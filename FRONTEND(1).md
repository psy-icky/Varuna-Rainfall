# VARUNA-RAINFALL — Frontend Specification

## 1. UX objective

The interface must feel like an operational decision-support console, not a generic weather app.

Visual hierarchy:

1. What is happening?
2. How uncertain is it?
3. What changed from raw NWP?
4. Can the result be trusted?
5. Why did it change?
6. What evidence supports it?

---

## 2. App shell

### Header

Left:
- VARUNA-RAINFALL
- "Regime-Uncertain Probabilistic Post-Processing"

Center:
- `DEMO MODE` badge

Right:
- selected issue time
- system health
- "Decision support — not an official warning authority"

### Sidebar

- Overview
- District Forecast
- Explainability
- Verification
- Trust & Fallback
- Audit

---

## 3. Overview page

### Hero section

Large:
- `Post-process the forecast. Surface the uncertainty.`

Subtext:
- Raw NWP → regime-aware correction → calibrated district risk

### Map

Show:
- district polygons/points
- q50 rainfall
- threshold probability
- selected district

Map legend:
- Expected rain
- P(>=64.5)
- P(>=115.6)
- P(>=204.5)

Do not use a "warning" icon as if it were an official alert.

### KPI cards

- Districts in demo
- High-risk threshold cases
- Current dominant regime
- Source health

### Data trust strip

Example:

```text
NWP  FRESH
Satellite  FRESH
Obs  1.2d old
Calibration  GREEN
Fallback  NONE
```

---

## 4. District Forecast page

### Header

```text
Nashik
Maharashtra
Valid: 29 Sep 2026 00:00 → 24h
```

### Regime card

Show seven chips/bars:

- Active
- Break
- Depression
- Coastal
- Orographic
- W. Disturbance
- Transition

Example:

```text
Depression 0.61
Orographic 0.22
Active     0.11
```

Include:
- confidence
- transition flag
- evidence list

### Raw vs corrected card

Use two bars:

```text
Raw NWP        60 mm
Corrected      128 mm
Observed       142 mm     [verification-only]
```

Add note:
`Observed value is used only for retrospective demo verification.`

### Distribution chart

X axis:
rainfall mm/day

Curves/markers:
- q10
- q50
- q90
- thresholds

### Threshold cards

Three cards:

```text
HEAVY
>= 64.5 mm
68%
```

```text
VERY HEAVY
>= 115.6 mm
24%
```

```text
EXTREMELY HEAVY
>= 204.5 mm
7%
```

Each card:
- probability
- calibration state
- threshold

### 5-day table

Columns:
- Date
- q50
- q10–q90
- P>=64.5
- P>=115.6
- regime
- calibration
- provenance

---

## 5. Explainability page

### "Why did VARUNA change the forecast?"

Show a vertical causal chain:

```text
Raw NWP
  ↓
Regime posterior
  ↓
Correction bank
  ↓
Distribution
  ↓
Threshold probabilities
```

Example:

```text
Depression probability: 0.68
      ↓
LPS correction selected
      ↓
Envelope amplified: +22%
Spatial shift proxy: eastward
      ↓
q50: 60 → 88 mm
```

Mark these values as:
`DEMO PROXY — not measured physics`

### Branch evidence cards

A. Rule evidence
- core-zone anomaly
- persistence
- trough
- vorticity

B. CNN placeholder
- status: `adapter ready / demo disabled`

C. LPS tracker placeholder
- status: `demo track available`

---

## 6. Verification page

### Header

`Held-out demo case · synthetic verification data`

### Baseline tabs

- Climatology
- Raw NWP
- QM
- EMOS-style
- Regime-aware

### Metric grid

- RMSE
- ETS
- CSI
- POD
- FAR
- FSS

Additional:
- Brier score
- Brier skill score

### Charts

1. Baseline ladder bar chart
2. Reliability curve
3. FSS vs neighbourhood size
4. Regime-by-regime table

Required footer:

`Synthetic prototype values. Replace with audited held-out measurements before scientific claims.`

---

## 7. Trust & Fallback page

### Source health

Rows:
- NWP
- Satellite
- Observation
- Terrain/static
- District polygons

Columns:
- last updated
- age
- status
- fallback impact

### Fallback ladder

Display as a horizontal path:

```text
Regime-aware → Global → QM → Raw NWP → Abstain
```

Highlight current state.

### Demo controls

Dropdown:
- no fault
- stale satellite
- missing NWP
- schema error
- regime OOD

Button:
`Inject Fault`

Button:
`Reset Demo`

---

## 8. Audit page

Use a code-style viewer.

Sections:

- forecast ID
- case ID
- issue time
- valid time
- lead
- accumulation
- sources
- model version
- calibration version
- regime posterior
- correction provenance
- fallback
- verification artifact

Add:
`Copy audit JSON`

---

## 9. Component list

```text
AppShell
TopNav
Sidebar
HealthPill
DemoBadge
TrustStrip

IndiaMap
DistrictLayer
MapLegend
DistrictSelector

RegimeProbabilityCard
RegimeBar
TransitionBadge
EvidenceList

ForecastSummaryCard
RainfallDistributionChart
ThresholdProbabilityCard
FiveDayForecastTable

BaselineComparison
MetricCard
ReliabilityChart
FSSChart

SourceHealthTable
FallbackLadder
FaultInjectionPanel

AuditPacket
JsonViewer

LoadingState
EmptyState
ErrorState
StaleState
AbstainState
```

---

## 10. State management

Use TanStack Query for server state.

Example hooks:

```text
useHealth()
useDistricts()
useCases()
useDistrictForecast(districtId, caseId)
useVerification(caseId)
useTrust(forecastId)
useAudit(forecastId)
useInjectFault()
useResetDemo()
```

Local state:
- selected district
- selected case
- selected threshold
- selected verification baseline
- active page

Persist:
- selected district
- selected case

---

## 11. API types

Keep frontend types generated manually from backend schema initially:

```ts
type Regime =
  | "active"
  | "break"
  | "depression"
  | "coastal"
  | "orographic"
  | "western_disturbance";

type CalibrationStatus = "green" | "amber" | "abstain";

type ForecastPacket = {
  forecastId: string;
  districtId: string;
  caseId: string;
  expectedRainMm: number;
  q10Mm: number;
  q50Mm: number;
  q90Mm: number;
  rain64_5Probability: number;
  rain115_6Probability: number;
  rain204_5Probability: number;
  regime: Record<Regime, number>;
  transition: boolean;
  calibration: CalibrationStatus;
  provenance: string;
  fallbackState: string;
  dataAgeMinutes: number;
};
```

---

## 12. UX status semantics

Never rely only on color.

### GREEN

Text:
`Calibrated / supported`

### AMBER

Text:
`Limited support / human review`

### ABSTAIN

Text:
`Insufficient confidence / do not act automatically`

### STALE

Text:
`Input age exceeded policy`

### OOD

Text:
`Out-of-distribution input`

---

## 13. Responsive behavior

At >= 1280px:
- 3-column dashboard

At 768–1279px:
- 2-column cards
- map full width

At <768px:
- single column
- map collapsible
- tables horizontally scrollable

---

## 14. Visual design

Use:
- dark navy/charcoal base
- off-white cards
- restrained cyan/teal accents
- amber for warnings
- red only for extreme-risk probability status, not official warnings

Typography:
- Inter or system sans

Radius:
- 10–14px

Do not make it look like a consumer weather app with giant animated clouds.

---

## 15. Frontend test checklist

- map loads
- district selection works
- case selection works
- API errors render
- stale state visible
- threshold cards use correct units
- q10 <= q50 <= q90
- synthetic badge appears
- official-warning disclaimer visible
- audit JSON opens
- reset restores golden case
