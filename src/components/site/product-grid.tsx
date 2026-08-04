'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip';
import { useCart } from './cart';
import { pauseSmoothScroll, resumeSmoothScroll } from './smooth-scroll';

if (typeof window !== 'undefined') gsap.registerPlugin(Flip);

const BLUSH = '#D6432F';

const PRODUCTS = [
  { code: 'JT-STJ-01', name: 'Ajrakh Silk Saree', desc: 'Indigo & madder dye, hand block-printed on pure silk.', price: 6400, sizes: ['Free Size'], img: 'https://images.pexels.com/photos/7920188/pexels-photo-7920188.jpeg?cs=tinysrgb&dpr=1&w=800' },
  { code: 'L-STJ-01', name: 'Hand-Stamped Kurti', desc: 'Cotton mul, stamped with a hand-carved teak block.', price: 1850, sizes: ['S', 'M', 'L', 'XL'], img: 'https://images.pexels.com/photos/37619027/pexels-photo-37619027/free-photo-of-hand-block-printing-on-yellow-fabric.jpeg?cs=tinysrgb&dpr=1&w=800' },
  { code: 'JN-STJ-01', name: 'Block-Print Dupatta', desc: 'Turmeric and pomegranate dye on light cotton.', price: 1200, sizes: ['Free Size'], img: 'https://images.pexels.com/photos/12576780/pexels-photo-12576780.jpeg?cs=tinysrgb&dpr=1&w=800' },
  { code: 'L-STJ-02', name: 'Co-ord Set', desc: 'Sanganeri print, small-batch cotton co-ord.', price: 3100, sizes: ['S', 'M', 'L'], img: 'https://images.pexels.com/photos/6851130/pexels-photo-6851130.jpeg?cs=tinysrgb&dpr=1&w=800' },
  { code: 'STJ-SH-01', name: 'Turmeric Dupatta', desc: 'Natural dye print, sun-dried and set by hand.', price: 1200, sizes: ['Free Size'], img: 'https://images.pexels.com/photos/35854471/pexels-photo-35854471/free-photo-of-abstract-pink-fabric-with-colorful-patterns.jpeg?cs=tinysrgb&dpr=1&w=800' },
  { code: 'STJ-SH-02', name: 'Indigo Mul Kurti', desc: 'Fermented indigo dye on breathable mul cotton.', price: 2150, sizes: ['S', 'M', 'L', 'XL'], img: 'https://images.pexels.com/photos/4566670/pexels-photo-4566670.jpeg?cs=tinysrgb&dpr=1&w=800' },
  { code: 'STJ-SH-03', name: 'Heritage Silk Saree', desc: 'Karigar-made, hand-carved block motifs on silk.', price: 9600, sizes: ['Free Size'], img: 'https://images.pexels.com/photos/27719401/pexels-photo-27719401/free-photo-of-a-woman-in-a-colorful-sari-holding-an-umbrella.jpeg?cs=tinysrgb&dpr=1&w=800' },
  { code: 'STJ-SH-04', name: 'Sanganeri Sarees', desc: 'Jaipur craft, small-batch hand block print.', price: 5200, sizes: ['Free Size'], img: 'https://images.pexels.com/photos/37076600/pexels-photo-37076600/free-photo-of-traditional-handicraft-shop-in-jaisalmer-india.jpeg?cs=tinysrgb&dpr=1&w=800' },
];

export function ProductGrid() {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [selected, setSelected] = useState<(typeof PRODUCTS)[number] | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const addTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { addToCart, openDrawer } = useCart();

  // Flip morph: the clicked thumbnail's own bounds are captured at click
  // time, then GSAP Flip animates the modal image from that exact rect
  // into place, instead of the modal just fading in from center.
  const thumbRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const modalImgWrapRef = useRef<HTMLDivElement>(null);
  const flipStateRef = useRef<Flip.FlipState | null>(null);

  const open = (p: (typeof PRODUCTS)[number]) => {
    const thumb = thumbRefs.current[p.code];
    flipStateRef.current = thumb ? Flip.getState(thumb, { props: 'borderRadius' }) : null;
    setSelected(p);
    setSelectedSize(p.sizes[0]);
  };
  const close = () => setSelected(null);

  useLayoutEffect(() => {
    if (!selected || !flipStateRef.current || !modalImgWrapRef.current) return;
    Flip.from(flipStateRef.current, {
      targets: modalImgWrapRef.current,
      duration: 0.7,
      ease: 'power3.inOut',
      absolute: true,
      props: 'borderRadius',
    });
    flipStateRef.current = null;
  }, [selected]);

  // Pause Lenis (not document.body.overflow — Lenis owns scroll itself via
  // its own rAF loop, so a native overflow-lock fights it instead of
  // cooperating) while the modal is open.
  useEffect(() => {
    if (!selected) return;
    pauseSmoothScroll();
    return () => resumeSmoothScroll();
  }, [selected]);

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
                <div
                  ref={(el) => { thumbRefs.current[p.code] = el; }}
                  className="relative w-full overflow-hidden rounded-xl"
                  style={{ aspectRatio: '4/5', background: '#f4f2f0' }}
                >
                  <img
                    src={p.img}
                    alt={p.name}
                    loading="lazy"
                    className="h-full w-full object-cover"
                    style={{
                      transition: 'transform .5s cubic-bezier(.2,.7,.2,1), filter .5s ease',
                      transform: hovered ? 'scale(1.06)' : 'scale(1)',
                      filter: hovered ? 'brightness(.92)' : 'brightness(1)',
                    }}
                  />
                </div>
                <p
                  className="mt-4 text-sm font-semibold tracking-[0.02em] transition-colors duration-300"
                  style={{ color: hovered ? BLUSH : '#111' }}
                >
                  {p.name}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
      {selected && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-8"
          onClick={close}
          initial={{ background: 'rgba(20,16,16,0)', backdropFilter: 'blur(0px)' }}
          animate={{ background: 'rgba(20,16,16,0.55)', backdropFilter: 'blur(14px)' }}
          exit={{ background: 'rgba(20,16,16,0)', backdropFilter: 'blur(0px)' }}
          transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            className="relative grid w-full max-w-3xl gap-0 overflow-hidden rounded-3xl sm:grid-cols-2"
            style={{ background: '#fff' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, boxShadow: '0 40px 100px rgba(0,0,0,.35)' }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.2, 0, 0, 1] }}
          >
            <button
              onClick={close}
              className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full text-sm transition-transform hover:scale-110"
              style={{ background: '#f4f2f0', color: '#111' }}
            >
              ✕
            </button>

            <div ref={modalImgWrapRef} className="relative overflow-hidden" style={{ background: '#fafafa', aspectRatio: '4/5' }}>
              <img src={selected.img} alt={selected.name} className="h-full w-full object-cover" />
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
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </section>
  );
}
