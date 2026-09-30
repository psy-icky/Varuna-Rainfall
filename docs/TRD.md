# VARUNA-RAINFALL — Technical Requirements Document (TRD)

## 1. Architecture

### Recommended stack

**Frontend**
- React
- TypeScript
- Vite
- Tailwind CSS
- TanStack Query
- Leaflet / React-Leaflet
- Recharts
- Lucide icons

**Backend**
- Python 3.11+
- FastAPI
- Pydantic v2
- NumPy
- pandas
- SciPy
- scikit-learn
- optional PyTorch adapter for future CNN/ConvLSTM
- Uvicorn

**Data**
- Supabase PostgreSQL
- JSONB for flexible model/provenance packets
- PostGIS optional for official polygon migration
- Supabase Auth optional for future user roles

**Deployment**
- Vercel/Netlify for frontend
- Render/Railway/Fly for FastAPI
- Supabase for database

---

## 2. System layers

```text
[React Dashboard]
        |
        v
[FastAPI API Gateway]
        |
        +-------------------------------+
        |                               |
        v                               v
[Forecast Orchestrator]          [Verification Service]
        |
        +--> Data/QC Service
        |
        +--> Regime Engine
        |       +--> Rule Evidence
        |       +--> CNN Adapter (future)
        |       +--> LPS Tracker Adapter (future)
        |       +--> Confidence Fusion
        |
        +--> Correction Router
        |       +--> Active EMOS Adapter
        |       +--> Break QM Adapter
        |       +--> LPS Frequency Adapter
        |       +--> Terrain QM Adapter
        |       +--> Coastal Analog Adapter
        |       +--> WD Recalibration Adapter
        |
        +--> Distribution Service
        |       +--> Occurrence head
        |       +--> Positive amount
        |       +--> q10/q50/q90
        |
        +--> Threshold Probability Service
        |
        +--> Trust/Fallback Service
        |
        +--> District Aggregation
        |
        +--> Audit Service
        |
        v
[Supabase PostgreSQL]
```

---

## 3. Repository structure

```text
varuna-rainfall/
├─ apps/
│  ├─ web/
│  │  ├─ src/
│  │  │  ├─ components/
│  │  │  ├─ pages/
│  │  │  ├─ features/
│  │  │  ├─ hooks/
│  │  │  ├─ lib/
│  │  │  ├─ types/
│  │  │  └─ app/
│  │  └─ public/
│  └─ api/
│     ├─ app/
│     │  ├─ api/
│     │  ├─ core/
│     │  ├─ models/
│     │  ├─ schemas/
│     │  ├─ services/
│     │  │  ├─ ingestion/
│     │  │  ├─ regime/
│     │  │  ├─ correction/
│     │  │  ├─ probability/
│     │  │  ├─ district/
│     │  │  ├─ verification/
│     │  │  └─ trust/
│     │  └─ main.py
│     └─ tests/
├─ supabase/
│  └─ supabase_schema.sql
├─ docs/
│  ├─ PRD.md
│  ├─ TRD.md
│  ├─ FRONTEND.md
│  ├─ BACKEND.md
│  ├─ FLOW.md
│  └─ DB.md
├─ .env.example
├─ docker-compose.yml
└─ README.md
```

---

## 4. Prototype implementation strategy

### 4.1 Separate "scientific adapter" from "demo engine"

Do not hardwire fake formulas into the API contract.

Create:

```python
class RegimeEngine(Protocol):
    def predict(self, features: RegimeFeatures) -> RegimeResult: ...

class CorrectionBank(Protocol):
    def correct(self, forecast: ForecastField, context: CorrectionContext) -> CorrectionResult: ...
```

Then provide:

- `DemoRegimeEngine`
- `DemoCorrectionBank`
- `FutureCNNRegimeEngine`
- `FutureLPSRegimeEngine`
- `FutureEMOSCorrectionBank`
- `FutureQMCorrectionBank`

This makes the prototype honest and upgradeable.

---

## 5. Regime engine

### Inputs

```text
core_zone_anomaly
active_persistence_days
break_persistence_days
monsoon_trough_lat
olr_anomaly
vorticity_850
wind_speed_850
coast_distance_km
elevation_m
terrain_gradient
western_disturbance_flag
cnn_confidence (optional)
lps_confidence (optional)
```

### Rule baseline

The supplied research describes:

- active spell: core-zone rainfall anomaly >= +1 sigma with >=3-day persistence
- break spell: core-zone rainfall anomaly <= -1 sigma with >=3-day persistence
- LPS: 850-hPa vorticity maxima + tracking
- western disturbance: upper-level trough evidence over the specified northwestern corridor

For the prototype, these become configurable rule features.

### Fusion

Priority:

```text
LPS/depression
    >
western disturbance
    >
active/break
    >
orographic/coastal modifiers
    >
transition
```

Do not force one mutually exclusive state at the UI level.

The API should return:

```json
{
  "probabilities": {
    "active": 0.12,
    "break": 0.05,
    "depression": 0.68,
    "coastal": 0.09,
    "orographic": 0.04,
    "western_disturbance": 0.01
  },
  "transition": false,
  "confidence": 0.84,
  "evidence": [...]
}
```

---

## 6. Correction engine

### Shared contract

```python
CorrectionResult(
    mean_mm_day: float,
    q10_mm_day: float,
    q50_mm_day: float,
    q90_mm_day: float,
    positive_probability: float,
    uncertainty_mm: float,
    method: str,
    fallback_state: str,
    explanation: str
)
```

### Demo methods

The demo engine must use deterministic transformations that visibly differ by regime while remaining physically non-negative.

Example concept:

```text
active:
  amplified envelope + distribution widening

break:
  reduced core rainfall + spatial redistribution proxy

depression:
  amplitude increase + spatial displacement proxy

orographic:
  terrain uplift factor

coastal:
  coastal timing/analogue factor

western disturbance:
  elevation-stratified recalibration
```

Use named coefficients in configuration so judges can inspect them.

---

## 7. Occurrence + intensity abstraction

Represent rainfall as:

```text
P(rain > 0) + P(amount | rain > 0)
```

Threshold probabilities are calculated from the returned distribution abstraction.

Recommended demo approximation:

- occurrence probability: sigmoid/monotonic function of raw rain + regime probability + ensemble spread
- positive amount: gamma-like parameterization
- threshold probability: analytical CDF or deterministic approximation

Production replacement:
- censored/shifted-gamma EMOS
- quantile mapping
- distribution-free frequency matching
- calibrated exceedance head

---

## 8. Calibration

Prototype calibration statuses are deterministic metadata, not evidence of production calibration.

Recommended enum:

```text
green
amber
abstain
```

Display:

```text
GREEN
Calibrated demo curve
Support: adequate
```

or

```text
AMBER
Limited regime support
Human review recommended
```

or

```text
ABSTAIN
OOD / stale / insufficient support
Do not use this result for automated action
```

Production implementation slot:
- isotonic calibration
- Platt-style calibration for occurrence
- rolling calibration window
- reliability diagram
- Brier score
- Brier skill score

---

## 9. Verification service

Implement exact metrics with tests.

### RMSE

```text
sqrt(mean((forecast - observation)^2))
```

### POD

```text
hits / (hits + misses)
```

### FAR

```text
false_alarms / (hits + false_alarms)
```

### CSI

```text
hits / (hits + misses + false_alarms)
```

### ETS

```text
(hits - hits_random) /
(hits + misses + false_alarms - hits_random)
```

### FSS

Implement a prototype neighbourhood fractions calculation.

Inputs must explicitly store:

- threshold
- neighbourhood radius
- lead
- verification date
- forecast source
- observation source

Never show an FSS value without that metadata.

---

## 10. Data freshness

Each ingestion source has:

```text
expected_interval_minutes
stale_after_minutes
last_success_at
status
```

Example:

```text
NWP        360 min
Satellite  180 min
Observation 1440 min
```

When stale:

```text
source_status = stale
fallback_triggered = true
```

---

## 11. Fallback ladder

```text
REGIME_AWARE
    |
    v
POOLED_GLOBAL
    |
    v
QM
    |
    v
RAW_NWP / CLIMATOLOGY
    |
    v
ABSTAIN / ESCALATE
```

Each transition creates a `fallback_event`.

---

## 12. API specification

### Health

`GET /api/v1/health`

### List districts

`GET /api/v1/districts`

Query:
- state
- search

### List demo cases

`GET /api/v1/cases`

### Forecast packet

`GET /api/v1/forecasts/{forecast_id}`

### District forecast

`GET /api/v1/districts/{district_id}/forecast?case_id=...`

### Regime explanation

`GET /api/v1/forecasts/{forecast_id}/regime`

### Verification

`GET /api/v1/verification/{case_id}`

### Trigger demo fault

`POST /api/v1/demo/fault`

Body:

```json
{
  "fault": "stale_satellite"
}
```

### Reset demo

`POST /api/v1/demo/reset`

### Audit packet

`GET /api/v1/audit/{forecast_id}`

### Trust status

`GET /api/v1/trust/{forecast_id}`

---

## 13. API error contract

```json
{
  "error": {
    "code": "STALE_SOURCE",
    "message": "Satellite source exceeded freshness policy",
    "retryable": true,
    "fallback_state": "QM",
    "trace_id": "..."
  }
}
```

---

## 14. Security

Prototype:

- never expose Supabase service-role key to frontend
- use public anon key only in frontend if RLS is correctly configured
- backend writes audit/fallback records
- environment variables only
- CORS restricted in production
- no real personal data in the demo database

Production:
- Supabase Auth
- role-based access
- signed audit records
- secret rotation
- rate limiting
- request IDs
- immutable model registry

---

## 15. Observability

Log:

- request ID
- forecast ID
- case ID
- source freshness
- model version
- regime confidence
- correction method
- fallback
- API duration

Create an internal `/debug` response only in development.

---

## 16. Testing

### Unit tests

- threshold calculations
- regime probability sum
- non-negative rainfall
- quantile ordering
- fallback ladder
- each metric
- stale source detection

### Integration tests

- forecast endpoint
- Supabase read/write
- fault injection
- audit packet

### Golden demo test

A fixed demo case must produce a known JSON snapshot. This protects the live demo from accidental changes.

---

## 17. Build order

1. Database schema + seed
2. FastAPI contracts
3. Demo services
4. Verification service
5. Frontend shell
6. District map
7. Forecast detail
8. Verification panel
9. Trust/fallback panel
10. Audit packet
11. Golden tests
12. Deployment

---

## 18. Definition of done

The technical prototype is done when:

- frontend runs,
- backend runs,
- Supabase schema runs,
- seed data loads,
- all primary screens work,
- API contracts are documented,
- stale-input demo works,
- verification works,
- audit works,
- no unproven claims appear in UI,
- setup is documented in README.
