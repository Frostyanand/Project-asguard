from pathlib import Path

# Directory Paths
UPLOAD_DIR = Path("uploads")

# Frame Extraction Configuration
DEFAULT_TARGET_FPS = 2.0
MIN_TARGET_FPS = 0.1
MAX_TARGET_FPS = 60.0

# Frame Quality Configuration
DEFAULT_BLUR_THRESHOLD = 100.0
DEFAULT_SIMILARITY_THRESHOLD = 0.95

# Reconstruction Backend Configuration
# Choices: "colmap", "python_sfm"
RECONSTRUCTION_BACKEND = "python_sfm"
COLMAP_PATH = "colmap"

# Mesh Processing Backend Configuration
# Choices: "open3d", "trimesh"
MESH_BACKEND = "trimesh"
