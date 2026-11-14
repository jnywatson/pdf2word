import sys
from pathlib import Path

# Add backend directory to sys.path to support both "app..." and "backend.app..." imports
BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse

from app.routes.convert import router as convert_router
from app.routes.download import router as download_router
from app.routes.history import router as history_router
from app.routes.settings import router as settings_router
from app.config import PROJECT_ROOT, FRONTEND_DIST
from app.services.ocr_engine import ocr_engine

app = FastAPI(
    title="PDF2WORD Web Pro API",
    description="Moteur web haute performance de conversion PDF vers Word (.docx) avec OCR avancé",
    version="2.0.0"
)

# Enable CORS for web hosting
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routes
app.include_router(convert_router)
app.include_router(download_router)
app.include_router(history_router)
app.include_router(settings_router)

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "PDF2WORD Web Pro",
        "version": "2.0.0",
        "ocr_available": ocr_engine.is_available(),
        "ocr_languages": ocr_engine.get_available_languages()
    }

# Serve React Vite Frontend in Production
if FRONTEND_DIST.exists():
    assets_dir = FRONTEND_DIST / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        if full_path.startswith("api/"):
            return JSONResponse(status_code=404, content={"detail": "API endpoint not found"})
        file_path = FRONTEND_DIST / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        index_file = FRONTEND_DIST / "index.html"
        if index_file.exists():
            return FileResponse(index_file)
        return JSONResponse(status_code=404, content={"detail": "Frontend non compilé"})
