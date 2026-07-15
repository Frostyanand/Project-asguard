from typing import List, Dict, Any
from pydantic import BaseModel


class UploadResponse(BaseModel):
    success: bool
    scan_id: str
    filename: str
    duration: float
    fps: float
    resolution: str
    warnings: List[str] = []
    message: str


class FrameExtractionResponse(BaseModel):
    success: bool
    scan_id: str
    frames_extracted: int
    original_fps: float
    target_fps: float
    message: str


class FrameFilterResponse(BaseModel):
    success: bool
    scan_id: str
    original_frames: int
    frames_filtered: int
    blurry_frames_removed: int
    duplicate_frames_removed: int
    message: str


class ReconstructionResponse(BaseModel):
    success: bool
    scan_id: str
    backend: str
    points_count: int
    message: str


class GLBExportResponse(BaseModel):
    success: bool
    scan_id: str
    vertices_count: int
    faces_count: int
    file_size_bytes: int
    download_url: str
    message: str


class ScanStatusResponse(BaseModel):
    scan_id: str
    status: str
    metadata: Dict[str, Any]