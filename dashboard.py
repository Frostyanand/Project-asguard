import streamlit as st
import requests
import json
import base64
import os
from pathlib import Path

# Configure Page
st.set_page_config(
    page_title="Video-to-GLB Digital Twin Pipeline",
    page_icon="🏢",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom Premium Styling (Dark Mode Accent)
st.markdown("""
<style>
    .stApp {
        background-color: #0e1117;
        color: #ffffff;
    }
    .main-title {
        font-family: 'Outfit', 'Inter', sans-serif;
        font-weight: 800;
        font-size: 2.8rem;
        background: linear-gradient(135deg, #00f2fe 0%, #4facfe 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 0.5rem;
    }
    .subtitle {
        font-family: 'Inter', sans-serif;
        font-size: 1.1rem;
        color: #8892b0;
        margin-bottom: 2rem;
    }
    .metric-card {
        background-color: #161a23;
        border: 1px solid #232a3b;
        border-radius: 12px;
        padding: 1.2rem;
        margin-bottom: 1rem;
    }
    .status-badge {
        font-weight: bold;
        padding: 0.3rem 0.8rem;
        border-radius: 20px;
        font-size: 0.85rem;
        display: inline-block;
        margin-top: 0.5rem;
    }
    .status-uploaded { background-color: #3b82f6; color: white; }
    .status-extracted { background-color: #8b5cf6; color: white; }
    .status-filtered { background-color: #d946ef; color: white; }
    .status-reconstructed { background-color: #10b981; color: white; }
    .status-completed { background-color: #059669; color: white; }
    .status-failed { background-color: #ef4444; color: white; }
    .status-unknown { background-color: #6b7280; color: white; }
</style>
""", unsafe_allow_html=True)

# Configuration
BACKEND_URL = "http://127.0.0.1:8000"
UPLOADS_DIR = Path("uploads")

# Header
st.markdown('<div class="main-title">Video-to-GLB Digital Twin Pipeline</div>', unsafe_allow_html=True)
st.markdown('<div class="subtitle">Convert smartphone room-scanning videos into high-quality interactive 3D GLB assets</div>', unsafe_allow_html=True)

# Helper function to get status badge class
def get_status_class(status: str) -> str:
    status = status.lower()
    if "upload" in status:
        return "status-uploaded"
    elif "extract" in status:
        return "status-extracted"
    elif "filter" in status:
        return "status-filtered"
    elif "reconstruct" in status or "dense" in status:
        return "status-reconstructed"
    elif "complete" in status:
        return "status-completed"
    elif "fail" in status:
        return "status-failed"
    else:
        return "status-unknown"

# Sidebar Workspace Selection
st.sidebar.title("Pipeline Controls")

mode = st.sidebar.radio("Select Input Mode", ["Use Existing Scan Workspace", "Upload New Video"])

selected_scan_id = None

if mode == "Use Existing Scan Workspace":
    st.sidebar.subheader("Select Workspace")
    if UPLOADS_DIR.exists():
        scan_folders = [f.name for f in UPLOADS_DIR.iterdir() if f.is_dir()]
    else:
        scan_folders = []
        
    if scan_folders:
        selected_scan_id = st.sidebar.selectbox("Choose a Scan ID", scan_folders)
    else:
        st.sidebar.info("No existing workspaces found. Please upload a new video.")
else:
    st.sidebar.subheader("Upload Room Scan")
    uploaded_file = st.sidebar.file_uploader("Upload video (.mp4, .mov, .avi)", type=["mp4", "mov", "avi"])
    if uploaded_file is not None:
        if st.sidebar.button("Upload & Initialize Pipeline"):
            with st.spinner("Uploading video and establishing workspace..."):
                try:
                    files = {"video": (uploaded_file.name, uploaded_file.getvalue(), uploaded_file.type)}
                    r = requests.post(f"{BACKEND_URL}/scan/upload", files=files)
                    if r.status_code == 200:
                        res = r.json()
                        st.sidebar.success(f"Uploaded successfully! ID: {res['scan_id']}")
                        # Set active scan
                        st.session_state["active_scan_id"] = res["scan_id"]
                        st.rerun()
                    else:
                        st.sidebar.error(f"Upload failed: {r.json().get('detail', 'Unknown error')}")
                except Exception as e:
                    st.sidebar.error(f"Error connecting to backend: {e}")

if "active_scan_id" in st.session_state and mode == "Upload New Video":
    selected_scan_id = st.session_state["active_scan_id"]

# Main dashboard body
if selected_scan_id:
    # 1. Fetch current status
    status_response = requests.get(f"{BACKEND_URL}/scan/{selected_scan_id}/status")
    if status_response.status_code == 200:
        scan_data = status_response.json()
        status = scan_data["status"]
        metadata = scan_data["metadata"]
        
        # Display Overview Panels
        col1, col2 = st.columns([1, 1.5])
        
        with col1:
            st.subheader("Scan Workspace Overview")
            st.markdown(f"""
            <div class="metric-card">
                <strong>Scan ID:</strong> <code>{selected_scan_id}</code><br>
                <strong>Status:</strong> <span class="status-badge {get_status_class(status)}">{status.upper()}</span><br>
                <hr style="border: 0; border-top: 1px solid #232a3b; margin: 10px 0;">
                <strong>Video Filename:</strong> {metadata.get('filename', 'N/A')}<br>
                <strong>Resolution:</strong> {metadata.get('width', 'N/A')}x{metadata.get('height', 'N/A')}<br>
                <strong>Duration:</strong> {metadata.get('duration', 'N/A')} seconds<br>
                <strong>Original FPS:</strong> {metadata.get('fps', 'N/A')}<br>
            </div>
            """, unsafe_allow_html=True)
            
            # Show warnings if any
            warnings = metadata.get("warnings", [])
            if warnings:
                with st.expander("⚠️ Pipeline Warnings", expanded=True):
                    for w in warnings:
                        st.warning(w)

            # Manual Action Buttons
            st.subheader("Orchestration Console")
            
            # Button states based on status
            btn_extract = st.button("1. Extract Frames", disabled=(status not in ["uploaded", "failed"]))
            btn_filter = st.button("2. Filter Blurry & Duplicate Frames", disabled=(status not in ["frames_extracted", "failed"]))
            btn_reconstruct = st.button("3. Reconstruct 3D Point Cloud", disabled=(status not in ["frames_filtered", "failed"]))
            btn_mesh = st.button("4. Generate Mesh & Export GLB", disabled=(status not in ["dense_point_cloud_generated", "failed"]))
            
            st.markdown("---")
            run_all = st.button("🚀 Run Full Remaining Pipeline")

            # Button Actions
            if btn_extract:
                with st.spinner("Extracting video frames..."):
                    r = requests.post(f"{BACKEND_URL}/scan/{selected_scan_id}/extract-frames")
                    if r.status_code == 200:
                        st.success("Frame extraction completed!")
                        st.rerun()
                    else:
                        st.error(f"Frame extraction failed: {r.json().get('detail')}")

            if btn_filter:
                with st.spinner("Filtering frames..."):
                    r = requests.post(f"{BACKEND_URL}/scan/{selected_scan_id}/filter-frames")
                    if r.status_code == 200:
                        st.success("Quality filter completed!")
                        st.rerun()
                    else:
                        st.error(f"Quality filter failed: {r.json().get('detail')}")

            if btn_reconstruct:
                with st.spinner("Reconstructing 3D Point Cloud (ORB SfM fallback)..."):
                    r = requests.post(f"{BACKEND_URL}/scan/{selected_scan_id}/reconstruct")
                    if r.status_code == 200:
                        st.success("Reconstruction completed!")
                        st.rerun()
                    else:
                        st.error(f"Reconstruction failed: {r.json().get('detail')}")

            if btn_mesh:
                with st.spinner("Generating 3D mesh & exporting GLB..."):
                    r = requests.post(f"{BACKEND_URL}/scan/{selected_scan_id}/generate-glb")
                    if r.status_code == 200:
                        st.success("Mesh & GLB exported successfully!")
                        st.rerun()
                    else:
                        st.error(f"Mesh/GLB generation failed: {r.json().get('detail')}")

            if run_all:
                steps = [
                    ("Extracting frames...", f"{BACKEND_URL}/scan/{selected_scan_id}/extract-frames", ["uploaded"]),
                    ("Analyzing frame quality...", f"{BACKEND_URL}/scan/{selected_scan_id}/filter-frames", ["frames_extracted"]),
                    ("Reconstructing 3D space...", f"{BACKEND_URL}/scan/{selected_scan_id}/reconstruct", ["frames_filtered"]),
                    ("Generating mesh and GLB asset...", f"{BACKEND_URL}/scan/{selected_scan_id}/generate-glb", ["dense_point_cloud_generated"])
                ]
                
                # Fetch fresh status before starting loop
                current_status = status
                for name, endpoint, allowed in steps:
                    if current_status in allowed or current_status == "failed":
                        with st.spinner(name):
                            r = requests.post(endpoint)
                            if r.status_code == 200:
                                # Fetch updated status
                                stat_r = requests.get(f"{BACKEND_URL}/scan/{selected_scan_id}/status")
                                if stat_r.status_code == 200:
                                    current_status = stat_r.json()["status"]
                            else:
                                st.error(f"Pipeline failed at step '{name}': {r.json().get('detail')}")
                                break
                st.success("Pipeline execution run finished!")
                st.rerun()

        with col2:
            st.subheader("Pipeline Stage Details")
            
            # Show detail information of pipeline stages
            tabs = st.tabs(["Frames Data", "Point Cloud", "GLB Digital Twin"])
            
            with tabs[0]:
                st.markdown("### Frame Sampling Statistics")
                if "frames_extracted" in metadata:
                    st.write(f"- **Frames Extracted:** {metadata['frames_extracted']} frames")
                    st.write(f"- **Target Sampling Rate:** {metadata.get('target_fps')} FPS")
                else:
                    st.info("Frames have not been extracted yet.")
                    
                if "frames_filtered" in metadata:
                    st.markdown("---")
                    st.markdown("### Quality Filter Statistics")
                    st.write(f"- **Original Frames:** {metadata['original_frames']}")
                    st.write(f"- **Kept (Sharp/Distinct):** {metadata['frames_filtered']}")
                    st.write(f"- **Blurry Removed:** {metadata['blurry_frames_removed']} (Laplacian variance < threshold)")
                    st.write(f"- **Duplicates Removed:** {metadata['duplicate_frames_removed']} (HSV Histogram correlation > threshold)")
                elif status == "frames_extracted":
                    st.info("Quality filtering is ready to run.")
            
            with tabs[1]:
                st.markdown("### 3D Point Cloud Details")
                if "points_count" in metadata:
                    st.write(f"- **Points Reconstructed:** {metadata['points_count']} vertices")
                    st.write(f"- **Reconstruction Backend:** `{metadata.get('backend')}`")
                    
                    # Optional: Render point cloud summary
                    st.info("Point cloud generated successfully. Proceed to Mesh Generation to build the watertight surface model.")
                else:
                    st.info("Point cloud has not been reconstructed yet.")
            
            with tabs[2]:
                st.markdown("### Interactive 3D Digital Twin GLB Showcase")
                if status.lower() == "completed" or "glb_path" in metadata:
                    st.write(f"- **Mesh Vertices:** {metadata.get('vertices_count')}")
                    st.write(f"- **Mesh Faces (Triangles):** {metadata.get('faces_count')}")
                    st.write(f"- **GLB Asset Size:** {metadata.get('file_size_bytes', 0) / 1024:.2f} KB")
                    
                    # Fetch and base64-encode model bytes
                    try:
                        dl_r = requests.get(f"{BACKEND_URL}/scan/{selected_scan_id}/download")
                        if dl_r.status_code == 200:
                            glb_base64 = base64.b64encode(dl_r.content).decode("utf-8")
                            data_uri = f"data:model/gltf-binary;base64,{glb_base64}"
                            
                            # Google Model-Viewer iframe embedding
                            html_code = f"""
                            <script type="module" src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.4.0/model-viewer.min.js"></script>
                            <style>
                                body {{
                                    margin: 0;
                                    background-color: #0e1117;
                                    display: flex;
                                    justify-content: center;
                                    align-items: center;
                                }}
                                model-viewer {{
                                    width: 100vw;
                                    height: 100vh;
                                    background-color: #161a23;
                                    border: 1px solid #232a3b;
                                    border-radius: 12px;
                                }}
                            </style>
                            <model-viewer 
                                src="{data_uri}" 
                                alt="Reconstructed 3D Digital Twin" 
                                auto-rotate 
                                camera-controls 
                                shadow-intensity="1.5" 
                                exposure="1.0"
                                environment-image="neutral"
                                interaction-prompt="auto">
                            </model-viewer>
                            """
                            # Embed in Streamlit iframe (height 550px)
                            st.components.v1.html(html_code, height=550)
                            
                            # Download Button
                            st.markdown(f'<a href="{BACKEND_URL}/scan/{selected_scan_id}/download" target="_blank"><button style="background-color: #059669; color: white; border: none; padding: 0.6rem 1.2rem; border-radius: 6px; font-weight: bold; cursor: pointer; width: 100%;">📥 Download Reconstructed room.glb Asset</button></a>', unsafe_allow_html=True)
                        else:
                            st.error("Failed to load GLB bytes from backend.")
                    except Exception as err:
                        st.error(f"Error loading 3D viewer: {err}")
                else:
                    st.info("Reconstructed GLB will be displayed here once mesh generation is completed.")

    else:
        st.error("Failed to retrieve workspace status. Is the FastAPI server running?")
else:
    st.info("Please select an existing workspace scan ID from the sidebar or upload a new scan video to begin the pipeline.")
