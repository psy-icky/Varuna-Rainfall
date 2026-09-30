from typing import Protocol, Dict, List, Any
import numpy as np
from app.schemas.regime import RegimeFeatures, RegimeResult
from app.core.constants import REGIMES

class RegimeEngine(Protocol):
    def predict(self, features: RegimeFeatures) -> RegimeResult:
        ...

class DemoRegimeEngine:
    """
    Deterministic demonstration implementation of the Hybrid Weather-Regime Classifier.
    Applies synoptic feature scoring followed by softmax normalization.
    """
    def __init__(self, version: str = "demo-regime-0.1.0"):
        self.version = version

    def predict(self, features: RegimeFeatures) -> RegimeResult:
        # Heuristic scoring using meteorological features
        scores: Dict[str, float] = {}

        # 1. Active Monsoon: Positive core-zone anomaly + sustained active days + moderate vorticity
        scores["active"] = (
            features.core_anomaly * 1.8 +
            features.active_persistence_days * 0.45 +
            (features.wind_speed_850 / 12.0)
        )

        # 2. Break Monsoon: Negative core anomaly + sustained break days
        scores["break"] = (
            (-features.core_anomaly) * 1.9 +
            features.break_persistence_days * 0.55 -
            (features.vorticity_850 * 0.3)
        )

        # 3. Depression / Low Pressure System (LPS): Elevated 850hPa vorticity + active monsoon environment
        scores["depression"] = (
            features.vorticity_850 * 1.25 +
            (features.wind_speed_850 / 8.0) * 0.8 +
            features.core_anomaly * 0.5
        )

        # 4. Coastal / Offshore trough: Nearness to coastline + low elevation
        scores["coastal"] = (
            max(0.0, (400.0 - features.coast_distance_km) / 100.0) * 1.1 +
            (features.wind_speed_850 / 14.0)
        )

        # 5. Orographic: High terrain elevation + moist orthogonal wind
        scores["orographic"] = (
            (features.elevation / 500.0) * 1.2 +
            (features.wind_speed_850 / 15.0) * 0.9
        )

        # 6. Western Disturbance: Upper-level trough flag + high latitude / northern elevation
        scores["western_disturbance"] = (
            (4.0 if features.western_disturbance_flag else 0.1) +
            (features.elevation / 1000.0) * 0.6
        )

        # Softmax normalization
        score_keys = REGIMES
        raw_vals = np.array([scores[k] for k in score_keys], dtype=np.float64)
        # Numerical stability shift
        exp_vals = np.exp(raw_vals - np.max(raw_vals))
        probs = exp_vals / np.sum(exp_vals)

        # Round and re-normalize to ensure exact 1.0 sum
        probs_dict = {k: round(float(p), 4) for k, p in zip(score_keys, probs)}
        # Fix minor rounding discrepancies on largest probability
        diff = 1.0 - sum(probs_dict.values())
        top_k = max(probs_dict, key=probs_dict.get)
        probs_dict[top_k] = round(probs_dict[top_k] + diff, 4)

        # Sort descending to inspect top 2
        sorted_probs = sorted(probs_dict.items(), key=lambda x: x[1], reverse=True)
        top1_regime, top1_prob = sorted_probs[0]
        top2_regime, top2_prob = sorted_probs[1]

        # Transition detection rule from TRD:
        # top1_prob < 0.55 OR (top1_prob - top2_prob) < 0.15
        is_transition = (top1_prob < 0.55) or ((top1_prob - top2_prob) < 0.15)

        # Confidence: scaled margin between top1 and top2
        confidence = float(np.clip((top1_prob - top2_prob) * 1.5 + 0.3, 0.25, 0.96))
        if is_transition:
            confidence = round(confidence * 0.75, 3)

        evidence = [
            {
                "feature": "core_anomaly",
                "value": features.core_anomaly,
                "interpretation": "Strong positive central anomaly" if features.core_anomaly > 0.8 else ("Strong negative anomaly (break signal)" if features.core_anomaly < -0.8 else "Neutral anomaly")
            },
            {
                "feature": "vorticity_850",
                "value": features.vorticity_850,
                "interpretation": "Vortex / low-pressure signature present" if features.vorticity_850 > 2.5 else "Quasi-linear monsoon flow"
            },
            {
                "feature": "elevation",
                "value": features.elevation,
                "interpretation": f"Terrain elevation: {features.elevation}m ({'Orographic uplift active' if features.elevation > 700 else 'Lowland plain/coastal'})"
            },
            {
                "feature": "coast_distance_km",
                "value": features.coast_distance_km,
                "interpretation": f"Distance to coast: {features.coast_distance_km}km"
            }
        ]

        return RegimeResult(
            probabilities=probs_dict,
            dominant_regime=top1_regime,
            transition=is_transition,
            confidence=round(confidence, 3),
            evidence=evidence,
            engine_version=self.version
        )


class FutureCNNRegimeEngine:
    """
    Adapter interface for deep spatial CNN / ConvLSTM synoptic feature extractor.
    Documented for future integration; not loaded in prototype to maintain scientific integrity.
    """
    def __init__(self, model_weights_path: str = "models/cnn_regime_v1.pt"):
        self.model_weights_path = model_weights_path
        self.is_loaded = False

    def predict(self, features: RegimeFeatures) -> RegimeResult:
        raise NotImplementedError(
            "Production CNN model weights are not loaded in this prototype. "
            "VARUNA uses DemoRegimeEngine with declared deterministic rule heuristics."
        )


class FutureLPSTrackerAdapter:
    """
    Adapter interface for Lagrangian Monsoon Low-Pressure System (LPS) vortex tracker.
    Documented for future integration.
    """
    def __init__(self, tracker_config_path: str = "configs/tracker.yaml"):
        self.tracker_config_path = tracker_config_path
        self.is_loaded = False

    def predict(self, features: RegimeFeatures) -> RegimeResult:
        raise NotImplementedError("Production LPS Tracker is an adapter slot for operational deployment.")
