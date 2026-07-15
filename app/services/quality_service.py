import shutil
import cv2
import numpy as np
from pathlib import Path
from app.utils.logger import logger


def calculate_blur_score(image) -> float:
    """
    Calculate the variance of Laplacian of an image (blur score).
    Higher values mean sharper images.
    """
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    return cv2.Laplacian(gray, cv2.CV_64F).var()


def calculate_color_histogram(image):
    """
    Compute a normalized HSV color histogram for the image to detect duplicates.
    """
    hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
    # Calculate histogram for Hue and Saturation channels
    hist = cv2.calcHist([hsv], [0, 1], None, [50, 60], [0, 180, 0, 256])
    cv2.normalize(hist, hist, alpha=0, beta=1, norm_type=cv2.NORM_MINMAX)
    return hist


def filter_frames(
    frames_dir: Path,
    output_dir: Path,
    blur_threshold: float = 100.0,
    similarity_threshold: float = 0.95,
) -> dict:
    """
    Filter frames based on blur and similarity thresholds with adaptive blur support.

    Args:
        frames_dir (Path): Directory containing raw extracted frames.
        output_dir (Path): Directory where filtered frames will be saved.
        blur_threshold (float): Minimum variance of Laplacian.
        similarity_threshold (float): Maximum histogram correlation with previous kept frame.

    Returns:
        dict: Filter statistics.
    """
    logger.info(
        f"Filtering frames in {frames_dir}. Output: {output_dir}. "
        f"Blur threshold: {blur_threshold}, Similarity threshold: {similarity_threshold}"
    )

    # Clean up output directory in case of re-runs
    if output_dir.exists():
        logger.info(f"Cleaning up existing filtered frames folder: {output_dir}")
        try:
            shutil.rmtree(output_dir)
        except Exception as e:
            logger.warning(f"Failed to clear output folder: {e}")

    output_dir.mkdir(parents=True, exist_ok=True)

    # Read all frame files in order
    frame_files = sorted(list(frames_dir.glob("frame_*.jpg")))
    total_frames = len(frame_files)

    if total_frames == 0:
        raise ValueError("No frames found in input folder to filter.")

    blurry_count = 0
    duplicate_count = 0
    saved_count = 0
    last_hist = None
    warning_msg = None

    try:
        # Step 1: Pre-calculate blur scores for all frames to verify thresholds
        logger.info("Evaluating frame sharpness scores...")
        scored_frames = []
        for file_path in frame_files:
            frame = cv2.imread(str(file_path))
            if frame is None:
                logger.warning(f"Skipping unreadable frame: {file_path}")
                continue
            blur_score = calculate_blur_score(frame)
            scored_frames.append((file_path, frame, blur_score))

        if not scored_frames:
            raise ValueError("No readable frames could be loaded.")

        all_scores = [item[2] for item in scored_frames]
        max_score = max(all_scores)

        # Step 2: Determine actual blur threshold (adaptive fallback)
        actual_blur_threshold = blur_threshold
        if max_score < blur_threshold:
            median_score = float(np.median(all_scores))
            # Lower the threshold dynamically to a margin below the median to keep the sharpest ones
            actual_blur_threshold = max(median_score - 5.0, 5.0)
            warning_msg = (
                f"All frames fell below blur threshold {blur_threshold:.1f}. "
                f"Dynamically lowered threshold to adaptive value {actual_blur_threshold:.1f}."
            )
            logger.warning(warning_msg)

        # Step 3: Run filtering using actual_blur_threshold
        for file_path, frame, blur_score in scored_frames:
            # 1. Blur Detection
            if blur_score < actual_blur_threshold:
                blurry_count += 1
                logger.debug(f"Frame {file_path.name} filtered: Blurry (score: {blur_score:.2f} < {actual_blur_threshold:.2f})")
                continue

            # 2. Duplicate/Similarity Detection
            current_hist = calculate_color_histogram(frame)
            if last_hist is not None:
                correlation = cv2.compareHist(last_hist, current_hist, cv2.HISTCMP_CORREL)
                if correlation > similarity_threshold:
                    duplicate_count += 1
                    logger.debug(f"Frame {file_path.name} filtered: Duplicate (similarity: {correlation:.4f} > {similarity_threshold})")
                    continue

            # Passed filters - Save it
            dest_name = output_dir / f"frame_{saved_count + 1:04d}.jpg"
            success = cv2.imwrite(str(dest_name), frame)
            if not success:
                raise IOError(f"Failed to write filtered frame file: {dest_name}")

            saved_count += 1
            last_hist = current_hist

        logger.info(
            f"Frame filtering complete. Total: {total_frames}, Kept: {saved_count}, "
            f"Blurry Removed: {blurry_count}, Duplicates Removed: {duplicate_count}"
        )

        return {
            "original_frames": total_frames,
            "frames_filtered": saved_count,
            "blurry_frames_removed": blurry_count,
            "duplicate_frames_removed": duplicate_count,
            "warning": warning_msg
        }

    except Exception as e:
        logger.error(f"Error occurred during frame filtering: {e}. Cleaning up output directory...")
        if output_dir.exists():
            try:
                shutil.rmtree(output_dir)
            except Exception as cleanup_err:
                logger.error(f"Failed to clean up filtered frames folder: {cleanup_err}")
        raise e
