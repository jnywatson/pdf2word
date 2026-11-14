from typing import Optional
from fastapi import APIRouter, Query, HTTPException

from app.services.history_service import history_service
from app.schemas.history import HistoryResponse, HistoryItem

router = APIRouter(prefix="/api/history", tags=["History"])

@router.get("", response_model=HistoryResponse)
async def get_history_endpoint(
    search: Optional[str] = Query(None, description="Recherche par nom"),
    status: Optional[str] = Query(None, description="Filtre par statut")
):
    records = history_service.get_records(search=search, status_filter=status)
    items = [HistoryItem(**r) for r in records]
    return HistoryResponse(items=items, total=len(items))

@router.delete("/{record_id}")
async def delete_history_item(record_id: str):
    success = history_service.delete_record(record_id)
    if not success:
        raise HTTPException(status_code=404, detail="Entrée introuvable.")
    return {"success": True, "message": "Entrée supprimée."}

@router.delete("")
async def clear_all_history():
    history_service.clear_all()
    return {"success": True, "message": "Historique effacé."}
