import os
import re
import unicodedata
from pathlib import Path
from typing import Tuple
import pymupdf

def sanitize_filename(filename: str) -> str:
    """
    Sanitizes filename while strictly preventing directory traversal.
    Preserves French accents, alphanumeric characters, hyphens, and spaces.
    """
    filename = filename.replace("\0", "").replace("/", "_").replace("\\", "_")
    filename = unicodedata.normalize("NFC", filename)
    filename = re.sub(r"\.\.+", ".", filename)
    # Filter illegal characters on Windows/Linux filesystems
    filename = re.sub(r'[<>:"/\\|?*]', '_', filename)
    filename = filename.strip(" .")
    if not filename:
        filename = "document"
    if not filename.lower().endswith(".pdf") and not filename.lower().endswith(".docx"):
        filename += ".pdf"
    return filename

def validate_pdf_content(file_path: Path, max_size_bytes: int) -> Tuple[bool, str, int]:
    """
    Validates PDF file:
    - Existence
    - File size constraints
    - Magic header (%PDF-)
    - Parseability via PyMuPDF
    - Password encryption detection
    Returns (is_valid, error_message, page_count)
    """
    if not file_path.exists():
        return False, "Le fichier n'existe pas.", 0

    size = file_path.stat().st_size
    if size == 0:
        return False, "Le fichier PDF est vide (0 octet).", 0

    if size > max_size_bytes:
        max_mb = max_size_bytes / (1024 * 1024)
        return False, f"La taille du fichier dépasse la limite configurée ({max_mb:.0f} Mo).", 0

    # Verify %PDF- signature in first 1024 bytes
    with open(file_path, "rb") as f:
        header = f.read(1024)
        if b"%PDF-" not in header:
            return False, "Le fichier téléversé n'est pas un document PDF valide (signature absente).", 0

    try:
        doc = pymupdf.open(str(file_path))
        if doc.is_encrypted:
            doc.close()
            return False, "Le document PDF est protégé par mot de passe. Veuillez le déverrouiller avant conversion.", 0

        page_count = len(doc)
        if page_count == 0:
            doc.close()
            return False, "Le document PDF ne contient aucune page.", 0

        doc.close()
        return True, "", page_count
    except Exception as e:
        return False, f"Le document PDF est corrompu ou illisible : {str(e)}", 0
