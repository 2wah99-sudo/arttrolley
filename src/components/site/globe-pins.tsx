'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

const GLOBE_R = 1.9;
const BLUE = '#4FC3F7';
const BLUE_DEEP = '#1B6CA8';

/** Artisan clusters ARTTROLLEY actually sources from. */
const PINS = [
  { id: 'bagru', label: 'Bagru, Rajasthan', line1: 'Hand block · natural dye', line2: '14 karigar families', lat: 26.81, lon: 75.55 },
  { id: 'kutch', label: 'Kutch, Gujarat', line1: 'Ajrakh resist printing', line2: 'Indigo & madder', lat: 23.24, lon: 69.67 },
  { id: 'jaipur', label: 'Jaipur, Rajasthan', line1: 'Sanganeri motifs', line2: 'Studio & finishing', lat: 26.91, lon: 75.79 },
];

/** lat/lon (degrees) -> point on a sphere of radius r */
function latLonToVec3(lat: number, lon: number, r: number) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  );
}

/** Soft radial sprite so each dot reads as a glow, not a hard square — this is what
 *  gives the bloom look without pulling in a postprocessing pass. */
function useGlowTexture() {
  return useMemo(() => {
    const size = 64;
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d')!;
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.25, 'rgba(180,235,255,0.85)');
    g.addColorStop(0.55, 'rgba(79,195,247,0.35)');
    g.addColorStop(1, 'rgba(79,195,247,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    return tex;
  }, []);
}

/** Samples an equirectangular earth image and emits a dot wherever there's land. */
function LandDots({ glow }: { glow: THREE.Texture }) {
  const [positions, setPositions] = useState<Float32Array | null>(null);
  const ref = useRef<THREE.Points>(null);

  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = '/textures/earth-dark.jpg';
    img.onload = () => {
      if (cancelled) return;
      const W = 420, H = 210;
      const c = document.createElement('canvas');
      c.width = W; c.height = H;
      const ctx = c.getContext('2d', { willReadFrequently: true })!;
      ctx.drawImage(img, 0, 0, W, H);
      const data = ctx.getImageData(0, 0, W, H).data;

      const pts: number[] = [];
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const i = (y * W + x) * 4;
          // earth-dark.jpg: land is lighter than ocean
          const lum = (data[i] + data[i + 1] + data[i + 2]) / 3;
          if (lum < 42) continue;
          const lat = 90 - (y / H) * 180;
          const lon = (x / W) * 360 - 180;
          const v = latLonToVec3(lat, lon, GLOBE_R);
          pts.push(v.x, v.y, v.z);
        }
      }
      setPositions(new Float32Array(pts));
    };
    return () => { cancelled = true; };
  }, []);

  if (!positions) return null;

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.032}
        map={glow}
        color={BLUE}
        transparent
        opacity={0.95}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}

/** Great-circle arc between two pins with a bright head that travels along it — the trail. */
function ArcTrail({ from, to, delay = 0 }: { from: THREE.Vector3; to: THREE.Vector3; delay?: number }) {
  const curve = useMemo(() => {
    const mid = from.clone().add(to).multiplyScalar(0.5);
    const lift = 1 + from.distanceTo(to) * 0.22;
    mid.normalize().multiplyScalar(GLOBE_R * lift);
    return new THREE.QuadraticBezierCurve3(from, mid, to);
  }, [from, to]);

  const pts = useMemo(() => curve.getPoints(120), [curve]);
  // Build the Line once — constructing it inline on every render leaks GPU resources.
  const line = useMemo(() => new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(pts),
    new THREE.LineBasicMaterial({
      color: BLUE_DEEP,
      transparent: true,
      opacity: 0.28,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  ), [pts]);
  const headRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = ((clock.getElapsedTime() * 0.28 + delay) % 1);
    const p = curve.getPoint(t);
    if (headRef.current) {
      headRef.current.position.copy(p);
      const fade = Math.sin(t * Math.PI);
      headRef.current.scale.setScalar(0.035 + fade * 0.03);
      (headRef.current.material as THREE.MeshBasicMaterial).opacity = fade;
    }
  });

  return (
    <group>
      <primitive object={line} />
      <mesh ref={headRef}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshBasicMaterial
          color={'#BFEBFF'}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function Pin({ pin, onHover }: { pin: (typeof PINS)[number]; onHover: (id: string | null) => void }) {
  const pos = useMemo(() => latLonToVec3(pin.lat, pin.lon, GLOBE_R * 1.015), [pin]);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (ringRef.current) {
      const s = 1 + ((t * 0.6) % 1) * 1.8;
      ringRef.current.scale.setScalar(s);
      (ringRef.current.material as THREE.MeshBasicMaterial).opacity = 0.5 * (1 - ((t * 0.6) % 1));
    }
  });

  return (
    <group position={pos}>
      <mesh>
        <sphereGeometry args={[0.028, 16, 16]} />
        <meshBasicMaterial color={'#DFF5FF'} transparent blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      {/* expanding halo — a sphere so it needs no orientation and reads from every angle */}
      <mesh ref={ringRef}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshBasicMaterial color={BLUE} transparent blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <Html distanceFactor={7} position={[0.12, 0.12, 0]}>
        <div
          onMouseEnter={() => onHover(pin.id)}
          onMouseLeave={() => onHover(null)}
          style={{
            width: 190,
            padding: '10px 12px',
            borderRadius: 12,
            background: 'rgba(10,22,32,.72)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(79,195,247,.35)',
            boxShadow: '0 0 0 1px rgba(79,195,247,.10), 0 12px 40px rgba(27,108,168,.35)',
            color: '#EAF7FF',
            fontSize: 11,
            lineHeight: 1.45,
            pointerEvents: 'auto',
            userSelect: 'none',
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 2 }}>{pin.label}</div>
          <div style={{ color: 'rgba(191,235,255,.72)' }}>{pin.line1}</div>
          <div style={{ color: 'rgba(191,235,255,.55)' }}>{pin.line2}</div>
        </div>
      </Html>
    </group>
  );
}

function Scene() {
  const glow = useGlowTexture();
  const groupRef = useRef<THREE.Group>(null);
  const [, setHovered] = useState<string | null>(null);
  const { camera } = useThree();

  useEffect(() => { camera.position.set(0, 0.6, 5.2); }, [camera]);

  useFrame((_, dt) => {
    if (groupRef.current) groupRef.current.rotation.y += dt * 0.055;
  });

  const arcs = useMemo(() => {
    const v = PINS.map((p) => latLonToVec3(p.lat, p.lon, GLOBE_R));
    return [
      { from: v[0], to: v[1], delay: 0 },
      { from: v[1], to: v[2], delay: 0.33 },
      { from: v[2], to: v[0], delay: 0.66 },
    ];
  }, []);

  return (
    <>
      <ambientLight intensity={0.6} />
      <group ref={groupRef}>
        {/* inner sphere so back-side dots are occluded and the globe reads as solid */}
        <mesh>
          <sphereGeometry args={[GLOBE_R * 0.985, 48, 48]} />
          <meshBasicMaterial color={'#04080D'} />
        </mesh>
        {/* atmospheric rim */}
        <mesh>
          <sphereGeometry args={[GLOBE_R * 1.06, 48, 48]} />
          <meshBasicMaterial
            color={BLUE_DEEP}
            transparent
            opacity={0.10}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
        <LandDots glow={glow} />
        {arcs.map((a, i) => <ArcTrail key={i} from={a.from} to={a.to} delay={a.delay} />)}
        {PINS.map((p) => <Pin key={p.id} pin={p} onHover={setHovered} />)}
      </group>
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        rotateSpeed={0.45}
        minPolarAngle={Math.PI * 0.22}
        maxPolarAngle={Math.PI * 0.78}
      />
    </>
  );
}

export function GlobePins() {
  return (
    <section className="relative overflow-hidden px-6 py-24" style={{ background: '#03070C' }}>
      <div className="mx-auto max-w-2xl pb-6 text-center">
        <p className="text-[0.62rem] uppercase tracking-[0.36em]" style={{ color: 'rgba(79,195,247,.75)' }}>
          Where it&apos;s made
        </p>
        <h2 className="mt-3 text-3xl font-semibold sm:text-5xl" style={{ color: '#EAF7FF' }}>
          Every print has an address.
        </h2>
        <p className="mt-4 text-sm font-light" style={{ color: 'rgba(191,235,255,.55)' }}>
          Drag the globe. These are the workshops our blocks, dyes and cloth actually come from.
        </p>
      </div>

      <div className="relative mx-auto" style={{ height: '62vh', maxHeight: 620, maxWidth: 1100 }}>
        <Canvas
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: true }}
          camera={{ fov: 42, position: [0, 0.6, 5.2] }}
          resize={{ debounce: 0 }}
          style={{ width: '100%', height: '100%', display: 'block' }}
        >
          <Scene />
        </Canvas>
        {/* vignette so the globe sits in the dark rather than on a flat panel */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at center, transparent 52%, #03070C 88%)' }}
        />
      </div>
    </section>
  );
}
