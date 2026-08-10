'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGarment } from './GarmentLoader';

const GARMENT_URL = '/models/kurti.glb';
const TARGET_HEIGHT = 2.4;

/**
 * A single garment in the fashion scene.
 *
 *     OutfitModel -> GarmentLoader -> kurti.glb
 *
 * The props are deliberately unchanged from the original placeholder
 * version (x / color / progress / delay) so FashionScene needed no edits
 * when the placeholder ExtrudeGeometry was replaced by the real GLB.
 *
 * `color` is now an optional tint multiplied over the garment's own printed
 * texture rather than a flat fill — passing white leaves the print untouched.
 */
export function OutfitModel({
  x,
  color,
  progress,
  delay = 0,
  tintStrength = 0.0,
}: {
  x: number;
  color: string;
  progress: React.RefObject<number>;
  delay?: number;
  tintStrength?: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const garment = useGarment(GARMENT_URL, TARGET_HEIGHT);
  const tint = useRef(new THREE.Color(color));

  useFrame((state) => {
    const p = Math.max(0, (progress.current ?? 0) - delay);
    // Same reveal window and easing as the placeholder used, so the scroll
    // choreography in FashionScene keeps its existing timing.
    const reveal = Math.min(1, Math.max(0, (p - 0.4) / 0.35));
    const eased = reveal * reveal * (3 - 2 * reveal);

    const g = groupRef.current;
    if (!g) return;

    g.position.x = x;
    g.position.y = (1 - eased) * -0.4;
    g.scale.setScalar(0.85 + eased * 0.15);
    g.rotation.y = Math.sin(state.clock.elapsedTime * 0.4 + x) * 0.06;

    g.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (!mat) return;
      mat.transparent = true;
      mat.opacity = eased;
      if (tintStrength > 0) mat.color.lerp(tint.current, tintStrength);
    });
  });

  return (
    <group ref={groupRef}>
      <primitive object={garment} />
    </group>
  );
}
