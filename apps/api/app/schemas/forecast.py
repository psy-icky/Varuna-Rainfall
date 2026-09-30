from typing import Dict, List, Any, Optional
from pydantic import BaseModel, Field

class DayForecastItem(BaseModel):
    day: int
    date: str
    expected_rain_mm: float
    q10_mm: float
    q50_mm: float
    q90_mm: float
    p64_5: float
    p115_6: float
    p204_5: float
    dominant_regime: str
    calibration_status: str
    fallback_state: str
    provenance: str

class ForecastPacket(BaseModel):
    forecast_id: str
    case_id: str
    district_id: str
    district_name: str
    state: str
    lat: float
    lon: float
    issue_time: str
    valid_time: str
    lead_hours: int = 24
    accumulation_window: str = "24h"
    
    # Rainfall estimates
    raw_rain_mm: float = Field(..., ge=0.0)
    expected_rain_mm: float = Field(..., ge=0.0)
    observed_rain_mm: Optional[float] = Field(default=None, description="Verification-only ground truth")
    q10_mm: float = Field(..., ge=0.0)
    q50_mm: float = Field(..., ge=0.0)
    q90_mm: float = Field(..., ge=0.0)
    uncertainty_mm: float = Field(..., ge=0.0)
    positive_probability: float = Field(..., ge=0.0, le=1.0)
    
    # Threshold exceedance probabilities (Monotonic: p204_5 <= p115_6 <= p64_5)
    p64_5: float = Field(..., ge=0.0, le=1.0, description="P(rain >= 64.5 mm/day) Heavy")
    p115_6: float = Field(..., ge=0.0, le=1.0, description="P(rain >= 115.6 mm/day) Very Heavy")
    p204_5: float = Field(..., ge=0.0, le=1.0, description="P(rain >= 204.5 mm/day) Extremely Heavy")
    
    # Regime & Method
    regime_probabilities: Dict[str, float]
    transition: bool
    confidence: float
    correction_method: str
    provenance: str
    calibration_status: str = Field(..., description="GREEN, AMBER, ABSTAIN")
    fallback_state: str = Field(..., description="REGIME_AWARE, POOLED_GLOBAL, QM, RAW_NWP, ABSTAIN")
    fallback_reason: Optional[str] = None
    human_review_required: bool = False
    
    # Metadata
    model_version: str = "demo-0.1.0"
    data_version: str = "demo-2026-09-01"
    data_quality: str = "synthetic_demo"
    source_health: Dict[str, Any] = Field(default_factory=dict)
    disclaimer: str = "Decision support — not an official warning authority. Synthetic prototype data — not operational forecast skill."
    
    # 5-day trajectory
    five_day_forecast: List[DayForecastItem] = Field(default_factory=list)

class DistrictOverviewItem(BaseModel):
    id: str
    name: str
    state: str
    lat: float
    lon: float
    expected_rain_mm: float
    q50_mm: float
    p64_5: float
    p115_6: float
    p204_5: float
    dominant_regime: str
    calibration_status: str
    fallback_state: str
    is_demo_geometry: bool = True
