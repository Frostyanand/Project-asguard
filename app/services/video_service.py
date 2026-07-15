import cv2
import json
from pathlib import Path

ALLOWED_EXTENSIONS = {".mp4", ".mov", ".avi"}

MIN_DURATION = 10      # seconds
MAX_DURATION = 120     # seconds


def get_video_metadata(video_path: str):
    cap = cv2.VideoCapture(video_path)

    if not cap.isOpened():
        raise ValueError("Unable to open uploaded video.")

    fps = cap.get(cv2.CAP_PROP_FPS)
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    duration = frame_count / fps if fps > 0 else 0

    cap.release()

    warnings = []

    if width < 720:
        warnings.append("Low resolution may reduce reconstruction quality.")

    if fps < 24:
        warnings.append("Low FPS may reduce reconstruction quality.")

    return {
        "fps": round(fps, 2),
        "frame_count": frame_count,
        "duration": round(duration, 2),
        "width": width,
        "height": height,
        "warnings": warnings
    }


def validate_video(video_path: str, metadata: dict):

    extension = Path(video_path).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise ValueError("Unsupported video format.")

    if metadata["duration"] < MIN_DURATION:
        raise ValueError("Video is too short. Please record at least 10 seconds.")

    if metadata["duration"] > MAX_DURATION:
        raise ValueError("Video is too long. Maximum allowed duration is 120 seconds.")

    if metadata["fps"] <= 0:
        raise ValueError("Invalid video. FPS could not be determined.")

    if metadata["frame_count"] <= 0:
        raise ValueError("Invalid video. No frames detected.")

    return True


def save_metadata(scan_folder: Path, metadata: dict):

    metadata_file = scan_folder / "metadata.json"

    with open(metadata_file, "w") as f:
        json.dump(metadata, f, indent=4)