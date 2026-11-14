from pydantic import BaseModel, Field
from typing import Optional, List

class ConversionTaskInfo(BaseModel):
    file_id: str
    original_filename: str
    file_size: int
    page_count: int
    status: str # "pending", "processing", "completed", "failed"
    progress: int = 0
    docx_filename: Optional[str] = None
    docx_size: Optional[int] = None
    duration_seconds: Optional[float] = None
    ocr_applied: bool = False
    is_scanned: bool = False
    method_used: Optional[str] = None
    error_message: Optional[str] = None

class BatchConversionResponse(BaseModel):
    success: bool
    message: str
    results: List[ConversionTaskInfo]

class PDFProbeResponse(BaseModel):
    file_id: str
    original_filename: str
    file_size: int
    page_count: int
    is_valid: bool
    is_scanned: bool
    avg_chars_per_page: float = 0.0
    error_message: Optional[str] = None
