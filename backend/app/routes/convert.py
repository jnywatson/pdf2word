import os
import uuid
import time
from pathlib import Path
from typing import List, Optional
from urllib.parse import quote, urlencode
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Query

from app.config import UPLOADS_DIR, OUTPUTS_DIR, load_settings
from app.utils.security import sanitize_filename, validate_pdf_content
from app.services.converter import PDFConverter
from app.services.history_service import history_service
from app.services.cleaner import cleaner_service
from app.schemas.conversion import ConversionTaskInfo, BatchConversionResponse, PDFProbeResponse

router = APIRouter(prefix="/api", tags=["Conversion"])

@router.post("/probe", response_model=PDFProbeResponse)
@router.post("/convert/probe", response_model=PDFProbeResponse)
async def probe_pdf_endpoint(file: UploadFile = File(...)):
    """
    Probes an uploaded PDF: validity, page count, scanned detection, character density.
    Mounted on both /api/probe and /api/convert/probe for full compatibility.
    """
    settings = load_settings()
    max_bytes = settings.get("max_file_size_mb", 100) * 1024 * 1024

    clean_filename = sanitize_filename(file.filename or "document.pdf")
    temp_id = str(uuid.uuid4())
    temp_path = UPLOADS_DIR / f"probe_{temp_id}_{clean_filename}"

    try:
        content = await file.read()
        with open(temp_path, "wb") as f:
            f.write(content)

        is_valid, err_msg, pages = validate_pdf_content(temp_path, max_bytes)
        if not is_valid:
            cleaner_service.cleanup_file(temp_path)
            return PDFProbeResponse(
                file_id=temp_id,
                original_filename=clean_filename,
                file_size=len(content),
                page_count=0,
                is_valid=False,
                is_scanned=False,
                needs_ocr=False,
                encrypted="mot de passe" in (err_msg or "").lower() or "protégé" in (err_msg or "").lower(),
                avg_chars_per_page=0.0,
                error_message=err_msg
            )

        probe_res = PDFConverter.probe_pdf(temp_path)
        cleaner_service.cleanup_file(temp_path)

        return PDFProbeResponse(
            file_id=temp_id,
            original_filename=clean_filename,
            file_size=len(content),
            page_count=probe_res["page_count"],
            is_valid=True,
            is_scanned=probe_res["is_scanned"],
            needs_ocr=probe_res["is_scanned"],
            encrypted=False,
            avg_chars_per_page=probe_res.get("avg_chars_per_page", 0.0),
            error_message=None
        )
    except Exception as e:
        cleaner_service.cleanup_file(temp_path)
        return PDFProbeResponse(
            file_id=temp_id,
            original_filename=clean_filename,
            file_size=0,
            page_count=0,
            is_valid=False,
            is_scanned=False,
            needs_ocr=False,
            encrypted=False,
            avg_chars_per_page=0.0,
            error_message=f"Erreur d'analyse : {str(e)}"
        )

@router.post("/convert", response_model=BatchConversionResponse)
async def convert_batch_endpoint(
    files: List[UploadFile] = File(...),
    ocr_mode: str = Form("auto"), # "auto", "force_ocr", "no_ocr"
    ocr_languages: Optional[str] = Form(None), # e.g. "fra+eng"
    language: Optional[str] = Form(None) # Frontend alias
):
    """
    Converts one or multiple PDF documents into Word (.docx).
    Supports scanned PDF OCR and high-fidelity digital conversion.
    """
    if not files:
        raise HTTPException(status_code=400, detail="Aucun fichier fourni.")

    # Use language if ocr_languages wasn't explicitly provided
    resolved_ocr_langs = ocr_languages or language or "fra+eng"

    start_batch_time = time.time()
    settings = load_settings()
    max_bytes = settings.get("max_file_size_mb", 100) * 1024 * 1024
    results: List[ConversionTaskInfo] = []

    for file in files:
        file_id = str(uuid.uuid4())
        original_name = file.filename or "document.pdf"
        safe_name = sanitize_filename(original_name)
        temp_input_path = UPLOADS_DIR / f"{file_id}_{safe_name}"

        try:
            content = await file.read()
            file_size = len(content)

            with open(temp_input_path, "wb") as f:
                f.write(content)

            # Security check
            is_valid, err_msg, page_count = validate_pdf_content(temp_input_path, max_bytes)
            if not is_valid:
                cleaner_service.cleanup_file(temp_input_path)
                task_info = ConversionTaskInfo(
                    file_id=file_id,
                    id=file_id,
                    original_filename=original_name,
                    file_size=file_size,
                    file_size_bytes=file_size,
                    page_count=0,
                    pages=0,
                    status="failed",
                    progress=0,
                    error_message=err_msg,
                    error=err_msg
                )
                history_service.add_record(
                    original_filename=original_name,
                    docx_filename="",
                    docx_path="",
                    file_size=file_size,
                    docx_size=0,
                    page_count=0,
                    status="failed",
                    duration_seconds=0.0,
                    ocr_applied=False,
                    error_message=err_msg
                )
                results.append(task_info)
                continue

            # Convert PDF
            conversion_res = PDFConverter.convert(
                pdf_path=temp_input_path,
                original_filename=safe_name,
                ocr_mode=ocr_mode,
                ocr_languages=resolved_ocr_langs
            )

            # Record in history
            history_service.add_record(
                original_filename=original_name,
                docx_filename=conversion_res["docx_filename"],
                docx_path=conversion_res["docx_path"],
                file_size=file_size,
                docx_size=conversion_res["docx_size"],
                page_count=conversion_res["page_count"],
                status="completed",
                duration_seconds=conversion_res["duration_seconds"],
                ocr_applied=conversion_res["ocr_applied"]
            )

            cleaner_service.cleanup_file(temp_input_path)

            download_url = f"/api/download/{quote(conversion_res['docx_filename'])}"

            results.append(
                ConversionTaskInfo(
                    file_id=file_id,
                    id=file_id,
                    original_filename=original_name,
                    file_size=file_size,
                    file_size_bytes=file_size,
                    page_count=conversion_res["page_count"],
                    pages=conversion_res["page_count"],
                    status="success",
                    progress=100,
                    docx_filename=conversion_res["docx_filename"],
                    output_filename=conversion_res["docx_filename"],
                    docx_size=conversion_res["docx_size"],
                    duration_seconds=conversion_res["duration_seconds"],
                    ocr_applied=conversion_res["ocr_applied"],
                    is_scanned=conversion_res["is_scanned"],
                    method_used=conversion_res.get("method_used", "Standard"),
                    download_url=download_url
                )
            )

        except Exception as e:
            cleaner_service.cleanup_file(temp_input_path)
            err = f"Erreur : {str(e)}"
            results.append(
                ConversionTaskInfo(
                    file_id=file_id,
                    id=file_id,
                    original_filename=original_name,
                    file_size=len(content) if 'content' in locals() else 0,
                    file_size_bytes=len(content) if 'content' in locals() else 0,
                    page_count=page_count if 'page_count' in locals() else 0,
                    pages=page_count if 'page_count' in locals() else 0,
                    status="failed",
                    progress=0,
                    error_message=err,
                    error=err
                )
            )
            history_service.add_record(
                original_filename=original_name,
                docx_filename="",
                docx_path="",
                file_size=len(content) if 'content' in locals() else 0,
                docx_size=0,
                page_count=page_count if 'page_count' in locals() else 0,
                status="failed",
                duration_seconds=0.0,
                ocr_applied=False,
                error_message=err
            )

    total_duration = round(time.time() - start_batch_time, 2)
    successful = [r for r in results if r.status in ("completed", "success")]
    failed = [r for r in results if r.status == "failed"]

    successful_filenames = [r.docx_filename for r in successful if r.docx_filename]
    batch_url = None
    if len(successful_filenames) > 1:
        query = urlencode([("files", filename) for filename in successful_filenames])
        batch_url = f"/api/download-all?{query}"

    return BatchConversionResponse(
        success=len(successful) > 0,
        message=f"{len(results)} document(s) traité(s).",
        total=len(results),
        successful_count=len(successful),
        failed_count=len(failed),
        duration_seconds=total_duration,
        batch_download_url=batch_url,
        results=results
    )
