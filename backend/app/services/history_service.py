import json
import uuid
import os
from datetime import datetime
from typing import List, Dict, Any, Optional
from app.config import HISTORY_FILE

class HistoryService:
    @staticmethod
    def _read_data() -> List[Dict[str, Any]]:
        if not HISTORY_FILE.exists():
            return []
        try:
            with open(HISTORY_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []

    @staticmethod
    def _write_data(data: List[Dict[str, Any]]):
        HISTORY_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(HISTORY_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

    @classmethod
    def add_record(
        cls,
        original_filename: str,
        docx_filename: str,
        docx_path: str,
        file_size: int,
        docx_size: int,
        page_count: int,
        status: str,
        duration_seconds: float,
        ocr_applied: bool,
        error_message: Optional[str] = None
    ) -> Dict[str, Any]:
        data = cls._read_data()
        record_id = str(uuid.uuid4())
        record = {
            "id": record_id,
            "timestamp": datetime.now().isoformat(),
            "original_filename": original_filename,
            "docx_filename": docx_filename,
            "docx_path": docx_path,
            "file_size": file_size,
            "docx_size": docx_size,
            "page_count": page_count,
            "status": status,
            "duration_seconds": duration_seconds,
            "ocr_applied": ocr_applied,
            "error_message": error_message
        }
        data.insert(0, record)
        # Keep maximum 200 items in history
        if len(data) > 200:
            data = data[:200]
        cls._write_data(data)
        record["exists_on_disk"] = os.path.exists(docx_path) if docx_path else False
        return record

    @classmethod
    def get_records(
        cls,
        search: Optional[str] = None,
        status_filter: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        records = cls._read_data()
        filtered = []

        for r in records:
            path_str = r.get("docx_path", "")
            exists = os.path.exists(path_str) if path_str else False
            r_copy = dict(r)
            r_copy["exists_on_disk"] = exists

            if search:
                s = search.lower()
                orig = r.get("original_filename", "").lower()
                docx = r.get("docx_filename", "").lower()
                if s not in orig and s not in docx:
                    continue

            if status_filter and status_filter != "all":
                if status_filter == "ocr" and not r.get("ocr_applied"):
                    continue
                elif status_filter != "ocr" and r.get("status") != status_filter:
                    continue

            filtered.append(r_copy)

        return filtered

    @classmethod
    def delete_record(cls, record_id: str) -> bool:
        records = cls._read_data()
        initial_len = len(records)
        records = [r for r in records if r.get("id") != record_id]
        if len(records) != initial_len:
            cls._write_data(records)
            return True
        return False

    @classmethod
    def clear_all(cls) -> bool:
        cls._write_data([])
        return True

history_service = HistoryService()
