'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

const BLUSH = '#D6432F';

/**
 * Interactive founder card: mouse-tilt in 3D + a cursor-following rim light,
 * on a premium entrance (MD3 Emphasized, 700ms — dramatic-reveal range).
 * Pure CSS transforms/radial-gradient — no extra WebGL context, since the
 * hero + globe + slider already run three canvases on this page.
 */
export function TeamSpotlight({
  name, role, src,
}: { name: string; role: string; src: string }) {
  const [mounted, setMounted] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const [light, setLight] = useState({ x: 50, y: 40 });
  const [hovering, setHovering] = useState(false);
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => { const id = requestAnimationFrame(() => setMounted(true)); return () => cancelAnimationFrame(id); }, []);

  const onMove = useCallback((e: React.MouseEvent) => {
    if (reduced || !cardRef.current) return;
    const r = cardRef.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    setTilt({ rx: (0.5 - py) * 14, ry: (px - 0.5) * 14 });
    setLight({ x: px * 100, y: py * 100 });
  }, [reduced]);

  const onLeave = useCallback(() => { setTilt({ rx: 0, ry: 0 }); setHovering(false); }, []);

  return (
    <div className="mx-auto flex max-w-[340px] flex-col items-center text-center" style={{ perspective: 1200 }}>
      <div
        ref={cardRef}
        onMouseMove={onMove}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={onLeave}
        className="relative overflow-hidden rounded-2xl"
        style={{
          width: 300,
          height: 320,
          border: '1px solid rgba(214,67,47,.2)',
          boxShadow: hovering
            ? '0 32px 80px rgba(0,0,0,.55), 0 0 60px rgba(214,67,47,.18)'
            : '0 24px 60px rgba(0,0,0,.45)',
          opacity: mounted ? 1 : 0,
          transform: mounted
            ? `scale(1) rotate(0deg) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`
            : 'scale(0.86) rotate(-3deg)',
          transformStyle: 'preserve-3d',
          transition: mounted && hovering
            ? 'transform .12s linear, box-shadow .3s cubic-bezier(.2,0,0,1)'
            : 'opacity .7s cubic-bezier(.05,.7,.1,1), transform .7s cubic-bezier(.05,.7,.1,1), box-shadow .3s cubic-bezier(.2,0,0,1)',
        }}
      >
        {/* Original photo — no filters, no duotone, no effects */}
        <img
          src={src}
          alt={name}
          className="h-full w-full object-cover"
          style={{ transform: 'translateZ(0)' }}
        />

        {/* cursor-following rim light */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            opacity: hovering ? 1 : 0,
            transition: 'opacity .3s cubic-bezier(.2,0,0,1)',
            background: `radial-gradient(280px circle at ${light.x}% ${light.y}%, rgba(255,214,201,.32), transparent 60%)`,
            mixBlendMode: 'screen',
          }}
        />
        {/* base vignette so the card reads as lit from one side even at rest */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: 'linear-gradient(155deg, rgba(214,67,47,.14), transparent 45%)' }}
        />
      </div>

      <h3 className="mt-6 text-2xl font-semibold" style={{ color: BLUSH }}>{name}</h3>
      <p className="mt-1 text-[0.68rem] uppercase tracking-[0.24em]" style={{ color: 'rgba(214,67,47,.55)' }}>{role}</p>
    </div>
  );
}
