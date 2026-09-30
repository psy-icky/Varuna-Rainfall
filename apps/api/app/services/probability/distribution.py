from typing import Dict, Any, Tuple
import numpy as np
from scipy import stats
from app.core.constants import IMD_THRESHOLDS

class DistributionService:
    """
    Parametric zero-inflated two-part distribution service.
    Models occurrence P(rain > 0) + continuous intensity Gamma(k, theta).
    Enforces strict mathematical invariants:
      1. rainfall >= 0
      2. q10 <= q50 <= q90
      3. P(>=204.5) <= P(>=115.6) <= P(>=64.5)
    """

    @staticmethod
    def derive_distribution(
        corrected_mean_mm: float,
        ensemble_std_mm: float,
        regime_probabilities: Dict[str, float],
        is_transition: bool = False,
        fallback_state: str = "REGIME_AWARE"
    ) -> Dict[str, Any]:
        corrected_mean = max(0.0, float(corrected_mean_mm))
        base_std = max(1.5, float(ensemble_std_mm))

        # Under transition or degraded fallback, widen the epistemic uncertainty
        uncertainty_multiplier = 1.0
        if is_transition:
            uncertainty_multiplier = 1.35
        if fallback_state == "QM":
            uncertainty_multiplier = 1.50
        elif fallback_state == "RAW_NWP":
            uncertainty_multiplier = 1.80
        elif fallback_state == "ABSTAIN":
            uncertainty_multiplier = 2.40

        effective_std = base_std * uncertainty_multiplier

        # 1. Occurrence head: P(rain > 0.1 mm)
        if corrected_mean < 0.5:
            positive_prob = float(np.clip(corrected_mean / 2.0, 0.05, 0.35))
        else:
            # Sigmoid response to corrected rain amount
            positive_prob = float(np.clip(1.0 - np.exp(-corrected_mean / 12.0), 0.30, 0.99))

        # 2. Continuous positive amount: Parameterize Gamma distribution
        # Mean of positive rain E[X | X > 0] = corrected_mean / positive_prob
        mean_cond = max(0.1, corrected_mean / max(0.01, positive_prob))
        variance_cond = max(1.0, (effective_std ** 2))

        # Gamma parameters: k (shape), theta (scale) where mean = k*theta, var = k*theta^2
        # theta = var / mean, k = mean / theta
        theta = max(0.5, variance_cond / mean_cond)
        k = max(0.8, mean_cond / theta)

        gamma_dist = stats.gamma(a=k, scale=theta)

        # Invert CDF for conditional quantiles, modulated by occurrence probability
        # Quantile q of total distribution: F(y) = (1 - p) + p * F_gamma(y) => F_gamma(y) = (q - (1-p)) / p
        def get_total_quantile(target_q: float) -> float:
            prob_zero = 1.0 - positive_prob
            if target_q <= prob_zero:
                return 0.0
            cond_q = (target_q - prob_zero) / positive_prob
            cond_q = np.clip(cond_q, 1e-4, 0.9999)
            val = float(gamma_dist.ppf(cond_q))
            return max(0.0, val)

        q10 = round(get_total_quantile(0.10), 1)
        q50 = round(get_total_quantile(0.50), 1)
        q90 = round(get_total_quantile(0.90), 1)

        # Enforce strict quantile ordering: q10 <= q50 <= q90
        if q50 < q10:
            q50 = q10
        if q90 < q50:
            q90 = q50 + 1.0

        # Expected rainfall
        expected_rain = round(positive_prob * mean_cond, 1)

        # 3. Threshold exceedance probabilities: P(rain >= T) = positive_prob * (1 - F_gamma(T))
        t_heavy = IMD_THRESHOLDS["heavy"]           # 64.5
        t_very_heavy = IMD_THRESHOLDS["very_heavy"] # 115.6
        t_extreme = IMD_THRESHOLDS["extremely_heavy"]# 204.5

        sf_64 = float(gamma_dist.sf(t_heavy))
        sf_115 = float(gamma_dist.sf(t_very_heavy))
        sf_204 = float(gamma_dist.sf(t_extreme))

        p64_5 = round(float(np.clip(positive_prob * sf_64, 0.0, 1.0)), 3)
        p115_6 = round(float(np.clip(positive_prob * sf_115, 0.0, 1.0)), 3)
        p204_5 = round(float(np.clip(positive_prob * sf_204, 0.0, 1.0)), 3)

        # Depression regime tail boost if depression is dominant
        depression_prob = regime_probabilities.get("depression", 0.0)
        if depression_prob > 0.40 and corrected_mean > 50.0:
            boost = (depression_prob - 0.40) * 0.25
            p64_5 = min(0.99, round(p64_5 + boost, 3))
            p115_6 = min(p64_5, round(p115_6 + boost * 0.7, 3))
            p204_5 = min(p115_6, round(p204_5 + boost * 0.35, 3))

        # Enforce strict monotonic threshold order: p204_5 <= p115_6 <= p64_5
        if p115_6 > p64_5:
            p115_6 = p64_5
        if p204_5 > p115_6:
            p204_5 = p115_6

        uncertainty_mm = round(q90 - q10, 1)

        return {
            "expected_rain_mm": expected_rain,
            "q10_mm": q10,
            "q50_mm": q50,
            "q90_mm": q90,
            "uncertainty_mm": uncertainty_mm,
            "positive_probability": round(positive_prob, 3),
            "p64_5": p64_5,
            "p115_6": p115_6,
            "p204_5": p204_5
        }
