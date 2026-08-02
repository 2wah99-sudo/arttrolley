'use client';

import dynamic from 'next/dynamic';

const ImageScroller = dynamic(() => import('./image-scroller.jsx'), { ssr: false });

const JOURNEY_ITEMS = [
  {
    image: { src: 'https://images.pexels.com/photos/37619027/pexels-photo-37619027/free-photo-of-hand-block-printing-on-yellow-fabric.jpeg?cs=tinysrgb&dpr=1&w=1600', alt: 'Carving the block' },
    text: '01 — Carve the Block\nMaster carvers cut every motif by hand into seasoned teak. One block can take days.',
  },
  {
    image: { src: 'https://images.pexels.com/photos/34161635/pexels-photo-34161635/free-photo-of-traditional-batik-printing-in-jakarta-workshop.jpeg?cs=tinysrgb&dpr=1&w=1600', alt: 'Mixing natural dye' },
    text: '02 — Mix the Dye\nIndigo, madder root and turmeric, ground and fermented the way they have been for generations.',
  },
  {
    image: { src: 'https://images.pexels.com/photos/34161636/pexels-photo-34161636/free-photo-of-traditional-batik-printing-in-jakarta-workshop.jpeg?cs=tinysrgb&dpr=1&w=1600', alt: 'Pressing the block by hand' },
    text: '03 — Press by Hand\nDipped, aligned by eye, pressed. No two lengths of cloth ever come out identical.',
  },
  {
    image: { src: 'https://images.pexels.com/photos/12576780/pexels-photo-12576780.jpeg?cs=tinysrgb&dpr=1&w=1600', alt: 'Cloth drying under open sky' },
    text: '04 — Sun-Dry & Set\nThe cloth rests under open sky so the colour cures naturally before it is cut and stitched.',
  },
];

export default function JourneyScroller() {
  return (
    <div style={{ width: '100%', height: '100vh', minHeight: 640, background: '#000' }}>
      <ImageScroller
        items={JOURNEY_ITEMS}
        layout={{ backgroundColor: '#000000', componentPadding: 0 }}
        text={{ textColor: '#D6432F', fontWeight: 500 }}
        dock={{ dockPosition: 'center', thumbColor: '#D6432F', dockInset: 24, dockPadding: 10, thumbBlur: 8, thumbRadius: 16 }}
        thumbnails={{ thumbSize: 64, thumbnailRadius: 10, thumbPadding: 8, thumbImageRadius: 8, dimInactive: true, inactiveOpacity: 0.4 }}
        outline={{ outlineSize: 2, outlineColor: '#D6432F' }}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}
