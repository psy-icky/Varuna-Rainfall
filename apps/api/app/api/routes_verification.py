from fastapi import APIRouter, Query
from app.schemas.verification import VerificationResponse
from app.services.verification.engine import VerificationService

router = APIRouter(tags=["Verification"])

@router.get("/verification/{case_id}", response_model=VerificationResponse)
def get_verification(
    case_id: str,
    threshold_mm: float = Query(64.5, description="IMD rainfall threshold in mm/day (64.5, 115.6, 204.5)")
):
    return VerificationService.get_metrics_for_case(case_id=case_id, threshold_mm=threshold_mm)
