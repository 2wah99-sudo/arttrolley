'use client';

import { useEffect, useState } from 'react';

const BLUSH = '#D6432F';

export function TeamSpotlight({
  name, role, src,
}: { name: string; role: string; src: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const id = requestAnimationFrame(() => setMounted(true)); return () => cancelAnimationFrame(id); }, []);

  return (
    <div className="mx-auto flex max-w-[340px] flex-col items-center text-center">
      <div
        className="overflow-hidden rounded-2xl"
        style={{
          width: 300,
          height: 320,
          border: '1px solid rgba(214,67,47,.2)',
          boxShadow: '0 24px 60px rgba(0,0,0,.45)',
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'scale(1) rotate(0deg)' : 'scale(0.86) rotate(-3deg)',
          transition: 'opacity .7s cubic-bezier(.2,.7,.2,1), transform .7s cubic-bezier(.2,.7,.2,1)',
        }}
      >
        {/* Original photo — no filters, no duotone, no effects */}
        <img
          src={src}
          alt={name}
          className="h-full w-full object-cover"
        />
      </div>

      <h3 className="mt-6 text-2xl font-semibold" style={{ color: BLUSH }}>{name}</h3>
      <p className="mt-1 text-[0.68rem] uppercase tracking-[0.24em]" style={{ color: 'rgba(214,67,47,.55)' }}>{role}</p>
    </div>
  );
}
