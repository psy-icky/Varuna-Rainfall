import {
  ForecastPacket,
  VerificationResponse,
  TrustResponse,
  AuditPacketResponse,
  DayForecastItem,
  BaselineMetrics
} from '../types';

export const FALLBACK_DISTRICTS_DICT: Record<string, { name: string; state: string; lat: number; lon: number; elevation: number; coast_km: number; factor: number }> = {
  mh_mumbai_suburban: { name: 'Mumbai Suburban', state: 'Maharashtra', lat: 19.08, lon: 72.88, elevation: 14, coast_km: 5, factor: 1.15 },
  mh_nashik: { name: 'Nashik', state: 'Maharashtra', lat: 20.00, lon: 73.78, elevation: 560, coast_km: 140, factor: 1.0 },
  mh_pune: { name: 'Pune', state: 'Maharashtra', lat: 18.52, lon: 73.85, elevation: 560, coast_km: 110, factor: 0.85 },
  mh_nagpur: { name: 'Nagpur', state: 'Maharashtra', lat: 21.14, lon: 79.08, elevation: 310, coast_km: 680, factor: 1.2 },
  od_cuttack: { name: 'Cuttack', state: 'Odisha', lat: 20.46, lon: 85.88, elevation: 36, coast_km: 60, factor: 1.35 },
  od_puri: { name: 'Puri', state: 'Odisha', lat: 19.81, lon: 85.83, elevation: 5, coast_km: 2, factor: 1.4 },
  cg_raigarh: { name: 'Raigarh', state: 'Chhattisgarh', lat: 21.90, lon: 83.40, elevation: 215, coast_km: 420, factor: 1.3 },
  mp_jabalpur: { name: 'Jabalpur', state: 'Madhya Pradesh', lat: 23.18, lon: 79.98, elevation: 411, coast_km: 720, factor: 1.25 },
  gj_surat: { name: 'Surat', state: 'Gujarat', lat: 21.17, lon: 72.83, elevation: 13, coast_km: 15, factor: 0.95 },
  kl_ernakulam: { name: 'Ernakulam', state: 'Kerala', lat: 9.98, lon: 76.30, elevation: 4, coast_km: 6, factor: 1.25 },
  kl_wayanad: { name: 'Wayanad', state: 'Kerala', lat: 11.68, lon: 76.13, elevation: 820, coast_km: 55, factor: 1.65 },
  uk_dehradun: { name: 'Dehradun', state: 'Uttarakhand', lat: 30.31, lon: 78.03, elevation: 640, coast_km: 1100, factor: 1.1 }
};

let currentSimulatedFault: string | null = null;

export function setSimulatedFault(fault: string | null) {
  currentSimulatedFault = fault;
}

export function getSimulatedFault(): string | null {
  return currentSimulatedFault;
}

export function buildMockForecastPacket(districtId: string, caseId: string = 'case_lps_001'): ForecastPacket {
  const d = FALLBACK_DISTRICTS_DICT[districtId] || FALLBACK_DISTRICTS_DICT['mh_nashik'];
  const forecastId = `fc_${caseId}_${districtId}`;

  let baseRaw = 60.0;
  let observed = 142.0;
  let dominantRegime = 'depression';
  let correctionMethod = 'lps_frequency_match';
  let issueDate = '2026-08-17';

  let regimeProbs: Record<string, number> = {
    depression: 0.68,
    active: 0.18,
    coastal: 0.06,
    orographic: 0.04,
    break: 0.02,
    western_disturbance: 0.02
  };

  if (caseId === 'case_active_001') {
    baseRaw = 45.0;
    observed = 52.0;
    dominantRegime = 'active';
    correctionMethod = 'active_emos';
    issueDate = '2026-07-22';
    regimeProbs = { active: 0.72, depression: 0.12, coastal: 0.08, orographic: 0.04, break: 0.02, western_disturbance: 0.02 };
  } else if (caseId === 'case_break_001') {
    baseRaw = 18.0;
    observed = 2.0;
    dominantRegime = 'break';
    correctionMethod = 'break_qm';
    issueDate = '2026-08-04';
    regimeProbs = { break: 0.81, active: 0.08, western_disturbance: 0.05, depression: 0.03, coastal: 0.02, orographic: 0.01 };
  } else if (caseId === 'case_orographic_001') {
    baseRaw = 80.0;
    observed = 195.0;
    dominantRegime = 'orographic';
    correctionMethod = 'terrain_qm';
    issueDate = '2026-07-15';
    regimeProbs = { orographic: 0.76, coastal: 0.11, active: 0.07, depression: 0.03, break: 0.02, western_disturbance: 0.01 };
  } else if (caseId === 'case_transition_001') {
    baseRaw = 35.0;
    observed = 48.0;
    dominantRegime = 'depression';
    correctionMethod = 'probability_blend';
    issueDate = '2026-08-20';
    regimeProbs = { depression: 0.44, active: 0.38, coastal: 0.08, orographic: 0.05, break: 0.03, western_disturbance: 0.02 };
  }

  const factor = d.factor;
  const rawRain = Math.round(baseRaw * factor * 10) / 10;
  const observedRain = Math.round(observed * factor * 10) / 10;

  // Compute realistic calibrated values
  let expectedRain = Math.round(rawRain * 1.48 * 10) / 10;
  if (dominantRegime === 'break') expectedRain = Math.round(rawRain * 0.35 * 10) / 10;
  if (dominantRegime === 'active') expectedRain = Math.round(rawRain * 1.15 * 10) / 10;

  const q10 = Math.round(expectedRain * 0.58 * 10) / 10;
  const q50 = Math.round(expectedRain * 0.98 * 10) / 10;
  const q90 = Math.round(expectedRain * 1.56 * 10) / 10;
  const uncertainty = Math.round((q90 - q10) * 10) / 10;

  let p64 = Math.min(0.99, Math.round((expectedRain / 94.0) * 100) / 100);
  let p115 = Math.min(0.90, Math.round((expectedRain / 155.0) * 100) / 100);
  let p204 = Math.min(0.65, Math.round((expectedRain / 260.0) * 100) / 100);

  // Invariant: p204 <= p115 <= p64
  if (p115 > p64) p115 = p64;
  if (p204 > p115) p204 = p115;

  let fallbackState = 'REGIME_AWARE';
  let calibrationStatus: 'GREEN' | 'AMBER' | 'ABSTAIN' = 'GREEN';
  let humanReview = false;
  let fallbackReason: string | null = null;

  if (currentSimulatedFault === 'stale_satellite') {
    fallbackState = 'QM';
    calibrationStatus = 'AMBER';
    fallbackReason = 'INSAT-3DR satellite telemetry SLA breached (>240m)';
  } else if (currentSimulatedFault === 'missing_nwp') {
    fallbackState = 'ABSTAIN';
    calibrationStatus = 'ABSTAIN';
    humanReview = true;
    fallbackReason = 'Primary ECMWF/IMD NWP grid missing';
  } else if (currentSimulatedFault === 'regime_ood') {
    fallbackState = 'POOLED_GLOBAL';
    calibrationStatus = 'AMBER';
    fallbackReason = 'Out-of-distribution regime feature anomaly';
  }

  // 5-Day trajectory
  const fiveDay: DayForecastItem[] = [];
  const decay = [1.0, 0.88, 0.65, 0.40, 0.25];
  for (let i = 1; i <= 5; i++) {
    const scale = decay[i - 1];
    const exp = Math.round(expectedRain * scale * 10) / 10;
    const d_p64 = Math.min(1.0, Math.round(p64 * scale * 100) / 100);
    const d_p115 = Math.min(d_p64, Math.round(p115 * (scale ** 1.3) * 100) / 100);
    const d_p204 = Math.min(d_p115, Math.round(p204 * (scale ** 1.8) * 100) / 100);

    fiveDay.push({
      day: i,
      date: `2026-08-${16 + i}`,
      expected_rain_mm: exp,
      q10_mm: Math.round(exp * 0.58 * 10) / 10,
      q50_mm: Math.round(exp * 0.98 * 10) / 10,
      q90_mm: Math.round(exp * 1.56 * 10) / 10,
      p64_5: d_p64,
      p115_6: d_p115,
      p204_5: d_p204,
      dominant_regime: dominantRegime,
      calibration_status: calibrationStatus,
      fallback_state: fallbackState,
      provenance: 'VARUNA Regime-Conditional Generator'
    });
  }

  return {
    forecast_id: forecastId,
    case_id: caseId,
    district_id: districtId,
    district_name: d.name,
    state: d.state,
    lat: d.lat,
    lon: d.lon,
    issue_time: `${issueDate} 06:00 UTC`,
    valid_time: `${issueDate} 06:00 to 24h`,
    lead_hours: 24,
    accumulation_window: '24h',
    raw_rain_mm: rawRain,
    expected_rain_mm: expectedRain,
    observed_rain_mm: observedRain,
    q10_mm: q10,
    q50_mm: q50,
    q90_mm: q90,
    uncertainty_mm: uncertainty,
    positive_probability: 0.98,
    p64_5: p64,
    p115_6: p115,
    p204_5: p204,
    regime_probabilities: regimeProbs,
    transition: caseId === 'case_transition_001',
    confidence: caseId === 'case_transition_001' ? 0.44 : 0.88,
    correction_method: correctionMethod,
    provenance: 'VARUNA Scientific Post-Processing Core',
    calibration_status: calibrationStatus,
    fallback_state: fallbackState as any,
    fallback_reason: fallbackReason,
    human_review_required: humanReview,
    model_version: 'demo-0.1.0',
    data_version: 'demo-2026-09',
    data_quality: 'synthetic_demo',
    source_health: {
      sources: [
        { source_id: 'nwp_ecmwf', name: 'ECMWF / IMD NWP Grid', source_type: 'grid', last_success_at: '2026-08-17T05:30:00Z', age_minutes: 18, expected_interval_minutes: 360, stale_after_minutes: 720, status: currentSimulatedFault === 'missing_nwp' ? 'missing' : 'fresh', fallback_impact: 'Drops to ABSTAIN' },
        { source_id: 'sat_insat', name: 'INSAT-3DR IR Brightness Temp', source_type: 'satellite', last_success_at: '2026-08-17T05:45:00Z', age_minutes: currentSimulatedFault === 'stale_satellite' ? 260 : 25, expected_interval_minutes: 30, stale_after_minutes: 180, status: currentSimulatedFault === 'stale_satellite' ? 'stale' : 'fresh', fallback_impact: 'Drops to QM' },
        { source_id: 'gauge_imd', name: 'IMD AWS Telemetric Rain Gauges', source_type: 'gauge', last_success_at: '2026-08-17T04:00:00Z', age_minutes: 90, expected_interval_minutes: 60, stale_after_minutes: 360, status: 'fresh', fallback_impact: 'Drops to POOLED_GLOBAL' }
      ]
    },
    disclaimer: 'Decision support — not an official warning authority. Synthetic prototype data — not operational forecast skill.',
    five_day_forecast: fiveDay
  };
}

export function buildMockVerification(caseId: string = 'case_lps_001', thresholdMm: number = 64.5): VerificationResponse {
  const isHighThreshold = thresholdMm >= 115.6;

  const baselines: Record<string, BaselineMetrics> = {
    climatology: {
      method_name: '1. Climatology',
      rmse: isHighThreshold ? 72.4 : 64.2,
      ets: isHighThreshold ? 0.08 : 0.12,
      csi: isHighThreshold ? 0.15 : 0.22,
      pod: isHighThreshold ? 0.28 : 0.40,
      far: isHighThreshold ? 0.74 : 0.65,
      fss: isHighThreshold ? 0.18 : 0.25,
      brier: isHighThreshold ? 0.28 : 0.24,
      brier_skill_score: 0.0,
      event_count: 142
    },
    raw_nwp: {
      method_name: '2. Raw NWP',
      rmse: isHighThreshold ? 60.1 : 52.8,
      ets: isHighThreshold ? 0.20 : 0.28,
      csi: isHighThreshold ? 0.29 : 0.38,
      pod: isHighThreshold ? 0.44 : 0.58,
      far: isHighThreshold ? 0.56 : 0.48,
      fss: isHighThreshold ? 0.32 : 0.42,
      brier: isHighThreshold ? 0.22 : 0.19,
      brier_skill_score: 0.21,
      event_count: 142
    },
    qm: {
      method_name: '3. Global QM',
      rmse: isHighThreshold ? 44.8 : 39.4,
      ets: isHighThreshold ? 0.32 : 0.41,
      csi: isHighThreshold ? 0.40 : 0.49,
      pod: isHighThreshold ? 0.58 : 0.69,
      far: isHighThreshold ? 0.44 : 0.36,
      fss: isHighThreshold ? 0.45 : 0.55,
      brier: isHighThreshold ? 0.17 : 0.14,
      brier_skill_score: 0.42,
      event_count: 142
    },
    emos: {
      method_name: '4. EMOS Baseline',
      rmse: isHighThreshold ? 39.2 : 34.6,
      ets: isHighThreshold ? 0.37 : 0.46,
      csi: isHighThreshold ? 0.46 : 0.54,
      pod: isHighThreshold ? 0.64 : 0.74,
      far: isHighThreshold ? 0.38 : 0.31,
      fss: isHighThreshold ? 0.52 : 0.61,
      brier: isHighThreshold ? 0.14 : 0.12,
      brier_skill_score: 0.50,
      event_count: 142
    },
    regime_aware: {
      method_name: '5. VARUNA Regime-Aware',
      rmse: isHighThreshold ? 31.5 : 27.9,
      ets: isHighThreshold ? 0.49 : 0.58,
      csi: isHighThreshold ? 0.58 : 0.66,
      pod: isHighThreshold ? 0.78 : 0.86,
      far: isHighThreshold ? 0.26 : 0.21,
      fss: isHighThreshold ? 0.64 : 0.74,
      brier: isHighThreshold ? 0.10 : 0.08,
      brier_skill_score: 0.67,
      event_count: 142
    }
  };

  const reliability = [
    { bin_center: 0.05, forecast_probability: 0.05, observed_frequency: 0.04, sample_count: 320 },
    { bin_center: 0.15, forecast_probability: 0.15, observed_frequency: 0.14, sample_count: 240 },
    { bin_center: 0.25, forecast_probability: 0.25, observed_frequency: 0.23, sample_count: 180 },
    { bin_center: 0.35, forecast_probability: 0.35, observed_frequency: 0.34, sample_count: 150 },
    { bin_center: 0.45, forecast_probability: 0.45, observed_frequency: 0.42, sample_count: 110 },
    { bin_center: 0.55, forecast_probability: 0.55, observed_frequency: 0.53, sample_count: 95 },
    { bin_center: 0.65, forecast_probability: 0.65, observed_frequency: 0.62, sample_count: 82 },
    { bin_center: 0.75, forecast_probability: 0.75, observed_frequency: 0.73, sample_count: 70 },
    { bin_center: 0.85, forecast_probability: 0.85, observed_frequency: 0.82, sample_count: 54 },
    { bin_center: 0.95, forecast_probability: 0.95, observed_frequency: 0.91, sample_count: 36 }
  ];

  const fssScales = [
    { neighbourhood_km: 10, raw_nwp: 0.32, qm: 0.42, emos: 0.48, regime_aware: 0.61 },
    { neighbourhood_km: 25, raw_nwp: 0.42, qm: 0.55, emos: 0.61, regime_aware: 0.74 },
    { neighbourhood_km: 50, raw_nwp: 0.54, qm: 0.66, emos: 0.72, regime_aware: 0.82 },
    { neighbourhood_km: 75, raw_nwp: 0.63, qm: 0.74, emos: 0.79, regime_aware: 0.88 },
    { neighbourhood_km: 100, raw_nwp: 0.71, qm: 0.81, emos: 0.85, regime_aware: 0.93 }
  ];

  return {
    case_id: caseId,
    case_name: 'Central India LPS (Monsoon Depression)',
    threshold_mm: thresholdMm,
    lead_day: 1,
    neighbourhood_km: 25,
    split_name: 'Held-out test fold',
    data_quality: 'synthetic_demo',
    baselines: baselines,
    reliability_curve: reliability,
    fss_by_scale: fssScales,
    neutral_comparison_statement: 'Scientific evaluation across standard WMO verification baselines without subjective marketing claims.'
  };
}

export function buildMockTrust(forecastId: string = 'fc_case_lps_001_mh_nashik'): TrustResponse {
  let fallbackState: any = 'REGIME_AWARE';
  let calibStatus = 'GREEN';
  let humanReview = false;

  if (currentSimulatedFault === 'stale_satellite') {
    fallbackState = 'QM';
    calibStatus = 'AMBER';
  } else if (currentSimulatedFault === 'missing_nwp') {
    fallbackState = 'ABSTAIN';
    calibStatus = 'ABSTAIN';
    humanReview = true;
  } else if (currentSimulatedFault === 'regime_ood') {
    fallbackState = 'POOLED_GLOBAL';
    calibStatus = 'AMBER';
  }

  return {
    forecast_id: forecastId,
    case_id: 'case_lps_001',
    current_fallback_state: fallbackState,
    fallback_ladder: ['REGIME_AWARE', 'POOLED_GLOBAL', 'QM', 'RAW_NWP', 'ABSTAIN'],
    calibration_status: calibStatus,
    human_review_required: humanReview,
    active_fault: currentSimulatedFault,
    sources: [
      {
        source_id: 'nwp_ecmwf',
        name: 'ECMWF / IMD NWP Grid',
        source_type: 'grid',
        last_success_at: '2026-08-17T05:30:00Z',
        age_minutes: 18,
        expected_interval_minutes: 360,
        stale_after_minutes: 720,
        status: currentSimulatedFault === 'missing_nwp' ? 'missing' : 'fresh',
        fallback_impact: 'Drops to ABSTAIN / Forecaster Escalation'
      },
      {
        source_id: 'sat_insat',
        name: 'INSAT-3DR IR Brightness Temp',
        source_type: 'satellite',
        last_success_at: '2026-08-17T05:45:00Z',
        age_minutes: currentSimulatedFault === 'stale_satellite' ? 260 : 25,
        expected_interval_minutes: 30,
        stale_after_minutes: 180,
        status: currentSimulatedFault === 'stale_satellite' ? 'stale' : 'fresh',
        fallback_impact: 'Drops to Global Quantile Mapping (QM)'
      },
      {
        source_id: 'gauge_imd',
        name: 'IMD AWS Telemetric Rain Gauges',
        source_type: 'gauge',
        last_success_at: '2026-08-17T04:00:00Z',
        age_minutes: 85,
        expected_interval_minutes: 60,
        stale_after_minutes: 360,
        status: 'fresh',
        fallback_impact: 'Drops to Pooled Global Baseline'
      },
      {
        source_id: 'radar_imd',
        name: 'IMD Doppler Radar Network (DWR)',
        source_type: 'radar',
        last_success_at: '2026-08-17T05:50:00Z',
        age_minutes: 12,
        expected_interval_minutes: 15,
        stale_after_minutes: 60,
        status: 'fresh',
        fallback_impact: 'Suppresses Meso-Convective Vortex Nudging'
      }
    ],
    fallback_history: [],
    system_safety_status: currentSimulatedFault
      ? `Operational Fallback Active: System degraded gracefully to ${fallbackState}`
      : 'All ingestion SLAs nominal. Zero fallbacks engaged.'
  };
}

export function buildMockAudit(forecastId: string = 'fc_case_lps_001_mh_nashik'): AuditPacketResponse {
  return {
    forecast_id: forecastId,
    case_id: 'case_lps_001',
    district_id: 'mh_nashik',
    issue_time: '2026-08-17T06:00:00Z',
    valid_time: '2026-08-18T06:00:00Z',
    lead_hours: 24,
    accumulation_window: '24h',
    source_versions: [
      { source: 'ECMWF NWP Grid', version: 'v2.4.1' },
      { source: 'INSAT-3DR Satellite', version: 'v1.1' },
      { source: 'IMD Telemetry Gauges', version: 'v3.0' }
    ],
    data_version: 'demo-2026-09',
    model_version: 'demo-0.1.0',
    regime_probabilities: {
      depression: 0.68,
      active: 0.18,
      coastal: 0.06,
      orographic: 0.04,
      break: 0.02,
      western_disturbance: 0.02
    },
    dominant_regime: 'depression',
    transition_flag: false,
    regime_confidence: 0.88,
    correction_method: 'lps_frequency_match',
    calibration_status: 'GREEN',
    fallback_state: 'REGIME_AWARE',
    fallback_reason: null,
    human_review_required: false,
    data_quality: 'synthetic_demo',
    verification_artifact: 'artifact_lps_nashik_verify.json',
    raw_nwp_snapshot: {
      base_rain_mm: 60.0,
      ensemble_std_mm: 24.0,
      vorticity_850: 3.8,
      core_anomaly_sigma: 1.40
    },
    output_quantiles: {
      q10: 52.3,
      q50: 87.3,
      q90: 138.4
    },
    threshold_probabilities: {
      p64_5: 0.94,
      p115_6: 0.28,
      p204_5: 0.05
    },
    provenance_hash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
    timestamp: '2026-08-17T06:02:14.382Z'
  };
}
