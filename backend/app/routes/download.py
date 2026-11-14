import io
import os
import zipfile
import urllib.parse
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, Body
from fastapi.responses import FileResponse, StreamingResponse

from app.config import OUTPUTS_DIR
from app.utils.security import sanitize_filename

router = APIRouter(prefix="/api", tags=["Download"])

@router.get("/download/{filename}")
async def download_file_endpoint(filename: str):
    """
    Safely streams converted DOCX with path traversal protection and UTF-8 encoding.
    """
    safe_name = sanitize_filename(filename)
    if not safe_name.lower().endswith(".docx"):
        safe_name += ".docx"

    file_path = (OUTPUTS_DIR / safe_name).resolve()

    # Prevent path traversal
    if not str(file_path).startswith(str(OUTPUTS_DIR.resolve())):
        raise HTTPException(status_code=403, detail="Accès non autorisé.")

    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="Le document Word demandé n'existe plus sur le serveur.")

    encoded_filename = urllib.parse.quote(safe_name)

    headers = {
        "Content-Disposition": f"attachment; filename*=UTF-8''{encoded_filename}",
        "Access-Control-Expose-Headers": "Content-Disposition"
    }

    return FileResponse(
        path=str(file_path),
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        filename=safe_name,
        headers=headers
    )

@router.get("/download-all")
async def download_all_zip(files: List[str] = Query(None)):
    """
    Creates and streams an in-memory ZIP archive containing the requested converted documents.
    """
    zip_buffer = io.BytesIO()

    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
        files_to_pack = files or [f.name for f in OUTPUTS_DIR.glob("*.docx")]
        count = 0
        for f_name in files_to_pack:
            safe_name = sanitize_filename(f_name)
            p = OUTPUTS_DIR / safe_name
            if p.exists() and p.is_file():
                zip_file.write(p, arcname=p.name)
                count += 1

    if count == 0:
        raise HTTPException(status_code=404, detail="Aucun document Word disponible pour l'archive.")

    zip_buffer.seek(0)
    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={"Content-Disposition": 'attachment; filename="documents_word_convertis.zip"'}
    )
