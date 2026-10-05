export type RegimeType =
  | 'active'
  | 'break'
  | 'depression'
  | 'coastal'
  | 'orographic'
  | 'western_disturbance';

export type CalibrationStatus = 'GREEN' | 'AMBER' | 'ABSTAIN';

export type FallbackState =
  | 'REGIME_AWARE'
  | 'POOLED_GLOBAL'
  | 'QM'
  | 'RAW_NWP'
  | 'ABSTAIN';

export interface DemoCase {
  id: string;
  name: string;
  label: string;
  date: string;
  regime_hint: string;
  description: string;
  is_hero_case: boolean;
  is_demo: boolean;
}

export interface DayForecastItem {
  day: number;
  date: string;
  expected_rain_mm: number;
  q10_mm: number;
  q50_mm: number;
  q90_mm: number;
  p64_5: number;
  p115_6: number;
  p204_5: number;
  dominant_regime: string;
  calibration_status: string;
  fallback_state: string;
  provenance: string;
}

export interface ForecastPacket {
  forecast_id: string;
  case_id: string;
  district_id: string;
  district_name: string;
  state: string;
  lat: float;
  lon: float;
  issue_time: string;
  valid_time: string;
  lead_hours: number;
  accumulation_window: string;
  raw_rain_mm: number;
  expected_rain_mm: number;
  observed_rain_mm: number | null;
  q10_mm: number;
  q50_mm: number;
  q90_mm: number;
  uncertainty_mm: number;
  positive_probability: number;
  p64_5: number;
  p115_6: number;
  p204_5: number;
  regime_probabilities: Record<string, number>;
  transition: boolean;
  confidence: number;
  correction_method: string;
  provenance: string;
  calibration_status: CalibrationStatus;
  fallback_state: FallbackState;
  fallback_reason: string | null;
  human_review_required: boolean;
  model_version: string;
  data_version: string;
  data_quality: string;
  source_health: {
    sources: DataSourceHealthItem[];
  };
  disclaimer: string;
  five_day_forecast: DayForecastItem[];
}

export type float = number;

export interface DistrictOverviewItem {
  id: string;
  name: string;
  state: string;
  lat: number;
  lon: number;
  geometry_geojson?: {
    type: string;
    coordinates: any;
  };
  expected_rain_mm: number;
  q50_mm: number;
  p64_5: number;
  p115_6: number;
  p204_5: number;
  dominant_regime: string;
  calibration_status: string;
  fallback_state: string;
  is_demo_geometry: boolean;
}

export interface BaselineMetrics {
  method_name: string;
  rmse: number;
  ets: number;
  csi: number;
  pod: number;
  far: number;
  fss: number;
  brier: number;
  brier_skill_score: number;
  event_count: number;
}

export interface ReliabilityBin {
  bin_center: number;
  forecast_probability: number;
  observed_frequency: number;
  sample_count: number;
}

export interface VerificationResponse {
  case_id: string;
  case_name: string;
  threshold_mm: number;
  lead_day: number;
  neighbourhood_km: number;
  split_name: string;
  data_quality: string;
  baselines: Record<string, BaselineMetrics>;
  reliability_curve: ReliabilityBin[];
  fss_by_scale: Array<{
    neighbourhood_km: number;
    raw_nwp: number;
    qm: number;
    emos: number;
    regime_aware: number;
  }>;
  neutral_comparison_statement: string;
}

export interface DataSourceHealthItem {
  source_id: string;
  name: string;
  source_type: string;
  last_success_at: string;
  age_minutes: number;
  expected_interval_minutes: number;
  stale_after_minutes: number;
  status: 'fresh' | 'stale' | 'missing' | 'invalid';
  fallback_impact: string;
}

export interface TrustResponse {
  forecast_id: string;
  case_id: string;
  current_fallback_state: FallbackState;
  fallback_ladder: string[];
  calibration_status: string;
  human_review_required: boolean;
  active_fault: string | null;
  sources: DataSourceHealthItem[];
  fallback_history: Array<Record<string, any>>;
  system_safety_status: string;
}

export interface AuditPacketResponse {
  forecast_id: string;
  case_id: string;
  district_id: string;
  issue_time: string;
  valid_time: string;
  lead_hours: number;
  accumulation_window: string;
  source_versions: Array<{ source: string; version: string }>;
  data_version: string;
  model_version: string;
  regime_probabilities: Record<string, number>;
  dominant_regime: string;
  transition_flag: boolean;
  regime_confidence: number;
  correction_method: string;
  calibration_status: string;
  fallback_state: string;
  fallback_reason: string | null;
  human_review_required: boolean;
  data_quality: string;
  verification_artifact: string;
  raw_nwp_snapshot: Record<string, any>;
  output_quantiles: Record<string, number>;
  threshold_probabilities: Record<string, number>;
  provenance_hash: string;
  timestamp: string;
}

export interface MapBaseLayer {
  id: string;
  name: string;
  url: string;
  attribution: string;
  max_zoom: number;
  default: boolean;
}

export interface MapOverlayLayer {
  id: string;
  name: string;
  type: string;
  url_template?: string;
  opacity?: number;
  attribution?: string;
}

export interface MapLayersResponse {
  base_layers: MapBaseLayer[];
  overlay_layers: MapOverlayLayer[];
  center: [number, number];
  zoom: number;
  bounds: [[number, number], [number, number]];
}

export interface DistrictGeoJsonFeature {
  type: 'Feature';
  id: string;
  geometry: {
    type: 'Polygon' | 'Point';
    coordinates: any;
  };
  properties: {
    id: string;
    name: string;
    state: string;
    lat: number;
    lon: number;
    expected_rain_mm: number;
    q50_mm: number;
    p64_5: number;
    p115_6: number;
    p204_5: number;
    dominant_regime: string;
    risk_level: string;
    fill_color: string;
    case_id: string;
  };
}

export interface DistrictsGeoJsonResponse {
  type: 'FeatureCollection';
  case_id: string;
  features: DistrictGeoJsonFeature[];
}
