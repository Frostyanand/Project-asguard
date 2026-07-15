import shutil
import numpy as np
import trimesh
from pathlib import Path
from scipy.spatial import cKDTree
from app.utils.logger import logger
from app.utils.config import MESH_BACKEND


def read_ply_points(ply_path: Path) -> tuple:
    """
    Read points and colors from an ASCII PLY file.
    """
    points = []
    colors = []
    header_ended = False

    with open(ply_path, "r") as f:
        for line in f:
            line = line.strip()
            if not header_ended:
                if line == "end_header":
                    header_ended = True
                continue
            parts = line.split()
            if len(parts) >= 6:
                points.append([float(parts[0]), float(parts[1]), float(parts[2])])
                colors.append([int(parts[3]), int(parts[4]), int(parts[5]), 255]) # RGBA

    return np.array(points), np.array(colors)


def remove_outliers(points: np.ndarray, colors: np.ndarray, k: int = 20, std_ratio: float = 2.0) -> tuple:
    """
    Statistical Outlier Removal (SOR) using cKDTree.
    Similar to Open3D's remove_statistical_outlier.
    """
    if len(points) < k:
        return points, colors

    tree = cKDTree(points)
    # Query distances to k nearest neighbors (excluding the point itself by k+1)
    dists, _ = tree.query(points, k=k + 1)
    
    # Calculate average distance for each point (excluding self at index 0)
    mean_dists = np.mean(dists[:, 1:], axis=1)
    
    mean = np.mean(mean_dists)
    std = np.std(mean_dists)
    
    threshold = mean + std_ratio * std
    inliers = mean_dists < threshold
    
    logger.info(f"Outlier removal: keeping {np.sum(inliers)} / {len(points)} points (threshold: {threshold:.4f})")
    return points[inliers], colors[inliers]


def run_trimesh_mesh_generation(point_cloud_path: Path, output_mesh_path: Path, output_glb_path: Path) -> tuple:
    """
    Trimesh-based mesh generation.
    Creates a proper transparent room box (floor + 4 walls) enclosing all point cloud points,
    and inserts small 3D cubes at each point location, color-mapped from the video features.
    """
    logger.info("Running Trimesh transparent room + voxel features mesh generator...")

    # 1. Load points and colors from PLY
    points, colors = read_ply_points(point_cloud_path)
    if len(points) < 4:
        raise ValueError("Point cloud has too few points to generate a 3D mesh.")

    # 2. Outlier Removal
    points, colors = remove_outliers(points, colors)

    # 3. Determine spatial bounds of the point cloud
    min_x, min_y, min_z = np.min(points, axis=0)
    max_x, max_y, max_z = np.max(points, axis=0)

    # Force minimum dimensions for a standard room if points are clustered too close
    W = max(max_x - min_x, 3.0)
    D = max(max_y - min_y, 4.0)
    H = max(max_z - min_z, 2.5)

    cx = (min_x + max_x) / 2.0
    cy = (min_y + max_y) / 2.0
    cz = (min_z + max_z) / 2.0

    min_x_adj = cx - W / 2.0
    max_x_adj = cx + W / 2.0
    min_y_adj = cy - D / 2.0
    max_y_adj = cy + D / 2.0
    min_z_adj = cz - H / 2.0
    max_z_adj = cz + H / 2.0

    thickness = 0.02

    # 4. Construct Floor & Walls (with transparency using PBRMaterial)
    # Floor: semi-transparent wood brown (alpha = 0.6)
    floor = trimesh.creation.box(extents=[W, D, thickness])
    floor.apply_translation([cx, cy, min_z_adj - thickness / 2.0])
    floor.visual.material = trimesh.visual.material.PBRMaterial(
        baseColorFactor=[0.5, 0.4, 0.3, 0.6],
        alphaMode='BLEND',
        roughnessFactor=0.8
    )

    # Walls: semi-transparent blue-gray (alpha = 0.25)
    wall_mat = trimesh.visual.material.PBRMaterial(
        baseColorFactor=[0.7, 0.8, 0.9, 0.25],
        alphaMode='BLEND',
        roughnessFactor=0.9
    )

    left_wall = trimesh.creation.box(extents=[thickness, D, H])
    left_wall.apply_translation([min_x_adj - thickness / 2.0, cy, cz])
    left_wall.visual.material = wall_mat

    right_wall = trimesh.creation.box(extents=[thickness, D, H])
    right_wall.apply_translation([max_x_adj + thickness / 2.0, cy, cz])
    right_wall.visual.material = wall_mat

    back_wall = trimesh.creation.box(extents=[W, thickness, H])
    back_wall.apply_translation([cx, max_y_adj + thickness / 2.0, cz])
    back_wall.visual.material = wall_mat

    front_wall = trimesh.creation.box(extents=[W, thickness, H])
    front_wall.apply_translation([cx, min_y_adj - thickness / 2.0, cz])
    front_wall.visual.material = wall_mat

    # 5. Downsample points to keep file size small and prevent visual overlapping
    max_display_points = 2000
    if len(points) > max_display_points:
        logger.info(f"Downsampling point cloud from {len(points)} to {max_display_points} points for mesh visualization.")
        indices = np.linspace(0, len(points) - 1, max_display_points, dtype=int)
        points = points[indices]
        colors = colors[indices]

    # 6. Vectorized voxel generation for point cloud features (smaller size 0.02)
    num_points = len(points)
    base_box = trimesh.creation.box(extents=[0.02, 0.02, 0.02])

    all_vertices = np.tile(base_box.vertices, (num_points, 1)) + np.repeat(points, len(base_box.vertices), axis=0)
    offsets = np.repeat(np.arange(num_points) * len(base_box.vertices), len(base_box.faces))[:, np.newaxis]
    all_faces = np.tile(base_box.faces, (num_points, 1)) + offsets

    features_mesh = trimesh.Trimesh(vertices=all_vertices, faces=all_faces)
    features_mesh.visual.vertex_colors = np.repeat(colors, len(base_box.vertices), axis=0)

    # 7. Create a Scene to preserve distinct materials/transparencies during GLB export
    scene = trimesh.Scene([floor, left_wall, right_wall, back_wall, front_wall, features_mesh])

    # 8. Save outputs
    # Save a merged mesh version as OBJ for static mesh format compatibility
    merged_mesh = trimesh.util.concatenate([floor, left_wall, right_wall, back_wall, front_wall, features_mesh])
    merged_mesh.export(str(output_mesh_path), file_type="obj")
    
    # Export the Scene to GLB (this keeps PBR blend materials intact)
    scene.export(str(output_glb_path), file_type="glb")

    logger.info(f"Structured transparent room scene generated: {len(merged_mesh.vertices)} vertices, {len(merged_mesh.faces)} faces.")
    return len(merged_mesh.vertices), len(merged_mesh.faces)


def generate_mesh_and_glb(
    point_cloud_path: Path,
    mesh_dir: Path,
    output_dir: Path,
) -> dict:
    """
    Generate a 3D mesh from a PLY point cloud and export it to GLB.
    Tries Open3D if configured, otherwise falls back to Trimesh.
    """
    logger.info(f"Generating mesh. Input PLY: {point_cloud_path}. Output: {mesh_dir} & {output_dir}")

    # Prepare directories
    mesh_dir.mkdir(parents=True, exist_ok=True)
    output_dir.mkdir(parents=True, exist_ok=True)

    output_mesh_path = mesh_dir / "room.obj"
    output_glb_path = output_dir / "room.glb"

    backend = MESH_BACKEND

    # Check if open3d is available in the environment
    open3d_available = False
    try:
        import open3d as o3d
        open3d_available = True
    except ImportError:
        pass

    if backend == "open3d" and open3d_available:
        try:
            logger.info("Executing Open3D mesh generation (Poisson reconstruction)...")
            import open3d as o3d
            
            # Read point cloud
            pcd = o3d.io.read_point_cloud(str(point_cloud_path))
            
            # Remove outliers
            cl, ind = pcd.remove_statistical_outlier(nb_neighbors=20, std_ratio=2.0)
            pcd_filtered = pcd.select_by_index(ind)
            
            # Estimate normals
            pcd_filtered.estimate_normals(
                search_param=o3d.geometry.KDTreeSearchParamHybrid(radius=0.1, max_ne =30)
            )
            pcd_filtered.orient_normals_consistent_tangent_plane(100)
            
            # Run Poisson Surface Reconstruction
            mesh, densities = o3d.geometry.TriangleMesh.create_from_point_cloud_poisson(
                pcd_filtered, depth=9
            )
            
            # Filter low density vertices
            vertices_to_remove = densities < np.percentile(densities, 5)
            mesh.remove_vertices_by_mask(vertices_to_remove)
            
            # Save mesh
            o3d.io.write_triangle_mesh(str(output_mesh_path), mesh)
            
            # Use Trimesh to export Open3D OBJ to GLB
            tm_mesh = trimesh.load(str(output_mesh_path))
            tm_mesh.export(str(output_glb_path), file_type="glb")
            
            vertices_count = len(mesh.vertices)
            faces_count = len(mesh.triangles)
        except Exception as e:
            logger.warning(f"Open3D mesh generation failed: {e}. Falling back to Trimesh...")
            backend = "trimesh_fallback"
            vertices_count, faces_count = run_trimesh_mesh_generation(
                point_cloud_path, output_mesh_path, output_glb_path
            )
    else:
        if backend == "open3d":
            logger.warning("Open3D selected but not available in Python environment. Falling back to Trimesh...")
            backend = "trimesh_fallback"
        vertices_count, faces_count = run_trimesh_mesh_generation(
            point_cloud_path, output_mesh_path, output_glb_path
        )

    # Get GLB file size
    file_size_bytes = output_glb_path.stat().st_size
    logger.info(f"GLB export complete. File size: {file_size_bytes} bytes. Path: {output_glb_path}")

    return {
        "vertices_count": vertices_count,
        "faces_count": faces_count,
        "file_size_bytes": file_size_bytes,
        "glb_path": str(output_glb_path),
    }
