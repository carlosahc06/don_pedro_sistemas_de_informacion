import sqlite3
from datetime import datetime, timezone
from typing import Any

def serialize_product(row: sqlite3.Row) -> dict[str, Any]:
    return {
        "id": row["id"],
        "name": row["name"],
        "category": row["category"],
        "description": row["description"],
        "price": row["price"],
        "stock": row["stock"],
        "emoji": row["emoji"],
        "active": bool(row["active"]),
    }


def serialize_table(row: sqlite3.Row) -> dict[str, Any]:
    return {
        "id": row["id"],
        "number": row["number"],
        "status": row["status"],
        "diners": row["diners"],
        "active_order_id": row["active_order_id"],
        "active_order_number": 1040 + row["active_order_id"] if row["active_order_id"] else None,
    }


def serialize_order(connection: sqlite3.Connection, row: sqlite3.Row) -> dict[str, Any]:
    item_rows = connection.execute(
        "SELECT * FROM order_items WHERE order_id = ? ORDER BY id", (row["id"],)
    ).fetchall()
    created = datetime.fromisoformat(row["created_at"].replace("Z", "+00:00"))
    if created.tzinfo is None:
        created = created.replace(tzinfo=timezone.utc)
    age_minutes = max(0, int((datetime.now(timezone.utc) - created).total_seconds() // 60))
    return {
        "id": row["id"],
        "number": 1040 + row["id"],
        "table_id": row["table_id"],
        "table_number": row["table_number"],
        "diners": row["diners"],
        "status": row["status"],
        "priority": bool(row["priority"]),
        "notes": row["notes"],
        "total": row["total"],
        "created_at": row["created_at"],
        "age_minutes": age_minutes,
        "items": [
            {
                "id": item["id"],
                "product_id": item["product_id"],
                "name": item["product_name"],
                "unit_price": item["unit_price"],
                "quantity": item["quantity"],
                "note": item["note"],
                "ready": bool(item["ready"]),
            }
            for item in item_rows
        ],
    }


def build_state(connection: sqlite3.Connection) -> dict[str, Any]:
    products = connection.execute("SELECT * FROM products ORDER BY category, name").fetchall()
    tables = connection.execute("SELECT * FROM restaurant_tables ORDER BY number").fetchall()
    orders = connection.execute(
        """
        SELECT o.*, t.number AS table_number
        FROM orders o JOIN restaurant_tables t ON t.id = o.table_id
        WHERE o.status IN ('new', 'preparing', 'ready')
        ORDER BY o.priority DESC, o.created_at
        """
    ).fetchall()
    completed_today = connection.execute(
        "SELECT COUNT(*) FROM orders WHERE status = 'completed' AND date(completed_at) = date('now')"
    ).fetchone()[0]
    return {
        "products": [serialize_product(row) for row in products],
        "tables": [serialize_table(row) for row in tables],
        "orders": [serialize_order(connection, row) for row in orders],
        "stats": {
            "active_orders": len(orders),
            "ready_orders": sum(row["status"] == "ready" for row in orders),
            "completed_today": completed_today,
            "low_stock": sum(row["stock"] <= 5 for row in products if row["active"]),
        },
    }


