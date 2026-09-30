# VARUNA-RAINFALL — Product Requirements Document (PRD)

**SIH Problem Statement:** SIH26080 — Regime-Aware AI Post-Processing of NWP Rainfall Forecasts  
**Prototype Type:** Hackathon-grade, end-to-end decision-support prototype  
**Product:** VARUNA-RAINFALL  
**Tagline:** From one forecast number to a calibrated, explainable risk field.

---

## 1. Product intent

VARUNA-RAINFALL is a transparent post-processing layer over NWP rainfall guidance. It does **not** replace the atmospheric model and it does **not** act as an official public warning authority.

The product takes forecast fields plus metadata, identifies the prevailing weather regime with uncertainty, applies a regime-appropriate rainfall correction, derives threshold exceedance probabilities, aggregates the corrected field to districts, and attaches verification/provenance/trust information to every result.

The prototype must make this chain visible to a judge in under three minutes.

### Core product promise

> **We do not replace NWP; we make its uncertainty, regime and district-level risk operationally usable.**

---

## 2. Source-derived requirements

The supplied SIH26080 research material defines a five-stage system:

1. Data ingestion
2. Hybrid weather-regime classifier
3. Regime-conditional bias correction
4. Heavy-rainfall probability
5. District product + automated verification

The research material uses six regime classes:

- Active monsoon
- Break monsoon
- Monsoon low / depression (LPS)
- Orographic
- Coastal
- Western disturbance

The deeper product pack further specifies an explicit **transition/uncertain** state for user-facing regime probabilities.

The prototype must expose:

- Corrected rainfall
- Regime probabilities
- `P(rain >= 64.5 mm/day)`
- `P(rain >= 115.6 mm/day)`
- `P(rain >= 204.5 mm/day)`
- q10 / q50 / q90
- Calibration status
- Data age/freshness
- Fallback reason
- Model/data version
- Human-review status
- Verification metrics

The IMD thresholds used in the supplied material are:

| Category | Threshold |
|---|---:|
| Heavy | 64.5 mm/day |
| Very heavy | 115.6 mm/day |
| Extremely heavy | 204.5 mm/day |

---

## 3. Problem

A single bias-correction method is not expected to behave equally across all weather regimes because the dominant error mechanism changes.

Examples from the supplied research:

| Regime | Typical raw-NWP issue | Prototype correction concept |
|---|---|---|
| Active | under-amplitude / misplaced rain envelope | EMOS-style distributional correction |
| Break | rain-band leakage over core zone | break-specific QM |
| LPS / depression | displaced vortex / rainfall maximum | tracker-conditioned displacement correction |
| Orographic | smoothed windward–lee contrast | terrain-aware QM |
| Coastal | timing / placement of convergence | coastal analog adjustment |
| Western disturbance | intensity / elevation-dependent phase | elevation-stratified recalibration |

For the hackathon prototype, all six correction strategies are implemented behind a common interface. The demo may use deterministic synthetic proxies where actual trained models or authorised production data are unavailable.

---

## 4. Personas

### A. Meteorological analyst / forecaster

Needs:
- regime context,
- raw vs corrected forecast,
- uncertainty,
- threshold probabilities,
- verification.

Success:
- Can explain why a forecast changed and whether the system is confident.

### B. District disaster-management user

Needs:
- district map,
- threshold risk,
- expected rainfall,
- uncertainty,
- stale/missing-data warning.

Success:
- Can identify districts requiring review without mistaking the product for an official warning.

### C. Hackathon judge / technical evaluator

Needs:
- end-to-end architecture,
- reproducible demo,
- baseline comparison,
- explainability,
- failure handling,
- proof of engineering discipline.

Success:
- Can trace one forecast from input → regime → correction → probability → district product → verification → audit.

---

## 5. Prototype scope

### In scope

- Supabase-backed district and forecast store
- React/Vite dashboard
- FastAPI service
- Synthetic deterministic demo dataset
- Regime probability engine
- Correction-bank router
- Two-part rainfall distribution abstraction
- Heavy-rain exceedance probabilities
- District aggregation
- Baseline comparison: raw / QM / EMOS-style / regime-aware
- Verification: RMSE, ETS, CSI, POD, FAR, FSS
- Probability calibration status
- Data freshness and fallback state
- Audit trail
- Model/data provenance
- Interactive held-out case selection
- Fault injection for stale or missing input
- Demo reset

### Out of scope for this prototype

- Official operational NWP ingestion
- Real-time public warning issuance
- Claiming national forecast skill
- Training a production CNN/ConvLSTM on the user's laptop
- Flood probability prediction directly from rainfall
- Agriculture advice generated automatically
- Autonomous emergency action
- Unverified official district polygons
- Any fabricated "live" feed

---

## 6. Primary user journeys

### Journey 1 — Held-out district forecast

1. User opens dashboard.
2. Selects district.
3. Selects a demo held-out date.
4. System loads raw NWP baseline.
5. System computes regime probabilities.
6. System routes to the selected correction bank.
7. System displays corrected q10/q50/q90.
8. System calculates threshold probabilities.
9. System renders the district risk packet.
10. User opens verification.
11. System compares raw vs QM vs EMOS vs regime-aware.
12. User opens audit packet.

### Journey 2 — Uncertain regime

1. User selects a transition case.
2. Multiple regime probabilities are visible.
3. System displays "Transition / uncertain".
4. Correction blends banks rather than hard-switching.
5. Uncertainty increases.
6. Calibration status becomes amber.
7. Human review is requested.

### Journey 3 — Stale-input failure

1. User toggles "simulate stale satellite".
2. Data freshness falls outside configured SLA.
3. System logs a fallback event.
4. Primary model becomes unavailable.
5. System falls back according to the ladder:
   - regime-aware model
   - pooled/global model
   - transparent QM
   - raw NWP / climatology
   - abstain / escalate
6. UI visibly displays the fallback reason.

### Journey 4 — Audit

1. User clicks "Audit packet".
2. System shows:
   - issue time,
   - valid time,
   - lead,
   - accumulation window,
   - source versions,
   - district geometry version,
   - model version,
   - calibration status,
   - fallback state,
   - validation split,
   - metric artifact ID.

---

## 7. Functional requirements

### FR-01 Data contract

Every forecast record must have:

- source
- source version
- issue time
- valid time
- lead
- accumulation window
- unit
- grid identifier
- district geometry version
- ingestion timestamp
- quality status
- freshness
- provenance ID

### FR-02 Regime engine

Return probabilities for:

- active
- break
- depression
- coastal
- orographic
- western_disturbance
- transition/uncertain

For the demo, probabilities are deterministic and generated from seeded feature values.

### FR-03 Regime routing

The backend must produce a correction provenance such as:

`active_emos`

`break_qm`

`lps_frequency_match`

`orographic_terrain_qm`

`coastal_analog`

`western_disturbance_recalibration`

For uncertain cases, the provenance must say `probability_blend`.

### FR-04 Non-negative rainfall

Corrected rainfall must never be negative.

### FR-05 Distribution output

Return:

- expected rainfall
- q10
- q50
- q90
- uncertainty width
- point estimate
- positive-occurrence probability

### FR-06 Heavy-rain probabilities

Return all three SIH thresholds:

- 64.5
- 115.6
- 204.5 mm/day

### FR-07 Calibration

Return a visible calibration status:

- `GREEN`: calibrated and supported
- `AMBER`: limited support / moderate uncertainty
- `ABSTAIN`: insufficient confidence or OOD

### FR-08 District product

Return one row per district/day with:

- district
- state
- valid day
- regime probabilities
- expected rainfall
- q10/q50/q90
- threshold probabilities
- category
- provenance
- calibration
- data age
- fallback state
- review status

### FR-09 Verification

The verification service must support:

- RMSE
- ETS
- CSI
- POD
- FAR
- FSS

The UI should also support Brier score/reliability for threshold probabilities because the supplied deeper product pack explicitly recommends probabilistic verification.

### FR-10 Baseline ladder

Always compare:

1. climatology
2. raw NWP
3. global QM
4. EMOS-style baseline
5. regime-aware

No "proposed model is best" badge is allowed. The UI should show measured values for the selected demo dataset and clearly label synthetic demo data.

### FR-11 Fallback and abstention

Fallback must be visible, not silently applied.

### FR-12 Auditability

Every published result must reference a:

- forecast ID
- model version
- data version
- calibration version
- verification run, where applicable

---

## 8. Non-functional requirements

### NFR-01 Performance

Prototype target:

- forecast packet API p95 < 2 seconds on local synthetic data
- dashboard initial load < 3 seconds on local development stack
- verification panel < 2 seconds for seeded datasets

These are software targets, not atmospheric-model latency claims.

### NFR-02 Reproducibility

Same:
- case ID
- model version
- demo seed

must return the same output.

### NFR-03 Explainability

Every correction result must expose "why":

- regime
- probability
- bank
- fallback
- uncertainty
- supported-data status

### NFR-04 Safety

No UI copy may imply:
- official warning authority,
- flood probability,
- live operational forecast,
- national accuracy,
- guaranteed detection.

### NFR-05 Accessibility

- Keyboard-friendly controls
- Sufficient contrast
- Meaningful labels
- No color-only status
- Tooltips for meteorological terms
- Responsive 1440px desktop-first layout with usable tablet fallback

---

## 9. Dashboard information architecture

### Screen A — Overview

- Header
- Current demo case
- Trust strip
- India/district map
- High-risk districts table
- Regime distribution
- Data freshness

### Screen B — District forecast

- District header
- Regime probability cards
- Raw vs corrected comparison
- Rainfall distribution chart
- Threshold probability cards
- 5-day table
- Provenance panel

### Screen C — Explainability

- Regime branch evidence
- Correction bank selected
- Feature contribution proxy
- "Why forecast changed?"
- Counterfactual values

### Screen D — Verification

- Raw vs QM vs EMOS vs regime-aware
- RMSE
- ETS
- CSI
- POD
- FAR
- FSS
- Brier/reliability
- Event counts
- "Synthetic demo data" badge

### Screen E — Trust & fallback

- data source health
- age
- missingness
- OOD flag
- fallback ladder
- human-review queue

### Screen F — Audit packet

- complete lineage JSON
- experiment metadata
- model version
- data version
- split
- thresholds
- validation artifact
- event ID

---

## 10. Demo dataset design

The demo database should contain:

- 12–20 synthetic districts
- 5 representative demo cases:
  - active monsoon
  - break monsoon
  - depression/LPS
  - orographic
  - transition/uncertain
- 5-day forecast horizon
- raw forecast
- corrected forecast
- observation
- ensemble spread
- regime probabilities
- threshold probabilities
- verification metrics
- data-source metadata

All demo values must be tagged:

`data_quality = "synthetic_demo"`

and visible in the UI.

---

## 11. Acceptance criteria

The prototype is accepted when a judge can perform this complete path without developer assistance:

**Select case → see regime probabilities → see raw forecast → see corrected forecast → see uncertainty → see 64.5/115.6/204.5 probabilities → compare baselines → trigger stale input → observe fallback → inspect audit.**

Additional acceptance:

- No negative rainfall values.
- No missing provenance for published forecast packets.
- Every fallback has a reason.
- Every verification metric has threshold/lead metadata.
- Synthetic numbers are not presented as operational skill.
- UI clearly says "Decision support — not an official warning authority."
- The system can be reset to the deterministic demo state.

---

## 12. Hackathon presentation rules encoded in the product

The supplied PPT pack asks for six slides and emphasizes a six-stage technical narrative, explicit uncertainty, provenance, fallback/abstention, human review and validation guardrails.

Prototype language must therefore favor:

- "demonstrates"
- "prototype"
- "synthetic demo"
- "validation plan"
- "measured on declared test set"

Avoid:

- "99% accuracy"
- "live operational warning"
- "saves lives"
- "predicts floods"
- "works across India"

unless those claims are independently measured and authorized.

---

## 13. Demo narrative

**0:00–0:30**  
Show the district map and explain that raw NWP is being post-processed, not replaced.

**0:30–1:00**  
Select a depression/LPS case. Show regime probability and tracker-conditioned provenance.

**1:00–1:30**  
Show raw q50 vs corrected q50 plus q10/q90 and threshold probabilities.

**1:30–2:00**  
Open verification. Compare raw / QM / EMOS / regime-aware.

**2:00–2:20**  
Inject stale satellite data. Show fallback and uncertainty increase.

**2:20–3:00**  
Open audit packet. Show lineage, model/data version, split, calibration and validation artifact.

---

## 14. Future production path

Phase 1: data contract + golden dataset + baseline ladder  
Phase 2: probabilistic regimes + occurrence/intensity + calibration  
Phase 3: spatial context + heavy-event evaluation  
Phase 4: shadow replay + human review + reproducible verification

The production roadmap should replace every synthetic demo metric with held-out measurements before any scientific performance claim is made.
