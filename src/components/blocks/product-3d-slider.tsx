'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { SliderErrorBoundary } from './slider-error-boundary';
import { BLUSH } from '@/components/site/sections';

const Scroll3DSlider = dynamic(() => import('./scroll3d-slider.jsx'), { ssr: false });

const SLIDES = [
  { image: 'https://images.pexels.com/photos/7920188/pexels-photo-7920188.jpeg?cs=tinysrgb&dpr=1&w=1000', title: 'Ajrakh Silk Saree' },
  { image: 'https://images.pexels.com/photos/37619027/pexels-photo-37619027/free-photo-of-hand-block-printing-on-yellow-fabric.jpeg?cs=tinysrgb&dpr=1&w=1000', title: 'Bagru Cotton Kurti' },
  { image: 'https://images.pexels.com/photos/35854471/pexels-photo-35854471/free-photo-of-abstract-pink-fabric-with-colorful-patterns.jpeg?cs=tinysrgb&dpr=1&w=1000', title: 'Turmeric Dupatta' },
  { image: 'https://images.pexels.com/photos/6851130/pexels-photo-6851130.jpeg?cs=tinysrgb&dpr=1&w=1000', title: 'Sanganeri Co-ord' },
  { image: 'https://images.pexels.com/photos/4566670/pexels-photo-4566670.jpeg?cs=tinysrgb&dpr=1&w=1000', title: 'Indigo Mul Kurti' },
  { image: 'https://images.pexels.com/photos/27719401/pexels-photo-27719401/free-photo-of-a-woman-in-a-colorful-sari-holding-an-umbrella.jpeg?cs=tinysrgb&dpr=1&w=1000', title: 'Heritage Silk Saree' },
];

function StaticFallback() {
  return (
    <div className="flex gap-4 overflow-x-auto px-6 pb-6" style={{ scrollSnapType: 'x proximity' }}>
      {SLIDES.map((s) => (
        <figure
          key={s.title}
          className="relative shrink-0 overflow-hidden rounded-xl"
          style={{ width: 'clamp(220px,26vw,320px)', aspectRatio: '3/4', scrollSnapAlign: 'start', background: '#000' }}
        >
          <img src={s.image} alt={s.title} loading="lazy" className="h-full w-full object-cover" />
          <figcaption
            className="absolute inset-x-0 bottom-0 p-4 text-sm"
            style={{ background: 'linear-gradient(0deg,rgba(0,0,0,.85),transparent)', color: BLUSH }}
          >
            {s.title}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

function detectWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

export default function Product3DSlider() {
  const [webglOk, setWebglOk] = useState<boolean | null>(null);

  useEffect(() => {
    setWebglOk(detectWebGL());
  }, []);

  // Unknown yet (SSR/first paint) or confirmed unsupported: show the static row.
  if (webglOk === false || webglOk === null) {
    return <StaticFallback />;
  }

  return (
    <SliderErrorBoundary fallback={<StaticFallback />}>
      <div style={{ height: '80vh', minHeight: 520, background: '#000' }}>
        <Scroll3DSlider
          slides={SLIDES}
          backgroundColor="#000000"
          direction="horizontal"
          borderRadius={0.04}
          effect={{ preset: 'coverflow' }}
          interactive
          snap
          showOverlay
          overlayColor="#D6432F"
          overlaySize={16}
          counterSize={13}
          overlayPosition="bottom-left"
          respectReducedMotion
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    </SliderErrorBoundary>
  );
}
