from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.trust.fallback import fallback_service

router = APIRouter(tags=["Demo"])

class FaultRequest(BaseModel):
    fault: str

@router.post("/demo/fault")
def inject_fault(request: FaultRequest):
    try:
        event = fallback_service.set_fault(request.fault)
        return {
            "status": "fault_injected",
            "active_fault": request.fault,
            "event": event
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/demo/reset")
def reset_demo():
    event = fallback_service.reset()
    return {
        "status": "reset_complete",
        "active_fault": None,
        "event": event
    }
