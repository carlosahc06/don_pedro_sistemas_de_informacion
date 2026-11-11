"""Punto de entrada del servidor Don Pedro."""
import os
from backend import create_app
from backend.database.connection import init_database  # Compatibilidad con las pruebas existentes.

if __name__ == "__main__":
    create_app().run(host="0.0.0.0", port=int(os.getenv("PORT", "8000")), debug=os.getenv("FLASK_DEBUG") == "1")
