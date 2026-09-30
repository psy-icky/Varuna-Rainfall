# VARUNA-RAINFALL — Backend Specification

## 1. Service responsibilities

FastAPI is the orchestration layer.

Services:

```text
ingestion
regime
correction
probability
district
verification
trust
audit
demo
```

---

## 2. Service contracts

### ForecastOrchestrator

```python
def build_forecast_packet(
    district_id: str,
    case_id: str,
    fault_mode: str | None = None
) -> ForecastPacket:
    ...
```

Pipeline:

```text
load_case
→ validate_sources
→ calculate_freshness
→ derive_regime_features
→ regime_predict
→ correction_route
→ generate_distribution
→ threshold_probabilities
→ calibration
→ fallback
→ district_product
→ persist_audit
→ return
```

---

## 3. Demo case structure

```python
DemoCase(
    id="case_lps_001",
    name="Central India LPS",
    date="2026-08-17",
    regime_hint="depression",
    raw_rain=60.0,
    observation=142.0,
    ensemble_mean=57.0,
    ensemble_std=24.0,
    core_anomaly=1.4,
    active_persistence=4,
    break_persistence=0,
    vorticity_850=3.8,
    wind_speed_850=17.5,
    elevation=465,
    coast_distance_km=740
)
```

These numbers are synthetic demo inputs.

---

## 4. Regime engine

### Demo regime engine

Use soft evidence and normalize scores to probabilities.

Pseudo-code:

```python
scores = {
    "active": active_score(features),
    "break": break_score(features),
    "depression": lps_score(features),
    "coastal": coastal_score(features),
    "orographic": orographic_score(features),
    "western_disturbance": wd_score(features),
}
probs = softmax(scores)
transition = top1_prob < 0.55 or top1_prob - top2_prob < 0.15
```

Add an explicit confidence score.

Do not call this a trained CNN unless a real CNN is actually loaded and evaluated.

---

## 5. Correction router

Map regime posterior to correction bank:

```python
bank_by_regime = {
    "active": "active_emos",
    "break": "break_qm",
    "depression": "lps_frequency_match",
    "coastal": "coastal_analog",
    "orographic": "terrain_qm",
    "western_disturbance": "wd_recalibration",
}
```

For transition:

```python
corrected = sum(
    p_regime * correction_bank(regime)
    for regime, p_regime in posterior.items()
)
```

This mirrors the supplied research idea of soft mixture behavior under regime uncertainty.

---

## 6. Distribution service

Prototype:

```python
positive_prob = clip(base_occurrence + regime_tail_boost, 0, 0.99)

shape = max(1.2, ...)
scale = max(1.0, ...)

q10, q50, q90 = gamma_like_quantiles(shape, scale)
```

Ensure:

```python
q10 >= 0
q10 <= q50 <= q90
```

For zero-inflated output, use:

```text
Expected rainfall = P(positive) * E[positive amount]
```

---

## 7. Threshold probability service

Thresholds:

```python
THRESHOLDS = {
    "heavy": 64.5,
    "very_heavy": 115.6,
    "extremely_heavy": 204.5,
}
```

Return:

```json
{
  "64.5": 0.68,
  "115.6": 0.24,
  "204.5": 0.07
}
```

Use monotonic probabilities:

```text
P(>=204.5) <= P(>=115.6) <= P(>=64.5)
```

---

## 8. Calibration service

Demo implementation:

- deterministic calibration transform
- calibration status from case support metadata
- reliability payload generated from seeded samples

Production replacement:
- isotonic calibration trained only on validation data
- never fit calibration on the test observation

---

## 9. Fallback service

### Inputs

```text
source freshness
schema validity
regime confidence
regime support count
OOD score
model available
calibration available
```

### Decision logic

```python
if fatal_input_error:
    return ABSTAIN

if stale_required_source and alternate_source_unavailable:
    return QM_OR_RAW

if ood_score > threshold:
    return POOLED_GLOBAL_OR_ABSTAIN

if regime_support < min_support:
    return POOLED_GLOBAL

return REGIME_AWARE
```

Persist every fallback.

---

## 10. Data freshness

Calculate:

```python
age_minutes = (now - source.last_success_at).total_seconds() / 60
```

Statuses:

```text
fresh
stale
missing
invalid
```

No fake current timestamps. Demo case times remain fixed.

---

## 11. Verification service

### Categorical event construction

For threshold T:

```python
forecast_event = forecast >= T
observed_event = observed >= T
```

Accumulate:
- H
- M
- F
- correct negatives

Then calculate POD/FAR/CSI/ETS.

### FSS

For each neighbourhood size:

1. create binary event grid
2. calculate local forecast event fraction
3. calculate local observed event fraction
4. calculate numerator MSE
5. normalize with reference denominator
6. return FSS

Prototype can use small synthetic grid arrays.

---

## 12. Verification output

```json
{
  "case_id": "case_lps_001",
  "threshold_mm": 115.6,
  "lead_day": 1,
  "baselines": {
    "raw_nwp": {
      "rmse": 80.2,
      "ets": 0.18,
      "csi": 0.25,
      "pod": 0.44,
      "far": 0.41,
      "fss": 0.49
    },
    "qm": {...},
    "emos": {...},
    "regime_aware": {...}
  },
  "data_quality": "synthetic_demo"
}
```

Any seeded numbers must be labeled as synthetic demo results.

---

## 13. District aggregation

For demo:

```text
grid_value
x
district_weight
=
district contribution
```

Sum normalized weights.

When official polygons arrive:
- switch to PostGIS
- area-weight based on grid-polygon intersection

Never call simplified demo boundaries official.

---

## 14. Audit packet

Persist:

```json
{
  "forecast_id": "...",
  "case_id": "...",
  "issue_time": "...",
  "valid_time": "...",
  "lead_hours": 24,
  "accumulation_window": "24h",
  "sources": [...],
  "regime_probabilities": {...},
  "correction_method": "lps_frequency_match",
  "fallback_state": "none",
  "calibration_status": "amber",
  "model_version": "demo-0.1.0",
  "data_version": "demo-2026-09-01",
  "verification_artifact": "verify-case_lps_001",
  "human_review": true
}
```

---

## 15. Endpoints

### GET `/api/v1/health`

```json
{
  "status": "ok",
  "demo_mode": true,
  "db": "connected"
}
```

### GET `/api/v1/cases`

Returns:
- id
- label
- date
- regime_hint
- description
- synthetic flag

### GET `/api/v1/districts`

Returns district list.

### GET `/api/v1/districts/{district_id}/forecast`

Returns full district forecast packet.

### GET `/api/v1/forecasts/{forecast_id}/regime`

Returns regime evidence.

### GET `/api/v1/verification/{case_id}`

Returns all baseline metrics.

### GET `/api/v1/trust/{forecast_id}`

Returns source health, fallback and calibration.

### GET `/api/v1/audit/{forecast_id}`

Returns lineage.

### POST `/api/v1/demo/fault`

Supported:
- `stale_satellite`
- `missing_nwp`
- `schema_error`
- `regime_ood`

### POST `/api/v1/demo/reset`

Restores no-fault mode.

---

## 16. Backend module names

```text
app/
├─ api/
│  ├─ routes_health.py
│  ├─ routes_cases.py
│  ├─ routes_forecasts.py
│  ├─ routes_verification.py
│  ├─ routes_trust.py
│  ├─ routes_audit.py
│  └─ routes_demo.py
├─ core/
│  ├─ config.py
│  ├─ constants.py
│  └─ logging.py
├─ schemas/
│  ├─ forecast.py
│  ├─ regime.py
│  ├─ verification.py
│  └─ audit.py
├─ services/
│  ├─ orchestrator.py
│  ├─ regime/
│  ├─ correction/
│  ├─ probability/
│  ├─ district/
│  ├─ verification/
│  └─ trust/
└─ main.py
```

---

## 17. Testing

Tests required before demo:

```text
test_regime_probs_sum_to_one
test_transition_detection
test_nonnegative_output
test_quantile_order
test_threshold_monotonicity
test_stale_source
test_fallback_ladder
test_rmse
test_pod
test_far
test_csi
test_ets
test_fss
test_audit_contains_provenance
test_demo_reset
```

---

## 18. Error handling

FastAPI exception handler should convert internal failures to the stable API error contract.

No stack traces in production response.

Every error gets:
- code
- message
- request ID
- fallback state

---

## 19. Demo-mode banner

Backend adds:

```text
X-Prototype-Mode: synthetic_demo
```

Optional.

Frontend must always render:
`Synthetic prototype data — not operational forecast skill.`
