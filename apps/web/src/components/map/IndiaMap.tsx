import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Layers, Eye, Radio, Maximize2, CloudRain, MapPin } from 'lucide-react';
import { DistrictOverviewItem, MapLayersResponse } from '../../types';
import { getMapLayers, getMapGeoJson, FALLBACK_DISTRICTS } from '../../lib/api';

interface IndiaMapProps {
  districts: DistrictOverviewItem[];
  selectedDistrictId: string;
  onSelectDistrict: (districtId: string) => void;
  thresholdFilter: 'expected' | 'p64' | 'p115' | 'p204';
  selectedCaseId?: string;
}

export const IndiaMap: React.FC<IndiaMapProps> = ({
  districts = [],
  selectedDistrictId,
  onSelectDistrict,
  thresholdFilter,
  selectedCaseId = 'case_lps_001'
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const baseLayersRef = useRef<Record<string, L.TileLayer>>({});
  const radarLayerRef = useRef<L.TileLayer | null>(null);
  const polygonsLayerRef = useRef<L.LayerGroup | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const radarRingsLayerRef = useRef<L.LayerGroup | null>(null);
  const polygonLayerRef = useRef<L.GeoJSON | null>(null);

  const [activeBaseLayer, setActiveBaseLayer] = useState<string>('dark_canvas');
  const [showRadar, setShowRadar] = useState<boolean>(true);
  const [showBoundaries, setShowBoundaries] = useState<boolean>(true);
  const [radarTimeLabel, setRadarTimeLabel] = useState<string>('Live Doppler');

  // Fallback to static list if districts is empty during loading
  const activeDistricts = (districts && districts.length > 0) ? districts : FALLBACK_DISTRICTS;

  const getDistrictColor = (d: DistrictOverviewItem) => {
    if (thresholdFilter === 'p204') {
      if (d.p204_5 > 0.20) return '#EF4444'; // Red
      if (d.p204_5 > 0.08) return '#F59E0B'; // Amber
      return '#3B82F6';                      // Blue
    } else if (thresholdFilter === 'p115') {
      if (d.p115_6 > 0.35) return '#EF4444';
      if (d.p115_6 > 0.15) return '#F59E0B';
      return '#3B82F6';
    } else if (thresholdFilter === 'p64') {
      if (d.p64_5 > 0.60) return '#EF4444';
      if (d.p64_5 > 0.35) return '#F59E0B';
      return '#10B981';                      // Green
    } else {
      // Expected rain
      if (d.expected_rain_mm > 100) return '#EF4444';
      if (d.expected_rain_mm > 60) return '#F59E0B';
      if (d.expected_rain_mm > 30) return '#06B6D4';
      return '#3B82F6';
    }
  };

  // 1. Initialize Leaflet Map
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }
    (container as any)._leaflet_id = null;

    // Center over Central/Western India (21.5, 78.5)
    const map = L.map(container, {
      center: [21.5, 78.5],
      zoom: 5,
      zoomControl: false,
      attributionControl: false
    });

    // Zoom control in bottom-left
    L.control.zoom({ position: 'bottomleft' }).addTo(map);

    // Free base tile layers (no API key, no watermark)
    const darkTile = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 16,
      attribution: 'Tiles &copy; Esri'
    });

    const osmTile = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    });

    const satelliteTile = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 18,
      attribution: 'Tiles &copy; Esri'
    });

    const topoTile = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 18,
      attribution: 'Tiles &copy; Esri'
    });

    baseLayersRef.current = {
      dark_canvas: darkTile,
      openstreetmap: osmTile,
      satellite: satelliteTile,
      topo: topoTile
    };

    // Default to Dark Canvas
    darkTile.addTo(map);

    // Layer groups for district polygons, radar footprints, and centroid dots
    polygonsLayerRef.current = L.layerGroup().addTo(map);
    radarRingsLayerRef.current = L.layerGroup().addTo(map);
    markersLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    // 2. Dynamically load live RainViewer Doppler radar tile layer with latest timestamp
    fetch('https://api.rainviewer.com/public/weather-maps.json')
      .then((res) => res.json())
      .then((apiData) => {
        if (!mapInstanceRef.current) return;
        const pastFrames = apiData.radar?.past || [];
        if (pastFrames.length > 0) {
          const latestFrame = pastFrames[pastFrames.length - 1];
          const host = apiData.host || 'https://tilecache.rainviewer.com';
          const tileUrl = `${host}${latestFrame.path}/256/{z}/{x}/{y}/2/1_1.png`;

          const radarTileLayer = L.tileLayer(tileUrl, {
            opacity: 0.65,
            zIndex: 200
          });
          radarLayerRef.current = radarTileLayer;
          radarTileLayer.addTo(mapInstanceRef.current);

          const date = new Date(latestFrame.time * 1000);
          setRadarTimeLabel(`Radar: ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
        }
      })
      .catch((err) => {
        console.warn('Live RainViewer fetch failed, using fallback:', err);
      });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      if (container) {
        (container as any)._leaflet_id = null;
      }
    };
  }, []);

  // 3. Switch Base Tile Layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    Object.entries(baseLayersRef.current).forEach(([key, layer]) => {
      if (key === activeBaseLayer) {
        if (!map.hasLayer(layer)) layer.addTo(map);
      } else {
        if (map.hasLayer(layer)) map.removeLayer(layer);
      }
    });
  }, [activeBaseLayer]);

  // 4. Toggle Weather Radar Overlay Layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    const radar = radarLayerRef.current;
    const rings = radarRingsLayerRef.current;
    if (!map) return;

    if (radar) {
      if (showRadar) {
        if (!map.hasLayer(radar)) radar.addTo(map);
      } else {
        if (map.hasLayer(radar)) map.removeLayer(radar);
      }
    }

    if (rings) {
      if (showRadar) {
        if (!map.hasLayer(rings)) rings.addTo(map);
      } else {
        if (map.hasLayer(rings)) map.removeLayer(rings);
      }
    }
  }, [showRadar]);

  // 5. Fetch & Render GeoJSON Boundary Choropleth
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (polygonLayerRef.current && map.hasLayer(polygonLayerRef.current)) {
      map.removeLayer(polygonLayerRef.current);
      polygonLayerRef.current = null;
    }

    if (!showBoundaries) return;

    getMapGeoJson(selectedCaseId).then((geoData) => {
      if (!mapInstanceRef.current) return;

      const geoJsonLayer = L.geoJSON(geoData as any, {
        style: (feature: any) => {
          const isSelected = feature.properties.id === selectedDistrictId;
          const fillColor = feature.properties.fill_color || '#06B6D4';
          return {
            fillColor: fillColor,
            weight: isSelected ? 2.5 : 1,
            opacity: 0.9,
            color: isSelected ? '#FFFFFF' : '#475569',
            dashArray: isSelected ? '' : '3',
            fillOpacity: isSelected ? 0.45 : 0.20
          };
        },
        onEachFeature: (feature, layer) => {
          layer.on({
            click: () => {
              onSelectDistrict(feature.properties.id);
            },
            mouseover: (e) => {
              const target = e.target;
              target.setStyle({
                weight: 3,
                color: '#38BDF8',
                fillOpacity: 0.50
              });
            },
            mouseout: (e) => {
              geoJsonLayer.resetStyle(e.target);
            }
          });
        }
      });

      polygonLayerRef.current = geoJsonLayer;
      geoJsonLayer.addTo(map);
    }).catch((err) => {
      console.warn('GeoJSON boundary loading error:', err);
    });
  }, [selectedCaseId, selectedDistrictId, showBoundaries, thresholdFilter]);

  // 6. Draw District Polygons, Radar Echo Footprints, and Centroid Dots
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current || !radarRingsLayerRef.current || !polygonsLayerRef.current) return;

    polygonsLayerRef.current.clearLayers();
    markersLayerRef.current.clearLayers();
    radarRingsLayerRef.current.clearLayers();

    activeDistricts.forEach((d) => {
      const isSelected = d.id === selectedDistrictId;
      const color = getDistrictColor(d);

      // A. Render GeoJSON Polygon if available
      if (d.geometry_geojson && d.geometry_geojson.coordinates) {
        const ring = d.geometry_geojson.coordinates[0];
        const latLngs: L.LatLngExpression[] = ring.map(([lon, lat]: [number, number]) => [lat, lon]);

        const polygon = L.polygon(latLngs, {
          color: isSelected ? '#06B6D4' : color,
          weight: isSelected ? 3 : 1.5,
          opacity: isSelected ? 1 : 0.7,
          fillColor: color,
          fillOpacity: isSelected ? 0.40 : 0.20
        });

        polygon.on('click', () => {
          onSelectDistrict(d.id);
        });

        polygon.on('mouseover', () => {
          polygon.setStyle({
            weight: 3,
            fillOpacity: 0.50
          });
        });

        polygon.on('mouseout', () => {
          if (!isSelected) {
            polygon.setStyle({
              weight: 1.5,
              fillOpacity: 0.20
            });
          }
        });

        polygonsLayerRef.current?.addLayer(polygon);
      }

      // B. Radar Reflectivity Halo Ring (Simulated Doppler radar rain echo footprint)
      const radarRadiusMeters = Math.max(30000, Math.min(100000, d.expected_rain_mm * 750));
      const radarRing = L.circle([d.lat, d.lon], {
        radius: radarRadiusMeters,
        color: color,
        fillColor: color,
        fillOpacity: isSelected ? 0.28 : 0.16,
        weight: isSelected ? 2 : 1,
        dashArray: isSelected ? '' : '4, 4'
      });
      radarRingsLayerRef.current?.addLayer(radarRing);

      // C. High-Contrast District Centroid Dot Marker
      const circle = L.circleMarker([d.lat, d.lon], {
        radius: isSelected ? 12 : 9,
        fillColor: color,
        color: '#FFFFFF',
        weight: isSelected ? 3 : 2,
        opacity: 1,
        fillOpacity: 1
      });

      const popupHtml = `
        <div style="font-family: inherit; font-size: 12px; min-width: 175px; color: #0F172A;">
          <div style="font-weight: 700; color: #0284C7; font-size: 14px; margin-bottom: 2px;">
            ${d.name}
          </div>
          <div style="color: #64748B; font-size: 11px; margin-bottom: 6px;">
            ${d.state}, India
          </div>
          <div style="border-top: 1px solid #E2E8F0; padding-top: 6px; display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
            <div><span style="color:#64748B;">Expected:</span> <b>${d.expected_rain_mm} mm</b></div>
            <div><span style="color:#64748B;">q50:</span> <b>${d.q50_mm} mm</b></div>
            <div><span style="color:#64748B;">P(≥64.5):</span> <b style="color:#D97706;">${Math.round(d.p64_5 * 100)}%</b></div>
            <div><span style="color:#64748B;">P(≥115.6):</span> <b style="color:#DC2626;">${Math.round(d.p115_6 * 100)}%</b></div>
          </div>
          <div style="margin-top: 6px; padding: 2px 6px; background: #F1F5F9; border-radius: 4px; font-size: 10px; color: #334155;">
            Synoptic Regime: <b>${d.dominant_regime.toUpperCase()}</b>
          </div>
        </div>
      `;

      circle.bindTooltip(`${d.name} • ${d.expected_rain_mm} mm`, {
        direction: 'top',
        permanent: false,
        className: 'bg-gray-900 text-gray-100 font-mono text-xs px-2.5 py-1 rounded-lg border border-gray-700 shadow-xl'
      });

      circle.bindPopup(popupHtml);

      circle.on('click', () => {
        onSelectDistrict(d.id);
      });

      markersLayerRef.current?.addLayer(circle);
    });
  }, [activeDistricts, selectedDistrictId, thresholdFilter]);

  const fitIndiaBounds = () => {
    if (!mapInstanceRef.current || activeDistricts.length === 0) return;
    const bounds = L.latLngBounds(activeDistricts.map((d) => [d.lat, d.lon]));
    mapInstanceRef.current.fitBounds(bounds.pad(0.18), {
      animate: true,
      duration: 0.8
    });
  };

  const zoomToSelected = () => {
    if (!mapInstanceRef.current) return;
    const current = activeDistricts.find((d) => d.id === selectedDistrictId);
    if (current) {
      mapInstanceRef.current.flyTo([current.lat, current.lon], 7, {
        animate: true,
        duration: 0.8
      });
    }
  };

  return (
    <div className="relative w-full h-[460px] rounded-2xl overflow-hidden border border-gray-800 bg-[#0D131F] shadow-2xl">
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Top-Left Banner with Live Indicator & Camera controls */}
      <div className="absolute top-3 left-3 z-[400] flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-950/90 backdrop-blur border border-gray-800 text-xs text-gray-300 shadow-lg">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-semibold text-cyan-300">{radarTimeLabel}</span>
          <span className="text-gray-500">· {activeDistricts.length} Districts</span>
        </div>

        <button
          onClick={fitIndiaBounds}
          title="Fit All Indian Districts"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-950/90 hover:bg-gray-800 backdrop-blur border border-gray-800 text-xs text-gray-200 transition-colors shadow-lg"
        >
          <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
          <span>Fit India</span>
        </button>

        <button
          onClick={zoomToSelected}
          title="Focus on Selected District"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-950/90 hover:bg-gray-800 backdrop-blur border border-gray-800 text-xs text-gray-200 transition-colors shadow-lg"
        >
          <MapPin className="w-3.5 h-3.5 text-cyan-400" />
          <span>Focus</span>
        </button>
      </div>

      {/* Top-Right Control Toolbar */}
      <div className="absolute top-3 right-3 z-[400] flex items-center gap-2 flex-wrap">
        {/* Base Layer Switcher */}
        <div className="flex items-center gap-1 bg-gray-950/90 backdrop-blur p-1 rounded-xl border border-gray-800 text-xs shadow-lg">
          <Layers className="w-3.5 h-3.5 text-gray-400 ml-1.5" />
          <button
            onClick={() => setActiveBaseLayer('dark_canvas')}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              activeBaseLayer === 'dark_canvas' ? 'bg-cyan-600 text-white font-medium' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Dark
          </button>
          <button
            onClick={() => setActiveBaseLayer('openstreetmap')}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              activeBaseLayer === 'openstreetmap' ? 'bg-cyan-600 text-white font-medium' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            OSM
          </button>
          <button
            onClick={() => setActiveBaseLayer('satellite')}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              activeBaseLayer === 'satellite' ? 'bg-cyan-600 text-white font-medium' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Satellite
          </button>
          <button
            onClick={() => setActiveBaseLayer('topo')}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              activeBaseLayer === 'topo' ? 'bg-cyan-600 text-white font-medium' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Topo
          </button>
        </div>

        {/* Live Weather Radar Overlay Toggle */}
        <button
          onClick={() => setShowRadar(!showRadar)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold backdrop-blur border transition-all shadow-lg ${
            showRadar
              ? 'bg-emerald-950/90 text-emerald-400 border-emerald-800/80 shadow-emerald-950'
              : 'bg-gray-950/80 text-gray-400 border-gray-800 hover:text-gray-200'
          }`}
          title="Toggle live Doppler precipitation radar overlay and echo rings"
        >
          <Radio className={`w-3.5 h-3.5 ${showRadar ? 'animate-pulse text-emerald-400' : 'text-gray-500'}`} />
          <span>Live Radar</span>
        </button>

        {/* GeoJSON Boundary Choropleth Toggle */}
        <button
          onClick={() => setShowBoundaries(!showBoundaries)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold backdrop-blur border transition-all shadow-lg ${
            showBoundaries
              ? 'bg-cyan-950/90 text-cyan-300 border-cyan-800/80 shadow-cyan-950'
              : 'bg-gray-950/80 text-gray-400 border-gray-800 hover:text-gray-200'
          }`}
          title="Toggle GeoJSON district boundaries"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Boundaries</span>
        </button>

        {/* Reset View Button */}
        <button
          onClick={fitIndiaBounds}
          className="p-1.5 rounded-xl bg-gray-950/90 backdrop-blur border border-gray-800 text-gray-300 hover:text-cyan-400 transition-colors shadow-lg"
          title="Center map on India"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom-Right Legend */}
      <div className="absolute bottom-3 right-3 z-[400] px-3.5 py-2.5 rounded-2xl bg-gray-950/90 backdrop-blur border border-gray-800 text-[11px] text-gray-300 space-y-2 shadow-xl">
        <div className="flex items-center justify-between gap-4">
          <span className="font-bold text-gray-300 text-[10px] uppercase tracking-wider">
            {thresholdFilter === 'expected' ? 'Expected Rain (mm)' : `Probability ${thresholdFilter.toUpperCase()}`}
          </span>
          {showRadar && (
            <span className="text-[9px] text-emerald-400 font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              Doppler Echo Active
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-500 inline-block shadow-sm" />
            <span>Low (&lt;30mm)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500 inline-block shadow-sm" />
            <span>Moderate (30-60mm)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500 inline-block shadow-sm" />
            <span>Elevated (&gt;60mm)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
