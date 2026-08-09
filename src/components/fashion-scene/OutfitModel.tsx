'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Placeholder garment — real volumetric mesh (ExtrudeGeometry with depth,
 * not a flat outline), swappable later for a real GLB without touching
 * the animation/scroll code: replace the <mesh> body here with
 * <primitive object={gltf.scene} /> and this component's public props
 * (x offset, color, progress) stay identical.
 *
 * Honest note: this is placeholder geometry per the brief's own fallback
 * clause — it reads as a stylized garment silhouette with real shading,
 * not photoreal cloth. Actual photoreal results need a modeled/rigged
 * GLB (CLO3D/Marvelous Designer export), which isn't something generated
 * from scratch here.
 */
function garmentShape() {
  const shape = new THREE.Shape();
  shape.moveTo(-0.18, 1.0);
  shape.bezierCurveTo(-0.48, 0.9, -0.48, 0.7, -0.42, 0.62);
  shape.bezierCurveTo(-0.3, 0.68, -0.24, 0.55, -0.28, 0.35);
  shape.bezierCurveTo(-0.5, 0.1, -0.5, -0.15, -0.34, -0.35);
  shape.lineTo(-0.16, -0.5);
  shape.lineTo(-0.22, -1.3);
  shape.lineTo(-0.1, -1.55);
  shape.lineTo(0.1, -1.55);
  shape.lineTo(0.22, -1.3);
  shape.lineTo(0.16, -0.5);
  shape.bezierCurveTo(0.34, -0.35, 0.5, -0.15, 0.5, -0.1);
  shape.bezierCurveTo(0.5, 0.1, 0.3, 0.15, 0.28, 0.35);
  shape.bezierCurveTo(0.24, 0.55, 0.3, 0.68, 0.42, 0.62);
  shape.bezierCurveTo(0.48, 0.7, 0.48, 0.9, 0.18, 1.0);
  shape.bezierCurveTo(0.1, 0.94, -0.1, 0.94, -0.18, 1.0);
  return shape;
}

export function OutfitModel({
  x,
  color,
  progress,
  delay = 0,
}: {
  x: number;
  color: string;
  progress: React.RefObject<number>;
  delay?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  const geometry = useMemo(() => {
    const shape = garmentShape();
    return new THREE.ExtrudeGeometry(shape, {
      depth: 0.14,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.015,
      bevelSegments: 3,
      curveSegments: 24,
    });
  }, []);

  useFrame((state) => {
    const p = Math.max(0, (progress.current ?? 0) - delay);
    // Reveals as the fabric assembles (0.4-0.75), then the whole group
    // gets the scroll-orbit treatment in CameraController — this mesh
    // itself just fades/scales in and does a gentle idle sway.
    const reveal = Math.min(1, Math.max(0, (p - 0.4) / 0.35));
    const eased = reveal * reveal * (3 - 2 * reveal);
    if (!meshRef.current) return;
    meshRef.current.scale.setScalar(0.85 + eased * 0.15);
    meshRef.current.position.x = x;
    meshRef.current.position.y = (1 - eased) * -0.4;
    meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.4 + x) * 0.06;
    const mat = meshRef.current.material as THREE.MeshStandardMaterial;
    mat.opacity = eased;
  });

  return (
    <mesh ref={meshRef} geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial color={color} roughness={0.55} metalness={0.05} transparent opacity={0} />
    </mesh>
  );
}
