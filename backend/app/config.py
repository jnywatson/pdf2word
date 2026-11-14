import os
import sys
import json
import shutil
from pathlib import Path
from typing import Dict, Any

# Resolve Base Paths
BACKEND_DIR = Path(__file__).resolve().parent.parent
PROJECT_ROOT = BACKEND_DIR.parent

# Storage Paths (configurable via env var for cloud volume mounting like /mnt/storage)
STORAGE_ENV = os.getenv("STORAGE_DIR")
if STORAGE_ENV:
    STORAGE_DIR = Path(STORAGE_ENV).resolve()
else:
    STORAGE_DIR = PROJECT_ROOT / "storage"

UPLOADS_DIR = STORAGE_DIR / "uploads"
OUTPUTS_DIR = STORAGE_DIR / "outputs"
TEMP_DIR = STORAGE_DIR / "temp"
HISTORY_FILE = STORAGE_DIR / "history.json"
SETTINGS_FILE = STORAGE_DIR / "settings.json"

for d in [UPLOADS_DIR, OUTPUTS_DIR, TEMP_DIR]:
    d.mkdir(parents=True, exist_ok=True)

# Frontend Distribution Path
FRONTEND_DIST = PROJECT_ROOT / "frontend" / "dist"

def find_tesseract_path() -> str:
    """
    Detects Tesseract binary across Linux (Docker/Cloud) and Windows environments.
    """
    # 1. Check explicit environment variable
    custom_path = os.getenv("TESSERACT_CMD")
    if custom_path and os.path.exists(custom_path):
        return custom_path

    # 2. Check standard system PATH (Linux / Unix / Docker default)
    which_path = shutil.which("tesseract")
    if which_path and os.path.exists(which_path):
        return which_path

    # 3. Known Linux/Debian/Ubuntu paths
    linux_candidates = [
        "/usr/bin/tesseract",
        "/usr/local/bin/tesseract",
        "/opt/homebrew/bin/tesseract",
    ]
    for p in linux_candidates:
        if os.path.exists(p):
            return p

    # 4. Known Windows paths
    win_candidates = [
        os.path.expandvars(r"%LOCALAPPDATA%\Programs\Tesseract-OCR\tesseract.exe"),
        r"C:\Program Files\Tesseract-OCR\tesseract.exe",
        r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
        os.path.expanduser(r"~\AppData\Local\Programs\Tesseract-OCR\tesseract.exe"),
    ]
    for p in win_candidates:
        if os.path.exists(p):
            return p

    return ""

DEFAULT_SETTINGS: Dict[str, Any] = {
    "language": "fr",
    "theme": "light",
    "naming_pattern": "original", # "original", "original_converti", "original_timestamp"
    "custom_output_dir": "",
    "ocr_enabled": True,
    "ocr_languages": ["fra", "eng"],
    "ocr_dpi": 300,
    "enhance_scans": True,
    "max_file_size_mb": int(os.getenv("MAX_FILE_SIZE_MB", "100")),
}

def load_settings() -> Dict[str, Any]:
    if SETTINGS_FILE.exists():
        try:
            with open(SETTINGS_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                merged = dict(DEFAULT_SETTINGS)
                merged.update(data)
                return merged
        except Exception:
            return dict(DEFAULT_SETTINGS)
    return dict(DEFAULT_SETTINGS)

def save_settings(new_settings: Dict[str, Any]) -> Dict[str, Any]:
    current = load_settings()
    current.update(new_settings)
    with open(SETTINGS_FILE, "w", encoding="utf-8") as f:
        json.dump(current, f, indent=2, ensure_ascii=False)
    return current
