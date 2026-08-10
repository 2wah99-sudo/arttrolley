'use client';

import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Abstraction layer between the scene and whatever GLB currently represents
 * a garment:
 *
 *     OutfitModel -> GarmentLoader -> kurti.glb
 *
 * Swapping in a different (or professionally authored) garment is a change
 * of `url` only — no scene, animation or scroll code needs to change.
 *
 * Handles the two things every externally authored GLB gets wrong relative
 * to a scene's expectations: world position and scale. The Blender kurti is
 * built at real-world scale sitting on a 1.65m figure (roughly z 0.62..1.38),
 * so it is recentred on its own bounding box and normalised to a target
 * height here rather than hard-coding magic offsets at each call site.
 */
export function useGarment(url: string, targetHeight: number) {
  const { scene } = useGLTF(url);

  return useMemo(() => {
    const root = scene.clone(true);

    const box = new THREE.Box3().setFromObject(root);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    const scale = size.y > 0 ? targetHeight / size.y : 1;

    // Wrapper so the caller can position/rotate freely without fighting the
    // recentring transform applied to the model itself.
    const group = new THREE.Group();
    root.position.set(-center.x, -center.y, -center.z);
    root.scale.setScalar(1);
    group.add(root);
    group.scale.setScalar(scale);

    root.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      // Materials are shared across clones by default, so animating opacity
      // on one instance would bleed into every other instance of the same
      // GLB. Clone per instance to keep the two garments independent.
      mesh.material = Array.isArray(mesh.material)
        ? mesh.material.map((mm) => mm.clone())
        : mesh.material.clone();
    });

    return group;
  }, [scene, targetHeight]);
}

export function preloadGarment(url: string) {
  useGLTF.preload(url);
}
