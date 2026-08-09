'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const CREAM = '#DBC9B1';
const MADDER = '#A8291F';
const BLUSH = '#F2C4BB';

const WORD = 'ARTTROLLEY';
const THREAD_COUNT = 64;

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
    // A real line-art figure is several INDEPENDENT strokes (hair outline,
    // head, arm, torso/back, vine) — one continuous curve can't branch, so
    // it flattened everything into one path. Using separate curves per
    // stroke instead, each getting its own share of threads.
    const strokes = [
      // hair / head outline (bun to jaw)
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.02, 1.62, 0),
        new THREE.Vector3(0.22, 1.58, 0),
        new THREE.Vector3(0.3, 1.45, 0),
        new THREE.Vector3(0.15, 1.32, 0),
        new THREE.Vector3(0.24, 1.2, 0),
        new THREE.Vector3(0.1, 1.08, 0),
        new THREE.Vector3(0.02, 0.98, 0),
      ]),
      // neck + shoulder line
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.02, 0.98, 0),
        new THREE.Vector3(-0.08, 0.88, 0),
        new THREE.Vector3(-0.32, 0.78, 0),
        new THREE.Vector3(-0.42, 0.6, 0),
      ]),
      // raised arm, elbow, hand resting near shoulder
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.42, 0.6, 0),
        new THREE.Vector3(-0.5, 0.35, 0),
        new THREE.Vector3(-0.38, 0.15, 0),
        new THREE.Vector3(-0.45, -0.05, 0),
        new THREE.Vector3(-0.28, 0.1, 0),
        new THREE.Vector3(-0.15, 0.35, 0),
        new THREE.Vector3(-0.2, 0.55, 0),
      ]),
      // torso / back curve, waist to hip
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.02, 0.98, 0),
        new THREE.Vector3(0.28, 0.7, 0),
        new THREE.Vector3(0.22, 0.35, 0),
        new THREE.Vector3(0.32, 0.0, 0),
        new THREE.Vector3(0.2, -0.35, 0),
        new THREE.Vector3(0.3, -0.7, 0),
        new THREE.Vector3(0.15, -1.0, 0),
      ]),
      // trailing floral vine
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.15, -1.0, 0),
        new THREE.Vector3(0.05, -1.15, 0),
        new THREE.Vector3(0.3, -1.3, 0),
        new THREE.Vector3(0.1, -1.5, 0),
        new THREE.Vector3(0.35, -1.6, 0),
      ]),
    ];
    const strokeLens = strokes.map((s) => s.getLength());
    const totalLen = strokeLens.reduce((a, b) => a + b, 0);
    const VERTS_PER_THREAD = 6;

    // Pick which stroke + arc position a given thread index falls on,
    // weighted by each stroke's length so density stays even.
    const pickStroke = (i: number) => {
      const target = (i / THREAD_COUNT) * totalLen;
      let acc = 0;
      for (let s = 0; s < strokes.length; s++) {
        if (target <= acc + strokeLens[s]) return { curve: strokes[s], localT: (target - acc) / strokeLens[s] };
        acc += strokeLens[s];
      }
      return { curve: strokes[strokes.length - 1], localT: 0.99 };
    };

    type Thread = {
      line: THREE.Line;
      scattered: THREE.Vector3[];
      woven: THREE.Vector3[];
      noiseSeed: number;
    };
    const threads: Thread[] = [];

    for (let i = 0; i < THREAD_COUNT; i++) {
      // Scattered: wild flung-out positions, further out for a "crazy"
      // flying-threads feel, each with its own noise seed for writhing motion.
      const scattered: THREE.Vector3[] = [];
      const flingX = (Math.random() - 0.5) * 14;
      const flingY = (Math.random() - 0.5) * 9;
      for (let v = 0; v < VERTS_PER_THREAD; v++) {
        scattered.push(new THREE.Vector3(
          flingX + (Math.random() - 0.5) * 2.5,
          flingY + (Math.random() - 0.5) * 2.5,
          (Math.random() - 0.5) * 6,
        ));
      }

      // Woven: a short window along this thread's assigned stroke, so each
      // thread traces one flowing stretch of that stroke's outline.
      const { curve, localT } = pickStroke(i);
      const windowLen = 0.16;
      const woven: THREE.Vector3[] = [];
      for (let v = 0; v < VERTS_PER_THREAD; v++) {
        const t = Math.min(1, Math.max(0, localT + (v / (VERTS_PER_THREAD - 1) - 0.5) * windowLen));
        woven.push(curve.getPointAt(t).clone());
      }

      const geo = new THREE.BufferGeometry().setFromPoints(scattered);
      const mat = new THREE.LineBasicMaterial({
        color: i % 2 === 0 ? MADDER : BLUSH,
        transparent: true,
        opacity: 0.85,
      });
      const line = new THREE.Line(geo, mat);
      scene.add(line);
      threads.push({ line, scattered, woven, noiseSeed: Math.random() * 100 });
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
    const tick = (now: number) => {
      // Smooth spring toward the scroll-derived target — buttery, and
      // still fully reversible since the target itself is scroll position.
      displayRef.current += (progressRef.current - displayRef.current) * 0.08;
      const p = displayRef.current;
      const eased = p * p * (3 - 2 * p); // smoothstep
      const time = now * 0.001;

      for (const t of threads) {
        const positions = t.line.geometry.attributes.position;
        // Writhing "crazy" flight noise — strong while scattered, fades to
        // nothing as the thread settles into the silhouette (1 - eased).
        const chaos = (1 - eased) * 0.5;
        for (let v = 0; v < VERTS_PER_THREAD; v++) {
          const nx = Math.sin(time * 1.3 + t.noiseSeed + v) * chaos;
          const ny = Math.cos(time * 1.7 + t.noiseSeed * 1.3 + v) * chaos;
          const sx = t.scattered[v].x + nx, sy = t.scattered[v].y + ny, sz = t.scattered[v].z;
          const wx = t.woven[v].x, wy = t.woven[v].y, wz = t.woven[v].z;
          positions.setXYZ(v, sx + (wx - sx) * eased, sy + (wy - sy) * eased, sz + (wz - sz) * eased);
        }
        positions.needsUpdate = true;
      }
      scene.rotation.y = (1 - eased) * 0.3; // gentle chaos drift before weaving settles flat
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick(0);

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
