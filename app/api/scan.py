from pathlib import Path
import json

from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from fastapi.responses import FileResponse

from app.models.schemas import (
    UploadResponse,
    FrameExtractionResponse,
    FrameFilterResponse,
    ReconstructionResponse,
    GLBExportResponse,
    ScanStatusResponse,
)

from app.services.storage_service import save_uploaded_video

from app.services.video_service import (
    get_video_metadata,
    validate_video,
    save_metadata,
)

from app.services.frame_service import extract_frames
from app.services.quality_service import filter_frames
from app.services.reconstruction_service import reconstruct_points
from app.services.mesh_service import generate_mesh_and_glb

from app.utils.logger import logger
from app.utils.config import (
    DEFAULT_TARGET_FPS,
    MIN_TARGET_FPS,
    MAX_TARGET_FPS,
    DEFAULT_BLUR_THRESHOLD,
    DEFAULT_SIMILARITY_THRESHOLD,
    UPLOAD_DIR,
)


router = APIRouter(
    prefix="/scan",
    tags=["Room Scan"],
)


def get_safe_scan_folder(scan_id: str) -> Path:
    """
    Validate and return the scan folder path, preventing directory traversal attacks.
    """
    # Exclude basic path traversal characters
    if ".." in scan_id or "/" in scan_id or "\\" in scan_id:
        logger.warning(f"Directory traversal attempt detected: {scan_id}")
        raise HTTPException(status_code=400, detail="Invalid Scan ID.")

    scan_folder = (UPLOAD_DIR / scan_id).resolve()
    base_folder = UPLOAD_DIR.resolve()

    # Ensure the resolved folder path is strictly inside the uploads directory
    try:
        if not scan_folder.is_relative_to(base_folder):
            logger.warning(f"Path escape attempt detected: {scan_id}")
            raise HTTPException(status_code=400, detail="Invalid Scan ID.")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Scan ID.")

    return scan_folder


# -----------------------------
# Upload Video
# -----------------------------
@router.post("/upload", response_model=UploadResponse)
def upload_video(video: UploadFile = File(...)):

    try:
        logger.info(f"Received video upload request: {video.filename}")
        upload = save_uploaded_video(video)

        metadata = get_video_metadata(str(upload["video_path"]))

        validate_video(str(upload["video_path"]), metadata)

        metadata["scan_id"] = upload["scan_id"]
        metadata["status"] = "uploaded"

        save_metadata(upload["scan_folder"], metadata)

        logger.info(f"Video uploaded successfully. Scan ID: {upload['scan_id']}")
        return UploadResponse(
            success=True,
            scan_id=upload["scan_id"],
            filename=upload["filename"],
            duration=metadata["duration"],
            fps=metadata["fps"],
            resolution=f'{metadata["width"]}x{metadata["height"]}',
            warnings=metadata["warnings"],
            message="Video uploaded and validated successfully."
        )

    except Exception as e:
        logger.error(f"Failed to upload/validate video: {e}")
        raise HTTPException(status_code=400, detail=str(e))


# -----------------------------
# Extract Frames
# -----------------------------
@router.post(
    "/{scan_id}/extract-frames",
    response_model=FrameExtractionResponse
)
def extract_video_frames(
    scan_id: str,
    target_fps: float = Query(
        DEFAULT_TARGET_FPS,
        gt=MIN_TARGET_FPS,
        le=MAX_TARGET_FPS,
        description="Target frames per second to extract from the video."
    )
):

    scan_folder = get_safe_scan_folder(scan_id)

    if not scan_folder.exists():
        logger.error(f"Scan ID folder not found: {scan_id}")
        raise HTTPException(
            status_code=404,
            detail="Scan ID not found."
        )

    metadata_file = scan_folder / "metadata.json"
    if not metadata_file.exists():
        logger.error(f"Metadata file not found in workspace: {metadata_file}")
        raise HTTPException(
            status_code=400,
            detail="Metadata file not found. Workspace may be corrupted."
        )

    # Load current metadata
    with open(metadata_file, "r") as f:
        metadata = json.load(f)

    try:
        # Locate uploaded video
        video_files = list(scan_folder.glob("room.*"))

        if not video_files:
            raise ValueError("Uploaded video not found in workspace.")

        video_path = video_files[0]
        frames_folder = scan_folder / "frames"

        # Check if target_fps is higher than original fps
        original_fps = metadata.get("fps", 0)
        if original_fps > 0 and target_fps > original_fps:
            logger.warning(
                f"Target FPS {target_fps} is greater than video original FPS {original_fps}. "
                f"Capping target FPS to original FPS."
            )
            target_fps = original_fps

        frame_info = extract_frames(
            str(video_path),
            frames_folder,
            target_fps=target_fps
        )

        metadata.update(frame_info)
        metadata["status"] = "frames_extracted"

        save_metadata(scan_folder, metadata)

        return FrameExtractionResponse(
            success=True,
            scan_id=scan_id,
            frames_extracted=frame_info["frames_extracted"],
            original_fps=frame_info["original_fps"],
            target_fps=frame_info["target_fps"],
            message="Frames extracted successfully."
        )

    except Exception as e:
        logger.error(f"Failed during frame extraction for Scan ID {scan_id}: {e}")
        metadata["status"] = "failed"
        save_metadata(scan_folder, metadata)
        raise HTTPException(status_code=400, detail=str(e))


# -----------------------------
# Filter Frames
# -----------------------------
@router.post(
    "/{scan_id}/filter-frames",
    response_model=FrameFilterResponse
)
def filter_video_frames(
    scan_id: str,
    blur_threshold: float = Query(
        DEFAULT_BLUR_THRESHOLD,
        gt=0,
        description="Minimum Laplacian variance for blur detection."
    ),
    similarity_threshold: float = Query(
        DEFAULT_SIMILARITY_THRESHOLD,
        ge=0,
        le=1,
        description="Maximum histogram correlation with previous kept frame."
    )
):
    scan_folder = get_safe_scan_folder(scan_id)

    if not scan_folder.exists():
        raise HTTPException(status_code=404, detail="Scan ID not found.")

    metadata_file = scan_folder / "metadata.json"
    if not metadata_file.exists():
        raise HTTPException(status_code=400, detail="Metadata file not found.")

    with open(metadata_file, "r") as f:
        metadata = json.load(f)

    try:
        frames_folder = scan_folder / "frames"
        filtered_folder = scan_folder / "filtered_frames"

        if not frames_folder.exists():
            raise ValueError("Frames folder does not exist. Please run frame extraction first.")

        filter_stats = filter_frames(
            frames_folder,
            filtered_folder,
            blur_threshold=blur_threshold,
            similarity_threshold=similarity_threshold
        )

        # Handle adaptive warning messages
        warning_msg = filter_stats.get("warning")
        if warning_msg:
            warnings_list = metadata.get("warnings", [])
            if warning_msg not in warnings_list:
                warnings_list.append(warning_msg)
            metadata["warnings"] = warnings_list

        metadata.update(filter_stats)
        metadata["status"] = "frames_filtered"
        save_metadata(scan_folder, metadata)

        return FrameFilterResponse(
            success=True,
            scan_id=scan_id,
            original_frames=filter_stats["original_frames"],
            frames_filtered=filter_stats["frames_filtered"],
            blurry_frames_removed=filter_stats["blurry_frames_removed"],
            duplicate_frames_removed=filter_stats["duplicate_frames_removed"],
            message="Frame quality analysis and filtering complete."
        )

    except Exception as e:
        logger.error(f"Failed during frame filtering for Scan ID {scan_id}: {e}")
        metadata["status"] = "failed"
        save_metadata(scan_folder, metadata)
        raise HTTPException(status_code=400, detail=str(e))


# -----------------------------
# Reconstruct Points
# -----------------------------
@router.post(
    "/{scan_id}/reconstruct",
    response_model=ReconstructionResponse
)
def reconstruct_scan(scan_id: str):
    scan_folder = get_safe_scan_folder(scan_id)

    if not scan_folder.exists():
        raise HTTPException(status_code=404, detail="Scan ID not found.")

    metadata_file = scan_folder / "metadata.json"
    if not metadata_file.exists():
        raise HTTPException(status_code=400, detail="Metadata file not found.")

    with open(metadata_file, "r") as f:
        metadata = json.load(f)

    try:
        filtered_folder = scan_folder / "filtered_frames"
        reconstruction_folder = scan_folder / "reconstruction"

        if not filtered_folder.exists() or len(list(filtered_folder.glob("*.jpg"))) == 0:
            raise ValueError("No filtered frames found. Please run frame filtering first.")

        recon_stats = reconstruct_points(filtered_folder, reconstruction_folder)

        metadata.update(recon_stats)
        metadata["status"] = "dense_point_cloud_generated"
        save_metadata(scan_folder, metadata)

        return ReconstructionResponse(
            success=True,
            scan_id=scan_id,
            backend=recon_stats["backend"],
            points_count=recon_stats["points_count"],
            message="3D Point Cloud reconstruction complete."
        )

    except Exception as e:
        logger.error(f"Failed during reconstruction for Scan ID {scan_id}: {e}")
        metadata["status"] = "failed"
        save_metadata(scan_folder, metadata)
        raise HTTPException(status_code=400, detail=str(e))


# -----------------------------
# Generate GLB
# -----------------------------
@router.post(
    "/{scan_id}/generate-glb",
    response_model=GLBExportResponse
)
def generate_glb_file(scan_id: str):
    scan_folder = get_safe_scan_folder(scan_id)

    if not scan_folder.exists():
        raise HTTPException(status_code=404, detail="Scan ID not found.")

    metadata_file = scan_folder / "metadata.json"
    if not metadata_file.exists():
        raise HTTPException(status_code=400, detail="Metadata file not found.")

    with open(metadata_file, "r") as f:
        metadata = json.load(f)

    try:
        ply_path = scan_folder / "reconstruction" / "dense.ply"
        mesh_folder = scan_folder / "mesh"
        output_folder = scan_folder / "output"

        if not ply_path.exists():
            raise ValueError("Point cloud file (dense.ply) not found. Please run reconstruction first.")

        mesh_stats = generate_mesh_and_glb(ply_path, mesh_folder, output_folder)

        metadata.update(mesh_stats)
        metadata["status"] = "completed"
        save_metadata(scan_folder, metadata)

        download_url = f"/scan/{scan_id}/download"

        return GLBExportResponse(
            success=True,
            scan_id=scan_id,
            vertices_count=mesh_stats["vertices_count"],
            faces_count=mesh_stats["faces_count"],
            file_size_bytes=mesh_stats["file_size_bytes"],
            download_url=download_url,
            message="GLB Digital Twin mesh generated and exported successfully."
        )

    except Exception as e:
        logger.error(f"Failed during mesh/GLB generation for Scan ID {scan_id}: {e}")
        metadata["status"] = "failed"
        save_metadata(scan_folder, metadata)
        raise HTTPException(status_code=400, detail=str(e))


# -----------------------------
# Scan Status
# -----------------------------
@router.get(
    "/{scan_id}/status",
    response_model=ScanStatusResponse
)
def get_scan_status(scan_id: str):
    scan_folder = get_safe_scan_folder(scan_id)

    if not scan_folder.exists():
        raise HTTPException(status_code=404, detail="Scan ID not found.")

    metadata_file = scan_folder / "metadata.json"
    if not metadata_file.exists():
        raise HTTPException(
            status_code=404,
            detail="Metadata file not found. Workspace may be corrupted."
        )

    with open(metadata_file, "r") as f:
        metadata = json.load(f)

    return ScanStatusResponse(
        scan_id=scan_id,
        status=metadata.get("status", "unknown"),
        metadata=metadata
    )


# -----------------------------
# Download GLB
# -----------------------------
@router.get("/{scan_id}/download")
def download_glb(scan_id: str):
    scan_folder = get_safe_scan_folder(scan_id)

    if not scan_folder.exists():
        raise HTTPException(status_code=404, detail="Scan ID not found.")

    glb_file = scan_folder / "output" / "room.glb"

    if not glb_file.exists():
        raise HTTPException(
            status_code=404,
            detail="GLB model not found. Please generate the GLB first."
        )

    logger.info(f"Downloading GLB file for Scan ID: {scan_id}")
    return FileResponse(
        path=str(glb_file),
        media_type="model/gltf-binary",
        filename="room.glb"
    )