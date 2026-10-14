import os
import sqlite3
from contextlib import contextmanager
from pathlib import Path

def database_path():
    return os.getenv("DATABASE_PATH", "data/tickets.db")

@contextmanager
def connect():
    path = database_path()
    if path != ":memory:":
        Path(path).parent.mkdir(parents=True, exist_ok=True)
    db = sqlite3.connect(path, timeout=10)
    db.row_factory = sqlite3.Row
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

def initialize_database():
    with connect() as db:
        db.execute("""CREATE TABLE IF NOT EXISTS tickets (
          ticket_id TEXT PRIMARY KEY, message TEXT NOT NULL, category TEXT NOT NULL,
          priority TEXT NOT NULL, assigned_team TEXT NOT NULL, summary TEXT NOT NULL,
          suggested_response TEXT NOT NULL, confidence REAL NOT NULL,
          review_status TEXT NOT NULL, created_at TEXT NOT NULL,
          reviewed_by TEXT, reviewed_at TEXT)""")
