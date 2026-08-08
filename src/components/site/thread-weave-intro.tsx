'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const CREAM = '#DBC9B1';
const MADDER = '#A8291F';
const BLUSH = '#F2C4BB';

const WORD = 'ARTTROLLEY';
const THREAD_COUNT = 64;
const GRID = 8; // 8x8 weave (64 threads: 32 horizontal + 32 vertical, doubled for density)
const CLOTH_SIZE = 3.2;

/**
 * Welcome sequence: the wordmark types in on load, then the thread canvas
 * below is scroll-scrubbed — scroll down weaves scattered threads into a
 * grid ("cloth"), scroll up unravels it. Everything is a pure function of
 * scroll progress (lerped for smoothness), so up/down is always exactly
 * reversible — no time-based state to desync.
 */
export function ThreadWeaveIntro() {
  const [typed, setTyped] = useState('');
  const mountRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const displayRef = useRef(0);

  // Typing animation — runs once on mount, not scroll-tied.
  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      i++;
      setTyped(WORD.slice(0, i));
      if (i >= WORD.length) clearInterval(id);
    }, 110);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 6);

    // Each thread: scattered endpoints (chaos) -> woven endpoints (grid).
    // Precomputed once; every frame just lerps between the two by progress.
    type Thread = { line: THREE.Line; scattered: THREE.Vector3[]; woven: THREE.Vector3[] };
    const threads: Thread[] = [];
    const half = CLOTH_SIZE / 2;

    for (let i = 0; i < THREAD_COUNT; i++) {
      const scattered = [
        new THREE.Vector3((Math.random() - 0.5) * 9, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 4),
        new THREE.Vector3((Math.random() - 0.5) * 9, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 4),
      ];

      const isHorizontal = i % 2 === 0;
      const idx = Math.floor(i / 2) % GRID;
      const t = idx / (GRID - 1);
      const z = isHorizontal ? 0.01 : -0.01; // alternate depth = plain-weave over/under illusion
      let woven: THREE.Vector3[];
      if (isHorizontal) {
        const y = -half + t * CLOTH_SIZE;
        woven = [new THREE.Vector3(-half, y, z), new THREE.Vector3(half, y, z)];
      } else {
        const x = -half + t * CLOTH_SIZE;
        woven = [new THREE.Vector3(x, -half, z), new THREE.Vector3(x, half, z)];
      }

      const geo = new THREE.BufferGeometry().setFromPoints(scattered);
      const mat = new THREE.LineBasicMaterial({
        color: isHorizontal ? MADDER : BLUSH,
        transparent: true,
        opacity: 0.85,
      });
      const line = new THREE.Line(geo, mat);
      scene.add(line);
      threads.push({ line, scattered, woven });
    }

    const resize = () => {
      const w = mount.clientWidth, h = mount.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    window.addEventListener('resize', resize);

    const onScroll = () => {
      const el = sectionRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      progressRef.current = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    let raf: number;
    const tick = () => {
      // Smooth spring toward the scroll-derived target — buttery, and
      // still fully reversible since the target itself is scroll position.
      displayRef.current += (progressRef.current - displayRef.current) * 0.08;
      const p = displayRef.current;
      const eased = p * p * (3 - 2 * p); // smoothstep

      for (const t of threads) {
        const positions = t.line.geometry.attributes.position;
        for (let v = 0; v < 2; v++) {
          const sx = t.scattered[v].x, sy = t.scattered[v].y, sz = t.scattered[v].z;
          const wx = t.woven[v].x, wy = t.woven[v].y, wz = t.woven[v].z;
          positions.setXYZ(v, sx + (wx - sx) * eased, sy + (wy - sy) * eased, sz + (wz - sz) * eased);
        }
        positions.needsUpdate = true;
      }
      scene.rotation.y = (1 - eased) * 0.3; // gentle chaos drift before weaving settles flat
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', onScroll);
      threads.forEach((t) => {
        t.line.geometry.dispose();
        (t.line.material as THREE.Material).dispose();
      });
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <section ref={sectionRef} className="relative" style={{ height: '220vh', background: CREAM }}>
      <div className="sticky top-0 flex h-screen w-full flex-col items-center justify-center overflow-hidden">
        <h1
          className="relative z-10 font-extrabold uppercase tracking-[0.08em] text-[12vw] sm:text-[6rem]"
          style={{ color: MADDER, minHeight: '1.1em' }}
        >
          {typed}
          <span className="animate-pulse" aria-hidden>{typed.length < WORD.length ? '|' : ''}</span>
        </h1>
        <p className="relative z-10 mt-3 text-xs uppercase tracking-[0.3em]" style={{ color: 'rgba(168,41,31,.6)' }}>
          Scroll to weave the cloth
        </p>
        <div ref={mountRef} className="absolute inset-0" />
      </div>
    </section>
  );
}
