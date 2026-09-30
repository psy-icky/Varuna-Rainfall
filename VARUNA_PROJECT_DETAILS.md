# VARUNA-RAINFALL — Comprehensive Project Details & Technical Architecture

**SIH Problem Statement:** SIH26080 — Regime-Aware AI Post-Processing of NWP Rainfall Forecasts over India  
**Product Name:** VARUNA-RAINFALL  
**Tagline:** *From one forecast number to a calibrated, explainable risk field.*  
**Classification:** Decision-Support Prototype (`synthetic_demo`)  
**Mandatory Disclaimer:** *Decision support — not an official warning authority. Synthetic prototype data — not operational forecast skill.*

---

## 1. Executive Summary

Numerical Weather Prediction (NWP) atmospheric models produce deterministic grid point rainfall estimates. However, systematic error mechanisms across the Indian subcontinent vary drastically depending on the prevailing synoptic weather regime:
- **Active Monsoon:** Models suffer from under-amplitude biases and smeared precipitation envelopes.
- **Break Monsoon:** Models exhibit false-alarm rain band leakage over the central core while missing foothill shifts.
- **Monsoon Low-Pressure Systems (LPS / Depressions):** Vortex core displacement and extreme rainfall suppression lead to severe localized misses.
- **Orographic Uplift (Western Ghats):** Steep windward-lee contrasts are smoothed out by grid resolution limits.
- **Coastal Convergence:** Timing and placement errors along offshore troughs distort risk.
- **Western Disturbances:** Elevation-stratified precipitation phases are mischaracterized.

Rather than treating post-processing as a single monolithic regression or replacing the physical atmospheric model with a black box, **VARUNA-RAINFALL** provides a transparent, five-stage decision-support pipeline:
1. Ingests raw forecast grids alongside observational and satellite telemetry under strict SLA freshness checks.
2. Infers a soft posterior probability distribution across six meteorological regimes.
3. Dynamically routes to a regime-conditional bias correction bank (or blends banks under epistemic transition uncertainty).
4. Parameterizes a zero-inflated two-part distribution (occurrence probability + Gamma continuous intensity) yielding physical credible quantiles ($q10 \le q50 \le q90$).
5. Integrates monotonic threshold exceedance probabilities for India Meteorological Department (IMD) warning cutoffs ($64.5\text{ mm}$, $115.6\text{ mm}$, and $204.5\text{ mm/day}$).
6. Emits an immutable, cryptographic audit packet and maintains an automated fallback ladder to safeguard operational decision-making.

---

## 2. Server Status & Quick Access

Both the API backend and the Web dashboard are actively running:

| Component | Status | Port / URL | Description |
|---|---|---|---|
| **Web Dashboard** | **LIVE** | `http://localhost:5173` | React 18, TypeScript, Tailwind, Leaflet, Recharts |
| **API Gateway** | **LIVE** | `http://localhost:8000` | FastAPI, Pydantic v2, Uvicorn |
| **API Documentation** | **LIVE** | `http://localhost:8000/api/v1/docs` | Interactive Swagger UI / OpenAPI 3.1 |
| **Supabase PostgreSQL** | **CONNECTED**| `https://qowhvxjsynxqjobibkcv.supabase.co` | Remote PostgreSQL with PostgREST |

---

## 3. End-to-End Architectural Data Flow

```text
+------------------------------------------------------------------------------------+
|                               VARUNA PIPELINE FLOW                                 |
+------------------------------------------------------------------------------------+

 [ Raw Forecast & Telemetry Ingestion ]
    • Global/Regional NWP Ensemble (360m interval)
    • Geostationary IR Satellite (180m interval)
    • AWS Rain Gauges (1440m interval)
    • Static High-Resolution DEM (Terrain)
                     |
                     v
   [ Freshness SLA & QC Gatekeeper ]
    • Input contract schema verification
    • Age calculation vs SLA thresholds
    • Trigger fallback ladder if stale/missing
                     |
                     v
  [ Stage 2: Weather Regime Classifier ]
    • Core-zone anomaly (sigma)
    • 850 hPa vorticity & wind vectors
    • Persistence (active vs break days)
    • Elevation & coastal distance
    • Softmax normalization -> Sum = 1.00
    • Transition detector: (top1 < 0.55) or (top1 - top2 < 0.15)
                     |
         +-----------+-----------+
         |                       |
         v (Single Regime)       v (Ambiguous / Transition)
 [ Conditional Bank ]     [ Posterior Blend ]
  • active_emos            • p_i * bank_i mixture
  • break_qm               • Epistemic variance expansion
  • lps_frequency_match    • Calibration flag -> AMBER
  • terrain_qm             • Forecaster review flag -> TRUE
  • coastal_analog
  • wd_recalibration
         |                       |
         +-----------+-----------+
                     |
                     v
 [ Stage 4: Parametric Two-Part Distribution Head ]
    • Occurrence: P(Rain > 0.1 mm) = 1 - exp(-mean / 12.0)
    • Intensity: Gamma(shape=k, scale=theta)
    • Quantile Monotonicity: q10 <= q50 <= q90
    • IMD Threshold Monotonicity: P(>=204.5) <= P(>=115.6) <= P(>=64.5)
                     |
                     v
  [ Stage 5: Operational Trust & Fallback Ladder ]
    REGIME_AWARE  ->  POOLED_GLOBAL  ->  QM  ->  RAW_NWP  ->  ABSTAIN
                     |
         +-----------+-----------+
         |                       |
         v                       v
 [ Supabase PostgreSQL ]    [ FastAPI Gateway ]
  • forecast_runs            • /api/v1/districts
  • forecast_products        • /api/v1/forecasts/{id}
  • verification_metrics     • /api/v1/trust & /audit
  • audit_events             • /api/v1/demo/fault
                             |
                             v
                 [ React Decision Dashboard ]
                  • Interactive Centroid Leaflet Map
                  • Quantile Horizon & 5-Day Outlook
                  • 6-Stage Explainability Step-Ladder
                  • 5-Baseline Verification Ladder
                  • Real-Time Fault Injector & Audit Viewer
```

---

## 4. Full Technology Stack

### Frontend Application (`apps/web`)
- **Framework:** React 18 with TypeScript 5.7
- **Bundler & Dev Server:** Vite 6.2 with Hot Module Replacement (HMR)
- **Styling:** Tailwind CSS 3.4 with custom charcoal/cyan dark theme palette (`#0B0F19`, `#111827`, `#06B6D4`, `#10B981`, `#F59E0B`, `#EF4444`)
- **Server State Management:** TanStack React Query v5 (declarative caching, background refetching, instant cache invalidation upon fault injection/reset)
- **Geospatial Mapping:** Leaflet 1.9 with dark CartoDB vector basemaps, custom circular centroid markers, interactive risk filters, and informative popups
- **Data Visualizations:** Recharts 2.15 (quantile comparisons, IMD reference lines, reliability curves, Fractions Skill Score lines)
- **Icons:** Lucide React

### Backend Application (`apps/api`)
- **Runtime:** Python 3.11 / 3.12 / 3.13
- **Framework:** FastAPI with ASGI high-throughput server (Uvicorn)
- **Data Validation:** Pydantic v2 with strict type coercion and mathematical constraint validators
- **Mathematical & Statistical Computing:**
  - `NumPy 2.4`: Matrix operations and numerical transformations
  - `SciPy 1.17`: Continuous statistical distributions (`scipy.stats.gamma`) and 2D spatial filtering (`scipy.ndimage.uniform_filter`)
- **Testing:** Pytest 9.1 with HTTP TestClient covering all scientific invariants

### Database & Persistence (`supabase`)
- **Storage:** Supabase managed PostgreSQL 15+
- **Security:** Row Level Security (RLS) policies distinguishing anonymous demonstration read access from service-role write operations
- **Schema:** 12 relational tables optimized with B-tree composite indexing
- **Format:** JSONB for dynamic feature snapshots, evidence arrays, and cryptographically signed audit logs

---

## 5. Database Schema & Demonstration Scenarios

### Relational Schema Definition
1. **`districts`**: Master spatial registry containing synthetic demonstration polygons, coordinates, and baseline elevation/coastal proximity.
2. **`demo_cases`**: Five held-out synoptic events with deterministic feature seeds.
3. **`data_sources`**: Ingestion SLA registry tracking last successful delivery, expected intervals, and age limits.
4. **`ingestion_runs`**: Ingestion log history tracking schema validity and missing record counts.
5. **`model_versions`**: Registered model metadata and adapter compatibility lists.
6. **`forecast_runs`**: Core forecast execution entity binding district, case, and issue/valid timestamps.
7. **`regime_predictions`**: Regime posterior weights, transition indicators, and evidence lists.
8. **`forecast_products`**: Calibrated quantiles, threshold exceedance probabilities, and provenance strings.
9. **`verification_runs`**: Validation split definitions and artifact linkages.
10. **`verification_metrics`**: Multi-baseline quantitative evaluation scores (RMSE, ETS, CSI, POD, FAR, FSS, Brier).
11. **`fallback_events`**: Transition logs recording ladder degradation events with reason codes.
12. **`audit_events`**: Append-only cryptographic audit logs.

### Five Golden Demonstration Scenarios
1. **Central India LPS (`case_lps_001` - HERO CASE):**
   - *Date:* 2026-08-17
   - *Synoptic Setting:* Monsoon depression over Odisha/Chhattisgarh migrating westward. Strong 850 hPa cyclonic vorticity ($3.8\times 10^{-5}\text{ s}^{-1}$) and $+1.4\sigma$ core anomaly.
   - *NWP Defect:* Raw NWP predicts only $60.0\text{ mm/day}$ due to vortex core displacement.
   - *VARUNA Output:* Routes to `lps_frequency_match`, scales median $q50$ to $87.3\text{ mm/day}$, bounds $q10=52.3\text{ mm}$ and $q90=138.4\text{ mm}$, raising $P(\ge 64.5\text{ mm})$ to $68\%$.
2. **Monsoon Core Active (`case_active_001`):**
   - *Date:* 2026-08-05
   - *Synoptic Setting:* Widespread monsoon trough along normal position with $+1.35\sigma$ core anomaly and 4-day persistence.
   - *NWP Defect:* Under-amplitude envelope bias.
   - *VARUNA Output:* Routes to `active_emos` (1.32x scaling).
3. **Core Rainfall Break (`case_break_001`):**
   - *Date:* 2026-08-12
   - *Synoptic Setting:* Trough shifted northward to Himalayan foothills; $-1.30\sigma$ core anomaly.
   - *NWP Defect:* Spurious rain-band leakage over central agricultural basins.
   - *VARUNA Output:* Routes to `break_qm` suppressing central rainfall by $55\%$ ($0.45\times$).
4. **Western Ghats Orographic (`case_orographic_001`):**
   - *Date:* 2026-08-24
   - *Synoptic Setting:* Strong cross-equatorial southwesterly low-level jet ($18\text{ m/s}$) orthogonal to coastal terrain ($850\text{ m}$ elevation).
   - *NWP Defect:* Smoothed windward precipitation maximum.
   - *VARUNA Output:* Routes to `terrain_qm` ($1.55\times$ uplift boost).
5. **Regime Transition (`case_transition_001`):**
   - *Date:* 2026-08-30
   - *Synoptic Setting:* Decaying depression transitioning to break/active state.
   - *NWP Defect:* Extreme epistemic uncertainty across competing models.
   - *VARUNA Output:* Triggers `probability_blend`, expands uncertainty span ($q90-q10$), sets calibration to `AMBER`, and flags mandatory human review.

---

## 6. Mathematical Invariants & Formulations

### A. Regime Posterior Normalization
Synoptic rule scoring functions yield unnormalized logits $s_r$ for each regime $r \in \mathcal{R}$:
$$P(R = r) = \frac{\exp(s_r - \max_j s_j)}{\sum_{k \in \mathcal{R}} \exp(s_k - \max_j s_j)}$$
Strictly enforced: $\sum_{r} P(R = r) = 1.0000$.

### B. Transition Detection
Let $p_{(1)}$ and $p_{(2)}$ denote the highest and second-highest regime probabilities:
$$\text{is\_transition} = \big(p_{(1)} < 0.55\big) \lor \big(p_{(1)} - p_{(2)} < 0.15\big)$$

### C. Two-Part Precipitation Distribution
Total rainfall $Y$ is zero-inflated continuous:
$$P(Y \le y) = (1 - p_{\text{pos}}) + p_{\text{pos}} \cdot F_{\text{Gamma}}(y; k, \theta)$$
Where:
- Occurrence head: $p_{\text{pos}} = 1 - \exp(-\mu_{\text{corr}} / 12.0) \in [0.05, 0.99]$
- Conditional Gamma parameters: $\theta = \frac{\sigma^2}{\mu_{\text{cond}}}$, $k = \frac{\mu_{\text{cond}}}{\theta}$
- Quantiles inverted analytically from CDF:
  $$q_{10} \le q_{50} \le q_{90}$$
- Non-negativity guaranteed: $q_{10} \ge 0$.

### D. IMD Exceedance Probability Monotonicity
For thresholds $T_1 = 64.5\text{ mm}$ (Heavy), $T_2 = 115.6\text{ mm}$ (Very Heavy), $T_3 = 204.5\text{ mm}$ (Extremely Heavy):
$$P(Y \ge T_i) = p_{\text{pos}} \cdot \big[1 - F_{\text{Gamma}}(T_i; k, \theta)\big]$$
Strictly enforced by analytical properties of survival functions:
$$P(Y \ge 204.5) \le P(Y \ge 115.6) \le P(Y \ge 64.5)$$

### E. Verification Metrics Formulations
- **Root Mean Square Error (RMSE):**
  $$\text{RMSE} = \sqrt{\frac{1}{N}\sum_{i=1}^N (f_i - o_i)^2}$$
- **Contingency Table Counts (Threshold $T$):**
  $$\text{Hits } (H): f \ge T \land o \ge T \quad\mid\quad \text{Misses } (M): f < T \land o \ge T$$
  $$\text{False Alarms } (F): f \ge T \land o < T \quad\mid\quad \text{Correct Negatives } (C): f < T \land o < T$$
- **Probability of Detection (POD):**
  $$\text{POD} = \frac{H}{H + M}$$
- **False Alarm Ratio (FAR):**
  $$\text{FAR} = \frac{F}{H + F}$$
- **Critical Success Index (CSI):**
  $$\text{CSI} = \frac{H}{H + M + F}$$
- **Equitable Threat Score (ETS):**
  $$H_{\text{random}} = \frac{(H + M)(H + F)}{N}, \quad \text{ETS} = \frac{H - H_{\text{random}}}{H + M + F - H_{\text{random}}}$$
- **Fractions Skill Score (FSS):**
  $$\text{FSS} = 1 - \frac{\frac{1}{N}\sum (f_{\text{frac}} - o_{\text{frac}})^2}{\frac{1}{N}\sum f_{\text{frac}}^2 + \frac{1}{N}\sum o_{\text{frac}}^2}$$
- **Brier Score (BS):**
  $$\text{BS} = \frac{1}{N}\sum_{i=1}^N (p_i - o_i)^2, \quad o_i \in \{0, 1\}$$

---

## 7. Operational Fallback Ladder & Fault Injection

VARUNA implements an orderly degradation path:
$$\text{REGIME\_AWARE} \longrightarrow \text{POOLED\_GLOBAL} \longrightarrow \text{QM} \longrightarrow \text{RAW\_NWP} \longrightarrow \text{ABSTAIN}$$

| Injected Fault | System Impact | Resulting State | Calibration | Human Review |
|---|---|---|---|---|
| **`stale_satellite`** | Satellite telemetry age breaches SLA (>240m) | `QM` | `AMBER` | Optional |
| **`missing_nwp`** | Primary numerical forecast grid unavailable | `ABSTAIN` | `ABSTAIN` | **MANDATORY (Automated Action Suspended)** |
| **`schema_error`** | Input telemetry fails schema validation | `RAW_NWP` | `ABSTAIN` | **MANDATORY** |
| **`regime_ood`** | Atmospheric predictors fall outside training manifold | `POOLED_GLOBAL` | `AMBER` | **MANDATORY** |
| **`reset`** | Restores nominal telemetry state | `REGIME_AWARE` | `GREEN` | None |

---

## 8. Complete API Endpoint Specification

All endpoints are prefixed with `/api/v1` and return strict Pydantic v2 JSON models:

### 1. `GET /api/v1/health`
Returns system status, active version, demo mode flag, and legal warning disclaimer.

### 2. `GET /api/v1/cases`
Returns all five held-out scenarios with dates, descriptions, and feature metadata.

### 3. `GET /api/v1/districts?case_id={case_id}`
Returns all 12 demonstration districts with expected rain, median $q50$, dominant regime, and threshold probabilities for regional map rendering.

### 4. `GET /api/v1/districts/{district_id}/forecast?case_id={case_id}`
Returns the comprehensive forecast packet:
- Raw NWP rain vs Calibrated $q50$
- Retrospective verification ground truth (where available)
- Quantile bounds: $q10, q50, q90$ and uncertainty span
- Monotonic IMD threshold exceedance probabilities ($64.5, 115.6, 204.5\text{ mm}$)
- 6-Regime posterior distribution and confidence
- Correction method and provenance string
- 5-Day scenario outlook table

### 5. `GET /api/v1/forecasts/{forecast_id}/regime`
Returns synoptic rule evidence, predictor interpretations, and adapter statuses.

### 6. `GET /api/v1/verification/{case_id}?threshold_mm={threshold}`
Returns multi-baseline comparative metrics (Climatology vs Raw NWP vs QM vs EMOS vs VARUNA Regime-Aware), reliability curve coordinates, and FSS by spatial scale.

### 7. `GET /api/v1/trust/{forecast_id}`
Returns upstream data source health (age, status, SLA), fallback ladder position, and fault history.

### 8. `GET /api/v1/audit/{forecast_id}`
Returns the cryptographic audit packet containing model version, data version, input snapshots, quantiles, and SHA-256 provenance hash.

### 9. `POST /api/v1/demo/fault`
Body: `{"fault": "stale_satellite" | "missing_nwp" | "schema_error" | "regime_ood"}`. Injects simulated operational disruptions.

### 10. `POST /api/v1/demo/reset`
Restores the system to nominal operational health.

---

## 9. 3-Minute Demonstration Script for Judges

Refer to [`DEMO_SCRIPT.md`](file:///c:/Users/HP/Desktop/SIH%20PRO%202/DEMO_SCRIPT.md) for the verbatim presentation:
1. **0:00–0:30 (Overview):** Show regional India map, explain that NWP is post-processed, and point out the disclaimer.
2. **0:30–1:15 (Hero LPS Case):** Select Central India LPS $\to$ select Nashik $\to$ open District Forecast. Show **68% Depression posterior**, explain how raw 60.0 mm was scaled to $87.3\text{ mm}$ ($q50$) with an 80% credible interval ($q10=52.3\text{ mm}$, $q90=138.4\text{ mm}$), and show monotonic threshold cards.
3. **1:15–1:50 (Verification Ladder):** Open Verification. Show the 5-baseline ladder and neutral statement (no marketing winner badges).
4. **1:50–2:30 (Fault Injection & Fallback):** Open Trust & Fallback. Inject "Stale Satellite" $\to$ ladder drops to `QM` in real-time. Inject "Missing NWP" $\to$ system drops to `ABSTAIN` with human review required. Click "Reset Demo" to return to nominal.
5. **2:30–3:00 (Audit & Closing):** Open Audit Packet. Inspect SHA-256 hash, click "Copy Audit JSON", and conclude:  
   *"Proof-carrying uncertainty: regime + probability + provenance + validation + fallback."*

---

## 10. Test Verification Results

All 16 unit and golden tests pass in 2.93s:

```text
apps/api/tests/test_varuna.py::test_regime_probability_sum PASSED        [  6%]
apps/api/tests/test_varuna.py::test_transition_state PASSED              [ 12%]
apps/api/tests/test_varuna.py::test_nonnegative_rainfall PASSED          [ 18%]
apps/api/tests/test_varuna.py::test_quantile_order PASSED                [ 25%]
apps/api/tests/test_varuna.py::test_threshold_monotonicity PASSED        [ 31%]
apps/api/tests/test_varuna.py::test_fallback_stale PASSED                [ 37%]
apps/api/tests/test_varuna.py::test_fallback_missing_nwp PASSED          [ 43%]
apps/api/tests/test_varuna.py::test_rmse PASSED                          [ 50%]
apps/api/tests/test_varuna.py::test_pod PASSED                           [ 56%]
apps/api/tests/test_varuna.py::test_far PASSED                           [ 62%]
apps/api/tests/test_varuna.py::test_csi PASSED                           [ 68%]
apps/api/tests/test_varuna.py::test_ets PASSED                           [ 75%]
apps/api/tests/test_varuna.py::test_fss PASSED                           [ 81%]
apps/api/tests/test_varuna.py::test_audit_lineage PASSED                 [ 87%]
apps/api/tests/test_varuna.py::test_demo_reset PASSED                    [ 93%]
apps/api/tests/test_varuna.py::test_golden_hero_snapshot PASSED          [100%]
======================== 16 passed, 1 warning in 2.93s ========================
```
