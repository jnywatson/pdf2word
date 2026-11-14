import os
import uuid
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Query

from app.config import UPLOADS_DIR, OUTPUTS_DIR, load_settings
from app.utils.security import sanitize_filename, validate_pdf_content
from app.services.converter import PDFConverter
from app.services.history_service import history_service
from app.services.cleaner import cleaner_service
from app.schemas.conversion import ConversionTaskInfo, BatchConversionResponse, PDFProbeResponse

router = APIRouter(prefix="/api", tags=["Conversion"])

@router.post("/probe", response_model=PDFProbeResponse)
async def probe_pdf_endpoint(file: UploadFile = File(...)):
    """
    Probes an uploaded PDF: validity, page count, scanned detection, character density.
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
            avg_chars_per_page=0.0,
            error_message=f"Erreur d'analyse : {str(e)}"
        )

@router.post("/convert", response_model=BatchConversionResponse)
async def convert_batch_endpoint(
    files: List[UploadFile] = File(...),
    ocr_mode: str = Form("auto"), # "auto", "force_ocr", "no_ocr"
    ocr_languages: Optional[str] = Form(None) # e.g. "fra+eng"
):
    """
    Converts one or multiple PDF documents into Word (.docx).
    Supports scanned PDF OCR and high-fidelity digital conversion.
    """
    if not files:
        raise HTTPException(status_code=400, detail="Aucun fichier fourni.")

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
                    original_filename=original_name,
                    file_size=file_size,
                    page_count=0,
                    status="failed",
                    progress=0,
                    error_message=err_msg
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
                ocr_languages=ocr_languages
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

            results.append(
                ConversionTaskInfo(
                    file_id=file_id,
                    original_filename=original_name,
                    file_size=file_size,
                    page_count=conversion_res["page_count"],
                    status="completed",
                    progress=100,
                    docx_filename=conversion_res["docx_filename"],
                    docx_size=conversion_res["docx_size"],
                    duration_seconds=conversion_res["duration_seconds"],
                    ocr_applied=conversion_res["ocr_applied"],
                    is_scanned=conversion_res["is_scanned"],
                    method_used=conversion_res.get("method_used")
                )
            )

        except Exception as e:
            cleaner_service.cleanup_file(temp_input_path)
            err = f"Erreur : {str(e)}"
            results.append(
                ConversionTaskInfo(
                    file_id=file_id,
                    original_filename=original_name,
                    file_size=len(content) if 'content' in locals() else 0,
                    page_count=page_count if 'page_count' in locals() else 0,
                    status="failed",
                    progress=0,
                    error_message=err
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

    return BatchConversionResponse(
        success=any(r.status == "completed" for r in results),
        message=f"{len(results)} document(s) traité(s).",
        results=results
    )
