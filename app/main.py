from fastapi import FastAPI
from app.api.scan import router as scan_router

app = FastAPI(
    title="Video to GLB Pipeline",
    description="Backend service for generating 3D GLB models from room videos.",
    version="1.0.0"
)

app.include_router(scan_router)

@app.get("/")
def root():
    return {
        "status": "running",
        "service": "Video-to-GLB Pipeline"
    }