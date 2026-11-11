from __future__ import annotations

import os
import sqlite3
from pathlib import Path
from typing import Any
from flask import Blueprint, current_app, jsonify, request, send_from_directory
from backend.database.connection import database, init_database
from backend.models.serializers import build_state, serialize_product, serialize_table, serialize_order
from backend.services.common import error, get_order, utc_now

bp = Blueprint("orders", __name__)

@bp.get("/api/orders")
def orders():
    requested_status = request.args.get("status")
    with database() as connection:
        if requested_status:
            rows = connection.execute(
                """
                SELECT o.*, t.number AS table_number
                FROM orders o JOIN restaurant_tables t ON t.id = o.table_id
                WHERE o.status = ? ORDER BY o.created_at
                """,
                (requested_status,),
            ).fetchall()
        else:
            rows = connection.execute(
                """
                SELECT o.*, t.number AS table_number
                FROM orders o JOIN restaurant_tables t ON t.id = o.table_id
                ORDER BY o.created_at DESC
                """
            ).fetchall()
        return jsonify([serialize_order(connection, row) for row in rows])

@bp.post("/api/orders")
def create_order():
    payload = request.get_json(silent=True) or {}
    items = payload.get("items")
    try:
        table_id = int(payload.get("table_id"))
        diners = int(payload.get("diners"))
    except (TypeError, ValueError):
        return error("Selecciona una mesa y registra los comensales.")
    if diners < 1 or diners > 20:
        return error("La cantidad de comensales debe estar entre 1 y 20.")
    if not isinstance(items, list) or not items:
        return error("Agrega al menos un plato antes de enviar el pedido.", 400, "empty_order")

    quantities: dict[int, int] = {}
    item_notes: dict[int, str] = {}
    for item in items:
        if not isinstance(item, dict):
            return error("El pedido contiene un plato inválido.")
        try:
            product_id = int(item.get("product_id"))
            quantity = int(item.get("quantity"))
        except (TypeError, ValueError):
            return error("Las cantidades deben ser números enteros positivos.")
        if isinstance(item.get("quantity"), bool) or quantity < 1:
            return error("Las cantidades deben ser números enteros positivos.", 400, "invalid_quantity")
        quantities[product_id] = quantities.get(product_id, 0) + quantity
        item_notes[product_id] = str(item.get("note", "")).strip()[:240]

    with database() as connection:
        try:
            connection.execute("BEGIN IMMEDIATE")
            table = connection.execute(
                "SELECT * FROM restaurant_tables WHERE id = ?", (table_id,)
            ).fetchone()
            if not table:
                connection.rollback()
                return error("Mesa no encontrada.", 404, "not_found")
            if table["status"] != "free":
                connection.rollback()
                return error("La mesa ya tiene un pedido activo.", 409, "table_occupied")

            placeholders = ",".join("?" for _ in quantities)
            product_rows = connection.execute(
                f"SELECT * FROM products WHERE id IN ({placeholders})", tuple(quantities)
            ).fetchall()
            product_map = {row["id"]: row for row in product_rows}
            if len(product_map) != len(quantities):
                connection.rollback()
                return error("Uno de los platos ya no existe.", 404, "product_not_found")

            for product_id, quantity in quantities.items():
                product = product_map[product_id]
                if not product["active"]:
                    connection.rollback()
                    return error(f"{product['name']} no está disponible.", 409, "product_inactive")
                if product["stock"] < quantity:
                    connection.rollback()
                    message = (
                        f"Stock insuficiente para {product['name']}. "
                        f"Disponible: {product['stock']}."
                    )
                    return error(message, 409, "insufficient_stock")

            total = sum(product_map[pid]["price"] * qty for pid, qty in quantities.items())
            cursor = connection.execute(
                """
                INSERT INTO orders (table_id, diners, status, priority, notes, total, created_at, updated_at)
                VALUES (?, ?, 'new', 0, ?, ?, ?, ?)
                """,
                (
                    table_id,
                    diners,
                    str(payload.get("notes", "")).strip()[:500],
                    total,
                    utc_now(),
                    utc_now(),
                ),
            )
            order_id = cursor.lastrowid
            for product_id, quantity in quantities.items():
                product = product_map[product_id]
                connection.execute(
                    """
                    INSERT INTO order_items
                        (order_id, product_id, product_name, unit_price, quantity, note, ready)
                    VALUES (?, ?, ?, ?, ?, ?, 0)
                    """,
                    (
                        order_id,
                        product_id,
                        product["name"],
                        product["price"],
                        quantity,
                        item_notes[product_id],
                    ),
                )
                connection.execute(
                    "UPDATE products SET stock = stock - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                    (quantity, product_id),
                )
            connection.execute(
                """
                UPDATE restaurant_tables
                SET status = 'occupied', diners = ?, active_order_id = ?
                WHERE id = ?
                """,
                (diners, order_id, table_id),
            )
            connection.commit()
        except sqlite3.Error:
            connection.rollback()
            raise

        created = get_order(connection, order_id)
        return jsonify(created), 201

@bp.patch("/api/orders/<int:order_id>/status")
def update_order_status(order_id: int):
    payload = request.get_json(silent=True) or {}
    new_status = str(payload.get("status", "")).strip()
    allowed_transitions = {
        "new": {"preparing", "cancelled"},
        "preparing": {"ready", "cancelled"},
        "ready": {"completed"},
        "completed": set(),
        "cancelled": set(),
    }
    with database() as connection:
        row = connection.execute("SELECT * FROM orders WHERE id = ?", (order_id,)).fetchone()
        if not row:
            return error("Pedido no encontrado.", 404, "not_found")
        if new_status not in allowed_transitions.get(row["status"], set()):
            return error(
                f"No se puede cambiar de {row['status']} a {new_status}.",
                409,
                "invalid_transition",
            )
        completed_at = utc_now() if new_status in {"completed", "cancelled"} else None
        connection.execute(
            "UPDATE orders SET status = ?, updated_at = ?, completed_at = ? WHERE id = ?",
            (new_status, utc_now(), completed_at, order_id),
        )
        if new_status in {"completed", "cancelled"}:
            connection.execute(
                """
                UPDATE restaurant_tables
                SET status = 'free', diners = 0, active_order_id = NULL
                WHERE id = ? AND active_order_id = ?
                """,
                (row["table_id"], order_id),
            )
        connection.commit()
        return jsonify(get_order(connection, order_id))

@bp.patch("/api/orders/<int:order_id>/items/<int:item_id>")
def update_order_item(order_id: int, item_id: int):
    payload = request.get_json(silent=True) or {}
    ready = 1 if bool(payload.get("ready", True)) else 0
    with database() as connection:
        order = connection.execute("SELECT * FROM orders WHERE id = ?", (order_id,)).fetchone()
        if not order:
            return error("Pedido no encontrado.", 404, "not_found")
        item = connection.execute(
            "SELECT id FROM order_items WHERE id = ? AND order_id = ?", (item_id, order_id)
        ).fetchone()
        if not item:
            return error("Plato del pedido no encontrado.", 404, "not_found")
        connection.execute("UPDATE order_items SET ready = ? WHERE id = ?", (ready, item_id))
        if not ready and order["status"] == "ready":
            connection.execute(
                "UPDATE orders SET status = 'preparing', updated_at = ? WHERE id = ?",
                (utc_now(), order_id),
            )
        pending = connection.execute(
            "SELECT COUNT(*) FROM order_items WHERE order_id = ? AND ready = 0", (order_id,)
        ).fetchone()[0]
        if pending == 0 and order["status"] in {"new", "preparing"}:
            connection.execute(
                "UPDATE orders SET status = 'ready', updated_at = ? WHERE id = ?",
                (utc_now(), order_id),
            )
        connection.commit()
        return jsonify(get_order(connection, order_id))

@bp.patch("/api/orders/<int:order_id>/priority")
def update_priority(order_id: int):
    payload = request.get_json(silent=True) or {}
    priority = 1 if bool(payload.get("priority", True)) else 0
    with database() as connection:
        cursor = connection.execute(
            "UPDATE orders SET priority = ?, updated_at = ? WHERE id = ?",
            (priority, utc_now(), order_id),
        )
        if cursor.rowcount == 0:
            return error("Pedido no encontrado.", 404, "not_found")
        connection.commit()
        return jsonify(get_order(connection, order_id))

