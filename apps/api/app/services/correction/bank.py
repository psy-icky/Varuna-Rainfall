from typing import Protocol, Dict, Any, Tuple
from dataclasses import dataclass
from app.core.constants import CORRECTION_METHODS

@dataclass
class CorrectionResult:
    corrected_mean_mm: float
    correction_method: str
    provenance: str
    scaling_factor: float
    explanation: str

class CorrectionBank(Protocol):
    def apply(self, raw_rain_mm: float, regime_probabilities: Dict[str, float], context: Dict[str, Any]) -> CorrectionResult:
        ...

class DemoCorrectionBank:
    """
    Deterministic correction bank implementing regime-conditional bias correction strategies.
    Coefficients represent named empirical proxies for NWP systematic error mechanisms.
    Guarantees non-negative rainfall outputs.
    """
    # Named empirical scaling coefficients for demo regimes
    COEFFICIENTS = {
        "active": 1.32,              # Under-amplitude active monsoon envelope bias correction
        "break": 0.45,               # Core zone leakage suppression during break spell
        "depression": 1.48,          # Heavy vortex core underestimation & displacement correction
        "coastal": 1.18,             # Coastal convergence line timing & analog adjustment
        "orographic": 1.55,          # Steep windward terrain uplift enhancement
        "western_disturbance": 1.12  # Elevation-stratified WD recalibration
    }

    def __init__(self, version: str = "demo-bank-0.1.0"):
        self.version = version

    def apply(self, raw_rain_mm: float, regime_probabilities: Dict[str, float], context: Dict[str, Any]) -> CorrectionResult:
        raw_val = max(0.0, float(raw_rain_mm))
        is_transition = context.get("transition", False)
        forced_fallback = context.get("fallback_state", "REGIME_AWARE")

        # 1. Fallback: If QM fallback is active, use simple global QM factor
        if forced_fallback == "QM":
            corrected = max(0.0, raw_val * 1.10)
            return CorrectionResult(
                corrected_mean_mm=round(corrected, 2),
                correction_method="global_qm",
                provenance=f"fallback:global_qm (v={self.version})",
                scaling_factor=1.10,
                explanation="Global quantile mapping fallback applied due to upstream source failure."
            )
        elif forced_fallback in ("RAW_NWP", "ABSTAIN"):
            return CorrectionResult(
                corrected_mean_mm=round(raw_val, 2),
                correction_method="raw_nwp_unadjusted",
                provenance=f"fallback:raw_nwp (v={self.version})",
                scaling_factor=1.00,
                explanation="Unadjusted raw NWP guidance passed through under degraded trust state."
            )

        # 2. Transition blending mode
        if is_transition:
            blended_factor = 0.0
            for regime, prob in regime_probabilities.items():
                blended_factor += prob * self.COEFFICIENTS.get(regime, 1.0)
            
            corrected = max(0.0, raw_val * blended_factor)
            return CorrectionResult(
                corrected_mean_mm=round(corrected, 2),
                correction_method=CORRECTION_METHODS["blend"],
                provenance=f"bank:probability_blend (v={self.version})",
                scaling_factor=round(blended_factor, 3),
                explanation=f"Posterior probability-weighted mixture across regimes (effective scale: {blended_factor:.2f})."
            )

        # 3. Dominant regime conditional correction
        dominant = max(regime_probabilities, key=regime_probabilities.get)
        factor = self.COEFFICIENTS.get(dominant, 1.0)
        method_name = CORRECTION_METHODS.get(dominant, "active_emos")
        corrected = max(0.0, raw_val * factor)

        explanations = {
            "depression": f"LPS frequency match applied: +{(factor-1.0)*100:.0f}% vortex core envelope enhancement.",
            "break": f"Break QM applied: {(factor-1.0)*100:.0f}% leakage suppression over central core.",
            "active": f"Active EMOS distributional scaling applied: +{(factor-1.0)*100:.0f}% under-amplitude correction.",
            "orographic": f"Terrain-aware QM applied: +{(factor-1.0)*100:.0f}% windward uplift compensation.",
            "coastal": f"Coastal analog adjustment applied: +{(factor-1.0)*100:.0f}% timing correction.",
            "western_disturbance": f"WD elevation-stratified recalibration: +{(factor-1.0)*100:.0f}%."
        }

        return CorrectionResult(
            corrected_mean_mm=round(corrected, 2),
            correction_method=method_name,
            provenance=f"bank:{method_name} (v={self.version})",
            scaling_factor=factor,
            explanation=explanations.get(dominant, "Regime-aware correction applied.")
        )
