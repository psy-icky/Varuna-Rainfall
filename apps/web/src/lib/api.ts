import {
  DemoCase,
  DistrictOverviewItem,
  ForecastPacket,
  VerificationResponse,
  TrustResponse,
  AuditPacketResponse,
  MapLayersResponse,
  DistrictsGeoJsonResponse
} from '../types';

const RENDER_BACKEND = 'https://varuna-rainfall.onrender.com';
const isBrowser = typeof window !== 'undefined';
const isLocalhost = isBrowser && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

// When deployed on Vercel or custom domain, direct to Render if no relative proxy
const BASE_URL = import.meta.env.VITE_API_BASE_URL || (isBrowser && !isLocalhost ? RENDER_BACKEND : '');
const PREFIX = '/api/v1';

export const FALLBACK_CASES: DemoCase[] = [
  {
    id: 'case_lps_001',
    name: 'Central India LPS',
    label: 'Central India LPS (Monsoon Depression)',
    date: '2026-08-17',
    regime_hint: 'depression',
    description: 'Hero Demo: Monsoon depression with intense core convection and vortex displacement over central/eastern India.',
    is_hero_case: true,
    is_demo: true
  },
  {
    id: 'case_active_001',
    name: 'Monsoon Core Active',
    label: 'Active Monsoon Spell (Core Anomaly +1.35σ)',
    date: '2026-07-22',
    regime_hint: 'active',
    description: 'Vigorous monsoon trough with widespread persistent precipitation across central and western India.',
    is_hero_case: false,
    is_demo: true
  },
  {
    id: 'case_break_001',
    name: 'Core Rainfall Break',
    label: 'Break Monsoon Spell (Core Anomaly -1.30σ)',
    date: '2026-08-04',
    regime_hint: 'break',
    description: 'Monsoon trough shifts north to Himalayan foothills; dry spell and negative rainfall anomaly over central India.',
    is_hero_case: false,
    is_demo: true
  },
  {
    id: 'case_orographic_001',
    name: 'Western Ghats Orographic',
    label: 'Western Ghats Heavy Orographic Enhancement',
    date: '2026-07-15',
    regime_hint: 'orographic',
    description: 'Strong low-level westerly jet perpendicular to Western Ghats barrier triggering intense upslope convection.',
    is_hero_case: false,
    is_demo: true
  },
  {
    id: 'case_transition_001',
    name: 'Depression to Active Transition',
    label: 'Regime Transition (Dissipating Vortex / Ambiguous)',
    date: '2026-08-20',
    regime_hint: 'depression',
    description: 'Dissipating depression weakening into broad monsoon trough with high epistemic classification ambiguity.',
    is_hero_case: false,
    is_demo: true
  }
];

export const FALLBACK_DISTRICTS: DistrictOverviewItem[] = [
  { id: 'mh_mumbai_suburban', name: 'Mumbai Suburban', state: 'Maharashtra', lat: 19.08, lon: 72.88, expected_rain_mm: 72.5, q50_mm: 69.2, p64_5: 0.65, p115_6: 0.31, p204_5: 0.09, dominant_regime: 'depression', calibration_status: 'GREEN', fallback_state: 'REGIME_AWARE', is_demo_geometry: true },
  { id: 'mh_nashik', name: 'Nashik', state: 'Maharashtra', lat: 20.00, lon: 73.78, expected_rain_mm: 88.8, q50_mm: 87.3, p64_5: 0.94, p115_6: 0.28, p204_5: 0.05, dominant_regime: 'depression', calibration_status: 'GREEN', fallback_state: 'REGIME_AWARE', is_demo_geometry: true },
  { id: 'mh_pune', name: 'Pune', state: 'Maharashtra', lat: 18.52, lon: 73.85, expected_rain_mm: 52.2, q50_mm: 49.8, p64_5: 0.42, p115_6: 0.14, p204_5: 0.03, dominant_regime: 'depression', calibration_status: 'GREEN', fallback_state: 'REGIME_AWARE', is_demo_geometry: true },
  { id: 'mh_nagpur', name: 'Nagpur', state: 'Maharashtra', lat: 21.14, lon: 79.08, expected_rain_mm: 114.4, q50_mm: 110.6, p64_5: 0.92, p115_6: 0.49, p204_5: 0.19, dominant_regime: 'depression', calibration_status: 'GREEN', fallback_state: 'REGIME_AWARE', is_demo_geometry: true },
  { id: 'od_cuttack', name: 'Cuttack', state: 'Odisha', lat: 20.46, lon: 85.88, expected_rain_mm: 128.0, q50_mm: 122.5, p64_5: 0.96, p115_6: 0.59, p204_5: 0.25, dominant_regime: 'depression', calibration_status: 'GREEN', fallback_state: 'REGIME_AWARE', is_demo_geometry: true },
  { id: 'od_puri', name: 'Puri', state: 'Odisha', lat: 19.81, lon: 85.83, expected_rain_mm: 134.8, q50_mm: 129.0, p64_5: 0.98, p115_6: 0.64, p204_5: 0.29, dominant_regime: 'depression', calibration_status: 'GREEN', fallback_state: 'REGIME_AWARE', is_demo_geometry: true },
  { id: 'cg_raigarh', name: 'Raigarh', state: 'Chhattisgarh', lat: 21.90, lon: 83.40, expected_rain_mm: 120.6, q50_mm: 115.8, p64_5: 0.94, p115_6: 0.54, p204_5: 0.22, dominant_regime: 'depression', calibration_status: 'GREEN', fallback_state: 'REGIME_AWARE', is_demo_geometry: true },
  { id: 'mp_jabalpur', name: 'Jabalpur', state: 'Madhya Pradesh', lat: 23.18, lon: 79.98, expected_rain_mm: 106.2, q50_mm: 102.5, p64_5: 0.90, p115_6: 0.46, p204_5: 0.16, dominant_regime: 'depression', calibration_status: 'GREEN', fallback_state: 'REGIME_AWARE', is_demo_geometry: true },
  { id: 'gj_surat', name: 'Surat', state: 'Gujarat', lat: 21.17, lon: 72.83, expected_rain_mm: 76.5, q50_mm: 72.8, p64_5: 0.70, p115_6: 0.34, p204_5: 0.11, dominant_regime: 'depression', calibration_status: 'GREEN', fallback_state: 'REGIME_AWARE', is_demo_geometry: true },
  { id: 'kl_ernakulam', name: 'Ernakulam', state: 'Kerala', lat: 9.98, lon: 76.30, expected_rain_mm: 54.0, q50_mm: 51.5, p64_5: 0.44, p115_6: 0.16, p204_5: 0.04, dominant_regime: 'active', calibration_status: 'GREEN', fallback_state: 'REGIME_AWARE', is_demo_geometry: true },
  { id: 'kl_wayanad', name: 'Wayanad', state: 'Kerala', lat: 11.68, lon: 76.13, expected_rain_mm: 82.4, q50_mm: 78.5, p64_5: 0.75, p115_6: 0.38, p204_5: 0.12, dominant_regime: 'orographic', calibration_status: 'GREEN', fallback_state: 'REGIME_AWARE', is_demo_geometry: true },
  { id: 'uk_dehradun', name: 'Dehradun', state: 'Uttarakhand', lat: 30.31, lon: 78.03, expected_rain_mm: 38.6, q50_mm: 36.2, p64_5: 0.25, p115_6: 0.08, p204_5: 0.02, dominant_regime: 'western_disturbance', calibration_status: 'GREEN', fallback_state: 'REGIME_AWARE', is_demo_geometry: true }
];

async function handleResponse<T>(res: Response, fallback?: T): Promise<T> {
  const contentType = res.headers.get('content-type') || '';
  if (!res.ok || !contentType.includes('application/json')) {
    if (fallback !== undefined) return fallback;
    let errorDetail = res.statusText;
    try {
      const errJson = await res.json();
      errorDetail = errJson.detail || errJson.message || JSON.stringify(errJson);
    } catch (_) {}
    throw new Error(`API Error [${res.status}]: ${errorDetail}`);
  }
  return res.json();
}

export async function getCases(): Promise<DemoCase[]> {
  try {
    const res = await fetch(`${BASE_URL}${PREFIX}/cases`);
    return await handleResponse<DemoCase[]>(res, FALLBACK_CASES);
  } catch (_) {
    return FALLBACK_CASES;
  }
}

export async function getDistricts(caseId: string = 'case_lps_001'): Promise<DistrictOverviewItem[]> {
  try {
    const res = await fetch(`${BASE_URL}${PREFIX}/districts?case_id=${encodeURIComponent(caseId)}`);
    return await handleResponse<DistrictOverviewItem[]>(res, FALLBACK_DISTRICTS);
  } catch (_) {
    return FALLBACK_DISTRICTS;
  }
}

export async function getDistrictForecast(districtId: string, caseId: string = 'case_lps_001'): Promise<ForecastPacket> {
  const res = await fetch(`${BASE_URL}${PREFIX}/districts/${encodeURIComponent(districtId)}/forecast?case_id=${encodeURIComponent(caseId)}`);
  return handleResponse<ForecastPacket>(res);
}

export async function getVerification(caseId: string = 'case_lps_001', thresholdMm: number = 64.5): Promise<VerificationResponse> {
  const res = await fetch(`${BASE_URL}${PREFIX}/verification/${encodeURIComponent(caseId)}?threshold_mm=${thresholdMm}`);
  return handleResponse<VerificationResponse>(res);
}

export async function getTrust(forecastId: string): Promise<TrustResponse> {
  const res = await fetch(`${BASE_URL}${PREFIX}/trust/${encodeURIComponent(forecastId)}`);
  return handleResponse<TrustResponse>(res);
}

export async function getAudit(forecastId: string): Promise<AuditPacketResponse> {
  const res = await fetch(`${BASE_URL}${PREFIX}/audit/${encodeURIComponent(forecastId)}`);
  return handleResponse<AuditPacketResponse>(res);
}

export async function injectFault(fault: string): Promise<{ status: string; active_fault: string }> {
  const res = await fetch(`${BASE_URL}${PREFIX}/demo/fault`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fault })
  });
  return handleResponse<{ status: string; active_fault: string }>(res);
}

export async function resetDemo(): Promise<{ status: string }> {
  const res = await fetch(`${BASE_URL}${PREFIX}/demo/reset`, {
    method: 'POST'
  });
  return handleResponse<{ status: string }>(res);
}

export async function getMapLayers(): Promise<MapLayersResponse> {
  try {
    const res = await fetch(`${BASE_URL}${PREFIX}/map/layers`);
    if (res.ok && (res.headers.get('content-type') || '').includes('application/json')) {
      return await res.json();
    }
  } catch (_) {}
  return {
    base_layers: [
      {
        id: 'dark_canvas',
        name: 'Dark Canvas (ESRI)',
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
        attribution: 'Tiles &copy; Esri',
        max_zoom: 16,
        default: true
      },
      {
        id: 'openstreetmap',
        name: 'OpenStreetMap',
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '&copy; OpenStreetMap contributors',
        max_zoom: 19,
        default: false
      },
      {
        id: 'satellite',
        name: 'ESRI World Imagery (Satellite)',
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attribution: 'Tiles &copy; Esri',
        max_zoom: 18,
        default: false
      },
      {
        id: 'topo',
        name: 'ESRI World Topography',
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
        attribution: 'Tiles &copy; Esri',
        max_zoom: 18,
        default: false
      }
    ],
    overlay_layers: [
      {
        id: 'rainviewer_radar',
        name: 'Live Weather Radar (RainViewer)',
        type: 'radar_tile',
        opacity: 0.65
      }
    ],
    center: [21.5, 78.9629],
    zoom: 5,
    bounds: [[6.5, 68.0], [36.0, 97.5]]
  };
}

export async function getMapGeoJson(caseId: string = 'case_lps_001'): Promise<DistrictsGeoJsonResponse> {
  try {
    const res = await fetch(`${BASE_URL}${PREFIX}/map/geojson?case_id=${encodeURIComponent(caseId)}`);
    if (res.ok && (res.headers.get('content-type') || '').includes('application/json')) {
      return await res.json();
    }
  } catch (_) {}
  const delta = 0.35;
  const features = FALLBACK_DISTRICTS.map((d) => ({
    type: 'Feature' as const,
    id: d.id,
    geometry: {
      type: 'Polygon' as const,
      coordinates: [
        [
          [d.lon - delta * 0.9, d.lat - delta * 0.7],
          [d.lon + delta * 0.8, d.lat - delta * 0.6],
          [d.lon + delta * 1.1, d.lat + delta * 0.4],
          [d.lon + delta * 0.2, d.lat + delta * 0.9],
          [d.lon - delta * 1.0, d.lat + delta * 0.5],
          [d.lon - delta * 0.9, d.lat - delta * 0.7]
        ]
      ]
    },
    properties: {
      id: d.id,
      name: d.name,
      state: d.state,
      lat: d.lat,
      lon: d.lon,
      expected_rain_mm: d.expected_rain_mm,
      q50_mm: d.q50_mm,
      p64_5: d.p64_5,
      p115_6: d.p115_6,
      p204_5: d.p204_5,
      dominant_regime: d.dominant_regime,
      risk_level: d.p64_5 > 0.6 ? 'extreme' : d.p64_5 > 0.35 ? 'moderate' : 'low',
      fill_color: d.p64_5 > 0.6 ? '#EF4444' : d.p64_5 > 0.35 ? '#F59E0B' : '#06B6D4',
      case_id: caseId
    }
  }));
  return {
    type: 'FeatureCollection',
    case_id: caseId,
    features: features
  };
}
