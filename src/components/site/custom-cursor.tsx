'use client';

import { useEffect, useRef, useState } from 'react';

const BLUSH = '#D6432F';

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const posRef = useRef({ x: 0, y: 0 });
  const ringPosRef = useRef({ x: 0, y: 0 });
  const [hovering, setHovering] = useState(false);
  const [touch, setTouch] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) { setTouch(true); return; }

    const onMove = (e: PointerEvent) => {
      posRef.current = { x: e.clientX, y: e.clientY };
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`;
      }
      const target = e.target as HTMLElement;
      const interactive = target.closest('a, button, [role="button"], input, textarea, [data-cursor-hover]');
      setHovering(!!interactive);
    };

    window.addEventListener('pointermove', onMove, { passive: true });

    let raf: number;
    const tick = () => {
      ringPosRef.current.x += (posRef.current.x - ringPosRef.current.x) * 0.18;
      ringPosRef.current.y += (posRef.current.y - ringPosRef.current.y) * 0.18;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringPosRef.current.x}px, ${ringPosRef.current.y}px, 0) translate(-50%, -50%)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  if (touch) return null;

  return (
    <>
      <div
        ref={dotRef}
        className="pointer-events-none fixed left-0 top-0 z-[9999] rounded-full"
        style={{
          width: 6, height: 6, background: BLUSH,
          transition: 'width .2s ease, height .2s ease, opacity .2s ease',
          willChange: 'transform',
          opacity: 1,
        }}
      />
      <div
        ref={ringRef}
        className="pointer-events-none fixed left-0 top-0 z-[9998] rounded-full"
        style={{
          width: hovering ? 56 : 32,
          height: hovering ? 56 : 32,
          border: `1px solid ${hovering ? BLUSH : 'rgba(214,67,47,.5)'}`,
          background: hovering ? 'rgba(214,67,47,.08)' : 'transparent',
          transition: 'width .3s cubic-bezier(.2,.8,.2,1), height .3s cubic-bezier(.2,.8,.2,1), background .3s ease, border-color .3s ease',
          willChange: 'transform',
          mixBlendMode: 'difference',
        }}
      />
      <style jsx global>{`
        @media (pointer: fine) {
          * { cursor: none !important; }
        }
      `}</style>
    </>
  );
}
