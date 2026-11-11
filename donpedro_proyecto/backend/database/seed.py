import sqlite3
from datetime import datetime, timedelta, timezone

PRODUCTS = [
    ("Lomo Saltado", "Platos de fondo", "Tiras de lomo, cebolla, tomate, arroz y papas.", 42.0, 18, "🥩", 1),
    ("Ají de Gallina", "Platos de fondo", "Pechuga deshilachada en salsa de ají amarillo.", 38.0, 12, "🍛", 1),
    ("Ceviche Clásico", "Entradas", "Pescado fresco, limón, cebolla y ají limo.", 45.0, 9, "🐟", 1),
    ("Seco de Cordero", "Platos de fondo", "Cordero, cilantro, frejoles y arroz.", 48.0, 7, "🍲", 1),
    ("Arroz con Pollo", "Platos de fondo", "Arroz al cilantro, pollo y salsa criolla.", 34.0, 15, "🍗", 1),
    ("Tallarines Verdes", "Platos de fondo", "Pasta al pesto peruano con bistec.", 36.0, 8, "🍝", 1),
    ("Tequeños", "Entradas", "Seis tequeños con salsa de palta.", 22.0, 20, "🧀", 1),
    ("Causa Limeña", "Entradas", "Papa amarilla, pollo, palta y ají amarillo.", 24.0, 0, "🥔", 1),
    ("Chicha Morada", "Bebidas", "Vaso de chicha morada de la casa.", 8.0, 30, "🥤", 1),
    ("Limonada", "Bebidas", "Limonada fresca con hierbabuena.", 9.0, 24, "🍋", 1),
    ("Suspiro Limeño", "Postres", "Manjar blanco, merengue y canela.", 16.0, 6, "🍮", 1),
    ("Picarones", "Postres", "Aros de zapallo y camote con miel de chancaca.", 18.0, 10, "🍩", 1),
]


def seed_database(connection: sqlite3.Connection) -> None:
    product_count = connection.execute("SELECT COUNT(*) FROM products").fetchone()[0]
    if product_count == 0:
        connection.executemany(
            """
            INSERT INTO products (name, category, description, price, stock, emoji, active)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            PRODUCTS,
        )
    table_count = connection.execute("SELECT COUNT(*) FROM restaurant_tables").fetchone()[0]
    if table_count == 0:
        connection.executemany(
            "INSERT INTO restaurant_tables (number) VALUES (?)",
            [(number,) for number in range(1, 13)],
        )
    order_count = connection.execute("SELECT COUNT(*) FROM orders").fetchone()[0]
    if order_count == 0:
        seed_orders(connection)


def seed_orders(connection: sqlite3.Connection) -> None:
    examples = [
        (2, 2, "preparing", 1, 7, [("Ají de Gallina", 1, 0), ("Arroz con Pollo", 1, 0)]),
        (4, 4, "new", 0, 4, [("Tequeños", 2, 0), ("Tallarines Verdes", 1, 0)]),
        (6, 3, "ready", 0, 14, [("Ceviche Clásico", 1, 1), ("Chicha Morada", 3, 1)]),
        (8, 2, "preparing", 0, 9, [("Lomo Saltado", 2, 0)]),
        (10, 5, "new", 0, 2, [("Seco de Cordero", 2, 0), ("Limonada", 5, 0)]),
        (12, 2, "ready", 0, 18, [("Picarones", 1, 1), ("Chicha Morada", 2, 1)]),
    ]
    for table_number, diners, status, priority, minutes_ago, items in examples:
        table_id = connection.execute(
            "SELECT id FROM restaurant_tables WHERE number = ?", (table_number,)
        ).fetchone()[0]
        created_at = (datetime.now(timezone.utc) - timedelta(minutes=minutes_ago)).isoformat()
        product_rows = []
        total = 0.0
        for product_name, quantity, ready in items:
            product = connection.execute(
                "SELECT * FROM products WHERE name = ?", (product_name,)
            ).fetchone()
            product_rows.append((product, quantity, ready))
            total += product["price"] * quantity
        cursor = connection.execute(
            """
            INSERT INTO orders (table_id, diners, status, priority, total, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (table_id, diners, status, priority, total, created_at, created_at),
        )
        order_id = cursor.lastrowid
        for product, quantity, ready in product_rows:
            connection.execute(
                """
                INSERT INTO order_items
                    (order_id, product_id, product_name, unit_price, quantity, ready)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (order_id, product["id"], product["name"], product["price"], quantity, ready),
            )
        connection.execute(
            """
            UPDATE restaurant_tables
            SET status = 'occupied', diners = ?, active_order_id = ?
            WHERE id = ?
            """,
            (diners, order_id, table_id),
        )


