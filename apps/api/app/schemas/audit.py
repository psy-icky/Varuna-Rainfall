from typing import Dict, List, Any, Optional
from pydantic import BaseModel, Field

class AuditPacketResponse(BaseModel):
    forecast_id: str
    case_id: str
    district_id: str
    issue_time: str
    valid_time: str
    lead_hours: int = 24
    accumulation_window: str = "24h"
    source_versions: List[Dict[str, str]]
    data_version: str = "demo-2026-09-01"
    model_version: str = "demo-0.1.0"
    regime_probabilities: Dict[str, float]
    dominant_regime: str
    transition_flag: bool
    regime_confidence: float
    correction_method: str
    calibration_status: str
    fallback_state: str
    fallback_reason: Optional[str] = None
    human_review_required: bool
    data_quality: str = "synthetic_demo"
    verification_artifact: str
    raw_nwp_snapshot: Dict[str, Any]
    output_quantiles: Dict[str, float]
    threshold_probabilities: Dict[str, float]
    provenance_hash: str
    timestamp: str
