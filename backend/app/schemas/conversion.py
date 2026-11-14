from pydantic import BaseModel, Field
from typing import Optional, List

class ConversionTaskInfo(BaseModel):
    file_id: str
    original_filename: str
    file_size: int
    page_count: int
    status: str # "pending", "processing", "completed", "failed", "success"
    progress: int = 0
    docx_filename: Optional[str] = None
    docx_size: Optional[int] = None
    duration_seconds: Optional[float] = None
    ocr_applied: bool = False
    is_scanned: bool = False
    method_used: Optional[str] = None
    download_url: Optional[str] = None
    error_message: Optional[str] = None

    # Aliases for frontend flexibility
    id: Optional[str] = None
    output_filename: Optional[str] = None
    pages: Optional[int] = None
    file_size_bytes: Optional[int] = None
    error: Optional[str] = None

class BatchConversionResponse(BaseModel):
    success: bool
    message: str
    total: int = 0
    successful_count: int = 0
    failed_count: int = 0
    duration_seconds: float = 0.0
    batch_download_url: Optional[str] = None
    results: List[ConversionTaskInfo]

class PDFProbeResponse(BaseModel):
    file_id: str
    original_filename: str
    file_size: int
    page_count: int
    is_valid: bool
    is_scanned: bool
    needs_ocr: bool = False
    encrypted: bool = False
    avg_chars_per_page: float = 0.0
    error_message: Optional[str] = None
