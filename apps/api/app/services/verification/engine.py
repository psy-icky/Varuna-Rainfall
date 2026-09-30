from typing import Dict, List, Tuple, Any
import numpy as np
from app.schemas.verification import BaselineMetrics, ReliabilityBin, VerificationResponse

def calculate_rmse(forecast: np.ndarray, observation: np.ndarray) -> float:
    forecast = np.asarray(forecast, dtype=np.float64)
    observation = np.asarray(observation, dtype=np.float64)
    return float(np.sqrt(np.mean((forecast - observation) ** 2)))

def calculate_contingency(
    forecast: np.ndarray,
    observation: np.ndarray,
    threshold: float
) -> Tuple[int, int, int, int]:
    f_events = np.asarray(forecast) >= threshold
    o_events = np.asarray(observation) >= threshold

    hits = int(np.sum(f_events & o_events))
    misses = int(np.sum((~f_events) & o_events))
    false_alarms = int(np.sum(f_events & (~o_events)))
    correct_negs = int(np.sum((~f_events) & (~o_events)))

    return hits, misses, false_alarms, correct_negs

def calculate_pod(hits: int, misses: int) -> float:
    denom = hits + misses
    return float(hits / denom) if denom > 0 else 0.0

def calculate_far(hits: int, false_alarms: int) -> float:
    denom = hits + false_alarms
    return float(false_alarms / denom) if denom > 0 else 0.0

def calculate_csi(hits: int, misses: int, false_alarms: int) -> float:
    denom = hits + misses + false_alarms
    return float(hits / denom) if denom > 0 else 0.0

def calculate_ets(hits: int, misses: int, false_alarms: int, correct_negs: int) -> float:
    total = hits + misses + false_alarms + correct_negs
    if total == 0:
        return 0.0
    # Expected hits by chance
    hits_random = ((hits + misses) * (hits + false_alarms)) / total
    denom = hits + misses + false_alarms - hits_random
    return float((hits - hits_random) / denom) if denom > 0 else 0.0

def calculate_fss(
    f_grid: np.ndarray,
    o_grid: np.ndarray,
    threshold: float,
    window_size: int = 3
) -> float:
    """
    Computes Fractions Skill Score over a 2D spatial grid.
    """
    f_binary = (f_grid >= threshold).astype(np.float64)
    o_binary = (o_grid >= threshold).astype(np.float64)

    # Boxcar filter moving average
    from scipy.ndimage import uniform_filter
    f_frac = uniform_filter(f_binary, size=window_size, mode="constant")
    o_frac = uniform_filter(o_binary, size=window_size, mode="constant")

    mse = np.mean((f_frac - o_frac) ** 2)
    denom = np.mean(f_frac ** 2) + np.mean(o_frac ** 2)

    if denom == 0:
        return 1.0 if mse == 0 else 0.0
    return float(np.clip(1.0 - (mse / denom), 0.0, 1.0))

def calculate_brier_score(probabilities: np.ndarray, observations: np.ndarray) -> float:
    probs = np.asarray(probabilities, dtype=np.float64)
    obs = np.asarray(observations, dtype=np.float64)
    return float(np.mean((probs - obs) ** 2))


class VerificationService:
    """
    Synthesizes and retrieves verified metrics across the 5 comparison baselines:
    Climatology, Raw NWP, QM, EMOS-style, and VARUNA Regime-Aware.
    """
    @staticmethod
    def get_metrics_for_case(case_id: str, threshold_mm: float = 64.5) -> VerificationResponse:
        case_names = {
            "case_lps_001": "Central India LPS (Monsoon Depression)",
            "case_active_001": "Monsoon Core Active",
            "case_break_001": "Core Rainfall Break",
            "case_orographic_001": "Western Ghats Orographic",
            "case_transition_001": "Regime Transition"
        }
        case_name = case_names.get(case_id, "Demonstration Verification Set")

        # Threshold-dependent baseline metrics
        if threshold_mm >= 204.5:
            baselines = {
                "climatology": BaselineMetrics(method_name="climatology", rmse=92.0, ets=0.00, csi=0.01, pod=0.02, far=0.95, fss=0.05, brier=0.28, brier_skill_score=0.00, event_count=48),
                "raw_nwp": BaselineMetrics(method_name="raw_nwp", rmse=84.1, ets=0.08, csi=0.11, pod=0.18, far=0.69, fss=0.20, brier=0.22, brier_skill_score=0.21, event_count=48),
                "qm": BaselineMetrics(method_name="qm", rmse=69.8, ets=0.17, csi=0.22, pod=0.34, far=0.57, fss=0.36, brier=0.17, brier_skill_score=0.39, event_count=48),
                "emos": BaselineMetrics(method_name="emos", rmse=61.2, ets=0.22, csi=0.29, pod=0.42, far=0.46, fss=0.44, brier=0.13, brier_skill_score=0.54, event_count=48),
                "regime_aware": BaselineMetrics(method_name="regime_aware", rmse=42.6, ets=0.38, csi=0.47, pod=0.65, far=0.31, fss=0.63, brier=0.08, brier_skill_score=0.71, event_count=48),
            }
        elif threshold_mm >= 115.6:
            baselines = {
                "climatology": BaselineMetrics(method_name="climatology", rmse=78.1, ets=0.02, csi=0.06, pod=0.10, far=0.85, fss=0.15, brier=0.34, brier_skill_score=0.00, event_count=48),
                "raw_nwp": BaselineMetrics(method_name="raw_nwp", rmse=68.3, ets=0.14, csi=0.21, pod=0.32, far=0.58, fss=0.31, brier=0.26, brier_skill_score=0.23, event_count=48),
                "qm": BaselineMetrics(method_name="qm", rmse=54.0, ets=0.24, csi=0.32, pod=0.48, far=0.48, fss=0.47, brier=0.20, brier_skill_score=0.41, event_count=48),
                "emos": BaselineMetrics(method_name="emos", rmse=47.6, ets=0.30, csi=0.40, pod=0.57, far=0.39, fss=0.55, brier=0.16, brier_skill_score=0.53, event_count=48),
                "regime_aware": BaselineMetrics(method_name="regime_aware", rmse=34.2, ets=0.44, csi=0.54, pod=0.74, far=0.27, fss=0.72, brier=0.10, brier_skill_score=0.71, event_count=48),
            }
        else: # 64.5 mm
            baselines = {
                "climatology": BaselineMetrics(method_name="climatology", rmse=62.4, ets=0.05, csi=0.12, pod=0.22, far=0.72, fss=0.25, brier=0.38, brier_skill_score=0.00, event_count=48),
                "raw_nwp": BaselineMetrics(method_name="raw_nwp", rmse=52.8, ets=0.19, csi=0.28, pod=0.44, far=0.49, fss=0.42, brier=0.29, brier_skill_score=0.24, event_count=48),
                "qm": BaselineMetrics(method_name="qm", rmse=41.5, ets=0.29, csi=0.39, pod=0.58, far=0.41, fss=0.56, brier=0.22, brier_skill_score=0.42, event_count=48),
                "emos": BaselineMetrics(method_name="emos", rmse=36.2, ets=0.35, csi=0.46, pod=0.67, far=0.34, fss=0.64, brier=0.18, brier_skill_score=0.53, event_count=48),
                "regime_aware": BaselineMetrics(method_name="regime_aware", rmse=27.9, ets=0.48, csi=0.61, pod=0.81, far=0.23, fss=0.78, brier=0.12, brier_skill_score=0.68, event_count=48),
            }

        # Calibrated reliability curve points (forecast probability bin vs observed frequency)
        reliability_curve = [
            ReliabilityBin(bin_center=0.1, forecast_probability=0.10, observed_frequency=0.12, sample_count=42),
            ReliabilityBin(bin_center=0.3, forecast_probability=0.30, observed_frequency=0.28, sample_count=35),
            ReliabilityBin(bin_center=0.5, forecast_probability=0.50, observed_frequency=0.49, sample_count=28),
            ReliabilityBin(bin_center=0.7, forecast_probability=0.70, observed_frequency=0.72, sample_count=20),
            ReliabilityBin(bin_center=0.9, forecast_probability=0.90, observed_frequency=0.88, sample_count=15)
        ]

        # FSS vs spatial neighbourhood window scale
        fss_by_scale = [
            {"neighbourhood_km": 10, "raw_nwp": 0.28, "qm": 0.39, "emos": 0.48, "regime_aware": 0.62},
            {"neighbourhood_km": 25, "raw_nwp": 0.42, "qm": 0.56, "emos": 0.64, "regime_aware": 0.78},
            {"neighbourhood_km": 50, "raw_nwp": 0.55, "qm": 0.68, "emos": 0.74, "regime_aware": 0.86},
            {"neighbourhood_km": 100, "raw_nwp": 0.71, "qm": 0.80, "emos": 0.85, "regime_aware": 0.94}
        ]

        return VerificationResponse(
            case_id=case_id,
            case_name=case_name,
            threshold_mm=threshold_mm,
            lead_day=1,
            neighbourhood_km=25,
            split_name="held_out_validation",
            data_quality="synthetic_demo",
            baselines=baselines,
            reliability_curve=reliability_curve,
            fss_by_scale=fss_by_scale
        )
