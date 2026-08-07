'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/** Small rotating 3D brand mark, loaded from the client-supplied GLB. */
export function LogoMark3D({ size = 34 }: { size?: number }) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    renderer.setSize(size, size);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(0, 1.6, 3.4);
    camera.lookAt(0, 0, 0);

    scene.add(new THREE.AmbientLight('#ffffff', 0.5));
    const key = new THREE.DirectionalLight('#ffffff', 1.2);
    key.position.set(2, 3, 2);
    scene.add(key);

    let mark: THREE.Object3D | null = null;
    new GLTFLoader().load('/models/brand-logo.glb', (gltf) => {
      mark = gltf.scene;
      mark.scale.setScalar(0.9);
      scene.add(mark);
    });

    let raf: number;
    const tick = () => {
      if (mark) mark.rotation.y += 0.012;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, [size]);

  return <div ref={mountRef} style={{ width: size, height: size }} aria-hidden />;
}
