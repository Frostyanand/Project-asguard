from fastapi import APIRouter, UploadFile, File

from app.models.schemas import UploadResponse
from app.services.storage_service import save_uploaded_video

router = APIRouter(
    prefix="/scan",
    tags=["Room Scan"]
)


@router.post("/upload", response_model=UploadResponse)
async def upload_video(video: UploadFile = File(...)):
    result = save_uploaded_video(video)

    return UploadResponse(
        success=True,
        scan_id=result["scan_id"],
        filename=result["filename"],
        message="Video uploaded successfully."
    )