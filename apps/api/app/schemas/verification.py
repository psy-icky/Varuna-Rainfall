from typing import Dict, List, Any
from pydantic import BaseModel, Field

class BaselineMetrics(BaseModel):
    method_name: str
    rmse: float = Field(..., ge=0.0)
    ets: float = Field(..., ge=-0.5, le=1.0)
    csi: float = Field(..., ge=0.0, le=1.0)
    pod: float = Field(..., ge=0.0, le=1.0)
    far: float = Field(..., ge=0.0, le=1.0)
    fss: float = Field(..., ge=0.0, le=1.0)
    brier: float = Field(..., ge=0.0, le=1.0)
    brier_skill_score: float
    event_count: int = 48

class ReliabilityBin(BaseModel):
    bin_center: float
    forecast_probability: float
    observed_frequency: float
    sample_count: int

class VerificationResponse(BaseModel):
    case_id: str
    case_name: str
    threshold_mm: float = 64.5
    lead_day: int = 1
    neighbourhood_km: int = 25
    split_name: str = "held_out_validation"
    data_quality: str = "synthetic_demo"
    baselines: Dict[str, BaselineMetrics]
    reliability_curve: List[ReliabilityBin] = Field(default_factory=list)
    fss_by_scale: List[Dict[str, Any]] = Field(default_factory=list)
    neutral_comparison_statement: str = "Measured metric on this demo verification set. Synthetic prototype values — replace with audited held-out measurements before scientific claims."
