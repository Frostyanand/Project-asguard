import uuid
from pathlib import Path
import shutil
from fastapi import UploadFile

UPLOAD_DIR = Path("uploads")


def save_uploaded_video(file: UploadFile):
    """
    Saves an uploaded video inside its own scan folder.
    """

    scan_id = str(uuid.uuid4())

    scan_folder = UPLOAD_DIR / scan_id
    scan_folder.mkdir(parents=True, exist_ok=True)

    destination = scan_folder / "room.mp4"

    with destination.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {
        "scan_id": scan_id,
        "filename": "room.mp4",
        "path": str(destination)
    }