from fastapi import APIRouter
from app.schemas.trust import TrustResponse, DataSourceHealthItem
from app.services.orchestrator import orchestrator
from app.services.trust.fallback import fallback_service
from app.core.constants import FALLBACK_LADDER

router = APIRouter(tags=["Trust"])

@router.get("/trust/{forecast_id}", response_model=TrustResponse)
def get_trust(forecast_id: str):
    audit = orchestrator.get_audit(forecast_id)
    sources_data = fallback_service.get_source_health()
    sources = [DataSourceHealthItem(**s) for s in sources_data]

    return TrustResponse(
        forecast_id=forecast_id,
        case_id=audit.case_id,
        current_fallback_state=audit.fallback_state,
        fallback_ladder=FALLBACK_LADDER,
        calibration_status=audit.calibration_status,
        human_review_required=audit.human_review_required,
        active_fault=fallback_service.active_fault,
        sources=sources,
        fallback_history=fallback_service.history
    )
