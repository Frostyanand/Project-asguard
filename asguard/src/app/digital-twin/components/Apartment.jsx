"use client";

import { useGLTF, Html } from "@react-three/drei";
import { useEffect, useMemo, useState, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const getRoomId = (nodeName) => {
  if (nodeName.includes("Chambre01") || nodeName.includes("Lit") || nodeName.includes("Object_8")) return "A";
  if (nodeName.includes("Quartos") || nodeName.includes("Object_10")) return "B";
  if (nodeName === "Object_12") return "C";
  if (nodeName.includes("Banheiros") || nodeName.includes("Corredor") || nodeName.includes("Object_4")) return "D";
  if (nodeName === "Object_13") return "E";
  if (nodeName.includes("Teto_1") || nodeName.includes("Object_6")) return "F";
  return null;
};

const roomLabels = {
  A: { name: "Bedroom 1", letter: "A" },
  B: { name: "Bedroom 2", letter: "B" },
  C: { name: "Kitchen", letter: "C" },
  D: { name: "Bathroom & Corridor", letter: "D" },
  E: { name: "Living Room", letter: "E" }
};

export default function Apartment({ activeRoom, setActiveRoom, ceilingVisible, focusMode, onCentersLoaded }) {
  const { scene } = useGLTF("/models/apartment.glb");
  const [hoveredRoom, setHoveredRoom] = useState(null);
  const groupRef = useRef();

  // Slow float & sway animation for dynamic digital twin effect
  useFrame((state) => {
    if (groupRef.current) {
      const time = state.clock.getElapsedTime();
      // Reduce amplitude when a specific room is selected for camera focus stability
      const ampY = (!activeRoom || activeRoom === "all") ? 0.12 : 0.02;
      const ampRot = (!activeRoom || activeRoom === "all") ? 0.015 : 0.003;

      groupRef.current.position.y = Math.sin(time * 0.8) * ampY;
      groupRef.current.rotation.y = Math.sin(time * 0.25) * ampRot;
    }
  });

  // Clone materials so they can be modified individually without sharing state
  const clonedMaterials = useMemo(() => {
    scene.traverse((node) => {
      if (node.isMesh && node.material) {
        const m = node.material.clone();
        m.transparent = true;
        m.opacity = 1.0;
        node.material = m;
      }
    });
    return true;
  }, [scene]);

  // Compute room centers and sizes dynamically
  const roomData = useMemo(() => {
    const data = {};
    scene.traverse((node) => {
      if (node.isMesh) {
        const roomId = getRoomId(node.name);
        if (roomId && roomId !== "F") {
          const box = new THREE.Box3().setFromObject(node);
          const center = new THREE.Vector3();
          box.getCenter(center);
          const size = new THREE.Vector3();
          box.getSize(size);
          
          // Accumulate meshes for same roomId to find collective bounding box
          if (!data[roomId]) {
            data[roomId] = { meshes: [node], center, size };
          } else {
            data[roomId].meshes.push(node);
          }
        }
      }
    });

    // Re-evaluate combined centers and sizes
    Object.keys(data).forEach((roomId) => {
      const box = new THREE.Box3();
      data[roomId].meshes.forEach((mesh) => {
        box.expandByObject(mesh);
      });
      const center = new THREE.Vector3();
      box.getCenter(center);
      const size = new THREE.Vector3();
      box.getSize(size);
      data[roomId].center = center;
      data[roomId].size = size;
    });

    return data;
  }, [scene]);

  // Notify parent of room centers for camera tracking
  useEffect(() => {
    if (onCentersLoaded && Object.keys(roomData).length > 0) {
      const centers = {};
      Object.entries(roomData).forEach(([roomId, info]) => {
        centers[roomId] = info.center;
      });

      // Compute collective center of the entire apartment for perfect default centering
      const box = new THREE.Box3().setFromObject(scene);
      const collectiveCenter = new THREE.Vector3();
      box.getCenter(collectiveCenter);
      centers.all = collectiveCenter;

      onCentersLoaded(centers);
    }
  }, [roomData, onCentersLoaded, scene]);

  // Update opacity, visibility, and emissive highlights dynamically
  useEffect(() => {
    scene.traverse((node) => {
      if (node.isMesh) {
        const roomId = getRoomId(node.name);

        if (roomId === "F") {
          node.visible = ceilingVisible;
          return;
        }

        node.visible = true;

        if (node.material) {
          if (!activeRoom || activeRoom === "all") {
            node.material.opacity = 1.0;
            if (node.material.emissive) {
              node.material.emissive.setHex(0x000000);
            }
          } else if (roomId === activeRoom) {
            node.material.opacity = 1.0;
            if (node.material.emissive) {
              node.material.emissive.setHex(0x2189ff);
              node.material.emissiveIntensity = 0.45;
            }
          } else {
            node.material.opacity = focusMode ? 0.12 : 1.0;
            if (node.material.emissive) {
              node.material.emissive.setHex(0x000000);
            }
          }

          // Apply temporary hover glow
          if (hoveredRoom && roomId === hoveredRoom && roomId !== activeRoom) {
            if (node.material.emissive) {
              node.material.emissive.setHex(0x2189ff);
              node.material.emissiveIntensity = 0.2;
            }
          }
        }
      }
    });
  }, [scene, activeRoom, focusMode, ceilingVisible, hoveredRoom]);

  return (
    <group ref={groupRef}>
      <primitive
        object={scene}
        onClick={(e) => {
          e.stopPropagation();
          const roomId = getRoomId(e.object.name);
          if (roomId && roomId !== "F") {
            setActiveRoom(roomId);
          }
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          const roomId = getRoomId(e.object.name);
          if (roomId && roomId !== "F") {
            setHoveredRoom(roomId);
            document.body.style.cursor = "pointer";
          }
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHoveredRoom(null);
          document.body.style.cursor = "auto";
        }}
      />

      {/* Floating 3D/HTML Badges */}
      {Object.entries(roomData).map(([roomId, info]) => {
        const isActive = activeRoom === roomId;
        const labelInfo = roomLabels[roomId];
        if (!labelInfo) return null;

        // Position slightly above the top of the room's mesh
        const position = [info.center.x, info.center.y + info.size.y / 2 + 0.6, info.center.z];

        return (
          <Html
            key={roomId}
            position={position}
            center
            distanceFactor={8}
            style={{ zIndex: 5 }}
            className="pointer-events-none select-none"
          >
            <div className="flex flex-col items-center group pointer-events-auto">
              {/* Tooltip */}
              <div className="mb-2 px-2 py-1 rounded bg-slate-900/90 text-white text-[10px] font-bold tracking-wider uppercase whitespace-nowrap shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                {labelInfo.name}
              </div>
              
              {/* Badge Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveRoom(roomId);
                }}
                className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-[13px] shadow-lg transition-all duration-300 border-2 active:scale-95 cursor-pointer
                  ${isActive
                    ? "bg-[#1428A0] text-white border-white ring-4 ring-[#1428A0]/30 scale-110"
                    : "bg-white/95 text-[#1428A0] border-[#1428A0] hover:bg-[#1428A0] hover:text-white hover:border-white hover:scale-105"
                  }`}
              >
                {labelInfo.letter}
              </button>
            </div>
          </Html>
        );
      })}
    </group>
  );
}