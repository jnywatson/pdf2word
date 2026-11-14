from pydantic import BaseModel, Field
from typing import List, Optional

class SettingsUpdate(BaseModel):
    language: Optional[str] = None
    theme: Optional[str] = None
    naming_pattern: Optional[str] = None
    ocr_enabled: Optional[bool] = None
    ocr_languages: Optional[List[str]] = None
    ocr_dpi: Optional[int] = Field(None, ge=150, le=400)
    enhance_scans: Optional[bool] = None
    max_file_size_mb: Optional[int] = Field(None, ge=5, le=500)

class SettingsResponse(BaseModel):
    language: str
    theme: str
    naming_pattern: str
    custom_output_dir: str
    ocr_enabled: bool
    ocr_languages: List[str]
    ocr_dpi: int
    enhance_scans: bool
    max_file_size_mb: int

class SystemDiagnostics(BaseModel):
    tesseract_available: bool
    tesseract_path: str
    tesseract_version: str
    tesseract_languages: List[str]
    pymupdf_version: str
    docx_version: str
    python_version: str
    storage_outputs_count: int
    storage_free_space_gb: float
    os_name: str
