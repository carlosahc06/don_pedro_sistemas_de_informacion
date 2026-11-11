from __future__ import annotations

import os
import sqlite3
from pathlib import Path
from typing import Any
from flask import Blueprint, current_app, jsonify, request, send_from_directory
from backend.database.connection import database, init_database
from backend.models.serializers import build_state, serialize_product, serialize_table, serialize_order
from backend.services.common import error, get_order, utc_now

bp = Blueprint("products", __name__)

@bp.get("/api/products")
def products():
    with database() as connection:
        rows = connection.execute("SELECT * FROM products ORDER BY category, name").fetchall()
        return jsonify([serialize_product(row) for row in rows])

@bp.post("/api/products")
def create_product():
    payload = request.get_json(silent=True) or {}
    name = str(payload.get("name", "")).strip()
    category = str(payload.get("category", "")).strip()
    description = str(payload.get("description", "")).strip()
    emoji = str(payload.get("emoji", "🍽️")).strip()[:8] or "🍽️"
    try:
        price = float(payload.get("price", -1))
        stock = int(payload.get("stock", -1))
    except (TypeError, ValueError):
        return error("El precio y el stock deben ser números válidos.")
    if not name or not category:
        return error("El nombre y la categoría son obligatorios.")
    if price < 0 or stock < 0:
        return error("El precio y el stock no pueden ser negativos.")

    with database() as connection:
        try:
            cursor = connection.execute(
                """
                INSERT INTO products (name, category, description, price, stock, emoji, active)
                VALUES (?, ?, ?, ?, ?, ?, 1)
                """,
                (name, category, description, price, stock, emoji),
            )
            connection.commit()
        except sqlite3.IntegrityError:
            return error("Ya existe un plato con ese nombre.", 409, "duplicate_product")
        row = connection.execute("SELECT * FROM products WHERE id = ?", (cursor.lastrowid,)).fetchone()
        return jsonify(serialize_product(row)), 201

@bp.patch("/api/products/<int:product_id>")
def update_product(product_id: int):
    payload = request.get_json(silent=True) or {}
    allowed = {"name", "category", "description", "price", "stock", "emoji", "active"}
    changes = {key: value for key, value in payload.items() if key in allowed}
    if not changes:
        return error("No se enviaron cambios.")

    if "price" in changes:
        try:
            changes["price"] = float(changes["price"])
        except (TypeError, ValueError):
            return error("El precio debe ser numérico.")
        if changes["price"] < 0:
            return error("El precio no puede ser negativo.")
    if "stock" in changes:
        try:
            changes["stock"] = int(changes["stock"])
        except (TypeError, ValueError):
            return error("El stock debe ser un número entero.")
        if changes["stock"] < 0:
            return error("El stock no puede ser negativo.")
    if "active" in changes:
        changes["active"] = 1 if bool(changes["active"]) else 0
    for field in ("name", "category"):
        if field in changes:
            changes[field] = str(changes[field]).strip()
            if not changes[field]:
                return error(f"El campo {field} no puede quedar vacío.")

    assignments = ", ".join(f"{field} = ?" for field in changes)
    with database() as connection:
        existing = connection.execute("SELECT id FROM products WHERE id = ?", (product_id,)).fetchone()
        if not existing:
            return error("Plato no encontrado.", 404, "not_found")
        try:
            connection.execute(
                f"UPDATE products SET {assignments}, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                (*changes.values(), product_id),
            )
            connection.commit()
        except sqlite3.IntegrityError:
            return error("Ya existe un plato con ese nombre.", 409, "duplicate_product")
        row = connection.execute("SELECT * FROM products WHERE id = ?", (product_id,)).fetchone()
        return jsonify(serialize_product(row))

