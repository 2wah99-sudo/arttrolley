'use client';

import { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { useScrollTimeline } from './ScrollAnimation';
import { FabricTransition } from './FabricTransition';
import { OutfitModel } from './OutfitModel';
import { CameraController } from './CameraController';

const MADDER = '#A8291F';
const BLUSH = '#F2C4BB';
const CREAM = '#DBC9B1';

/**
 * The pinned, full-viewport scene. Composition mirrors the reference
 * video's cinematic-fashion-film language: key + soft fill + rim light,
 * neutral cream backdrop, minimal UI — the 3D content carries the scene.
 */
export function FashionScene() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const progress = useScrollTimeline(sectionRef, 400);

  return (
    <div ref={sectionRef} className="relative h-screen w-full overflow-hidden" style={{ background: CREAM }}>
      <Canvas
        shadows
        camera={{ position: [0, 0, 7], fov: 42 }}
        dpr={[1, 2]}
        gl={{ antialias: true }}
      >
        <color attach="background" args={[CREAM]} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[3, 4, 4]} intensity={1.3} castShadow shadow-mapSize={[1024, 1024]} />
        <directionalLight position={[-3, 1, -2]} intensity={0.4} color={BLUSH} />
        <pointLight position={[0, -2, 3]} intensity={0.25} color={MADDER} />

        <FabricTransition progress={progress} />
        <OutfitModel x={-1.3} color={MADDER} progress={progress} />
        <OutfitModel x={1.3} color="#EDE3D3" progress={progress} delay={0.05} />
        <CameraController progress={progress} />
      </Canvas>

      <p
        className="pointer-events-none absolute bottom-14 left-1/2 -translate-x-1/2 text-xs uppercase tracking-[0.3em]"
        style={{ color: 'rgba(168,41,31,.7)' }}
      >
        Four threads. Two dresses. Scroll to pull them together.
      </p>
    </div>
  );
}
