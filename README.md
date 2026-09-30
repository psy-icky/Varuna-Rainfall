# VARUNA-RAINFALL

**SIH Problem Statement:** SIH26080 — Regime-Aware AI Post-Processing of NWP Rainfall Forecasts over India  
**Tagline:** From one forecast number to a calibrated, explainable risk field.  
**Prototype Classification:** Decision-Support Prototype (`synthetic_demo`) — Not an official public warning authority.

---

## 1. System Overview

**VARUNA-RAINFALL** is a transparent, regime-aware post-processing layer that operates over Numerical Weather Prediction (NWP) rainfall fields. Instead of presenting a single, uncalibrated raw precipitation number, VARUNA infers the synoptic atmospheric regime (Active Monsoon, Break Monsoon, Depression/LPS, Western Ghats Orographic, Coastal Convergence, Western Disturbance), routes to a regime-conditional bias correction bank, parameterizes a zero-inflated two-part occurrence and intensity distribution, derives monotonic heavy-rainfall exceedance probabilities ($P \ge 64.5$, $P \ge 115.6$, $P \ge 204.5\text{ mm/day}$), and binds every forecast to an immutable audit and data-SLA fallback ladder.

---

## 2. End-to-End Architecture

```text
+-----------------------------------------------------------------------------------+
|                            VARUNA-RAINFALL ARCHITECTURE                           |
+-----------------------------------------------------------------------------------+
                                          |
                [ Upstream Ingestion & Freshness SLA Monitoring ]
                   (NWP Grids, Satellite IR, Rain Gauges, Static DEM)
                                          |
                                          v
                         [ Stage 1: Predictor Alignment ]
                           • Schema & Freshness Verification
                           • Spatial Centroid & Topography
                                          |
                                          v
                      [ Stage 2: Weather Regime Classifier ]
                           • Synoptic Rule Evidence Engine (Active)
                           • Future Spatial CNN Adapter (Documented/Standby)
                           • LPS Vortex Tracker Adapter (Demo)
                           • Softmax Posterior & Transition Detection
                                          |
                       +------------------+------------------+
                       |                                     |
                       v (Single Dominant)                   v (Transition / Ambiguous)
         [ Regime-Conditional Bank ]             [ Posterior Probability Blend ]
         • Active: EMOS Scaling                  • Multi-regime mixture
         • Break: Core Leakage QM                • Epistemic uncertainty boost
         • LPS: Frequency Match & Core Boost     • Calibration flag: AMBER
         • Orographic: Terrain QM                • Human review escalation
         • Coastal: Convergence Analog
         • WD: Elevation Recalibration
                       |                                     |
                       +------------------+------------------+
                                          |
                                          v
             [ Stage 3 & 4: Two-Part Occurrence + Intensity Distribution ]
                    • Occurrence Head: P(Rain > 0.1 mm)
                    • Continuous Intensity: Gamma(k, theta) Parameterization
                    • Credible Bounds: q10 <= q50 <= q90
                    • IMD Thresholds: P(>=204.5) <= P(>=115.6) <= P(>=64.5)
                                          |
                                          v
                 [ Stage 5: Operational Trust & Fallback Ladder ]
               REGIME_AWARE  -->  POOLED_GLOBAL  -->  QM  -->  RAW_NWP  -->  ABSTAIN
                                          |
                     +--------------------+--------------------+
                     |                                         |
                     v                                         v
        [ REST API Gateway (FastAPI) ]            [ Database (Supabase PostgreSQL) ]
        • /api/v1/districts                       • Relational core tables
        • /api/v1/forecasts/{id}                  • JSONB provenance & audit logs
        • /api/v1/verification/{case}             • Seeded held-out scenarios
        • /api/v1/trust & /api/v1/demo            • Verification metric artifacts
                     |
                     v
       [ Decision-Support Console (React + Vite + Leaflet + Tailwind) ]
       • Regional Risk & Exceedance Map
       • Quantile Distribution & Threshold Cards
       • Six-Stage Causal Explainability Ladder
       • 5-Baseline Verification Ladder (RMSE, ETS, CSI, POD, FAR, FSS, Brier)
       • Live SLA Fault Injector & Provenance Audit Packet
```

---

## 3. Technology Stack

- **Frontend (`apps/web`):**
  - React 18, TypeScript, Vite
  - Tailwind CSS (Dark industrial charcoal/cyan aesthetic)
  - TanStack Query v5 (Declarative server state & cache invalidation)
  - Leaflet (Interactive India map with synthetic centroids & risk coloring)
  - Recharts (Distribution quantile comparisons, reliability curves, FSS)
  - Lucide React (Industrial iconography)

- **Backend (`apps/api`):**
  - Python 3.11+ / FastAPI
  - Pydantic v2 (Strict response and validation contracts)
  - NumPy, SciPy (Parametric Gamma CDF inversion, FSS uniform filtering)
  - Pytest (Comprehensive unit & integration test suite)
  - Uvicorn (ASGI web server)

- **Database (`supabase`):**
  - Supabase PostgreSQL with PostgREST REST interface
  - Relational tables for districts, cases, runs, and verification metrics
  - JSONB storage for features, provenance snapshots, and audit events

---

## 4. Repository Structure

```text
SIH PRO 2/
├── apps/
│   ├── api/
│   │   ├── app/
│   │   │   ├── api/             # HTTP route controllers
│   │   │   ├── core/            # App configuration & domain constants
│   │   │   ├── schemas/         # Pydantic v2 contracts
│   │   │   ├── services/        # Regime, correction, probability, verification, trust
│   │   │   └── main.py          # FastAPI application entrypoint
│   │   └── tests/               # 16 Pytest test cases & Hero golden snapshot
│   └── web/
│       ├── src/
│       │   ├── components/      # AppShell, Header, Sidebar, IndiaMap, Forecast Cards
│       │   ├── pages/           # Overview, Forecast, Explainability, Verification, Trust, Audit
│       │   ├── lib/             # API client & TanStack query wrappers
│       │   ├── types/           # TypeScript contracts
│       │   └── App.tsx          # Root container & navigation
│       └── package.json
├── supabase/
│   └── supabase_schema.sql      # Complete DDL & deterministic seed data
├── docs/                        # PRD, TRD, FRONTEND, BACKEND, FLOW, DB specifications
├── BUILD_PLAN.md                # Engineering plan & checklist
├── DEMO_SCRIPT.md               # 3-minute hackathon judge walkthrough
├── .env.example                 # Environment variable templates
└── README.md
```

---

## 5. Environment Variables & Setup

Create a `.env` file in the root directory (or use `.env.example`):

```bash
SUPABASE_URL=https://qowhvxjsynxqjobibkcv.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_API_BASE_URL=http://localhost:8000
PORT=8000
DEMO_MODE=true
API_PREFIX=/api/v1
DATA_QUALITY=synthetic_demo
```

---

## 6. How to Run

### Backend (FastAPI)
From repository root:
```bash
# Set PYTHONPATH to include apps/api
$env:PYTHONPATH="apps/api"   # Windows PowerShell
# or export PYTHONPATH=apps/api # Linux / macOS

python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation will be live at: `http://localhost:8000/api/v1/docs`

### Frontend (React + Vite)
From `apps/web`:
```bash
cd apps/web
npm install
npm run dev
```
Dashboard will be live at: `http://localhost:5173`

---

## 7. Running the Test Suite

Execute the unit and golden integration tests:
```bash
python -m pytest apps/api/tests/test_varuna.py -v
```

All 16 test cases enforce the scientific invariants:
- `test_regime_probability_sum`: Regime probabilities sum strictly to 1.0.
- `test_transition_state`: Ambiguous features trigger the transition state.
- `test_nonnegative_rainfall`: Rainfall is physically non-negative ($R \ge 0$).
- `test_quantile_order`: Enforces $q10 \le q50 \le q90$.
- `test_threshold_monotonicity`: Enforces $P(\ge 204.5) \le P(\ge 115.6) \le P(\ge 64.5)$.
- `test_fallback_stale`: Satellite SLA breach triggers fallback to QM.
- `test_fallback_missing_nwp`: Missing NWP drops system to ABSTAIN.
- `test_rmse`, `test_pod`, `test_far`, `test_csi`, `test_ets`, `test_fss`: Exact metric verification formulas.
- `test_audit_lineage`: Verifies SHA-256 provenance signature.
- `test_golden_hero_snapshot`: Verifies the Hero Central India LPS output contract.

---

## 8. API Specification

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/v1/health` | `GET` | Health check, demo mode verification, and system disclaimer |
| `/api/v1/cases` | `GET` | List the five held-out demo cases (Active, Break, LPS, Orographic, Transition) |
| `/api/v1/districts` | `GET` | Retrieve 12 demonstration districts with current risk metrics |
| `/api/v1/districts/{id}/forecast` | `GET` | Full forecast packet: raw, q10/q50/q90, threshold probabilities, 5-day horizon |
| `/api/v1/forecasts/{id}/regime` | `GET` | Regime evidence breakdown and adapter statuses |
| `/api/v1/verification/{case_id}` | `GET` | 5-baseline comparison ladder: RMSE, ETS, CSI, POD, FAR, FSS, Brier score |
| `/api/v1/trust/{id}` | `GET` | Ingestion source age, freshness status, and fallback ladder state |
| `/api/v1/audit/{id}` | `GET` | Complete immutable audit lineage JSON with cryptographic hash |
| `/api/v1/demo/fault` | `POST` | Live fault injection (`stale_satellite`, `missing_nwp`, `schema_error`, `regime_ood`) |
| `/api/v1/demo/reset` | `POST` | Restores nominal operational state (`REGIME_AWARE`) |

---

## 9. Demonstration Scenarios

1. **Central India LPS (`case_lps_001` - HERO CASE):**
   - Deep monsoon depression with intense lower-tropospheric cyclonic vorticity.
   - Raw NWP underestimates core precipitation ($60\text{ mm}$).
   - VARUNA identifies `depression` regime ($>65\%$), routes to `lps_frequency_match`, scales $q50$ to $88.8\text{ mm}$, and calculates elevated heavy exceedance ($P \ge 64.5\text{ mm} > 60\%$).
2. **Monsoon Core Active (`case_active_001`):**
   - Widespread rain envelope with persistent $+1.35\sigma$ core anomaly; routed to `active_emos`.
3. **Core Rainfall Break (`case_break_001`):**
   - Core-zone dry anomaly ($-1.30\sigma$); routed to `break_qm` suppressing central rainfall and indicating northward shift.
4. **Western Ghats Orographic (`case_orographic_001`):**
   - Strong moisture flux impinging high terrain elevation ($850\text{ m}$); routed to `terrain_qm`.
5. **Regime Transition (`case_transition_001`):**
   - Dissipating depression with ambiguous posterior; triggers `probability_blend`, expands uncertainty bounds, and requests human review.

---

## 10. Claims Discipline & Prototype Limitations

1. **Synthetic Demo Quality:** All numerical outputs are generated using deterministic simulation rules (`data_quality: "synthetic_demo"`). They demonstrate the complete decision-support architecture and software contracts, not verified national operational atmospheric skill.
2. **Decision Support Only:** This prototype is not an official warning authority and does not issue public storm warnings or emergency declarations.
3. **No Fabricated Model Loading:** Neural network adapters (`FutureCNNRegimeEngine`) and Lagrangian vortex trackers (`FutureLPSTrackerAdapter`) are provided as explicit software adapter interfaces and clearly marked as `ADAPTER READY / DEMO DISABLED` rather than pretending real deep-learning weights are executing on the client.
4. **Physical Invariants:** Non-negative rainfall and monotonicity across quantiles ($q10 \le q50 \le q90$) and exceedance thresholds ($P \ge 204.5 \le P \ge 115.6 \le P \ge 64.5$) are strictly enforced by construction.
