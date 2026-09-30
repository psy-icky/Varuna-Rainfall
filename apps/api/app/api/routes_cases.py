from fastapi import APIRouter
from app.services.orchestrator import orchestrator

router = APIRouter(tags=["Cases"])

@router.get("/cases")
def list_cases():
    return orchestrator.list_cases()
