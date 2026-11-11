import sqlite3
from datetime import datetime, timezone
from typing import Any
from flask import jsonify
from backend.models.serializers import serialize_order

def utc_now():
    return datetime.now(timezone.utc).isoformat()

def error(message: str, status: int = 400, code: str = "validation_error"):
    return jsonify({"error": message, "code": code}), status

def get_order(connection: sqlite3.Connection, order_id: int) -> dict[str, Any] | None:
    row = connection.execute(
        """
        SELECT o.*, t.number AS table_number
        FROM orders o JOIN restaurant_tables t ON t.id = o.table_id
        WHERE o.id = ?
        """,
        (order_id,),
    ).fetchone()
    return serialize_order(connection, row) if row else None

