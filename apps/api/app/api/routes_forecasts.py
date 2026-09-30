from fastapi import APIRouter, HTTPException
from app.schemas.regime import RegimeResult
from app.services.orchestrator import orchestrator

router = APIRouter(tags=["Forecasts"])

@router.get("/forecasts/{forecast_id}/regime", response_model=RegimeResult)
def get_forecast_regime(forecast_id: str):
    # Retrieve audit to deduce case and district
    audit = orchestrator.get_audit(forecast_id)
    district = orchestrator.districts.get(audit.district_id, orchestrator.districts["mh_nashik"])
    case = orchestrator.cases.get(audit.case_id, orchestrator.cases["case_lps_001"])

    features = case["features"]
    tailored_features = features.model_copy(update={
        "elevation": district["elevation"],
        "coast_distance_km": district["coast_distance_km"]
    })
    return orchestrator.regime_engine.predict(tailored_features)
