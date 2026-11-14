import os
import time
from pathlib import Path
from app.config import TEMP_DIR, UPLOADS_DIR

class CleanerService:
    @staticmethod
    def cleanup_file(path: Path):
        """Safely removes a file if it exists."""
        try:
            if path and path.exists() and path.is_file():
                path.unlink()
        except Exception:
            pass

    @staticmethod
    def cleanup_old_files(older_than_minutes: int = 60):
        """Removes temporary files older than specified minutes."""
        now = time.time()
        cutoff = now - (older_than_minutes * 60)
        for directory in [TEMP_DIR, UPLOADS_DIR]:
            if not directory.exists():
                continue
            for item in directory.glob("*"):
                if item.name.startswith("."):
                    continue
                try:
                    if item.is_file() and item.stat().st_mtime < cutoff:
                        item.unlink()
                except Exception:
                    pass

cleaner_service = CleanerService()
