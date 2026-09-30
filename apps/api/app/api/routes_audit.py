from fastapi import APIRouter
from app.schemas.audit import AuditPacketResponse
from app.services.orchestrator import orchestrator

router = APIRouter(tags=["Audit"])

@router.get("/audit/{forecast_id}", response_model=AuditPacketResponse)
def get_audit(forecast_id: str):
    return orchestrator.get_audit(forecast_id)
