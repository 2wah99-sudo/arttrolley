'use client';

import dynamic from 'next/dynamic';
import { BLUSH } from './sections';

type OrbitCarouselProps = {
  photos: { src: string; alt?: string }[];
  styleProps?: { radius?: number; clipContent?: boolean };
  cameraProps?: { zoom?: number; offsetX?: number; offsetY?: number };
  motionProps?: { autoSpeed?: number; rocking?: number };
  style?: React.CSSProperties;
};

const OrbitCarousel = dynamic<OrbitCarouselProps>(
  () => import('../blocks/orbit-carousel-3d').then((m) => m.default as unknown as (props: OrbitCarouselProps) => React.JSX.Element),
  { ssr: false, loading: () => <div style={{ width: '100%', height: '100%' }} /> },
);

// Portrait (3:4) craft photos already used elsewhere in this codebase —
// reused here rather than pulling in new unverified image URLs.
const PHOTOS = [
  { src: 'https://images.pexels.com/photos/190592/pexels-photo-190592.jpeg?auto=compress&cs=tinysrgb&w=500&h=650&fit=crop', alt: 'Hand block printing' },
  { src: 'https://images.pexels.com/photos/3957987/pexels-photo-3957987.jpeg?auto=compress&cs=tinysrgb&w=500&h=650&fit=crop', alt: 'Dye workshop' },
  { src: 'https://images.pexels.com/photos/3962280/pexels-photo-3962280.jpeg?auto=compress&cs=tinysrgb&w=500&h=650&fit=crop', alt: 'Block carving' },
  { src: 'https://images.pexels.com/photos/37619027/pexels-photo-37619027/free-photo-of-hand-block-printing-on-yellow-fabric.jpeg?auto=compress&cs=tinysrgb&w=500&h=650&fit=crop', alt: 'Bagru cotton printing' },
  { src: 'https://images.pexels.com/photos/34161635/pexels-photo-34161635/free-photo-of-traditional-batik-printing-in-jakarta-workshop.jpeg?auto=compress&cs=tinysrgb&w=500&h=650&fit=crop', alt: 'Traditional printing workshop' },
  { src: 'https://images.pexels.com/photos/12576780/pexels-photo-12576780.jpeg?auto=compress&cs=tinysrgb&w=500&h=650&fit=crop', alt: 'Block-print dupatta detail' },
];

export function KarigarOrbit() {
  return (
    <section style={{ background: 'rgba(0,0,0,.16)' }}>
      <div className="mx-auto max-w-2xl px-6 pb-10 pt-24 text-center">
        <p className="text-[0.62rem] uppercase tracking-[0.36em]" style={{ color: 'rgba(214,67,47,.7)' }}>
          The Hands Behind It
        </p>
        <h2 className="mt-3 text-3xl font-semibold sm:text-5xl" style={{ color: BLUSH }}>
          Drag the wheel. Meet the craft.
        </h2>
      </div>
      <div className="mx-auto flex justify-center px-6 pb-20 pt-16" style={{ width: '100%', maxWidth: 1200, height: 560 }}>
        <OrbitCarousel
          photos={PHOTOS}
          styleProps={{ radius: 14, clipContent: false }}
          cameraProps={{ zoom: 1, offsetX: 0, offsetY: 160 }}
          motionProps={{ autoSpeed: 4, rocking: 1 }}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    </section>
  );
}
