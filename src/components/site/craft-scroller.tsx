'use client';

import { useEffect, useRef, useState } from 'react';

const CRAFT_STEPS = [
  {
    n: '01',
    t: 'Carve the Block',
    d: 'Master carvers cut every motif by hand into seasoned teak. One block can take days.',
    img: 'https://images.pexels.com/photos/190592/pexels-photo-190592.jpeg?cs=tinysrgb&dpr=1&w=1000',
  },
  {
    n: '02',
    t: 'Mix the Dye',
    d: 'Indigo, madder root and turmeric, ground and fermented the way they have been for generations.',
    img: 'https://images.pexels.com/photos/3957987/pexels-photo-3957987.jpeg?cs=tinysrgb&dpr=1&w=1000',
  },
  {
    n: '03',
    t: 'Press by Hand',
    d: 'Dipped, aligned by eye, pressed. No two lengths of cloth ever come out identical.',
    img: 'https://images.pexels.com/photos/3962280/pexels-photo-3962280.jpeg?cs=tinysrgb&dpr=1&w=1000',
  },
  {
    n: '04',
    t: 'Sun-Dry & Set',
    d: 'The cloth rests under open sky so the colour cures naturally before it is cut and stitched.',
    img: 'https://images.unsplash.com/photo-1604493225443-a8cc19434aec?q=80&w=1000&auto=format&fit=crop',
  },
];

export function CraftScroller() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [fill, setFill] = useState(0);

  useEffect(() => {
    const on = () => {
      const el = wrapRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const total = r.height - window.innerHeight * 0.45;
      const done = Math.min(total, Math.max(0, window.innerHeight * 0.68 - r.top));
      setFill(total > 0 ? Math.min(100, (done / total) * 100) : 0);
    };
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  return (
    <section id="craft" ref={wrapRef} style={{ background: '#000' }}>
      <div className="mx-auto max-w-5xl px-6 pb-24">
        {/* Header */}
        <div className="mb-16 text-center">
          <p className="text-[0.62rem] uppercase tracking-[0.36em]" style={{ color: 'rgba(214,67,47,.7)' }}>
            The Craft
          </p>
          <h2 className="mt-3 text-3xl font-semibold sm:text-5xl" style={{ color: '#D6432F' }}>
            From block to bolt of cloth.
          </h2>
        </div>

        {/* Main Scroller */}
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-12">
          {/* Images carousel */}
          <div className="relative overflow-hidden rounded-2xl" style={{ aspectRatio: '4/3', background: '#000' }}>
            <div className="relative h-full w-full">
              {CRAFT_STEPS.map((step, idx) => (
                <div
                  key={step.n}
                  className="absolute inset-0 transition-opacity duration-700"
                  style={{ opacity: active === idx ? 1 : 0 }}
                >
                  <img
                    src={step.img}
                    alt={step.t}
                    className="h-full w-full object-cover"
                    style={{ filter: 'saturate(1.1) contrast(1.08) brightness(0.88)' }}
                  />
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                      background:
                        'radial-gradient(ellipse at center, transparent 45%, #000 100%),' +
                        'linear-gradient(180deg, rgba(0,0,0,0.4) 0%, transparent 50%, rgba(0,0,0,.6) 100%)',
                    }}
                  />
                </div>
              ))}
            </div>
            {/* Step indicator overlay */}
            <div className="absolute bottom-6 left-6 z-20">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-full text-lg font-semibold"
                style={{ background: '#332B2B', border: '1px solid #D6432F', color: '#D6432F' }}
              >
                {CRAFT_STEPS[active].n}
              </div>
            </div>
          </div>

          {/* Steps list */}
          <div className="flex flex-col gap-4">
            {CRAFT_STEPS.map((step, idx) => (
              <button
                key={step.n}
                onClick={() => setActive(idx)}
                className="group flex flex-col rounded-lg px-5 py-4 text-left transition-all duration-300"
                style={{
                  background: active === idx ? 'rgba(214,67,47,.12)' : 'transparent',
                  border: active === idx ? '1px solid rgba(214,67,47,.3)' : '1px solid rgba(214,67,47,.1)',
                  cursor: 'pointer',
                }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="text-sm font-semibold transition-colors"
                    style={{ color: active === idx ? '#D6432F' : 'rgba(214,67,47,.5)' }}
                  >
                    {step.n}
                  </span>
                  <h4
                    className="text-base font-medium transition-colors sm:text-lg"
                    style={{ color: active === idx ? '#D6432F' : 'rgba(214,67,47,.7)' }}
                  >
                    {step.t}
                  </h4>
                </div>
                <p
                  className="mt-2 text-sm font-light transition-opacity"
                  style={{
                    color: active === idx ? 'rgba(214,67,47,.8)' : 'rgba(214,67,47,.5)',
                    opacity: active === idx ? 1 : 0.7,
                  }}
                >
                  {step.d}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Progress line */}
        <div className="mt-16 h-1 overflow-hidden rounded-full" style={{ background: 'rgba(214,67,47,.12)' }}>
          <div
            className="h-full transition-all duration-100"
            style={{ width: `${fill}%`, background: '#D6432F' }}
          />
        </div>
      </div>
    </section>
  );
}
