'use client';

import { useEffect, useRef, useState } from 'react';

const BLUSH = '#D6432F';

const GALLERY_IMAGES = [
  'https://images.pexels.com/photos/7920188/pexels-photo-7920188.jpeg?cs=tinysrgb&dpr=1&w=600',
  'https://images.pexels.com/photos/37619027/pexels-photo-37619027/free-photo-of-hand-block-printing-on-yellow-fabric.jpeg?cs=tinysrgb&dpr=1&w=600',
  'https://images.pexels.com/photos/35854471/pexels-photo-35854471/free-photo-of-abstract-pink-fabric-with-colorful-patterns.jpeg?cs=tinysrgb&dpr=1&w=600',
  'https://images.pexels.com/photos/6851130/pexels-photo-6851130.jpeg?cs=tinysrgb&dpr=1&w=600',
  'https://images.pexels.com/photos/4566670/pexels-photo-4566670.jpeg?cs=tinysrgb&dpr=1&w=600',
  'https://images.pexels.com/photos/27719401/pexels-photo-27719401/free-photo-of-a-woman-in-a-colorful-sari-holding-an-umbrella.jpeg?cs=tinysrgb&dpr=1&w=600',
  'https://images.pexels.com/photos/12576780/pexels-photo-12576780.jpeg?cs=tinysrgb&dpr=1&w=600',
  'https://images.pexels.com/photos/5865305/pexels-photo-5865305.jpeg?cs=tinysrgb&dpr=1&w=600',
  'https://images.pexels.com/photos/34161635/pexels-photo-34161635/free-photo-of-traditional-batik-printing-in-jakarta-workshop.jpeg?cs=tinysrgb&dpr=1&w=600',
];

const COLUMNS = [
  { speed: 0.5, images: [0, 3, 6, 1, 4] },
  { speed: 0.8, images: [1, 4, 7, 2, 5] },
  { speed: 0.35, images: [2, 5, 8, 0, 3] },
];

export function ScrollGallery() {
  const sectionRef = useRef<HTMLElement>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const progress = -rect.top / (rect.height - window.innerHeight);
      setOffset(Math.max(0, Math.min(1, progress)));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden py-32"
      style={{ background: '#000', minHeight: '160vh' }}
    >
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <div className="mx-auto w-full max-w-7xl px-6">
          <div className="mb-12 text-center">
            <p className="text-[0.62rem] uppercase tracking-[0.36em]" style={{ color: 'rgba(214,67,47,.7)' }}>
              The Collection
            </p>
            <h2 className="mt-3 text-3xl font-semibold sm:text-5xl" style={{ color: BLUSH }}>
              Every print, a story.
            </h2>
          </div>

          <div className="grid grid-cols-3 gap-4 sm:gap-6">
            {COLUMNS.map((col, colIdx) => (
              <div
                key={colIdx}
                className="flex flex-col gap-4 sm:gap-6"
                style={{
                  transform: `translateY(${-offset * col.speed * 400}px)`,
                  transition: 'transform 0.1s linear',
                }}
              >
                {col.images.map((imgIdx, i) => (
                  <div
                    key={`${colIdx}-${i}`}
                    className="relative overflow-hidden rounded-xl"
                    style={{
                      aspectRatio: '3/4',
                      background: '#111',
                      border: '1px solid rgba(214,67,47,.12)',
                    }}
                  >
                    <img
                      src={GALLERY_IMAGES[imgIdx]}
                      alt="ARTTROLLEY handblock print"
                      loading="lazy"
                      className="h-full w-full object-cover"
                      style={{ filter: 'saturate(1.05) contrast(1.06) brightness(0.9)' }}
                    />
                    <div
                      className="pointer-events-none absolute inset-0"
                      style={{
                        background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,.7) 100%)',
                      }}
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
