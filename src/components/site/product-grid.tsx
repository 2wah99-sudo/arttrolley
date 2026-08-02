'use client';

import { useEffect, useRef, useState } from 'react';
import { useCart } from './cart';

const BLUSH = '#D6432F';

const PRODUCTS = [
  { code: 'JT-STJ-01', name: 'Ajrakh Silk Saree', desc: 'Indigo & madder dye, hand block-printed on pure silk.', price: 6400, sizes: ['Free Size'], img: '/products/JT-STJ-01.png' },
  { code: 'L-STJ-01', name: 'Hand-Stamped Kurti', desc: 'Cotton mul, stamped with a hand-carved teak block.', price: 1850, sizes: ['S', 'M', 'L', 'XL'], img: '/products/L-STJ-01.png' },
  { code: 'JN-STJ-01', name: 'Block-Print Dupatta', desc: 'Turmeric and pomegranate dye on light cotton.', price: 1200, sizes: ['Free Size'], img: '/products/JN-STJ-01.png' },
  { code: 'L-STJ-02', name: 'Co-ord Set', desc: 'Sanganeri print, small-batch cotton co-ord.', price: 3100, sizes: ['S', 'M', 'L'], img: '/products/L-STJ-02.png' },
  { code: 'STJ-SH-01', name: 'Turmeric Dupatta', desc: 'Natural dye print, sun-dried and set by hand.', price: 1200, sizes: ['Free Size'], img: '/products/STJ-SH-01.png' },
  { code: 'STJ-SH-02', name: 'Indigo Mul Kurti', desc: 'Fermented indigo dye on breathable mul cotton.', price: 2150, sizes: ['S', 'M', 'L', 'XL'], img: '/products/STJ-SH-02.png' },
  { code: 'STJ-SH-03', name: 'Heritage Silk Saree', desc: 'Karigar-made, hand-carved block motifs on silk.', price: 9600, sizes: ['Free Size'], img: '/products/STJ-SH-03.png' },
  { code: 'STJ-SH-04', name: 'Sanganeri Sarees', desc: 'Jaipur craft, small-batch hand block print.', price: 5200, sizes: ['Free Size'], img: '/products/STJ-SH-04.png' },
];

export function ProductGrid() {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [selected, setSelected] = useState<(typeof PRODUCTS)[number] | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [modalIn, setModalIn] = useState(false);
  const [added, setAdded] = useState(false);
  const addTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { addToCart, openDrawer } = useCart();

  useEffect(() => {
    if (selected) {
      const id = requestAnimationFrame(() => setModalIn(true));
      return () => cancelAnimationFrame(id);
    }
    setModalIn(false);
  }, [selected]);

  const open = (p: (typeof PRODUCTS)[number]) => {
    setSelected(p);
    setSelectedSize(p.sizes[0]);
  };
  const close = () => {
    setModalIn(false);
    setTimeout(() => setSelected(null), 260);
  };

  const handleAddToTrolley = () => {
    if (!selected || !selectedSize || added) return; // idempotent against rapid clicks
    addToCart({
      code: selected.code,
      name: selected.name,
      price: selected.price,
      size: selectedSize,
      img: selected.img,
    });
    setAdded(true);
    openDrawer();
    if (addTimerRef.current) clearTimeout(addTimerRef.current);
    addTimerRef.current = setTimeout(() => setAdded(false), 900);
  };

  useEffect(() => () => { if (addTimerRef.current) clearTimeout(addTimerRef.current); }, []);

  return (
    <section className="relative px-6 py-24" style={{ background: '#ffffff' }}>
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-2 gap-x-6 gap-y-16 sm:grid-cols-4">
          {PRODUCTS.map((p, i) => {
            const hovered = hoveredIdx === i;
            return (
              <div
                key={p.code}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                onClick={() => open(p)}
                className="flex cursor-pointer flex-col items-center"
                data-cursor-hover
              >
                <div className="relative flex w-full items-center justify-center" style={{ aspectRatio: '4/5' }}>
                  <img
                    src={p.img}
                    alt={p.name}
                    loading="lazy"
                    className="h-full w-full object-contain"
                    style={{
                      transition: 'transform .5s cubic-bezier(.2,.7,.2,1), filter .5s ease',
                      transform: hovered ? 'scale(1.05)' : 'scale(1)',
                      filter: hovered ? 'drop-shadow(0 18px 24px rgba(0,0,0,.12))' : 'drop-shadow(0 0 0 rgba(0,0,0,0))',
                    }}
                  />
                </div>
                <p
                  className="mt-5 text-sm font-semibold tracking-[0.02em] transition-colors duration-300"
                  style={{ color: hovered ? BLUSH : '#111' }}
                >
                  {p.code}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-8"
          onClick={close}
          style={{
            background: `rgba(20,16,16,${modalIn ? 0.55 : 0})`,
            backdropFilter: modalIn ? 'blur(14px)' : 'blur(0px)',
            transition: 'background .32s ease, backdrop-filter .32s ease',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative grid w-full max-w-3xl gap-0 overflow-hidden rounded-3xl sm:grid-cols-2"
            style={{
              background: '#fff',
              boxShadow: modalIn ? '0 40px 100px rgba(0,0,0,.35)' : 'none',
              opacity: modalIn ? 1 : 0,
              transform: modalIn ? 'scale(1) translateY(0)' : 'scale(0.9) translateY(30px)',
              transition: 'opacity .35s cubic-bezier(.34,1.4,.4,1), transform .35s cubic-bezier(.34,1.4,.4,1)',
            }}
          >
            <button
              onClick={close}
              className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full text-sm transition-transform hover:scale-110"
              style={{ background: '#f4f2f0', color: '#111' }}
            >
              ✕
            </button>

            <div className="flex items-center justify-center p-8" style={{ background: '#fafafa', aspectRatio: '4/5' }}>
              <img src={selected.img} alt={selected.name} className="max-h-full max-w-full object-contain" />
            </div>

            <div className="flex flex-col justify-center p-8">
              <p className="text-[0.6rem] uppercase tracking-[0.24em]" style={{ color: '#999' }}>{selected.code}</p>
              <h3 className="mt-2 text-2xl font-semibold" style={{ color: '#111' }}>{selected.name}</h3>
              <p className="mt-2 text-sm" style={{ color: '#666' }}>{selected.desc}</p>
              <p className="mt-4 text-2xl font-semibold" style={{ color: BLUSH }}>
                ₹{selected.price.toLocaleString('en-IN')}
              </p>

              <div className="mt-6">
                <p className="mb-2 text-[0.6rem] uppercase tracking-[0.2em]" style={{ color: '#999' }}>Size</p>
                <div className="flex flex-wrap gap-2">
                  {selected.sizes.map((sz) => (
                    <button
                      key={sz}
                      onClick={() => setSelectedSize(sz)}
                      className="rounded-full px-4 py-2 text-xs font-medium transition-all duration-200"
                      style={{
                        border: `1px solid ${selectedSize === sz ? '#111' : '#ddd'}`,
                        background: selectedSize === sz ? '#111' : 'transparent',
                        color: selectedSize === sz ? '#fff' : '#111',
                      }}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleAddToTrolley}
                className="mt-8 rounded-full px-7 py-3 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-white transition-transform"
                style={{
                  background: '#111',
                  minWidth: '13rem',
                  transform: added ? 'scale(0.97)' : 'scale(1)',
                  transition: 'transform .15s ease',
                }}
              >
                {added ? 'Added ✓' : `Add to Trolley — ₹${selected.price.toLocaleString('en-IN')}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
