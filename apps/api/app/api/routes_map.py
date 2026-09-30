from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Query
from app.services.orchestrator import orchestrator

router = APIRouter(tags=["Map API"])

@router.get("/map/layers")
def get_map_layers() -> Dict[str, Any]:
    """
    Returns open, watermark-free base tile layers and overlay layers for Leaflet integration.
    """
    return {
        "base_layers": [
            {
                "id": "dark_canvas",
                "name": "Dark Canvas (ESRI)",
                "url": "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
                "attribution": "Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ",
                "max_zoom": 16,
                "default": True
            },
            {
                "id": "openstreetmap",
                "name": "OpenStreetMap",
                "url": "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
                "attribution": "&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors",
                "max_zoom": 19,
                "default": False
            },
            {
                "id": "satellite",
                "name": "ESRI World Imagery (Satellite)",
                "url": "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
                "attribution": "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
                "max_zoom": 18,
                "default": False
            },
            {
                "id": "topo",
                "name": "ESRI World Topography",
                "url": "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
                "attribution": "Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community",
                "max_zoom": 18,
                "default": False
            }
        ],
        "overlay_layers": [
            {
                "id": "rainviewer_radar",
                "name": "Live Weather Radar (RainViewer)",
                "type": "radar_tile",
                "url_template": "https://tilecache.rainviewer.com/v2/radar/nowcast_latest/256/{z}/{x}/{y}/2/1_1.png",
                "opacity": 0.65,
                "attribution": "Radar data &copy; <a href='https://www.rainviewer.com/api.html'>RainViewer</a>"
            },
            {
                "id": "precipitation_grid",
                "name": "VARUNA Calibrated NWP Risk Grid",
                "type": "geojson_choropleth",
                "opacity": 0.8
            }
        ],
        "center": [21.5, 78.9629],
        "zoom": 5,
        "bounds": [
            [6.5, 68.0],
            [36.0, 97.5]
        ]
    }

@router.get("/map/geojson")
def get_districts_geojson(case_id: str = Query("case_lps_001", description="Held-out demo case ID")) -> Dict[str, Any]:
    """
    Returns RFC 7946 GeoJSON FeatureCollection of districts with calibrated rainfall & risk metrics.
    """
    districts_list = orchestrator.list_districts(case_id=case_id)
    features: List[Dict[str, Any]] = []

    delta = 0.35

    for d in districts_list:
        lat = d.lat
        lon = d.lon

        # Risk classification
        if d.p204_5 > 0.20 or d.p115_6 > 0.45 or d.expected_rain_mm > 100:
            risk_level = "extreme"
            color = "#EF4444"
        elif d.p115_6 > 0.25 or d.p64_5 > 0.55 or d.expected_rain_mm > 60:
            risk_level = "high"
            color = "#F97316"
        elif d.p64_5 > 0.30 or d.expected_rain_mm > 30:
            risk_level = "moderate"
            color = "#EAB308"
        else:
            risk_level = "low"
            color = "#06B6D4"

        polygon_coords = [
            [
                [lon - delta * 0.9, lat - delta * 0.7],
                [lon + delta * 0.8, lat - delta * 0.6],
                [lon + delta * 1.1, lat + delta * 0.4],
                [lon + delta * 0.2, lat + delta * 0.9],
                [lon - delta * 1.0, lat + delta * 0.5],
                [lon - delta * 0.9, lat - delta * 0.7]
            ]
        ]

        feature = {
            "type": "Feature",
            "id": d.id,
            "geometry": {
                "type": "Polygon",
                "coordinates": polygon_coords
            },
            "properties": {
                "id": d.id,
                "name": d.name,
                "state": d.state,
                "lat": d.lat,
                "lon": d.lon,
                "expected_rain_mm": d.expected_rain_mm,
                "q50_mm": d.q50_mm,
                "p64_5": d.p64_5,
                "p115_6": d.p115_6,
                "p204_5": d.p204_5,
                "dominant_regime": d.dominant_regime,
                "risk_level": risk_level,
                "fill_color": color,
                "case_id": case_id
            }
        }
        features.append(feature)

    return {
        "type": "FeatureCollection",
        "case_id": case_id,
        "features": features
    }
