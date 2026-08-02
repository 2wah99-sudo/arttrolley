'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/* ------------------------------------------------------------------ config
 * Values mirror the TacticalGlobe3D defaults exactly.
 * Despite the "3D" name it is an SVG orthographic projection, not WebGL. */
const OCEAN = '#160D0C';
const LAND_FILL = '#2D1613';
const LAND_STROKE = '#6B2F27';
const STROKE_W = 0.5;
const HOVER_FILL = '#7A3A30';
const GRID_COLOR = '#8A4237';
const GRID_OPACITY = 0.18;
const GLOW_COLOR = '#D6432F';
const GLOW_INTENSITY = 0.3;
const AUTO_ROTATE_SPEED = 6;   // degrees / second
const DRAG_SENSITIVITY = 0.4;
const IDLE_MS = 1200;          // auto-rotate resumes this long after drag ends
const PADDING = 12;
const MARKER_COLOR = '#FF6B4A';
const MARKER_SIZE = 5;

type Ring = [number, number][];
type Country = { n: string; p: Ring[] };

/** ARTTROLLEY's actual sourcing clusters. */
const MARKERS = [
  { id: 'bagru', name: 'Bagru, Rajasthan', note: 'Hand block · natural dye', lat: 26.81, lon: 75.55 },
  { id: 'kutch', name: 'Kutch, Gujarat', note: 'Ajrakh resist printing', lat: 23.24, lon: 69.67 },
  { id: 'jaipur', name: 'Jaipur, Rajasthan', note: 'Sanganeri motifs · studio', lat: 26.91, lon: 75.79 },
];

const DEG = Math.PI / 180;

/**
 * Orthographic projection with three sequential rotations:
 *   lambda -> polar spin, phi -> tilt, gamma -> roll.
 * Returns screen x/y plus rx; rx >= 0 means the point faces the camera.
 */
function project(
  lonDeg: number, latDeg: number,
  lambda: number, phi: number, gamma: number,
  cx: number, cy: number, R: number,
) {
  const lon = (lonDeg + lambda) * DEG;
  const lat = latDeg * DEG;
  const cosLat = Math.cos(lat);

  let x = cosLat * Math.cos(lon);
  let y = Math.sin(lat);
  let z = cosLat * Math.sin(lon);

  // tilt around the horizontal axis
  const cp = Math.cos(phi * DEG), sp = Math.sin(phi * DEG);
  let y2 = y * cp - x * sp;
  let x2 = y * sp + x * cp;

  // roll around the view axis
  const cg = Math.cos(gamma * DEG), sg = Math.sin(gamma * DEG);
  const zz = z * cg - y2 * sg;
  const yy = z * sg + y2 * cg;

  return { x: cx + R * zz, y: cy - R * yy, rx: x2 };
}

export function TacticalGlobe() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 700, h: 500 });
  const [countries, setCountries] = useState<Country[] | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [active, setActive] = useState<string | null>(null);

  // rotation state lives in refs so the rAF loop never re-renders through React
  const lambdaRef = useRef(0);
  const phiRef = useRef(12);
  const gammaRef = useRef(0);
  const draggingRef = useRef(false);
  const lastPtrRef = useRef({ x: 0, y: 0 });
  const idleUntilRef = useRef(0);
  const [, tick] = useState(0);

  useEffect(() => {
    fetch('/geo/countries-110m.json')
      .then((r) => r.json())
      .then(setCountries)
      .catch(() => setCountries([]));
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect;
      if (width > 0 && height > 0) setSize({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // animation loop — dt clamped to 0.05s, auto-rotate resumes after IDLE_MS
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!draggingRef.current && now >= idleUntilRef.current) {
        lambdaRef.current += AUTO_ROTATE_SPEED * dt;
      }
      tick((n) => (n + 1) % 1000000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    draggingRef.current = true;
    lastPtrRef.current = { x: e.clientX, y: e.clientY };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    const dx = e.clientX - lastPtrRef.current.x;
    const dy = e.clientY - lastPtrRef.current.y;
    lastPtrRef.current = { x: e.clientX, y: e.clientY };
    lambdaRef.current += dx * DRAG_SENSITIVITY;
    phiRef.current = Math.max(-85, Math.min(85, phiRef.current + dy * DRAG_SENSITIVITY));
  }, []);

  const onPointerUp = useCallback(() => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    idleUntilRef.current = performance.now() + IDLE_MS;
  }, []);

  const { w, h } = size;
  const innerW = w - PADDING * 2;
  const innerH = h - PADDING * 2;
  const R = Math.max(20, Math.min(innerW, innerH) / 2 - 8);
  const cx = w / 2;
  const cy = h / 2;

  const lambda = lambdaRef.current;
  const phi = phiRef.current;
  const gamma = gammaRef.current;

  // ---- country paths (only front-facing segments) ----
  const countryPaths = useMemo(() => {
    if (!countries) return [];
    const out: { n: string; d: string }[] = [];
    for (const c of countries) {
      let d = '';
      for (const ring of c.p) {
        let open = false;
        for (const [lon, lat] of ring) {
          const p = project(lon, lat, lambda, phi, gamma, cx, cy, R);
          if (p.rx >= 0) {
            d += `${open ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
            open = true;
          } else {
            open = false;
          }
        }
      }
      if (d) out.push({ n: c.n, d });
    }
    return out;
  }, [countries, lambda, phi, gamma, cx, cy, R]);

  // ---- graticule: parallels -60..60 step 30, meridians -180..180 step 30, sampled every 4° ----
  const gridPath = useMemo(() => {
    let d = '';
    for (let lat = -60; lat <= 60; lat += 30) {
      let open = false;
      for (let lon = -180; lon <= 180; lon += 4) {
        const p = project(lon, lat, lambda, phi, gamma, cx, cy, R);
        if (p.rx >= 0) { d += `${open ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`; open = true; }
        else open = false;
      }
    }
    for (let lon = -180; lon <= 180; lon += 30) {
      let open = false;
      for (let lat = -90; lat <= 90; lat += 4) {
        const p = project(lon, lat, lambda, phi, gamma, cx, cy, R);
        if (p.rx >= 0) { d += `${open ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`; open = true; }
        else open = false;
      }
    }
    return d;
  }, [lambda, phi, gamma, cx, cy, R]);

  const markerPts = useMemo(
    () => MARKERS.map((m) => ({ ...m, ...project(m.lon, m.lat, lambda, phi, gamma, cx, cy, R) })),
    [lambda, phi, gamma, cx, cy, R],
  );

  // atmosphere gradient stops, per spec
  const atmInner = (R / (R + 60)) * 100;
  const atmMid = ((R + 6) / (R + 60)) * 100;

  return (
    <div
      ref={wrapRef}
      className="relative mx-auto w-full select-none"
      style={{ height: '68vh', maxHeight: 640, maxWidth: 900, padding: PADDING, touchAction: 'none' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      <svg width={w} height={h} style={{ display: 'block', cursor: 'grab' }}>
        <defs>
          <radialGradient id="gAtm" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={GLOW_COLOR} stopOpacity={0} />
            <stop offset={`${atmInner}%`} stopColor={GLOW_COLOR} stopOpacity={0} />
            <stop offset={`${atmMid}%`} stopColor={GLOW_COLOR} stopOpacity={0.4 * GLOW_INTENSITY} />
            <stop offset="100%" stopColor={GLOW_COLOR} stopOpacity={0} />
          </radialGradient>
          <radialGradient id="gShade" cx="38%" cy="32%" r="70%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity={0.12} />
            <stop offset="55%" stopColor="#ffffff" stopOpacity={0} />
            <stop offset="92%" stopColor="#000000" stopOpacity={0.32} />
            <stop offset="100%" stopColor="#000000" stopOpacity={0.55} />
          </radialGradient>
          <clipPath id="globeClip">
            <circle cx={cx} cy={cy} r={R} />
          </clipPath>
        </defs>

        {/* atmosphere halo sits outside the clip so it can bleed past the limb */}
        <circle cx={cx} cy={cy} r={R + 60} fill="url(#gAtm)" />

        {/* ocean disc */}
        <circle cx={cx} cy={cy} r={R} fill={OCEAN} />

        <g clipPath="url(#globeClip)">
          <path
            d={gridPath}
            fill="none"
            stroke={GRID_COLOR}
            strokeOpacity={GRID_OPACITY}
            strokeWidth={STROKE_W}
            vectorEffect="non-scaling-stroke"
          />
          {countryPaths.map((c) => (
            <path
              key={c.n}
              d={c.d}
              fill={hovered === c.n ? HOVER_FILL : LAND_FILL}
              stroke={LAND_STROKE}
              strokeWidth={STROKE_W}
              vectorEffect="non-scaling-stroke"
              onMouseEnter={() => setHovered(c.n)}
              onMouseLeave={() => setHovered(null)}
              style={{
                transition: 'fill 140ms ease, filter 140ms ease',
                filter: hovered === c.n ? 'brightness(1.18)' : undefined,
              }}
            />
          ))}
        </g>

        {/* spherical shading on top of the map */}
        <circle cx={cx} cy={cy} r={R} fill="url(#gShade)" pointerEvents="none" />

        {/* markers — hidden when on the far side, depth-faded near the limb */}
        {markerPts.map((m) => {
          if (m.rx < 0) return null;
          const opacity = Math.max(0, Math.min(1, m.rx * 4));
          const isOn = active === m.id;
          return (
            <g
              key={m.id}
              opacity={opacity}
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setActive(m.id)}
              onMouseLeave={() => setActive(null)}
            >
              <circle cx={m.x} cy={m.y} r={MARKER_SIZE * 2.1} fill={MARKER_COLOR} opacity={0.14} />
              <circle
                cx={m.x} cy={m.y} r={MARKER_SIZE * 1.4}
                fill={MARKER_COLOR} opacity={0.55}
                style={{ animation: 'mm-pulse 2.4s ease-out infinite', transformOrigin: `${m.x}px ${m.y}px` }}
              />
              <circle cx={m.x} cy={m.y} r={MARKER_SIZE} fill={MARKER_COLOR} />
              <circle cx={m.x - 1.2} cy={m.y - 1.2} r={MARKER_SIZE * 0.35} fill="#ffffff" opacity={0.55} />
              {isOn && (
                <g pointerEvents="none">
                  <rect
                    x={m.x + 12} y={m.y - 26} width={182} height={44} rx={8}
                    fill="rgba(22,13,12,.9)" stroke="rgba(214,67,47,.35)"
                  />
                  <text x={m.x + 22} y={m.y - 9} fill="#FBEAE6" fontSize={11} fontWeight={600}>{m.name}</text>
                  <text x={m.x + 22} y={m.y + 6} fill="rgba(255,180,160,.66)" fontSize={10}>{m.note}</text>
                </g>
              )}
            </g>
          );
        })}
      </svg>

      {!countries && (
        <div
          className="absolute inset-0 flex items-center justify-center text-[0.62rem] uppercase tracking-[0.3em]"
          style={{ color: 'rgba(214,67,47,.55)' }}
        >
          Loading map…
        </div>
      )}
    </div>
  );
}

export function TacticalGlobeSection() {
  return (
    <section className="relative overflow-hidden px-6 py-24" style={{ background: OCEAN }}>
      <div className="mx-auto max-w-2xl pb-8 text-center">
        <p className="text-[0.62rem] uppercase tracking-[0.36em]" style={{ color: 'rgba(214,67,47,.75)' }}>
          Where it&apos;s made
        </p>
        <h2 className="mt-3 text-3xl font-semibold sm:text-5xl" style={{ color: '#FBEAE6' }}>
          Every print has an address.
        </h2>
        <p className="mt-4 text-sm font-light" style={{ color: 'rgba(255,180,160,.55)' }}>
          Drag to spin. These are the workshops our blocks, dyes and cloth actually come from.
        </p>
      </div>
      <TacticalGlobe />
    </section>
  );
}
