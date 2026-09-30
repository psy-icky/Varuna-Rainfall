import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Layers, Eye, Radio, Maximize2 } from 'lucide-react';
import { DistrictOverviewItem, MapLayersResponse } from '../../types';
import { getMapLayers, getMapGeoJson } from '../../lib/api';

interface IndiaMapProps {
  districts: DistrictOverviewItem[];
  selectedDistrictId: string;
  onSelectDistrict: (districtId: string) => void;
  thresholdFilter: 'expected' | 'p64' | 'p115' | 'p204';
  selectedCaseId?: string;
}

export const IndiaMap: React.FC<IndiaMapProps> = ({
  districts,
  selectedDistrictId,
  onSelectDistrict,
  thresholdFilter,
  selectedCaseId = 'case_lps_001'
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const baseLayersRef = useRef<Record<string, L.TileLayer>>({});
  const radarLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const polygonLayerRef = useRef<L.GeoJSON | null>(null);

  const [activeBaseLayer, setActiveBaseLayer] = useState<string>('dark_canvas');
  const [showRadar, setShowRadar] = useState<boolean>(true);
  const [showBoundaries, setShowBoundaries] = useState<boolean>(true);
  const [mapMeta, setMapMeta] = useState<MapLayersResponse | null>(null);

  const getDistrictColor = (d: DistrictOverviewItem) => {
    if (thresholdFilter === 'p204') {
      if (d.p204_5 > 0.30) return '#EF4444'; // Red
      if (d.p204_5 > 0.10) return '#F59E0B'; // Amber
      return '#3B82F6';                      // Blue
    } else if (thresholdFilter === 'p115') {
      if (d.p115_6 > 0.40) return '#EF4444';
      if (d.p115_6 > 0.20) return '#F59E0B';
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

  // 1. Fetch map layers metadata from API
  useEffect(() => {
    getMapLayers().then((data) => {
      setMapMeta(data);
    }).catch((err) => {
      console.warn('Using fallback map layers:', err);
    });
  }, []);

  // 2. Initialize Leaflet Map
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }
    (container as any)._leaflet_id = null;

    // Center roughly over Central/Western India (21.5, 78.5)
    const map = L.map(container, {
      center: [21.5, 78.5],
      zoom: 5,
      zoomControl: false,
      attributionControl: false
    });

    // Add zoom control in bottom-left
    L.control.zoom({ position: 'bottomleft' }).addTo(map);

    // Initialize Tile Layers (100% Free & No API Key Required)
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

    // Live RainViewer Weather Radar overlay tile layer
    const radar = L.tileLayer('https://tilecache.rainviewer.com/v2/radar/nowcast_latest/256/{z}/{x}/{y}/2/1_1.png', {
      opacity: 0.60,
      zIndex: 100
    });
    radarLayerRef.current = radar;
    radar.addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

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

  // 3. Switch base tile layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    Object.entries(baseLayersRef.current).forEach(([key, layer]) => {
      if (key === activeBaseLayer) {
        if (!map.hasLayer(layer)) {
          layer.addTo(map);
        }
      } else {
        if (map.hasLayer(layer)) {
          map.removeLayer(layer);
        }
      }
    });
  }, [activeBaseLayer]);

  // 4. Toggle Radar Layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    const radar = radarLayerRef.current;
    if (!map || !radar) return;

    if (showRadar) {
      if (!map.hasLayer(radar)) radar.addTo(map);
    } else {
      if (map.hasLayer(radar)) map.removeLayer(radar);
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
            color: isSelected ? '#FFFFFF' : '#334155',
            dashArray: isSelected ? '' : '3',
            fillOpacity: isSelected ? 0.45 : 0.25
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
                fillOpacity: 0.55
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

  // 6. Update district markers whenever districts or threshold filter changes
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    districts.forEach((d) => {
      const isSelected = d.id === selectedDistrictId;
      const color = getDistrictColor(d);
      const radius = isSelected ? 12 : 8;

      const circle = L.circleMarker([d.lat, d.lon], {
        radius: radius,
        fillColor: color,
        color: isSelected ? '#FFFFFF' : '#0F172A',
        weight: isSelected ? 3 : 1.5,
        opacity: 1,
        fillOpacity: isSelected ? 0.95 : 0.85
      });

      const popupHtml = `
        <div style="font-family: inherit; font-size: 12px; min-width: 170px;">
          <div style="font-weight: 700; color: #38BDF8; font-size: 13px; margin-bottom: 2px;">
            ${d.name}
          </div>
          <div style="color: #94A3B8; font-size: 11px; margin-bottom: 6px;">
            ${d.state}, India
          </div>
          <div style="border-top: 1px solid #334155; padding-top: 6px; display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
            <div><span style="color:#64748B;">Expected:</span> <b style="color:#F8FAFC;">${d.expected_rain_mm} mm</b></div>
            <div><span style="color:#64748B;">q50:</span> <b style="color:#F8FAFC;">${d.q50_mm} mm</b></div>
            <div><span style="color:#64748B;">P(≥64.5):</span> <b style="color:#F8FAFC;">${Math.round(d.p64_5 * 100)}%</b></div>
            <div><span style="color:#64748B;">P(≥115.6):</span> <b style="color:#F8FAFC;">${Math.round(d.p115_6 * 100)}%</b></div>
          </div>
          <div style="margin-top: 6px; padding: 2px 6px; background: #1E293B; border-radius: 4px; font-size: 10px; color: #CBD5E1;">
            Regime: <b>${d.dominant_regime.toUpperCase()}</b>
          </div>
        </div>
      `;

      circle.bindTooltip(`${d.name} (${d.expected_rain_mm} mm)`, {
        direction: 'top',
        className: 'bg-gray-900 text-gray-200 border border-gray-700 text-xs px-2 py-1 rounded shadow'
      });

      circle.bindPopup(popupHtml);

      circle.on('click', () => {
        onSelectDistrict(d.id);
      });

      markersLayerRef.current?.addLayer(circle);
    });
  }, [districts, selectedDistrictId, thresholdFilter]);

  const handleResetBounds = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([21.5, 78.5], 5, { animate: true });
    }
  };

  return (
    <div className="relative w-full h-[450px] rounded-2xl overflow-hidden border border-gray-800 bg-[#0D131F] shadow-2xl">
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Top-Left Banner */}
      <div className="absolute top-3 left-3 z-[400] flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-950/90 backdrop-blur border border-gray-800 text-xs text-gray-300 shadow-lg">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
        <span className="font-semibold text-cyan-300">Leaflet Map API Active</span>
        <span className="text-gray-500">· 12 Synoptic Dist. Centroids</span>
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

        {/* Live Weather Radar Toggle */}
        <button
          onClick={() => setShowRadar(!showRadar)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold backdrop-blur border transition-all shadow-lg ${
            showRadar
              ? 'bg-emerald-950/90 text-emerald-400 border-emerald-800/80 shadow-emerald-950'
              : 'bg-gray-950/80 text-gray-400 border-gray-800 hover:text-gray-200'
          }`}
          title="Toggle RainViewer live weather radar layer"
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
          onClick={handleResetBounds}
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
              Radar Overlay
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-500 inline-block shadow-sm" />
            <span>Low</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500 inline-block shadow-sm" />
            <span>Moderate</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500 inline-block shadow-sm" />
            <span>Elevated</span>
          </div>
        </div>
      </div>
    </div>
  );
};
