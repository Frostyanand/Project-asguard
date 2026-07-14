from pydantic import BaseModel

class UploadResponse(BaseModel):
    success: bool
    scan_id: str
    filename: str
    message: str