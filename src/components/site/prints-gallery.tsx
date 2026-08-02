'use client';

import React, { useRef } from 'react';
import SimpleMarquee from '@/components/fancy/blocks/simple-marquee';

const PRINTS = [
  '/prints/saree-ajrakh-1.jpg',
  '/prints/kurti-bagru-1.jpg',
  '/prints/dupatta-buta-1.jpg',
  '/prints/saree-ajrakh-2.jpg',
  '/prints/kurti-bagru-2.jpg',
  '/prints/dupatta-buta-2.jpg',
  '/prints/saree-ajrakh-3.jpg',
  '/prints/kurti-bagru-3.jpg',
  '/prints/dupatta-buta-3.jpg',
  '/prints/saree-ajrakh-4.jpg',
  '/prints/kurti-bagru-4.jpg',
  '/prints/dupatta-buta-4.jpg',
  '/prints/saree-ajrakh-5.jpg',
  '/prints/kurti-bagru-5.jpg',
  '/prints/dupatta-buta-5.jpg',
];

const Item = ({ src }: { src: string }) => (
  <div className="mx-1 shrink-0 overflow-hidden rounded-lg transition-transform hover:scale-105 sm:mx-2 md:mx-3">
    <img
      src={src}
      alt="block print"
      className="h-20 w-32 object-cover sm:h-28 sm:w-44 md:h-40 md:w-56"
    />
  </div>
);

export default function PrintsGallery() {
  const container = useRef<HTMLDivElement>(null);

  const row1 = PRINTS.slice(0, 5);
  const row2 = PRINTS.slice(5, 10);
  const row3 = PRINTS.slice(10, 15);

  return (
    <section ref={container} className="relative overflow-hidden px-6 py-20 md:py-28" style={{ background: '#000000' }}>
      <div className="mx-auto mb-12 max-w-2xl text-center">
        <p className="text-[0.6rem] uppercase tracking-[0.36em]" style={{ color: '#da1a32' }}>
          The Collection
        </p>
        <h2 className="mt-4 text-3xl font-semibold sm:text-4xl md:text-5xl" style={{ color: '#FFFFFF' }}>
          Every Print, Hand-Pressed
        </h2>
      </div>

      <div className="space-y-3 md:space-y-4">
        <SimpleMarquee baseVelocity={6} repeat={2} direction="left" slowdownOnHover className="w-full">
          {row1.map((src, i) => (
            <Item key={i} src={src} />
          ))}
        </SimpleMarquee>

        <SimpleMarquee baseVelocity={6} repeat={2} direction="right" slowdownOnHover className="w-full">
          {row2.map((src, i) => (
            <Item key={i} src={src} />
          ))}
        </SimpleMarquee>

        <SimpleMarquee baseVelocity={6} repeat={2} direction="left" slowdownOnHover className="w-full">
          {row3.map((src, i) => (
            <Item key={i} src={src} />
          ))}
        </SimpleMarquee>
      </div>
    </section>
  );
}
