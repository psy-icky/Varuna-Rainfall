import hashlib
import json
from typing import Dict, List, Any, Optional
from datetime import datetime, timezone, timedelta
import numpy as np

from app.core.config import settings
from app.core.constants import IMD_THRESHOLDS, CORRECTION_METHODS
from app.schemas.forecast import ForecastPacket, DayForecastItem, DistrictOverviewItem
from app.schemas.regime import RegimeFeatures, RegimeResult
from app.schemas.audit import AuditPacketResponse
from app.services.regime.engine import DemoRegimeEngine
from app.services.correction.bank import DemoCorrectionBank
from app.services.probability.distribution import DistributionService
from app.services.trust.fallback import fallback_service

class ForecastOrchestrator:
    """
    Main orchestration engine connecting input ingestion, regime inference,
    conditional bias correction, parametric uncertainty, threshold exceedance,
    trust evaluation, and audit logging.
    """
    def __init__(self):
        self.regime_engine = DemoRegimeEngine()
        self.correction_bank = DemoCorrectionBank()
        self.distribution_service = DistributionService()
        self.audit_store: Dict[str, AuditPacketResponse] = {}

        # Static district master data
        self.districts: Dict[str, Dict[str, Any]] = {
            "mh_mumbai_suburban": {"id": "mh_mumbai_suburban", "name": "Mumbai Suburban", "state": "Maharashtra", "lat": 19.08, "lon": 72.88, "elevation": 14.0, "coast_distance_km": 5.0, "base_rain_factor": 1.15, "geometry_geojson": {"type": "Polygon", "coordinates": [[[72.78, 19.25], [72.98, 19.25], [72.98, 18.98], [72.78, 18.98], [72.78, 19.25]]]}},
            "mh_nashik": {"id": "mh_nashik", "name": "Nashik", "state": "Maharashtra", "lat": 20.00, "lon": 73.78, "elevation": 560.0, "coast_distance_km": 140.0, "base_rain_factor": 1.00, "geometry_geojson": {"type": "Polygon", "coordinates": [[[73.50, 20.25], [74.15, 20.25], [74.15, 19.70], [73.50, 19.70], [73.50, 20.25]]]}},
            "mh_pune": {"id": "mh_pune", "name": "Pune", "state": "Maharashtra", "lat": 18.52, "lon": 73.85, "elevation": 560.0, "coast_distance_km": 110.0, "base_rain_factor": 0.85, "geometry_geojson": {"type": "Polygon", "coordinates": [[[73.60, 18.75], [74.20, 18.75], [74.20, 18.30], [73.60, 18.30], [73.60, 18.75]]]}},
            "mh_nagpur": {"id": "mh_nagpur", "name": "Nagpur", "state": "Maharashtra", "lat": 21.14, "lon": 79.08, "elevation": 310.0, "coast_distance_km": 680.0, "base_rain_factor": 1.20, "geometry_geojson": {"type": "Polygon", "coordinates": [[[78.75, 21.45], [79.40, 21.45], [79.40, 20.85], [78.75, 20.85], [78.75, 21.45]]]}},
            "od_cuttack": {"id": "od_cuttack", "name": "Cuttack", "state": "Odisha", "lat": 20.46, "lon": 85.88, "elevation": 36.0, "coast_distance_km": 60.0, "base_rain_factor": 1.35, "geometry_geojson": {"type": "Polygon", "coordinates": [[[85.60, 20.70], [86.20, 20.70], [86.20, 20.25], [85.60, 20.25], [85.60, 20.70]]]}},
            "od_puri": {"id": "od_puri", "name": "Puri", "state": "Odisha", "lat": 19.81, "lon": 85.83, "elevation": 5.0, "coast_distance_km": 2.0, "base_rain_factor": 1.40, "geometry_geojson": {"type": "Polygon", "coordinates": [[[85.55, 20.05], [86.15, 20.05], [86.15, 19.65], [85.55, 19.65], [85.55, 20.05]]]}},
            "cg_raigarh": {"id": "cg_raigarh", "name": "Raigarh", "state": "Chhattisgarh", "lat": 21.90, "lon": 83.40, "elevation": 215.0, "coast_distance_km": 420.0, "base_rain_factor": 1.30, "geometry_geojson": {"type": "Polygon", "coordinates": [[[83.10, 22.15], [83.75, 22.15], [83.75, 21.65], [83.10, 21.65], [83.10, 22.15]]]}},
            "mp_jabalpur": {"id": "mp_jabalpur", "name": "Jabalpur", "state": "Madhya Pradesh", "lat": 23.18, "lon": 79.98, "elevation": 411.0, "coast_distance_km": 720.0, "base_rain_factor": 1.25, "geometry_geojson": {"type": "Polygon", "coordinates": [[[79.65, 23.45], [80.35, 23.45], [80.35, 22.90], [79.65, 22.90], [79.65, 23.45]]]}},
            "gj_surat": {"id": "gj_surat", "name": "Surat", "state": "Gujarat", "lat": 21.17, "lon": 72.83, "elevation": 13.0, "coast_distance_km": 15.0, "base_rain_factor": 0.95, "geometry_geojson": {"type": "Polygon", "coordinates": [[[72.60, 21.40], [73.15, 21.40], [73.15, 20.95], [72.60, 20.95], [72.60, 21.40]]]}},
            "kl_ernakulam": {"id": "kl_ernakulam", "name": "Ernakulam", "state": "Kerala", "lat": 9.98, "lon": 76.30, "elevation": 4.0, "coast_distance_km": 6.0, "base_rain_factor": 1.25, "geometry_geojson": {"type": "Polygon", "coordinates": [[[76.05, 10.25], [76.60, 10.25], [76.60, 9.75], [76.05, 9.75], [76.05, 10.25]]]}},
            "kl_wayanad": {"id": "kl_wayanad", "name": "Wayanad", "state": "Kerala", "lat": 11.68, "lon": 76.13, "elevation": 820.0, "coast_distance_km": 55.0, "base_rain_factor": 1.65, "geometry_geojson": {"type": "Polygon", "coordinates": [[[75.85, 11.95], [76.40, 11.95], [76.40, 11.45], [75.85, 11.45], [75.85, 11.95]]]}},
            "uk_dehradun": {"id": "uk_dehradun", "name": "Dehradun", "state": "Uttarakhand", "lat": 30.31, "lon": 78.03, "elevation": 640.0, "coast_distance_km": 1100.0, "base_rain_factor": 1.10, "geometry_geojson": {"type": "Polygon", "coordinates": [[[77.70, 30.60], [78.35, 30.60], [78.35, 30.05], [77.70, 30.05], [77.70, 30.60]]]}}
        }

        # Five representative held-out demo cases
        self.cases: Dict[str, Dict[str, Any]] = {
            "case_lps_001": {
                "id": "case_lps_001",
                "name": "Central India LPS",
                "label": "Central India LPS (Monsoon Depression)",
                "date": "2026-08-17",
                "regime_hint": "depression",
                "description": "Hero Demo: Monsoon depression with intense core convection and vortex displacement over central/eastern India.",
                "features": RegimeFeatures(
                    core_anomaly=1.40,
                    active_persistence_days=4,
                    break_persistence_days=0,
                    vorticity_850=3.8,
                    wind_speed_850=17.5,
                    elevation=465,
                    coast_distance_km=740
                ),
                "base_nwp_rain": 60.0,
                "observed_rain": 142.0,
                "ensemble_std": 24.0,
                "seed": 303
            },
            "case_active_001": {
                "id": "case_active_001",
                "name": "Monsoon Core Active",
                "label": "Monsoon Core Active",
                "date": "2026-08-05",
                "regime_hint": "active",
                "description": "Widespread active-monsoon envelope with systematic NWP under-amplitude bias.",
                "features": RegimeFeatures(
                    core_anomaly=1.35,
                    active_persistence_days=4,
                    break_persistence_days=0,
                    vorticity_850=1.1,
                    wind_speed_850=10.0,
                    elevation=420,
                    coast_distance_km=600
                ),
                "base_nwp_rain": 42.0,
                "observed_rain": 68.0,
                "ensemble_std": 12.0,
                "seed": 101
            },
            "case_break_001": {
                "id": "case_break_001",
                "name": "Core Rainfall Break",
                "label": "Core Rainfall Break",
                "date": "2026-08-12",
                "regime_hint": "break",
                "description": "Break-spell leakage over central India with northward shift towards Himalayan foothills.",
                "features": RegimeFeatures(
                    core_anomaly=-1.30,
                    active_persistence_days=0,
                    break_persistence_days=4,
                    vorticity_850=0.7,
                    wind_speed_850=9.0,
                    elevation=260,
                    coast_distance_km=650
                ),
                "base_nwp_rain": 28.0,
                "observed_rain": 12.0,
                "ensemble_std": 8.0,
                "seed": 202
            },
            "case_orographic_001": {
                "id": "case_orographic_001",
                "name": "Western Ghats Orographic",
                "label": "Western Ghats Orographic",
                "date": "2026-08-24",
                "regime_hint": "orographic",
                "description": "Strong moist southwesterly flow impinging Western Ghats barrier with steep windward-lee contrast.",
                "features": RegimeFeatures(
                    core_anomaly=0.80,
                    active_persistence_days=2,
                    break_persistence_days=0,
                    vorticity_850=1.5,
                    wind_speed_850=18.0,
                    elevation=850,
                    coast_distance_km=60
                ),
                "base_nwp_rain": 75.0,
                "observed_rain": 138.0,
                "ensemble_std": 20.0,
                "seed": 404
            },
            "case_transition_001": {
                "id": "case_transition_001",
                "name": "Regime Transition",
                "label": "Regime Transition (Depression → Active)",
                "date": "2026-08-30",
                "regime_hint": "transition",
                "description": "Ambiguous state during depression dissipation transitioning toward active spell with high epistemic uncertainty.",
                "features": RegimeFeatures(
                    core_anomaly=0.20,
                    active_persistence_days=1,
                    break_persistence_days=1,
                    vorticity_850=1.9,
                    wind_speed_850=12.0,
                    elevation=510,
                    coast_distance_km=400
                ),
                "base_nwp_rain": 35.0,
                "observed_rain": 48.0,
                "ensemble_std": 18.0,
                "seed": 505
            }
        }

    def list_cases(self) -> List[Dict[str, Any]]:
        result = []
        for c in self.cases.values():
            result.append({
                "id": c["id"],
                "name": c["name"],
                "label": c["label"],
                "date": c["date"],
                "regime_hint": c["regime_hint"],
                "description": c["description"],
                "is_hero_case": (c["id"] == "case_lps_001"),
                "is_demo": True
            })
        return result

    def list_districts(self, case_id: str = "case_lps_001") -> List[DistrictOverviewItem]:
        case = self.cases.get(case_id, self.cases["case_lps_001"])
        items = []

        for d_id, d in self.districts.items():
            packet = self.build_forecast_packet(district_id=d_id, case_id=case_id)
            items.append(DistrictOverviewItem(
                id=d_id,
                name=d["name"],
                state=d["state"],
                lat=d["lat"],
                lon=d["lon"],
                geometry_geojson=d.get("geometry_geojson"),
                expected_rain_mm=packet.expected_rain_mm,
                q50_mm=packet.q50_mm,
                p64_5=packet.p64_5,
                p115_6=packet.p115_6,
                p204_5=packet.p204_5,
                dominant_regime=max(packet.regime_probabilities, key=packet.regime_probabilities.get),
                calibration_status=packet.calibration_status,
                fallback_state=packet.fallback_state,
                is_demo_geometry=True
            ))
        return items

    def build_forecast_packet(self, district_id: str, case_id: str) -> ForecastPacket:
        district = self.districts.get(district_id, self.districts["mh_nashik"])
        case = self.cases.get(case_id, self.cases["case_lps_001"])

        # Construct district-tailored regime features
        base_features: RegimeFeatures = case["features"]
        tailored_features = RegimeFeatures(
            core_anomaly=base_features.core_anomaly,
            active_persistence_days=base_features.active_persistence_days,
            break_persistence_days=base_features.break_persistence_days,
            vorticity_850=base_features.vorticity_850,
            wind_speed_850=base_features.wind_speed_850,
            elevation=district["elevation"],
            coast_distance_km=district["coast_distance_km"],
            western_disturbance_flag=(district["lat"] > 28.0)
        )

        # 1. Infer regime posterior
        regime_result = self.regime_engine.predict(tailored_features)

        # 2. Evaluate operational fallback & trust
        fallback_state, calibration_status, fallback_reason, human_review_required = fallback_service.evaluate_state(
            is_transition=regime_result.transition,
            regime_confidence=regime_result.confidence
        )

        # 3. Base Raw NWP for this district & case
        district_factor = district["base_rain_factor"]
        raw_rain = round(case["base_nwp_rain"] * district_factor, 1)
        observed_rain = round(case["observed_rain"] * district_factor, 1)
        base_std = round(case["ensemble_std"] * district_factor, 1)

        # 4. Apply conditional correction bank
        correction_context = {
            "transition": regime_result.transition,
            "fallback_state": fallback_state
        }
        correction = self.correction_bank.apply(
            raw_rain_mm=raw_rain,
            regime_probabilities=regime_result.probabilities,
            context=correction_context
        )

        # 5. Derive two-part distribution & monotonic threshold exceedances
        dist_output = self.distribution_service.derive_distribution(
            corrected_mean_mm=correction.corrected_mean_mm,
            ensemble_std_mm=base_std,
            regime_probabilities=regime_result.probabilities,
            is_transition=regime_result.transition,
            fallback_state=fallback_state
        )

        forecast_id = f"fc_{case_id}_{district_id}"

        # 6. Generate 5-day scenario forecast
        base_date = datetime.strptime(case["date"], "%Y-%m-%d").replace(tzinfo=timezone.utc)
        five_day: List[DayForecastItem] = []
        decay_factors = [1.0, 0.88, 0.65, 0.40, 0.25] if case["regime_hint"] in ("depression", "active") else [1.0, 1.15, 1.25, 0.90, 0.70]

        for day_idx in range(1, 6):
            cur_date = base_date + timedelta(days=day_idx-1)
            f_scale = decay_factors[day_idx-1]
            day_expected = round(dist_output["expected_rain_mm"] * f_scale, 1)
            day_q10 = round(dist_output["q10_mm"] * f_scale, 1)
            day_q50 = round(dist_output["q50_mm"] * f_scale, 1)
            day_q90 = round(dist_output["q90_mm"] * f_scale + (day_idx * 2.0), 1)
            day_p64 = round(float(np.clip(dist_output["p64_5"] * f_scale, 0.0, 1.0)), 3)
            day_p115 = round(float(np.clip(dist_output["p115_6"] * (f_scale ** 1.3), 0.0, 1.0)), 3)
            day_p204 = round(float(np.clip(dist_output["p204_5"] * (f_scale ** 1.8), 0.0, 1.0)), 3)

            # Monotonic guarantee
            if day_p115 > day_p64:
                day_p115 = day_p64
            if day_p204 > day_p115:
                day_p204 = day_p115

            five_day.append(DayForecastItem(
                day=day_idx,
                date=cur_date.strftime("%Y-%m-%d"),
                expected_rain_mm=day_expected,
                q10_mm=day_q10,
                q50_mm=day_q50,
                q90_mm=day_q90,
                p64_5=day_p64,
                p115_6=day_p115,
                p204_5=day_p204,
                dominant_regime=regime_result.dominant_regime,
                calibration_status=calibration_status,
                fallback_state=fallback_state,
                provenance=correction.provenance
            ))

        packet = ForecastPacket(
            forecast_id=forecast_id,
            case_id=case_id,
            district_id=district_id,
            district_name=district["name"],
            state=district["state"],
            lat=district["lat"],
            lon=district["lon"],
            issue_time=f"{case['date']}T00:00:00Z",
            valid_time=f"{case['date']}T24:00:00Z",
            lead_hours=24,
            accumulation_window="24h",
            raw_rain_mm=raw_rain,
            expected_rain_mm=dist_output["expected_rain_mm"],
            observed_rain_mm=observed_rain,
            q10_mm=dist_output["q10_mm"],
            q50_mm=dist_output["q50_mm"],
            q90_mm=dist_output["q90_mm"],
            uncertainty_mm=dist_output["uncertainty_mm"],
            positive_probability=dist_output["positive_probability"],
            p64_5=dist_output["p64_5"],
            p115_6=dist_output["p115_6"],
            p204_5=dist_output["p204_5"],
            regime_probabilities=regime_result.probabilities,
            transition=regime_result.transition,
            confidence=regime_result.confidence,
            correction_method=correction.correction_method,
            provenance=correction.provenance,
            calibration_status=calibration_status,
            fallback_state=fallback_state,
            fallback_reason=fallback_reason,
            human_review_required=human_review_required,
            model_version="demo-0.1.0",
            data_version="demo-2026-09-01",
            data_quality=settings.DATA_QUALITY,
            source_health={"sources": fallback_service.get_source_health()},
            five_day_forecast=five_day
        )

        # 7. Audit packet creation and storage
        audit_payload = {
            "forecast_id": forecast_id,
            "case_id": case_id,
            "district_id": district_id,
            "issue_time": packet.issue_time,
            "valid_time": packet.valid_time,
            "lead_hours": 24,
            "accumulation_window": "24h",
            "source_versions": [
                {"source": "NWP", "version": "demo-nwp-v1"},
                {"source": "Satellite", "version": "demo-sat-v1"},
                {"source": "Observation", "version": "demo-gauge-v1"},
                {"source": "Terrain", "version": "demo-dem-v1"}
            ],
            "data_version": packet.data_version,
            "model_version": packet.model_version,
            "regime_probabilities": packet.regime_probabilities,
            "dominant_regime": regime_result.dominant_regime,
            "transition_flag": packet.transition,
            "regime_confidence": packet.confidence,
            "correction_method": packet.correction_method,
            "calibration_status": packet.calibration_status,
            "fallback_state": packet.fallback_state,
            "fallback_reason": packet.fallback_reason,
            "human_review_required": packet.human_review_required,
            "data_quality": packet.data_quality,
            "verification_artifact": f"vr_{case_id.replace('case_', '')}",
            "raw_nwp_snapshot": {
                "raw_rain_mm": raw_rain,
                "ensemble_std": base_std,
                "resolution_km": 12.0
            },
            "output_quantiles": {
                "q10": packet.q10_mm,
                "q50": packet.q50_mm,
                "q90": packet.q90_mm,
                "uncertainty_mm": packet.uncertainty_mm
            },
            "threshold_probabilities": {
                "p64_5": packet.p64_5,
                "p115_6": packet.p115_6,
                "p204_5": packet.p204_5
            },
            "provenance_hash": hashlib.sha256(f"{forecast_id}:{packet.correction_method}:{packet.fallback_state}".encode()).hexdigest()[:16],
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

        self.audit_store[forecast_id] = AuditPacketResponse(**audit_payload)
        return packet

    def get_audit(self, forecast_id: str) -> AuditPacketResponse:
        if forecast_id in self.audit_store:
            return self.audit_store[forecast_id]
        
        # Parse fallback forecast_id
        parts = forecast_id.split("_")
        case_id = "case_lps_001"
        district_id = "mh_nashik"
        if len(parts) >= 4:
            case_id = f"case_{parts[1]}_{parts[2]}"
            district_id = "_".join(parts[3:])
        self.build_forecast_packet(district_id, case_id)
        return self.audit_store.get(forecast_id, next(iter(self.audit_store.values())))

orchestrator = ForecastOrchestrator()
