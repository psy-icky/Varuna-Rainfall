import type { Plugin, ViteDevServer } from 'vite';
import * as https from 'https';

interface DistrictGeo {
  id: string;
  name: string;
  state: string;
  lat: number;
  lon: number;
  elevation: number;
  coast_distance_km: number;
  base_rain_factor: number;
}

const DISTRICTS_DATA: Record<string, DistrictGeo> = {
  mh_mumbai_suburban: { id: 'mh_mumbai_suburban', name: 'Mumbai Suburban', state: 'Maharashtra', lat: 19.08, lon: 72.88, elevation: 14.0, coast_distance_km: 5.0, base_rain_factor: 1.15 },
  mh_nashik: { id: 'mh_nashik', name: 'Nashik', state: 'Maharashtra', lat: 20.00, lon: 73.78, elevation: 560.0, coast_distance_km: 140.0, base_rain_factor: 1.00 },
  mh_pune: { id: 'mh_pune', name: 'Pune', state: 'Maharashtra', lat: 18.52, lon: 73.85, elevation: 560.0, coast_distance_km: 110.0, base_rain_factor: 0.85 },
  mh_nagpur: { id: 'mh_nagpur', name: 'Nagpur', state: 'Maharashtra', lat: 21.14, lon: 79.08, elevation: 310.0, coast_distance_km: 680.0, base_rain_factor: 1.20 },
  od_cuttack: { id: 'od_cuttack', name: 'Cuttack', state: 'Odisha', lat: 20.46, lon: 85.88, elevation: 36.0, coast_distance_km: 60.0, base_rain_factor: 1.35 },
  od_puri: { id: 'od_puri', name: 'Puri', state: 'Odisha', lat: 19.81, lon: 85.83, elevation: 5.0, coast_distance_km: 2.0, base_rain_factor: 1.40 },
  cg_raigarh: { id: 'cg_raigarh', name: 'Raigarh', state: 'Chhattisgarh', lat: 21.90, lon: 83.40, elevation: 215.0, coast_distance_km: 420.0, base_rain_factor: 1.30 },
  mp_jabalpur: { id: 'mp_jabalpur', name: 'Jabalpur', state: 'Madhya Pradesh', lat: 23.18, lon: 79.98, elevation: 411.0, coast_distance_km: 720.0, base_rain_factor: 1.25 },
  gj_surat: { id: 'gj_surat', name: 'Surat', state: 'Gujarat', lat: 21.17, lon: 72.83, elevation: 13.0, coast_distance_km: 15.0, base_rain_factor: 0.95 },
  kl_ernakulam: { id: 'kl_ernakulam', name: 'Ernakulam', state: 'Kerala', lat: 9.98, lon: 76.30, elevation: 4.0, coast_distance_km: 6.0, base_rain_factor: 1.25 },
  kl_wayanad: { id: 'kl_wayanad', name: 'Wayanad', state: 'Kerala', lat: 11.68, lon: 76.13, elevation: 820.0, coast_distance_km: 55.0, base_rain_factor: 1.65 },
  uk_dehradun: { id: 'uk_dehradun', name: 'Dehradun', state: 'Uttarakhand', lat: 30.31, lon: 78.03, elevation: 640.0, coast_distance_km: 1100.0, base_rain_factor: 1.10 }
};

// Node.js Leaf Map API Plugin for Vite
export function leafMapNodeApiPlugin(): Plugin {
  return {
    name: 'vite-plugin-leaf-map-api',
    configureServer(server: ViteDevServer) {
      server.middlewares.use((req: any, res: any, next: () => void) => {
        const host = req.headers?.host || 'localhost:5173';
        const url = new URL(req.url || '/', `http://${host}`);

        // 1. GET /api/leaf/map/layers (Node.js Leaflet Layer Catalog)
        if (url.pathname === '/api/leaf/map/layers') {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('X-Powered-By', 'NodeJS-Leaf-Map-Engine');
          res.end(
            JSON.stringify({
              engine: 'Node.js Leaflet API Service',
              version: '1.2.0',
              status: 'nominal',
              base_layers: [
                {
                  id: 'dark_canvas',
                  name: 'Dark Canvas (ESRI)',
                  url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
                  attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
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
                  url_template: 'https://tilecache.rainviewer.com/v2/radar/nowcast_latest/256/{z}/{x}/{y}/2/1_1.png',
                  opacity: 0.65,
                  attribution: 'Radar data &copy; RainViewer API'
                },
                {
                  id: 'varuna_grid',
                  name: 'VARUNA Calibrated Heavy Rain Choropleth',
                  type: 'geojson_choropleth',
                  opacity: 0.8
                }
              ],
              center: [21.5, 78.9629],
              zoom: 5,
              bounds: [
                [6.5, 68.0],
                [36.0, 97.5]
              ]
            })
          );
          return;
        }

        // 2. GET /api/leaf/map/geojson (Node.js GeoJSON Choropleth Generator)
        if (url.pathname === '/api/leaf/map/geojson') {
          const caseId = url.searchParams.get('case_id') || 'case_lps_001';
          const delta = 0.35;

          const features = Object.values(DISTRICTS_DATA).map((d) => {
            let rainMultiplier = 1.0;
            let dominantRegime = 'active';

            if (caseId === 'case_lps_001') {
              dominantRegime = 'depression';
              rainMultiplier = d.lat > 18 && d.lat < 24 ? 1.45 : 0.9;
            } else if (caseId === 'case_break_001') {
              dominantRegime = 'break';
              rainMultiplier = d.lat > 26 ? 1.3 : 0.35;
            } else if (caseId === 'case_orographic_001') {
              dominantRegime = 'orographic';
              rainMultiplier = d.elevation > 400 ? 1.6 : 0.8;
            } else {
              dominantRegime = 'active';
              rainMultiplier = 1.15;
            }

            const baseExpected = Math.round(55 * d.base_rain_factor * rainMultiplier * 10) / 10;
            const q50 = Math.round((baseExpected * 0.96) * 10) / 10;
            const p64 = Math.min(0.95, Math.round((baseExpected / 105) * 100) / 100);
            const p115 = Math.min(0.85, Math.round((baseExpected / 165) * 100) / 100);
            const p204 = Math.min(0.60, Math.round((baseExpected / 280) * 100) / 100);

            let riskLevel = 'low';
            let fillColor = '#06B6D4';

            if (p204 > 0.20 || p115 > 0.40 || baseExpected > 90) {
              riskLevel = 'extreme';
              fillColor = '#EF4444';
            } else if (p115 > 0.20 || p64 > 0.50 || baseExpected > 55) {
              riskLevel = 'high';
              fillColor = '#F97316';
            } else if (p64 > 0.30 || baseExpected > 30) {
              riskLevel = 'moderate';
              fillColor = '#EAB308';
            }

            const polygonCoords = [
              [
                [d.lon - delta * 0.9, d.lat - delta * 0.7],
                [d.lon + delta * 0.8, d.lat - delta * 0.6],
                [d.lon + delta * 1.1, d.lat + delta * 0.4],
                [d.lon + delta * 0.2, d.lat + delta * 0.9],
                [d.lon - delta * 1.0, d.lat + delta * 0.5],
                [d.lon - delta * 0.9, d.lat - delta * 0.7]
              ]
            ];

            return {
              type: 'Feature',
              id: d.id,
              geometry: {
                type: 'Polygon',
                coordinates: polygonCoords
              },
              properties: {
                id: d.id,
                name: d.name,
                state: d.state,
                lat: d.lat,
                lon: d.lon,
                elevation: d.elevation,
                expected_rain_mm: baseExpected,
                q50_mm: q50,
                p64_5: p64,
                p115_6: p115,
                p204_5: p204,
                dominant_regime: dominantRegime,
                risk_level: riskLevel,
                fill_color: fillColor,
                case_id: caseId
              }
            };
          });

          res.setHeader('Content-Type', 'application/json');
          res.setHeader('X-Powered-By', 'NodeJS-Leaf-GeoJSON');
          res.end(
            JSON.stringify({
              type: 'FeatureCollection',
              engine: 'Node.js Leaf API',
              case_id: caseId,
              features: features
            })
          );
          return;
        }

        // 3. GET /api/leaf/map/radar (Live Radar Time Series from RainViewer API in Node.js)
        if (url.pathname === '/api/leaf/map/radar') {
          https
            .get('https://api.rainviewer.com/public/weather-maps.json', (radarRes: any) => {
              let rawData = '';
              radarRes.on('data', (chunk: any) => {
                rawData += chunk;
              });
              radarRes.on('end', () => {
                try {
                  const radarData = JSON.parse(rawData);
                  res.setHeader('Content-Type', 'application/json');
                  res.setHeader('X-Powered-By', 'NodeJS-RainViewer-Bridge');
                  res.end(
                    JSON.stringify({
                      status: 'ok',
                      host: radarData.host || 'https://tilecache.rainviewer.com',
                      radar: radarData.radar?.past || [],
                      nowcast: radarData.radar?.nowcast || [],
                      generated_by: 'NodeJS Leaf Map Proxy'
                    })
                  );
                } catch {
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ status: 'fallback', tile_url: 'https://tilecache.rainviewer.com/v2/radar/nowcast_latest/256/{z}/{x}/{y}/2/1_1.png' }));
                }
              });
            })
            .on('error', () => {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ status: 'fallback', tile_url: 'https://tilecache.rainviewer.com/v2/radar/nowcast_latest/256/{z}/{x}/{y}/2/1_1.png' }));
            });
          return;
        }

        next();
      });
    }
  };
}
