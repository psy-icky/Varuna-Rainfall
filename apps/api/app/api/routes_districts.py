from typing import List, Optional
from fastapi import APIRouter, Query, HTTPException
from app.schemas.forecast import DistrictOverviewItem, ForecastPacket
from app.services.orchestrator import orchestrator

router = APIRouter(tags=["Districts"])

@router.get("/districts", response_model=List[DistrictOverviewItem])
def list_districts(case_id: str = Query("case_lps_001", description="Held-out demo case ID")):
    return orchestrator.list_districts(case_id=case_id)

@router.get("/districts/{district_id}/forecast", response_model=ForecastPacket)
def get_district_forecast(
    district_id: str,
    case_id: str = Query("case_lps_001", description="Held-out demo case ID")
):
    if district_id not in orchestrator.districts:
        raise HTTPException(status_code=404, detail=f"District '{district_id}' not found.")
    return orchestrator.build_forecast_packet(district_id=district_id, case_id=case_id)
