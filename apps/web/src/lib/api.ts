import {
  DemoCase,
  DistrictOverviewItem,
  ForecastPacket,
  VerificationResponse,
  TrustResponse,
  AuditPacketResponse
} from '../types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const PREFIX = '/api/v1';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
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
  const res = await fetch(`${BASE_URL}${PREFIX}/cases`);
  return handleResponse<DemoCase[]>(res);
}

export async function getDistricts(caseId: string = 'case_lps_001'): Promise<DistrictOverviewItem[]> {
  const res = await fetch(`${BASE_URL}${PREFIX}/districts?case_id=${encodeURIComponent(caseId)}`);
  return handleResponse<DistrictOverviewItem[]>(res);
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

export async function getMapLayers(): Promise<import('../types').MapLayersResponse> {
  try {
    const res = await fetch('/api/leaf/map/layers');
    if (res.ok) return res.json();
  } catch (_) {}
  const fallbackRes = await fetch(`${BASE_URL}${PREFIX}/map/layers`);
  return handleResponse<import('../types').MapLayersResponse>(fallbackRes);
}

export async function getMapGeoJson(caseId: string = 'case_lps_001'): Promise<import('../types').DistrictsGeoJsonResponse> {
  try {
    const res = await fetch(`/api/leaf/map/geojson?case_id=${encodeURIComponent(caseId)}`);
    if (res.ok) return res.json();
  } catch (_) {}
  const fallbackRes = await fetch(`${BASE_URL}${PREFIX}/map/geojson?case_id=${encodeURIComponent(caseId)}`);
  return handleResponse<import('../types').DistrictsGeoJsonResponse>(fallbackRes);
}

export async function getLeafRadarTimeline(): Promise<any> {
  const res = await fetch('/api/leaf/map/radar');
  return handleResponse<any>(res);
}
