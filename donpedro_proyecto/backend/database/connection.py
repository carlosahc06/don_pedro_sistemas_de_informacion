import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator
from flask import current_app
from .seed import seed_database

@contextmanager
def database() -> Iterator[sqlite3.Connection]:
    connection = sqlite3.connect(current_app.config["DATABASE"], timeout=10)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    try:
        yield connection
    finally:
        connection.close()

def init_database(database_path: str | Path, reset: bool = False, seed: bool = True) -> None:
    path = Path(database_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(path)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    if reset:
        connection.executescript(
            """
            DROP TABLE IF EXISTS order_items;
            DROP TABLE IF EXISTS orders;
            DROP TABLE IF EXISTS products;
            DROP TABLE IF EXISTS restaurant_tables;
            """
        )
    connection.executescript(
        """
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            category TEXT NOT NULL,
            description TEXT NOT NULL DEFAULT '',
            price REAL NOT NULL CHECK (price >= 0),
            stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
            emoji TEXT NOT NULL DEFAULT '🍽️',
            active INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS restaurant_tables (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            number INTEGER NOT NULL UNIQUE,
            status TEXT NOT NULL DEFAULT 'free' CHECK (status IN ('free', 'occupied')),
            diners INTEGER NOT NULL DEFAULT 0,
            active_order_id INTEGER
        );

        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            table_id INTEGER NOT NULL REFERENCES restaurant_tables(id),
            diners INTEGER NOT NULL CHECK (diners > 0),
            status TEXT NOT NULL DEFAULT 'new'
                CHECK (status IN ('new', 'preparing', 'ready', 'completed', 'cancelled')),
            priority INTEGER NOT NULL DEFAULT 0,
            notes TEXT NOT NULL DEFAULT '',
            total REAL NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            completed_at TEXT
        );

        CREATE TABLE IF NOT EXISTS order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
            product_id INTEGER NOT NULL REFERENCES products(id),
            product_name TEXT NOT NULL,
            unit_price REAL NOT NULL,
            quantity INTEGER NOT NULL CHECK (quantity > 0),
            note TEXT NOT NULL DEFAULT '',
            ready INTEGER NOT NULL DEFAULT 0
        );
        """
    )
    if seed:
        seed_database(connection)
    connection.commit()
    connection.close()


