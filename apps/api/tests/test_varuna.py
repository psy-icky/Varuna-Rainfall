import json
import numpy as np
import pytest
from fastapi.testclient import TestClient

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.schemas.regime import RegimeFeatures
from app.services.regime.engine import DemoRegimeEngine
from app.services.correction.bank import DemoCorrectionBank
from app.services.probability.distribution import DistributionService
from app.services.trust.fallback import fallback_service
from app.services.verification.engine import (
    calculate_rmse,
    calculate_contingency,
    calculate_pod,
    calculate_far,
    calculate_csi,
    calculate_ets,
    calculate_fss
)
from app.services.orchestrator import orchestrator

client = TestClient(app)

# 1. test_regime_probability_sum
def test_regime_probability_sum():
    engine = DemoRegimeEngine()
    features = RegimeFeatures(core_anomaly=1.4, vorticity_850=3.8, wind_speed_850=17.5)
    res = engine.predict(features)
    total_prob = sum(res.probabilities.values())
    assert abs(total_prob - 1.0) < 1e-4, f"Regime probabilities must sum to 1.0, got {total_prob}"

# 2. test_transition_state
def test_transition_state():
    engine = DemoRegimeEngine()
    # Transition features where active and break are balanced
    features = RegimeFeatures(core_anomaly=0.1, active_persistence_days=1, break_persistence_days=1, vorticity_850=1.2)
    res = engine.predict(features)
    assert res.transition is True, "Ambiguous case must trigger transition state"

# 3. test_nonnegative_rainfall
def test_nonnegative_rainfall():
    bank = DemoCorrectionBank()
    probs = {"active": 0.5, "break": 0.5, "depression": 0.0, "coastal": 0.0, "orographic": 0.0, "western_disturbance": 0.0}
    res = bank.apply(raw_rain_mm=0.0, regime_probabilities=probs, context={})
    assert res.corrected_mean_mm >= 0.0

    res_neg = bank.apply(raw_rain_mm=-10.0, regime_probabilities=probs, context={})
    assert res_neg.corrected_mean_mm >= 0.0

# 4. test_quantile_order
def test_quantile_order():
    dist_svc = DistributionService()
    probs = {"depression": 0.75, "active": 0.15, "break": 0.02, "coastal": 0.04, "orographic": 0.03, "western_disturbance": 0.01}
    out = dist_svc.derive_distribution(corrected_mean_mm=85.0, ensemble_std_mm=22.0, regime_probabilities=probs)
    assert out["q10_mm"] <= out["q50_mm"] <= out["q90_mm"], (
        f"Quantile monotonicity violated: q10={out['q10_mm']}, q50={out['q50_mm']}, q90={out['q90_mm']}"
    )

# 5. test_threshold_monotonicity
def test_threshold_monotonicity():
    dist_svc = DistributionService()
    probs = {"depression": 0.70, "active": 0.20, "break": 0.02, "coastal": 0.04, "orographic": 0.03, "western_disturbance": 0.01}
    out = dist_svc.derive_distribution(corrected_mean_mm=120.0, ensemble_std_mm=30.0, regime_probabilities=probs)
    p64 = out["p64_5"]
    p115 = out["p115_6"]
    p204 = out["p204_5"]
    assert p204 <= p115 <= p64, f"Threshold monotonicity violated: p204={p204} <= p115={p115} <= p64={p64}"

# 6. test_fallback_stale
def test_fallback_stale():
    fallback_service.set_fault("stale_satellite")
    f_state, calib, reason, review = fallback_service.evaluate_state(is_transition=False, regime_confidence=0.85)
    assert f_state == "QM"
    assert calib == "AMBER"
    fallback_service.reset()

# 7. test_fallback_missing_nwp
def test_fallback_missing_nwp():
    fallback_service.set_fault("missing_nwp")
    f_state, calib, reason, review = fallback_service.evaluate_state(is_transition=False, regime_confidence=0.85)
    assert f_state == "ABSTAIN"
    assert review is True
    fallback_service.reset()

# 8. test_rmse
def test_rmse():
    f = np.array([10.0, 20.0, 30.0])
    o = np.array([10.0, 20.0, 30.0])
    assert calculate_rmse(f, o) == 0.0

    f2 = np.array([13.0, 24.0])
    o2 = np.array([10.0, 20.0])
    assert round(calculate_rmse(f2, o2), 2) == 3.54

# 9. test_pod
def test_pod():
    # POD = H / (H + M)
    assert calculate_pod(hits=8, misses=2) == 0.8
    assert calculate_pod(hits=0, misses=5) == 0.0

# 10. test_far
def test_far():
    # FAR = F / (H + F)
    assert calculate_far(hits=6, false_alarms=2) == 0.25
    assert calculate_far(hits=10, false_alarms=0) == 0.0

# 11. test_csi
def test_csi():
    # CSI = H / (H + M + F)
    assert calculate_csi(hits=5, misses=2, false_alarms=3) == 0.5

# 12. test_ets
def test_ets():
    hits, misses, fa, cn = 20, 5, 5, 70
    ets = calculate_ets(hits, misses, fa, cn)
    assert 0.0 < ets < 1.0

# 13. test_fss
def test_fss():
    grid_f = np.ones((10, 10)) * 70.0
    grid_o = np.ones((10, 10)) * 70.0
    fss_perfect = calculate_fss(grid_f, grid_o, threshold=64.5, window_size=3)
    assert fss_perfect == 1.0

    grid_zero = np.zeros((10, 10))
    fss_poor = calculate_fss(grid_zero, grid_o, threshold=64.5, window_size=3)
    assert fss_poor == 0.0

# 14. test_audit_lineage
def test_audit_lineage():
    res = client.get("/api/v1/districts/mh_nashik/forecast?case_id=case_lps_001")
    assert res.status_code == 200
    fc = res.json()
    audit_res = client.get(f"/api/v1/audit/{fc['forecast_id']}")
    assert audit_res.status_code == 200
    audit = audit_res.json()
    assert audit["forecast_id"] == fc["forecast_id"]
    assert "provenance_hash" in audit
    assert audit["model_version"] == "demo-0.1.0"
    assert audit["data_quality"] == "synthetic_demo"

# 15. test_demo_reset
def test_demo_reset():
    # Inject fault
    inj = client.post("/api/v1/demo/fault", json={"fault": "stale_satellite"})
    assert inj.status_code == 200
    assert fallback_service.active_fault == "stale_satellite"

    # Reset
    rst = client.post("/api/v1/demo/reset")
    assert rst.status_code == 200
    assert fallback_service.active_fault is None

# 16. Hero LPS Case Golden JSON Snapshot
def test_golden_hero_snapshot():
    res = client.get("/api/v1/districts/mh_nashik/forecast?case_id=case_lps_001")
    assert res.status_code == 200
    data = res.json()
    assert data["case_id"] == "case_lps_001"
    assert data["district_id"] == "mh_nashik"
    assert data["regime_probabilities"]["depression"] > 0.50
    assert data["correction_method"] == "lps_frequency_match"
    assert data["raw_rain_mm"] == 60.0
    assert data["q50_mm"] >= 60.0 # Amplified
    assert data["p64_5"] > 0.40
    assert data["data_quality"] == "synthetic_demo"
    assert "Decision support" in data["disclaimer"]
