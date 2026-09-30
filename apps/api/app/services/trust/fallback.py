from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timezone
from app.core.constants import FALLBACK_LADDER

class FallbackService:
    """
    Manages operational trust, SLA data freshness monitoring, fault injection,
    and the deterministic fallback ladder:
    REGIME_AWARE -> POOLED_GLOBAL -> QM -> RAW_NWP -> ABSTAIN
    """
    def __init__(self):
        self.active_fault: Optional[str] = None
        self.history: List[Dict[str, Any]] = []

    def set_fault(self, fault_code: str) -> Dict[str, Any]:
        valid_faults = ["stale_satellite", "missing_nwp", "schema_error", "regime_ood"]
        if fault_code not in valid_faults:
            raise ValueError(f"Unknown fault code: {fault_code}. Must be one of {valid_faults}")
        
        old_fault = self.active_fault
        self.active_fault = fault_code

        event = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "event": "fault_injected",
            "fault": fault_code,
            "previous_fault": old_fault,
            "impact": self._get_fault_impact(fault_code)
        }
        self.history.append(event)
        return event

    def reset(self) -> Dict[str, Any]:
        self.active_fault = None
        event = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "event": "demo_reset",
            "fault": None,
            "status": "Nominal operational state restored (REGIME_AWARE)"
        }
        self.history.append(event)
        return event

    def _get_fault_impact(self, fault: str) -> str:
        impacts = {
            "stale_satellite": "Satellite freshness policy SLA breached (>240m). Fallback triggered to transparent QM.",
            "missing_nwp": "Primary numerical weather prediction run unavailable. Fallback to ABSTAIN (Actionable forecast revoked).",
            "schema_error": "Input format schema validation failed. Fallback to RAW_NWP with elevated uncertainty.",
            "regime_ood": "Atmospheric predictors outside training distribution (OOD). Fallback to POOLED_GLOBAL."
        }
        return impacts.get(fault, "Degraded operation")

    def evaluate_state(self, is_transition: bool, regime_confidence: float) -> Tuple[str, str, str, bool]:
        """
        Determines:
        (fallback_state, calibration_status, fallback_reason, human_review_required)
        """
        if self.active_fault == "missing_nwp":
            return (
                "ABSTAIN",
                "ABSTAIN",
                "Primary NWP grid stream missing. System abstains from issuing automated advice.",
                True
            )
        elif self.active_fault == "stale_satellite":
            return (
                "QM",
                "AMBER",
                "Satellite convective analysis feed stale (>240m age). Dropped to transparent QM baseline.",
                False
            )
        elif self.active_fault == "schema_error":
            return (
                "RAW_NWP",
                "ABSTAIN",
                "Schema validation failed on input predictors. Raw uncorrected NWP pass-through with human review.",
                True
            )
        elif self.active_fault == "regime_ood":
            return (
                "POOLED_GLOBAL",
                "AMBER",
                "Atmospheric features out of distribution (OOD). Fallback to pooled global regime prior.",
                True
            )

        # Nominal evaluation based on scientific criteria
        if is_transition or regime_confidence < 0.45:
            return (
                "REGIME_AWARE",
                "AMBER",
                "Ambiguous regime posterior (transition state). Probability blending active; human review recommended.",
                True
            )

        return (
            "REGIME_AWARE",
            "GREEN",
            "Nominal regime-aware operational calibration.",
            False
        )

    def get_source_health(self) -> List[Dict[str, Any]]:
        is_sat_stale = (self.active_fault == "stale_satellite")
        is_nwp_missing = (self.active_fault == "missing_nwp")
        is_schema_err = (self.active_fault == "schema_error")

        return [
            {
                "source_id": "src_nwp",
                "name": "Global/Regional NWP Ensemble",
                "source_type": "model_grid",
                "last_success_at": "2026-09-28T18:00:00Z" if not is_nwp_missing else "2026-09-27T00:00:00Z",
                "age_minutes": 120.0 if not is_nwp_missing else 2160.0,
                "expected_interval_minutes": 360,
                "stale_after_minutes": 480,
                "status": "missing" if is_nwp_missing else "fresh",
                "fallback_impact": "ABSTAIN if missing" if is_nwp_missing else "Nominal"
            },
            {
                "source_id": "src_satellite",
                "name": "Geostationary IR/Precip Satellite",
                "source_type": "satellite_rad",
                "last_success_at": "2026-09-28T18:30:00Z" if not is_sat_stale else "2026-09-28T12:00:00Z",
                "age_minutes": 90.0 if not is_sat_stale else 480.0,
                "expected_interval_minutes": 180,
                "stale_after_minutes": 240,
                "status": "stale" if is_sat_stale else "fresh",
                "fallback_impact": "Downgrade to QM" if is_sat_stale else "Nominal"
            },
            {
                "source_id": "src_observation",
                "name": "Automated Weather Stations / Rain Gauge",
                "source_type": "in_situ",
                "last_success_at": "2026-09-28T06:00:00Z",
                "age_minutes": 840.0,
                "expected_interval_minutes": 1440,
                "stale_after_minutes": 2880,
                "status": "invalid" if is_schema_err else "fresh",
                "fallback_impact": "Verification only"
            },
            {
                "source_id": "src_terrain",
                "name": "Digital Elevation Model (DEM) Static",
                "source_type": "static_dem",
                "last_success_at": "2026-09-01T00:00:00Z",
                "age_minutes": 40320.0,
                "expected_interval_minutes": 525600,
                "stale_after_minutes": 1051200,
                "status": "fresh",
                "fallback_impact": "Nominal"
            }
        ]

fallback_service = FallbackService()
