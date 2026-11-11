import os
from pathlib import Path
from flask import Flask
from backend.database.connection import init_database
from backend.routes import orders, products, system

BASE_DIR = Path(__file__).resolve().parent.parent

def create_app(database_path=None, testing=False):
    app = Flask(__name__, static_folder=str(BASE_DIR / "frontend"), static_url_path="")
    app.config.update(
        DATABASE=str(database_path or os.getenv("DON_PEDRO_DB", BASE_DIR / "data" / "don_pedro.db")),
        TESTING=testing,
        JSON_SORT_KEYS=False,
    )
    init_database(app.config["DATABASE"], seed=not testing)
    app.register_blueprint(system.bp)
    app.register_blueprint(products.bp)
    app.register_blueprint(orders.bp)
    return app
