from typing import Dict, List, Any
from pydantic import BaseModel, Field

class RegimeFeatures(BaseModel):
    core_anomaly: float = 0.0
    active_persistence_days: int = 0
    break_persistence_days: int = 0
    vorticity_850: float = 1.0
    wind_speed_850: float = 10.0
    elevation: float = 200.0
    coast_distance_km: float = 300.0
    monsoon_trough_lat: float = 22.0
    olr_anomaly: float = 0.0
    western_disturbance_flag: bool = False

class RegimeResult(BaseModel):
    probabilities: Dict[str, float] = Field(..., description="Probabilities for each of the 6 synoptic regimes summing to 1.0")
    dominant_regime: str
    transition: bool = Field(..., description="True if top probability is below 0.55 or margin with 2nd is < 0.15")
    confidence: float = Field(..., ge=0.0, le=1.0)
    evidence: List[Dict[str, Any]] = Field(default_factory=list)
    engine_version: str = "demo-regime-0.1.0"
    adapter_status: Dict[str, str] = Field(
        default_factory=lambda: {
            "rule_evidence": "ACTIVE (demo heuristics)",
            "cnn_adapter": "ADAPTER READY (demo disabled)",
            "lps_tracker_adapter": "DEMO VORTEX DETECTOR"
        }
    )
    disclaimer: str = "Synthetic prototype probabilities — not an operational forecast."
