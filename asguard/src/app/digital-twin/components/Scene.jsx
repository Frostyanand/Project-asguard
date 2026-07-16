"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useEffect, useRef, useCallback } from "react";
import * as THREE from "three";
import Apartment from "./Apartment";

function CameraController({ activeRoom, roomCenters, viewMode }) {
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3(0, 10, 15));
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0));
  const isAnimating = useRef(false);
  const animationFrames = useRef(0);

  useEffect(() => {
    if (activeRoom && roomCenters && roomCenters[activeRoom]) {
      const center = roomCenters[activeRoom];

      if (viewMode === "interior") {
        // Place camera at eye-level inside the room, offset slightly from center
        targetPos.current.set(center.x + 1.0, center.y + 0.4, center.z + 1.0);
        targetLookAt.current.set(center.x - 0.5, center.y + 0.2, center.z - 0.5);
      } else {
        // Aerial / isometric focus on the selected room
        targetPos.current.set(center.x + 3, center.y + 5, center.z + 5);
        targetLookAt.current.copy(center);
      }
    } else if (roomCenters && roomCenters.all) {
      const center = roomCenters.all;
      targetPos.current.set(center.x, center.y + 10, center.z + 14);
      targetLookAt.current.copy(center);
    } else {
      targetPos.current.set(0, 10, 15);
      targetLookAt.current.set(0, 0, 0);
    }
    // Trigger animation for ~120 frames (~2s at 60fps), then stop so OrbitControls takes over
    isAnimating.current = true;
    animationFrames.current = 0;
  }, [activeRoom, roomCenters, viewMode]);

  useFrame((state) => {
    if (!isAnimating.current) return;

    animationFrames.current++;
    const t = 0.06; // lerp speed

    camera.position.lerp(targetPos.current, t);

    const controls = state.controls;
    if (controls) {
      controls.target.lerp(targetLookAt.current, t);
      controls.update();
    }

    // Stop animating once close enough or after enough frames
    const dist = camera.position.distanceTo(targetPos.current);
    if (dist < 0.05 || animationFrames.current > 150) {
      isAnimating.current = false;
    }
  });

  return null;
}

export default function Scene({
  activeRoom,
  setActiveRoom,
  ceilingVisible,
  focusMode,
  roomCenters,
  setRoomCenters,
  viewMode,
}) {
  return (
    <Canvas
      camera={{
        position: [0, 10, 15],
        fov: 45,
      }}
      shadows
    >
      <ambientLight intensity={1.8} />

      <directionalLight position={[8, 12, 10]} intensity={2.5} castShadow />
      <directionalLight position={[-8, 10, -10]} intensity={1.2} />

      <Apartment
        activeRoom={activeRoom}
        setActiveRoom={setActiveRoom}
        ceilingVisible={ceilingVisible}
        focusMode={focusMode}
        onCentersLoaded={setRoomCenters}
      />

      <CameraController
        activeRoom={activeRoom}
        roomCenters={roomCenters}
        viewMode={viewMode}
      />

      <OrbitControls
        makeDefault
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        maxPolarAngle={Math.PI / 1.5}
        minDistance={0.5}
        maxDistance={30}
        zoomSpeed={1.2}
        rotateSpeed={0.8}
      />
    </Canvas>
  );
}