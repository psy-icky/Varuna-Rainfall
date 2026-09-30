from fastapi import APIRouter
from app.core.config import settings

router = APIRouter(tags=["Health"])

@router.get("/health")
def get_health():
    return {
        "status": "ok",
        "demo_mode": settings.DEMO_MODE,
        "data_quality": settings.DATA_QUALITY,
        "version": settings.VERSION,
        "disclaimer": "Decision support — not an official warning authority. Synthetic prototype data."
    }
