-- VARUNA-RAINFALL: Supabase PostgreSQL Schema & Seed Script
-- Problem Statement: SIH26080 — Regime-Aware AI Post-Processing of NWP Rainfall Forecasts over India
-- Data Quality Flag: synthetic_demo

-- =============================================================================
-- 1. EXTENSIONS
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- 2. TABLES
-- =============================================================================

-- Districts master table
CREATE TABLE IF NOT EXISTS districts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    state TEXT NOT NULL,
    country TEXT NOT NULL DEFAULT 'India',
    lat DOUBLE PRECISION NOT NULL,
    lon DOUBLE PRECISION NOT NULL,
    geometry_geojson JSONB NOT NULL,
    geometry_version TEXT NOT NULL DEFAULT 'demo-v1',
    is_demo_geometry BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT '2026-09-01T00:00:00Z'
);

-- Demo scenarios / held-out events
CREATE TABLE IF NOT EXISTS demo_cases (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    event_date DATE NOT NULL,
    regime_hint TEXT NOT NULL,
    synthetic_features JSONB NOT NULL,
    seed INTEGER NOT NULL,
    is_demo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT '2026-09-01T00:00:00Z'
);

-- Data sources registry
CREATE TABLE IF NOT EXISTS data_sources (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    source_type TEXT NOT NULL,
    version TEXT NOT NULL,
    expected_interval_minutes INTEGER NOT NULL,
    stale_after_minutes INTEGER NOT NULL,
    last_success_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'fresh',
    created_at TIMESTAMPTZ NOT NULL DEFAULT '2026-09-01T00:00:00Z'
);

-- Ingestion run records for source monitoring
CREATE TABLE IF NOT EXISTS ingestion_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id TEXT NOT NULL REFERENCES data_sources(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ NOT NULL,
    finished_at TIMESTAMPTZ NOT NULL,
    rows_ingested INTEGER NOT NULL DEFAULT 0,
    records_missing INTEGER NOT NULL DEFAULT 0,
    schema_valid BOOLEAN NOT NULL DEFAULT true,
    status TEXT NOT NULL DEFAULT 'success',
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT '2026-09-01T00:00:00Z'
);

-- Model version registry
CREATE TABLE IF NOT EXISTS model_versions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    version TEXT NOT NULL,
    model_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT '2026-09-01T00:00:00Z'
);

-- Core forecast execution table
CREATE TABLE IF NOT EXISTS forecast_runs (
    id TEXT PRIMARY KEY,
    case_id TEXT NOT NULL REFERENCES demo_cases(id) ON DELETE CASCADE,
    district_id TEXT NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
    model_version_id TEXT NOT NULL REFERENCES model_versions(id) ON DELETE CASCADE,
    issue_time TIMESTAMPTZ NOT NULL,
    valid_time TIMESTAMPTZ NOT NULL,
    lead_hours INTEGER NOT NULL DEFAULT 24,
    accumulation_window TEXT NOT NULL DEFAULT '24h',
    source_version TEXT NOT NULL DEFAULT 'demo-data-v1',
    raw_rain_mm DOUBLE PRECISION NOT NULL,
    observed_rain_mm DOUBLE PRECISION,
    ensemble_mean_mm DOUBLE PRECISION NOT NULL,
    ensemble_std_mm DOUBLE PRECISION NOT NULL,
    qc_status TEXT NOT NULL DEFAULT 'passed',
    data_quality TEXT NOT NULL DEFAULT 'synthetic_demo',
    created_at TIMESTAMPTZ NOT NULL DEFAULT '2026-09-01T00:00:00Z'
);

-- Regime posterior predictions
CREATE TABLE IF NOT EXISTS regime_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    forecast_run_id TEXT NOT NULL REFERENCES forecast_runs(id) ON DELETE CASCADE,
    active_probability DOUBLE PRECISION NOT NULL,
    break_probability DOUBLE PRECISION NOT NULL,
    depression_probability DOUBLE PRECISION NOT NULL,
    coastal_probability DOUBLE PRECISION NOT NULL,
    orographic_probability DOUBLE PRECISION NOT NULL,
    western_disturbance_probability DOUBLE PRECISION NOT NULL,
    transition BOOLEAN NOT NULL DEFAULT false,
    confidence DOUBLE PRECISION NOT NULL,
    evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
    engine_version TEXT NOT NULL DEFAULT 'demo-regime-0.1.0',
    created_at TIMESTAMPTZ NOT NULL DEFAULT '2026-09-01T00:00:00Z'
);

-- Final calibrated forecast products
CREATE TABLE IF NOT EXISTS forecast_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    forecast_run_id TEXT NOT NULL REFERENCES forecast_runs(id) ON DELETE CASCADE,
    correction_method TEXT NOT NULL,
    expected_rain_mm DOUBLE PRECISION NOT NULL,
    q10_mm DOUBLE PRECISION NOT NULL,
    q50_mm DOUBLE PRECISION NOT NULL,
    q90_mm DOUBLE PRECISION NOT NULL,
    positive_probability DOUBLE PRECISION NOT NULL,
    p64_5 DOUBLE PRECISION NOT NULL,
    p115_6 DOUBLE PRECISION NOT NULL,
    p204_5 DOUBLE PRECISION NOT NULL,
    uncertainty_mm DOUBLE PRECISION NOT NULL,
    calibration_status TEXT NOT NULL DEFAULT 'green',
    fallback_state TEXT NOT NULL DEFAULT 'REGIME_AWARE',
    provenance TEXT NOT NULL,
    human_review_required BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT '2026-09-01T00:00:00Z'
);

-- Verification runs metadata
CREATE TABLE IF NOT EXISTS verification_runs (
    id TEXT PRIMARY KEY,
    case_id TEXT NOT NULL REFERENCES demo_cases(id) ON DELETE CASCADE,
    split_name TEXT NOT NULL DEFAULT 'held_out_validation',
    data_quality TEXT NOT NULL DEFAULT 'synthetic_demo',
    run_version TEXT NOT NULL DEFAULT 'demo-verify-0.1.0',
    started_at TIMESTAMPTZ NOT NULL DEFAULT '2026-09-01T00:00:00Z',
    finished_at TIMESTAMPTZ NOT NULL DEFAULT '2026-09-01T00:05:00Z'
);

-- Baseline comparison & verification metrics
CREATE TABLE IF NOT EXISTS verification_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    verification_run_id TEXT NOT NULL REFERENCES verification_runs(id) ON DELETE CASCADE,
    method_name TEXT NOT NULL,
    threshold_mm DOUBLE PRECISION NOT NULL,
    lead_day INTEGER NOT NULL DEFAULT 1,
    neighbourhood_km INTEGER NOT NULL DEFAULT 25,
    rmse DOUBLE PRECISION NOT NULL,
    ets DOUBLE PRECISION NOT NULL,
    csi DOUBLE PRECISION NOT NULL,
    pod DOUBLE PRECISION NOT NULL,
    far DOUBLE PRECISION NOT NULL,
    fss DOUBLE PRECISION NOT NULL,
    brier DOUBLE PRECISION NOT NULL,
    brier_skill_score DOUBLE PRECISION NOT NULL,
    event_count INTEGER NOT NULL DEFAULT 48,
    created_at TIMESTAMPTZ NOT NULL DEFAULT '2026-09-01T00:00:00Z'
);

-- Fallback event logs
CREATE TABLE IF NOT EXISTS fallback_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    forecast_run_id TEXT NOT NULL,
    from_state TEXT NOT NULL,
    to_state TEXT NOT NULL,
    reason_code TEXT NOT NULL,
    reason_detail TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT '2026-09-01T00:00:00Z'
);

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    forecast_run_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT '2026-09-01T00:00:00Z'
);

-- =============================================================================
-- 3. INDEXES
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_forecast_runs_case_id ON forecast_runs(case_id);
CREATE INDEX IF NOT EXISTS idx_forecast_runs_district_id ON forecast_runs(district_id);
CREATE INDEX IF NOT EXISTS idx_forecast_runs_valid_time ON forecast_runs(valid_time);
CREATE INDEX IF NOT EXISTS idx_forecast_runs_case_district ON forecast_runs(case_id, district_id);
CREATE INDEX IF NOT EXISTS idx_forecast_products_forecast_run_id ON forecast_products(forecast_run_id);
CREATE INDEX IF NOT EXISTS idx_verification_metrics_run_id ON verification_metrics(verification_run_id);
CREATE INDEX IF NOT EXISTS idx_fallback_events_run_id ON fallback_events(forecast_run_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_run_id ON audit_events(forecast_run_id);

-- =============================================================================
-- 4. SEED DATA (Deterministic, Synthetic Demo)
-- =============================================================================

-- Districts (12 synthetic districts across meteorological zones)
INSERT INTO districts (id, name, state, country, lat, lon, geometry_geojson, geometry_version, is_demo_geometry, created_at)
VALUES
('mh_mumbai_suburban', 'Mumbai Suburban', 'Maharashtra', 'India', 19.08, 72.88, '{"type":"Polygon","coordinates":[[[72.83,19.13],[72.94,19.13],[72.94,19.03],[72.83,19.03],[72.83,19.13]]]}', 'demo-v1', true, '2026-09-01T00:00:00Z'),
('mh_nashik', 'Nashik', 'Maharashtra', 'India', 20.00, 73.78, '{"type":"Polygon","coordinates":[[[73.70,20.07],[73.87,20.07],[73.87,19.93],[73.70,19.93],[73.70,20.07]]]}', 'demo-v1', true, '2026-09-01T00:00:00Z'),
('mh_pune', 'Pune', 'Maharashtra', 'India', 18.52, 73.85, '{"type":"Polygon","coordinates":[[[73.77,18.58],[73.93,18.58],[73.93,18.45],[73.77,18.45],[73.77,18.58]]]}', 'demo-v1', true, '2026-09-01T00:00:00Z'),
('mh_nagpur', 'Nagpur', 'Maharashtra', 'India', 21.14, 79.08, '{"type":"Polygon","coordinates":[[[79.00,21.22],[79.18,21.22],[79.18,21.07],[79.00,21.07],[79.00,21.22]]]}', 'demo-v1', true, '2026-09-01T00:00:00Z'),
('od_cuttack', 'Cuttack', 'Odisha', 'India', 20.46, 85.88, '{"type":"Polygon","coordinates":[[[85.80,20.53],[85.96,20.53],[85.96,20.39],[85.80,20.39],[85.80,20.53]]]}', 'demo-v1', true, '2026-09-01T00:00:00Z'),
('od_puri', 'Puri', 'Odisha', 'India', 19.81, 85.83, '{"type":"Polygon","coordinates":[[[85.75,19.88],[85.91,19.88],[85.91,19.74],[85.75,19.74],[85.75,19.88]]]}', 'demo-v1', true, '2026-09-01T00:00:00Z'),
('cg_raigarh', 'Raigarh', 'Chhattisgarh', 'India', 21.90, 83.40, '{"type":"Polygon","coordinates":[[[83.32,21.97],[83.48,21.97],[83.48,21.83],[83.32,21.83],[83.32,21.97]]]}', 'demo-v1', true, '2026-09-01T00:00:00Z'),
('mp_jabalpur', 'Jabalpur', 'Madhya Pradesh', 'India', 23.18, 79.98, '{"type":"Polygon","coordinates":[[[79.90,23.25],[80.06,23.25],[80.06,23.11],[79.90,23.11],[79.90,23.25]]]}', 'demo-v1', true, '2026-09-01T00:00:00Z'),
('gj_surat', 'Surat', 'Gujarat', 'India', 21.17, 72.83, '{"type":"Polygon","coordinates":[[[72.75,21.24],[72.91,21.24],[72.91,21.10],[72.75,21.10],[72.75,21.24]]]}', 'demo-v1', true, '2026-09-01T00:00:00Z'),
('kl_ernakulam', 'Ernakulam', 'Kerala', 'India', 9.98, 76.30, '{"type":"Polygon","coordinates":[[[76.22,10.05],[76.38,10.05],[76.38,9.91],[76.22,9.91],[76.22,10.05]]]}', 'demo-v1', true, '2026-09-01T00:00:00Z'),
('kl_wayanad', 'Wayanad', 'Kerala', 'India', 11.68, 76.13, '{"type":"Polygon","coordinates":[[[76.05,11.75],[76.21,11.75],[76.21,11.61],[76.05,11.61],[76.05,11.75]]]}', 'demo-v1', true, '2026-09-01T00:00:00Z'),
('uk_dehradun', 'Dehradun', 'Uttarakhand', 'India', 30.31, 78.03, '{"type":"Polygon","coordinates":[[[77.95,30.38],[78.11,30.38],[78.11,30.24],[77.95,30.24],[77.95,30.38]]]}', 'demo-v1', true, '2026-09-01T00:00:00Z')
ON CONFLICT (id) DO UPDATE SET
name = EXCLUDED.name, state = EXCLUDED.state, lat = EXCLUDED.lat, lon = EXCLUDED.lon, geometry_geojson = EXCLUDED.geometry_geojson;

-- Demo Cases (Exactly 5 cases, hero: case_lps_001)
INSERT INTO demo_cases (id, name, description, event_date, regime_hint, synthetic_features, seed, is_demo, created_at)
VALUES
('case_active_001', 'Monsoon Core Active', 'Widespread active-monsoon envelope with NWP under-amplitude bias.', '2026-08-05', 'active', '{"core_anomaly":1.35,"active_persistence_days":4,"break_persistence_days":0,"vorticity_850":1.1,"wind_speed_850":10.0,"elevation":420,"coast_distance_km":600}', 101, true, '2026-09-01T00:00:00Z'),
('case_break_001', 'Core Rainfall Break', 'Break-spell leakage over central India with northward shift towards foothills.', '2026-08-12', 'break', '{"core_anomaly":-1.30,"active_persistence_days":0,"break_persistence_days":4,"vorticity_850":0.7,"wind_speed_850":9.0,"elevation":260,"coast_distance_km":650}', 202, true, '2026-09-01T00:00:00Z'),
('case_lps_001', 'Central India LPS', 'Hero Demo: Monsoon depression with intense core convection and vortex displacement.', '2026-08-17', 'depression', '{"core_anomaly":1.40,"active_persistence_days":4,"break_persistence_days":0,"vorticity_850":3.8,"wind_speed_850":17.5,"elevation":465,"coast_distance_km":740}', 303, true, '2026-09-01T00:00:00Z'),
('case_orographic_001', 'Western Ghats Orographic', 'Strong moist southwesterly flow impinging Western Ghats with steep windward-lee contrast.', '2026-08-24', 'orographic', '{"core_anomaly":0.80,"active_persistence_days":2,"break_persistence_days":0,"vorticity_850":1.5,"wind_speed_850":18.0,"elevation":850,"coast_distance_km":60}', 404, true, '2026-09-01T00:00:00Z'),
('case_transition_001', 'Regime Transition', 'Ambiguous state during depression dissipation transitioning toward active spell with high epistemic uncertainty.', '2026-08-30', 'transition', '{"core_anomaly":0.20,"active_persistence_days":1,"break_persistence_days":1,"vorticity_850":1.9,"wind_speed_850":12.0,"elevation":510,"coast_distance_km":400}', 505, true, '2026-09-01T00:00:00Z')
ON CONFLICT (id) DO UPDATE SET
name = EXCLUDED.name, description = EXCLUDED.description, regime_hint = EXCLUDED.regime_hint, synthetic_features = EXCLUDED.synthetic_features;

-- Data Sources
INSERT INTO data_sources (id, name, source_type, version, expected_interval_minutes, stale_after_minutes, last_success_at, status, created_at)
VALUES
('src_nwp', 'Global/Regional NWP Ensemble', 'model_grid', 'demo-nwp-v1', 360, 480, '2026-09-28T18:00:00Z', 'fresh', '2026-09-01T00:00:00Z'),
('src_satellite', 'Geostationary IR/Precip Satellite', 'satellite_rad', 'demo-sat-v1', 180, 240, '2026-09-28T18:30:00Z', 'fresh', '2026-09-01T00:00:00Z'),
('src_observation', 'Automated Weather Stations / Rain Gauge', 'in_situ', 'demo-gauge-v1', 1440, 2880, '2026-09-28T06:00:00Z', 'fresh', '2026-09-01T00:00:00Z'),
('src_terrain', 'Digital Elevation Model (DEM) Static', 'static_dem', 'demo-dem-v1', 525600, 1051200, '2026-09-01T00:00:00Z', 'fresh', '2026-09-01T00:00:00Z')
ON CONFLICT (id) DO UPDATE SET
last_success_at = EXCLUDED.last_success_at, status = EXCLUDED.status;

-- Model Versions
INSERT INTO model_versions (id, name, version, model_type, status, metadata, created_at)
VALUES
('mv_regime_demo', 'VARUNA Hybrid Regime Classifier', '0.1.0-demo', 'rule_evidence_fusion', 'active', '{"weights":"rule_prior","adapters":["rule_engine","future_cnn","future_lps_tracker"]}', '2026-09-01T00:00:00Z'),
('mv_bank_demo', 'VARUNA Regime-Conditional Correction Bank', '0.1.0-demo', 'correction_bank_router', 'active', '{"banks":["active_emos","break_qm","lps_frequency_match","terrain_qm","coastal_analog","wd_recalibration"]}', '2026-09-01T00:00:00Z'),
('mv_calib_demo', 'VARUNA Parametric Uncertainty & Calibration Head', '0.1.0-demo', 'gamma_mixture_calibration', 'active', '{"quantiles":["q10","q50","q90"],"thresholds":[64.5,115.6,204.5]}', '2026-09-01T00:00:00Z')
ON CONFLICT (id) DO UPDATE SET
version = EXCLUDED.version, status = EXCLUDED.status, metadata = EXCLUDED.metadata;

-- Verification Runs
INSERT INTO verification_runs (id, case_id, split_name, data_quality, run_version, started_at, finished_at)
VALUES
('vr_lps_001', 'case_lps_001', 'held_out_validation', 'synthetic_demo', 'demo-verify-0.1.0', '2026-09-01T00:00:00Z', '2026-09-01T00:02:00Z'),
('vr_active_001', 'case_active_001', 'held_out_validation', 'synthetic_demo', 'demo-verify-0.1.0', '2026-09-01T00:00:00Z', '2026-09-01T00:02:00Z'),
('vr_break_001', 'case_break_001', 'held_out_validation', 'synthetic_demo', 'demo-verify-0.1.0', '2026-09-01T00:00:00Z', '2026-09-01T00:02:00Z'),
('vr_orographic_001', 'case_orographic_001', 'held_out_validation', 'synthetic_demo', 'demo-verify-0.1.0', '2026-09-01T00:00:00Z', '2026-09-01T00:02:00Z'),
('vr_transition_001', 'case_transition_001', 'held_out_validation', 'synthetic_demo', 'demo-verify-0.1.0', '2026-09-01T00:00:00Z', '2026-09-01T00:02:00Z')
ON CONFLICT (id) DO NOTHING;

-- Verification Metrics (Hero LPS case comparison across 5 baselines)
INSERT INTO verification_metrics (verification_run_id, method_name, threshold_mm, lead_day, neighbourhood_km, rmse, ets, csi, pod, far, fss, brier, brier_skill_score, event_count, created_at)
VALUES
('vr_lps_001', 'climatology', 64.5, 1, 25, 62.4, 0.05, 0.12, 0.22, 0.72, 0.25, 0.38, 0.00, 48, '2026-09-01T00:00:00Z'),
('vr_lps_001', 'raw_nwp', 64.5, 1, 25, 52.8, 0.19, 0.28, 0.44, 0.49, 0.42, 0.29, 0.24, 48, '2026-09-01T00:00:00Z'),
('vr_lps_001', 'qm', 64.5, 1, 25, 41.5, 0.29, 0.39, 0.58, 0.41, 0.56, 0.22, 0.42, 48, '2026-09-01T00:00:00Z'),
('vr_lps_001', 'emos', 64.5, 1, 25, 36.2, 0.35, 0.46, 0.67, 0.34, 0.64, 0.18, 0.53, 48, '2026-09-01T00:00:00Z'),
('vr_lps_001', 'regime_aware', 64.5, 1, 25, 27.9, 0.48, 0.61, 0.81, 0.23, 0.78, 0.12, 0.68, 48, '2026-09-01T00:00:00Z'),

('vr_lps_001', 'climatology', 115.6, 1, 25, 78.1, 0.02, 0.06, 0.10, 0.85, 0.15, 0.34, 0.00, 48, '2026-09-01T00:00:00Z'),
('vr_lps_001', 'raw_nwp', 115.6, 1, 25, 68.3, 0.14, 0.21, 0.32, 0.58, 0.31, 0.26, 0.23, 48, '2026-09-01T00:00:00Z'),
('vr_lps_001', 'qm', 115.6, 1, 25, 54.0, 0.24, 0.32, 0.48, 0.48, 0.47, 0.20, 0.41, 48, '2026-09-01T00:00:00Z'),
('vr_lps_001', 'emos', 115.6, 1, 25, 47.6, 0.30, 0.40, 0.57, 0.39, 0.55, 0.16, 0.53, 48, '2026-09-01T00:00:00Z'),
('vr_lps_001', 'regime_aware', 115.6, 1, 25, 34.2, 0.44, 0.54, 0.74, 0.27, 0.72, 0.10, 0.71, 48, '2026-09-01T00:00:00Z'),

('vr_lps_001', 'climatology', 204.5, 1, 25, 92.0, 0.00, 0.01, 0.02, 0.95, 0.05, 0.28, 0.00, 48, '2026-09-01T00:00:00Z'),
('vr_lps_001', 'raw_nwp', 204.5, 1, 25, 84.1, 0.08, 0.11, 0.18, 0.69, 0.20, 0.22, 0.21, 48, '2026-09-01T00:00:00Z'),
('vr_lps_001', 'qm', 204.5, 1, 25, 69.8, 0.17, 0.22, 0.34, 0.57, 0.36, 0.17, 0.39, 48, '2026-09-01T00:00:00Z'),
('vr_lps_001', 'emos', 204.5, 1, 25, 61.2, 0.22, 0.29, 0.42, 0.46, 0.44, 0.13, 0.54, 48, '2026-09-01T00:00:00Z'),
('vr_lps_001', 'regime_aware', 204.5, 1, 25, 42.6, 0.38, 0.47, 0.65, 0.31, 0.63, 0.08, 0.71, 48, '2026-09-01T00:00:00Z');
