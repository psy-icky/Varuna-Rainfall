from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.api import (
    routes_health,
    routes_cases,
    routes_districts,
    routes_forecasts,
    routes_verification,
    routes_trust,
    routes_audit,
    routes_demo,
    routes_map
)

app = FastAPI(
    title="VARUNA-RAINFALL API",
    description="Regime-Aware AI Post-Processing of NWP Rainfall Forecasts over India (SIH26080 Prototype)",
    version=settings.VERSION,
    docs_url=f"{settings.API_PREFIX}/docs",
    openapi_url=f"{settings.API_PREFIX}/openapi.json"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Prototype Mode Header Middleware
@app.middleware("http")
async def add_prototype_header(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Prototype-Mode"] = settings.DATA_QUALITY
    response.headers["X-Warning-Disclaimer"] = "Decision support - not an official warning authority."
    return response

# Include Sub-Routers
app.include_router(routes_health.router, prefix=settings.API_PREFIX)
app.include_router(routes_cases.router, prefix=settings.API_PREFIX)
app.include_router(routes_districts.router, prefix=settings.API_PREFIX)
app.include_router(routes_forecasts.router, prefix=settings.API_PREFIX)
app.include_router(routes_verification.router, prefix=settings.API_PREFIX)
app.include_router(routes_trust.router, prefix=settings.API_PREFIX)
app.include_router(routes_audit.router, prefix=settings.API_PREFIX)
app.include_router(routes_demo.router, prefix=settings.API_PREFIX)
app.include_router(routes_map.router, prefix=settings.API_PREFIX)

@app.get("/")
def root():
    return {
        "product": settings.PROJECT_NAME,
        "tagline": settings.TAGLINE,
        "version": settings.VERSION,
        "api_docs": f"{settings.API_PREFIX}/docs",
        "data_quality": settings.DATA_QUALITY,
        "disclaimer": "Decision support — not an official warning authority. Synthetic prototype data — not operational forecast skill."
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=settings.PORT, reload=True)
