# VARUNA-RAINFALL — Implementation Build Plan (SIH26080)

## System Overview
**VARUNA-RAINFALL**: From one forecast number to a calibrated, explainable risk field.
Regime-Aware AI Post-Processing of NWP Rainfall Forecasts over India.
Decision support — not an official warning authority.
Demo data quality: `synthetic_demo`.

---

## 1. Environment & Database Status
- **Python**: 3.12+ (FastAPI, Pydantic v2, NumPy, pandas, SciPy, scikit-learn, Supabase client installed).
- **Node**: v22.19.0, npm 10.9.3.
- **Supabase**: Connected and verified at `https://qowhvxjsynxqjobibkcv.supabase.co`.
  Schema verified with tables: `districts`, `demo_cases`, `data_sources`, `model_versions`, `forecast_runs`, `forecast_products`, `regime_predictions`, `verification_runs`, `verification_metrics`, `fallback_events`, `audit_events`.
- Dedicated export file: `supabase/supabase_schema.sql` with clean DDL and seed statements for reproducibility.

---

## 2. Implementation Checklist

### Step 1: Repository Scaffolding
- [x] Create project structure:
  - `apps/api/app/` (FastAPI backend, domain services, schemas, core config)
  - `apps/api/tests/` (Full pytest test suite)
  - `apps/web/` (React, TypeScript, Vite, Tailwind CSS, TanStack Query, Leaflet, Recharts, Lucide)
  - `supabase/` (`supabase_schema.sql` with complete schema and seed data)
  - `docs/` (Organize and link PRD, TRD, FRONTEND, BACKEND, FLOW, DB)
  - `.env.example` & `.env`

### Step 2: Supabase Schema & Seeding
- [x] Standardize `supabase/supabase_schema.sql` covering all 12 tables, indexes, RLS, and deterministic seed data:
  - 12 synthetic districts across diverse Indian meteorological zones (Mumbai, Nashik, Pune, Nagpur, Cuttack, Puri, Raigarh, Jabalpur, Surat, Ernakulam, Wayanad, Dehradun).
  - 5 Golden Demo cases:
    1. `case_active_001` (Monsoon Core Active)
    2. `case_break_001` (Core Rainfall Break)
    3. `case_lps_001` (Central India LPS - Hero Demo Case)
    4. `case_orographic_001` (Western Ghats Orographic)
    5. `case_transition_001` (Regime Transition / Uncertain)
  - Model versions and data source health tracking.
  - Verification metrics for baselines: `climatology`, `raw_nwp`, `qm`, `emos`, `regime_aware`.

### Step 3: FastAPI Backend (`apps/api`)
- [x] Core configuration & constants (`core/config.py`, `core/constants.py`)
- [x] Pydantic v2 schemas (`schemas/forecast.py`, `schemas/regime.py`, `schemas/verification.py`, `schemas/trust.py`, `schemas/audit.py`)
- [x] Domain services:
  - `services/regime/engine.py`: `DemoRegimeEngine`, feature scoring, softmax normalization, transition detection, confidence estimation, future adapter interfaces (`FutureCNNRegimeEngine`, `FutureLPSTrackerAdapter`).
  - `services/correction/bank.py`: Correction bank protocol and adapters: `active_emos`, `break_qm`, `lps_frequency_match`, `terrain_qm`, `coastal_analog`, `wd_recalibration`, `probability_blend`. Non-negative output guarantee.
  - `services/probability/distribution.py`: Zero-inflated two-part distribution abstraction ($P(\text{rain} > 0)$ + Gamma-like positive intensity), quantiles ($q10 \le q50 \le q90$), monotonic threshold probabilities ($P \ge 204.5 \le P \ge 115.6 \le P \ge 64.5$).
  - `services/trust/fallback.py`: Dynamic state engine: `REGIME_AWARE` $\to$ `POOLED_GLOBAL` $\to$ `QM` $\to$ `RAW_NWP` $\to$ `ABSTAIN`. Fault injection handlers (`stale_satellite`, `missing_nwp`, `schema_error`, `regime_ood`).
  - `services/verification/engine.py`: Analytical computation of RMSE, POD, FAR, CSI, ETS, FSS (spatial neighbourhood fraction score), Brier score & reliability diagram.
  - `services/orchestrator.py`: Orchestrator connecting DB repository, fallback ladder, correction bank, and audit logger.
- [x] API Routes:
  - `GET  /api/v1/health`
  - `GET  /api/v1/cases`
  - `GET  /api/v1/districts`
  - `GET  /api/v1/districts/{district_id}/forecast`
  - `GET  /api/v1/forecasts/{forecast_id}/regime`
  - `GET  /api/v1/verification/{case_id}`
  - `GET  /api/v1/trust/{forecast_id}`
  - `GET  /api/v1/audit/{forecast_id}`
  - `POST /api/v1/demo/fault`
  - `POST /api/v1/demo/reset`

### Step 4: Verification & Golden Demo Tests (`apps/api/tests`)
- [x] Unit tests:
  - `test_regime_probability_sum` (sums to 1.0)
  - `test_transition_state` (correctly triggers blend under ambiguity)
  - `test_nonnegative_rainfall` (all outputs $\ge 0$)
  - `test_quantile_order` ($q10 \le q50 \le q90$)
  - `test_threshold_monotonicity` ($P \ge 204.5 \le P \ge 115.6 \le P \ge 64.5$)
  - `test_fallback_stale` & `test_fallback_missing_nwp`
  - `test_rmse`, `test_pod`, `test_far`, `test_csi`, `test_ets`, `test_fss`
  - `test_audit_lineage`
  - `test_demo_reset`
- [x] Golden JSON snapshot test for Hero LPS case.

### Step 5: Frontend Development (`apps/web`)
- [x] Setup Vite + React + TypeScript + Tailwind CSS
- [x] Implement Navigation & Shell:
  - AppShell with Header (`DEMO MODE`, disclaimer, health pill, selected case info) and Sidebar navigation.
- [x] Build Pages:
  - **Overview**: Synthetic Leaflet India map, district selector, case selector, KPI cards, trust strip, regime distribution summary.
  - **District Forecast**: Regime posterior chips, Raw vs Corrected vs Retrospective Obs comparison, $q10/q50/q90$ distribution visualization, 3 threshold exceedance cards, 5-day scenario forecast table, provenance card.
  - **Explainability**: Causal step ladder (Raw $\to$ Regime $\to$ Bank $\to$ Distribution $\to$ Thresholds $\to$ Trust), "Why did it change?" drawer, branch evidence cards (Rule evidence, CNN adapter status, LPS tracker status).
  - **Verification**: Baseline ladder (Climatology vs Raw NWP vs QM vs EMOS vs Regime-Aware), metric cards (RMSE, ETS, CSI, POD, FAR, FSS, Brier score), reliability curve, synthetic disclosure footer.
  - **Trust & Fallback**: Ingestion source freshness table, interactive Fallback Ladder, Fault Injector panel (`stale_satellite`, `missing_nwp`, `schema_error`, `regime_ood`), Human Review Queue, Demo Reset.
  - **Audit**: Comprehensive JSON inspection viewer with lineage, parameter snapshots, hash signatures, copy-to-clipboard.

### Step 6: Documentation & Deliverables
- [x] Comprehensive root `README.md` with ASCII architecture diagram, stack, setup, API reference, claims discipline.
- [x] `DEMO_SCRIPT.md` for a 3-minute hackathon judge walkthrough.
- [x] Build verification (FastAPI health checks, tests passing, Vite frontend compiling clean).
