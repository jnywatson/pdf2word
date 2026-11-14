import os
import sys
import shutil
import pymupdf
import docx
from fastapi import APIRouter

from app.config import (
    load_settings,
    save_settings,
    OUTPUTS_DIR,
    STORAGE_DIR
)
from app.services.ocr_engine import ocr_engine
from app.schemas.settings import SettingsResponse, SettingsUpdate, SystemDiagnostics

router = APIRouter(prefix="/api/settings", tags=["Settings"])

@router.get("", response_model=SettingsResponse)
async def get_settings_endpoint():
    current = load_settings()
    return SettingsResponse(**current)

@router.post("", response_model=SettingsResponse)
async def update_settings_endpoint(payload: SettingsUpdate):
    update_dict = {k: v for k, v in payload.model_dump().items() if v is not None}
    updated = save_settings(update_dict)
    return SettingsResponse(**updated)

@router.get("/diagnostics", response_model=SystemDiagnostics)
async def get_diagnostics_endpoint():
    doc_count = len(list(OUTPUTS_DIR.glob("*.docx")))

    try:
        total, used, free = shutil.disk_usage(STORAGE_DIR)
        free_gb = round(free / (1024 ** 3), 2)
    except Exception:
        free_gb = 0.0

    return SystemDiagnostics(
        tesseract_available=ocr_engine.is_available(),
        tesseract_path=ocr_engine.tesseract_cmd or "Non configuré",
        tesseract_version=ocr_engine.get_version(),
        tesseract_languages=ocr_engine.get_available_languages(),
        pymupdf_version=pymupdf.__version__,
        docx_version=docx.__version__,
        python_version=sys.version.split()[0],
        storage_outputs_count=doc_count,
        storage_free_space_gb=free_gb,
        os_name=os.name
    )
