import shutil
import uuid
from pathlib import Path
from fastapi import UploadFile

UPLOAD_DIR = Path("uploads")


def save_uploaded_video(file: UploadFile):
    """
    Save an uploaded video into a unique scan folder.

    Returns:
        {
            scan_id,
            scan_folder,
            video_path,
            filename
        }
    """

    # Ensure uploads directory exists
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

    # Generate unique scan ID
    scan_id = str(uuid.uuid4())

    # Create scan workspace
    scan_folder = UPLOAD_DIR / scan_id
    scan_folder.mkdir(parents=True, exist_ok=True)

    # Preserve original extension
    extension = Path(file.filename).suffix.lower()

    if extension == "":
        extension = ".mp4"

    filename = f"room{extension}"

    destination = scan_folder / filename

    # Save uploaded file
    with destination.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {
        "scan_id": scan_id,
        "scan_folder": scan_folder,
        "video_path": destination,
        "filename": filename
    }