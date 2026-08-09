'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

/**
 * Cinematic camera: dolly + orbit driven by scroll progress, damped
 * (lerped toward target every frame) rather than jumping directly to the
 * scroll-derived position — that damping is what reads as "camera" motion
 * instead of "object teleporting." Reverses naturally since target is a
 * pure function of progress.
 */
export function CameraController({ progress }: { progress: React.RefObject<number> }) {
  const { camera } = useThree();
  const current = useRef(new THREE.Vector3(0, 0, 7));
  const lookTarget = useRef(new THREE.Vector3(0, -0.1, 0));

  useFrame(() => {
    const p = progress.current ?? 0;
    // 0-0.55: fabric assembling — camera holds a steady establishing shot.
    // 0.55-1: garments formed — camera dollies in and orbits around them.
    const orbitP = Math.max(0, (p - 0.55) / 0.45);
    const eased = orbitP * orbitP * (3 - 2 * orbitP);
    const angle = eased * Math.PI * 0.55;

    const radius = 7 - eased * 2.2;
    const target = new THREE.Vector3(Math.sin(angle) * radius, 0.3 * eased, Math.cos(angle) * radius);
    current.current.lerp(target, 0.06);
    camera.position.copy(current.current);
    lookTarget.current.lerp(new THREE.Vector3(0, -0.1, 0), 0.06);
    camera.lookAt(lookTarget.current);
  });

  return null;
}
