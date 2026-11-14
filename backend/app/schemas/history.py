from pydantic import BaseModel
from typing import Optional, List

class HistoryItem(BaseModel):
    id: str
    timestamp: str
    original_filename: str
    docx_filename: str
    file_size: int
    docx_size: int
    page_count: int
    status: str
    duration_seconds: float
    ocr_applied: bool
    exists_on_disk: bool
    error_message: Optional[str] = None

class HistoryResponse(BaseModel):
    items: List[HistoryItem]
    total: int
