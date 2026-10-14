import pytest
from fastapi.testclient import TestClient

@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("DATABASE_PATH", str(tmp_path / "test.db"))
    from app.database.connection import initialize_database
    initialize_database()
    from app.main import app
    with TestClient(app) as test_client:
        yield test_client
