from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field

class DataSourceHealthItem(BaseModel):
    source_id: str
    name: str
    source_type: str
    last_success_at: str
    age_minutes: float
    expected_interval_minutes: int
    stale_after_minutes: int
    status: str = Field(..., description="fresh, stale, missing, invalid")
    fallback_impact: str

class TrustResponse(BaseModel):
    forecast_id: str
    case_id: str
    current_fallback_state: str
    fallback_ladder: List[str]
    calibration_status: str
    human_review_required: bool
    active_fault: Optional[str] = None
    sources: List[DataSourceHealthItem]
    fallback_history: List[Dict[str, Any]] = Field(default_factory=list)
    system_safety_status: str = "Operating within declared synthetic prototype guardrails"
