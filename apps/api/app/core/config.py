import os
from pydantic import BaseModel, Field

class Settings(BaseModel):
    PROJECT_NAME: str = "VARUNA-RAINFALL"
    TAGLINE: str = "From one forecast number to a calibrated, explainable risk field."
    VERSION: str = "0.1.0-prototype"
    API_PREFIX: str = "/api/v1"
    PORT: int = int(os.getenv("PORT", "8000"))
    DEMO_MODE: bool = os.getenv("DEMO_MODE", "true").lower() in ("true", "1")
    DATA_QUALITY: str = os.getenv("DATA_QUALITY", "synthetic_demo")

    # Supabase credentials
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "https://qowhvxjsynxqjobibkcv.supabase.co")
    SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvd2h2eGpzeW54cWpvYmlia2N2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2MTY0MDUsImV4cCI6MjEwNjE5MjQwNX0.PEtLZAmRvIwxhTNL5I3xLhmHhuSnuywh8swcg_0apg8")
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvd2h2eGpzeW54cWpvYmlia2N2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDYxNjQwNSwiZXhwIjoyMTA2MTkyNDA1fQ.LKXjYosCT48tMyFuSmS0Vtp9V8D3cbmWz22h0Vaf-IE")

    # Demo SLA Freshness
    NWP_MAX_AGE_MINUTES: int = 480
    SATELLITE_MAX_AGE_MINUTES: int = 240
    OBS_MAX_AGE_MINUTES: int = 2880

settings = Settings()
