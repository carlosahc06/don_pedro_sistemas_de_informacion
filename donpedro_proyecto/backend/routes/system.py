from __future__ import annotations

import os
import sqlite3
from pathlib import Path
from typing import Any
from flask import Blueprint, current_app, jsonify, request, send_from_directory
from backend.database.connection import database, init_database
from backend.models.serializers import build_state, serialize_product, serialize_table, serialize_order
from backend.services.common import error, get_order, utc_now

bp = Blueprint("system", __name__)

@bp.get("/api/health")
def health():
    return jsonify({"status": "ok", "service": "don-pedro-pos"})

@bp.get("/api/state")
def state():
    with database() as connection:
        return jsonify(build_state(connection))

@bp.get("/api/tables")
def tables():
    with database() as connection:
        rows = connection.execute(
            "SELECT * FROM restaurant_tables ORDER BY number"
        ).fetchall()
        return jsonify([serialize_table(row) for row in rows])


@bp.post("/api/reset-demo")
def reset_demo():
    if not current_app.config["TESTING"] and os.getenv("DON_PEDRO_ALLOW_RESET") != "1":
        return error("El reinicio de datos está desactivado.", 403, "forbidden")
    init_database(current_app.config["DATABASE"], reset=True, seed=True)
    with database() as connection:
        return jsonify(build_state(connection))

@bp.get("/")
def index():
    return send_from_directory(current_app.static_folder, "index.html")

@bp.get("/<path:path>")
def static_files(path: str):
    asset = Path(current_app.static_folder) / path
    if asset.is_file():
        return send_from_directory(current_app.static_folder, path)
    return send_from_directory(current_app.static_folder, "index.html")

