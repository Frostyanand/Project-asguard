import cv2
from pathlib import Path


def extract_frames(
    video_path: str,
    output_folder: Path,
    target_fps: float = 2.0,
):
    """
    Extract frames from a video at a specified FPS.

    Args:
        video_path (str): Path to input video.
        output_folder (Path): Folder to save extracted frames.
        target_fps (float): Frames to extract per second.

    Returns:
        dict: Extraction statistics.
    """

    output_folder.mkdir(parents=True, exist_ok=True)

    cap = cv2.VideoCapture(video_path)

    if not cap.isOpened():
        raise ValueError("Unable to open video for frame extraction.")

    original_fps = cap.get(cv2.CAP_PROP_FPS)

    if original_fps <= 0:
        raise ValueError("Invalid FPS detected.")

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    frame_interval = max(round(original_fps / target_fps), 1)

    frame_index = 0
    saved_frames = 0

    while True:

        ret, frame = cap.read()

        if not ret:
            break

        if frame_index % frame_interval == 0:

            frame_name = output_folder / f"frame_{saved_frames + 1:04d}.jpg"

            cv2.imwrite(str(frame_name), frame)

            saved_frames += 1

        frame_index += 1

    cap.release()

    return {
        "frames_extracted": saved_frames,
        "original_fps": round(original_fps, 2),
        "target_fps": target_fps,
        "total_video_frames": total_frames,
    }