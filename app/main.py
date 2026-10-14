import logging
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from app.api.routes import router
from app.database.connection import initialize_database

logging.basicConfig(level=logging.INFO)

@asynccontextmanager
async def lifespan(app):
    initialize_database()
    yield

app = FastAPI(title="Cerevyn SupportAI", version="1.0.0", description="Explainable support ticket triage with human approval.", lifespan=lifespan)
app.include_router(router, prefix="/api/v1")
static_dir = Path(__file__).parent / "static"
app.mount("/static", StaticFiles(directory=static_dir), name="static")

@app.get("/", include_in_schema=False)
def dashboard():
    return FileResponse(static_dir / "index.html")

@app.get("/health", tags=["health"])
def health():
    return {"status": "ok"}
