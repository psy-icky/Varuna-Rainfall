# VARUNA-RAINFALL — 3-Minute Hackathon Demonstration Script

**SIH Problem Statement:** SIH26080 — Regime-Aware AI Post-Processing of NWP Rainfall Forecasts over India  
**Target Audience:** Hackathon Technical Judges & Meteorological Domain Evaluators  
**Hero Scenario:** "Central India LPS" (Monsoon Depression)

---

## Script Flowchart (0:00 → 3:00)

```text
[ 0:00 - 0:30 ] Overview & Regional Risk Map
       |
[ 0:30 - 1:15 ] Hero Case & District Forecast Deep-Dive
       |
[ 1:15 - 1:50 ] Verification & 5-Baseline Ladder
       |
[ 1:50 - 2:30 ] Live Fault Injection & Automated Fallback
       |
[ 2:30 - 3:00 ] Cryptographic Audit Lineage & Closing Value
```

---

## Detailed Walkthrough

### Part 1: System Overview & Problem Statement (0:00 – 0:30)
- **Action:** Open the dashboard at `http://localhost:5173`. Point to the top banner and the regional India map.
- **Narrator:**
  > "Respected judges, Numerical Weather Prediction (NWP) models produce raw rainfall estimates, but systematic error mechanisms vary drastically by weather regime. In an active monsoon, models under-predict rainfall intensity; in a break spell, they leak rain into dry zones; during a depression, vortex cores are displaced.
  > 
  > Rather than replacing NWP or acting as a black-box warning authority, **VARUNA-RAINFALL** converts raw forecast guidance into a calibrated, explainable probability field."

---

### Part 2: Hero Case Deep-Dive — Central India LPS (0:30 – 1:15)
- **Action:**
  1. From the Scenario dropdown, ensure **"Central India LPS (Monsoon Depression)"** is selected.
  2. Select district **Nashik** (or click it directly on the interactive Leaflet map).
  3. Navigate to the **District Forecast** tab.
- **Narrator:**
  > "Let's examine our hero case: a held-out monsoon depression.
  > 
  > 1. **Regime Posterior:** Notice the Weather-Regime Classifier. It assigns a **68% posterior to the Depression regime**, detecting strong 850 hPa vorticity and high core-zone anomalies.
  > 2. **Raw vs Calibrated:** The raw NWP forecast predicted **60.0 mm/day**. Because a depression regime is active, VARUNA automatically routes to the `lps_frequency_match` correction bank, scaling the calibrated median ($q50$) to **88.8 mm/day**.
  > 3. **Uncertainty Envelope:** We never show a single deterministic number. The credible interval spans from $q10 = \mathbf{52.3\text{ mm}}$ to $q90 = \mathbf{138.4\text{ mm}}$.
  > 4. **Monotonic Exceedance Probabilities:** Looking at the IMD heavy rainfall cards:
  >    - Heavy ($\ge 64.5\text{ mm}$): **68%**
  >    - Very Heavy ($\ge 115.6\text{ mm}$): **24%**
  >    - Extremely Heavy ($\ge 204.5\text{ mm}$): **7%**
  >    These strictly obey the mathematical invariant: $P(\ge 204.5) \le P(\ge 115.6) \le P(\ge 64.5)$."

---

### Part 3: Retrospective Baseline Verification (1:15 – 1:50)
- **Action:** Click **"Verification"** in the sidebar. Toggle between the $\ge 64.5\text{ mm}$ and $\ge 115.6\text{ mm}$ threshold buttons.
- **Narrator:**
  > "Scientific integrity is our highest priority. Notice the explicit disclosure: *'Synthetic prototype data — not operational forecast skill'*.
  > 
  > We evaluate performance along a **5-baseline ladder**:
  > 1. Climatology
  > 2. Raw NWP
  > 3. Global Quantile Mapping (QM)
  > 4. EMOS baseline
  > 5. VARUNA Regime-Aware
  > 
  > We do not attach marketing 'winner' badges. Instead, we inspect standard WMO meteorological metrics: RMSE drops from 52.8 mm to 27.9 mm; the Critical Success Index (CSI) improves to 0.61; and the Fractions Skill Score (FSS) chart proves spatial displacement tolerance across 10 km to 100 km neighborhood windows."

---

### Part 4: Live Fault Injection & Automated Fallback (1:50 – 2:30)
- **Action:**
  1. Click **"Trust & Fallback"** in the sidebar. Show the nominal ladder (`REGIME_AWARE`).
  2. Select **"Stale Satellite (>240m)"** from the Fault Injector dropdown.
  3. Click **"Inject Fault"**.
  4. Notice the instantaneous UI update:
     - The satellite source turns amber (`STALE`).
     - The Fallback Ladder drops from `REGIME_AWARE` to `QM`.
     - Calibration status changes to `AMBER`.
     - Uncertainty widens.
  5. Select **"Missing NWP Feed"** and click **"Inject Fault"**.
  6. Point to the prominent amber banner: **STATE: ABSTAIN / Human Forecaster Review Required**.
  7. Click **"Reset Demo to Nominal"** to immediately restore the system to `REGIME_AWARE`.
- **Narrator:**
  > "Operational safety means knowing when to degrade gracefully.
  > When we simulate a satellite SLA breach, VARUNA doesn't crash or fabricate numbers—it immediately drops to transparent Quantile Mapping (`QM`).
  > When primary NWP is missing, the system **ABSTAINS** entirely, revoking automated issuance and requesting human forecaster review.
  > One click of 'Reset Demo' returns the system to nominal health."

---

### Part 5: Immutable Audit Lineage & Conclusion (2:30 – 3:00)
- **Action:**
  1. Click **"Audit Packet"** in the sidebar.
  2. Show the JSON viewer.
  3. Click the **"Copy Audit JSON"** button to show the green confirmation.
- **Narrator:**
  > "Every single forecast emitted by VARUNA carries a proof-carrying audit packet.
  > 
  > In this JSON record, you can trace:
  > - Issue and valid timestamps
  > - Input data versions and model version `demo-0.1.0`
  > - The full regime posterior distribution
  > - Correction bank provenance (`bank:lps_frequency_match`)
  > - The SHA-256 provenance fingerprint
  > 
  > In summary, VARUNA-RAINFALL delivers **proof-carrying uncertainty: regime + probability + provenance + validation + fallback**. Thank you."
