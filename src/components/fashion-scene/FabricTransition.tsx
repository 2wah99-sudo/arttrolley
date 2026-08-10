'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const MADDER = '#A8291F';
// The ivory garment's threads read as a warm taupe rather than actual
// cream: flat cream lines on the cream (#DBC9B1) backdrop had almost zero
// contrast and disappeared. This is the shadow-tone of ivory fabric, so it
// still belongs to the same garment while staying legible.
const IVORY_THREAD = '#8C7150';
const VERTS = 18; // enough segments that a hanging strand curves smoothly
const THREADS_PER_GARMENT = 70;
const CLUSTER_X = [-4.2, -1.4, 1.4, 4.2];
const FINAL_X = [-1.3, 1.3];

/** Two-half garment outline (kurta + pants + dupatta drape), one closed
 * loop per garment — reused/upgraded from the earlier thread-weave work
 * in this project, now driven by a shared progress ref instead of raw
 * scroll math, and rendered inside an R3F scene graph. */
function buildGarmentStrokes() {
  const outline = new THREE.CatmullRomCurve3(
    [
      new THREE.Vector3(-0.18, 1.0, 0), new THREE.Vector3(-0.48, 0.85, 0), new THREE.Vector3(-0.42, 0.62, 0),
      new THREE.Vector3(-0.22, 0.7, 0), new THREE.Vector3(-0.28, 0.35, 0), new THREE.Vector3(-0.5, -0.1, 0),
      new THREE.Vector3(-0.34, -0.35, 0), new THREE.Vector3(-0.16, -0.5, 0), new THREE.Vector3(-0.22, -1.3, 0),
      new THREE.Vector3(-0.1, -1.55, 0), new THREE.Vector3(0.1, -1.55, 0), new THREE.Vector3(0.22, -1.3, 0),
      new THREE.Vector3(0.16, -0.5, 0), new THREE.Vector3(0.34, -0.35, 0), new THREE.Vector3(0.5, -0.1, 0),
      new THREE.Vector3(0.28, 0.35, 0), new THREE.Vector3(0.22, 0.7, 0), new THREE.Vector3(0.42, 0.62, 0),
      new THREE.Vector3(0.48, 0.85, 0), new THREE.Vector3(0.18, 1.0, 0), new THREE.Vector3(0, 0.88, 0),
      new THREE.Vector3(-0.18, 1.0, 0),
    ],
    true,
  );
  const drape = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.3, 0.95, 0.05), new THREE.Vector3(0.05, 0.5, 0.05),
    new THREE.Vector3(0.32, 0.0, 0.05), new THREE.Vector3(0.15, -0.55, 0.05), new THREE.Vector3(0.3, -1.1, 0.05),
  ]);
  return [outline, drape];
}

type Thread = { line: THREE.Line; geo: THREE.BufferGeometry; scattered: THREE.Vector3[]; woven: THREE.Vector3[]; seed: number };

export function FabricTransition({ progress }: { progress: React.RefObject<number> }) {
  const groupRef = useRef<THREE.Group>(null);

  const threads = useMemo<Thread[]>(() => {
    const strokes = buildGarmentStrokes();
    const lens = strokes.map((s) => s.getLength());
    const total = lens.reduce((a, b) => a + b, 0);
    const pick = (t: number) => {
      const target = t * total;
      let acc = 0;
      for (let s = 0; s < strokes.length; s++) {
        if (target <= acc + lens[s]) return { curve: strokes[s], localT: (target - acc) / lens[s] };
        acc += lens[s];
      }
      return { curve: strokes[strokes.length - 1], localT: 0.99 };
    };

    const out: Thread[] = [];
    for (let g = 0; g < 4; g++) {
      const isRed = g % 2 === 0;
      const finalX = FINAL_X[isRed ? 0 : 1];
      for (let i = 0; i < THREADS_PER_GARMENT; i++) {
        // Each thread is a smooth hanging STRAND, not a cloud of points.
        // Previously every vertex got an independent random position, so
        // consecutive points jumped around and the line rendered as a
        // jagged scribble instead of a fibre. Now x/z are fixed per strand
        // (with a gentle sine drift for natural hang) and y descends
        // monotonically from top to bottom.
        const cx = CLUSTER_X[g] + (Math.random() - 0.5) * 0.55;
        const cz = (Math.random() - 0.5) * 0.5;
        const topY = 2.4 + Math.random() * 0.3;
        const strandLen = 2.6 + Math.random() * 1.4;
        const drift = 0.05 + Math.random() * 0.08;
        const phase = Math.random() * Math.PI * 2;
        const scattered: THREE.Vector3[] = [];
        for (let v = 0; v < VERTS; v++) {
          const f = v / (VERTS - 1); // 0 at top → 1 at bottom
          scattered.push(
            new THREE.Vector3(
              cx + Math.sin(f * 2.2 + phase) * drift,
              topY - f * strandLen,
              cz + Math.cos(f * 1.8 + phase) * drift * 0.6,
            ),
          );
        }
        const tStart = i / THREADS_PER_GARMENT;
        const woven: THREE.Vector3[] = [];
        for (let v = 0; v < VERTS; v++) {
          const t = (((tStart + (v / (VERTS - 1) - 0.5) * 0.1) % 1) + 1) % 1;
          const { curve, localT } = pick(t);
          const p = curve.getPointAt(Math.min(1, Math.max(0, localT))).clone();
          p.x += finalX;
          woven.push(p);
        }
        const geo = new THREE.BufferGeometry().setFromPoints(scattered);
        // Built as a real THREE.Line here (not JSX <line>) — R3F's <line>
        // collides with the DOM/SVG <line> element in TS's JSX namespace,
        // which was resolving to the wrong type entirely.
        const mat = new THREE.LineBasicMaterial({
          color: isRed ? MADDER : IVORY_THREAD,
          transparent: true,
          opacity: 0.7,
        });
        const line = new THREE.Line(geo, mat);
        out.push({ line, geo, scattered, woven, seed: Math.random() * 100 });
      }
    }
    return out;
  }, []);

  useFrame(({ clock }) => {
    const p = progress.current ?? 0;
    // First 55% of this section's timeline: threads assemble. Remainder:
    // fully formed, held for the camera/outfit stages that follow.
    const assemble = Math.min(1, p / 0.55);
    const eased = assemble * assemble * (3 - 2 * assemble);
    const time = clock.elapsedTime;

    threads.forEach((t) => {
      const pos = t.geo.attributes.position;
      const chaos = (1 - eased) * 0.12;
      for (let v = 0; v < VERTS; v++) {
        const nx = Math.sin(time * 1.1 + t.seed + v) * chaos;
        const ny = Math.cos(time * 1.4 + t.seed * 1.2 + v) * chaos;
        const sx = t.scattered[v].x + nx, sy = t.scattered[v].y + ny, sz = t.scattered[v].z;
        const wx = t.woven[v].x, wy = t.woven[v].y, wz = t.woven[v].z;
        pos.setXYZ(v, sx + (wx - sx) * eased, sy + (wy - sy) * eased, sz + (wz - sz) * eased);
      }
      pos.needsUpdate = true;
    });

    if (groupRef.current) {
      groupRef.current.visible = p < 0.85; // fades out of relevance once outfits take over
      const opacity = 1 - Math.max(0, (p - 0.7) / 0.15);
      threads.forEach((t) => {
        (t.line.material as THREE.LineBasicMaterial).opacity = Math.max(0, opacity) * 0.7;
      });
    }
  });

  return (
    <group ref={groupRef}>
      {threads.map((t, i) => (
        <primitive key={i} object={t.line} />
      ))}
    </group>
  );
}
