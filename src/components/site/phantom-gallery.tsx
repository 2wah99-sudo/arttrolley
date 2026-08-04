'use client';

import { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip';
import { useCart } from './cart';
import { pauseSmoothScroll, resumeSmoothScroll } from './smooth-scroll';

if (typeof window !== 'undefined') gsap.registerPlugin(Flip);

const BLUSH = '#D6432F';
const RED = '#D4222A';

const ITEMS = [
  { code: 'PG-01', t: 'Ajrakh Silk Saree', s: 'Indigo · Madder', price: 6400, sizes: ['Free Size'], img: 'https://images.pexels.com/photos/7920188/pexels-photo-7920188.jpeg?cs=tinysrgb&dpr=1&w=900' },
  { code: 'PG-02', t: 'Hand-Stamped Kurti', s: 'Cotton · Mul', price: 1850, sizes: ['S', 'M', 'L', 'XL'], img: 'https://images.pexels.com/photos/37619027/pexels-photo-37619027/free-photo-of-hand-block-printing-on-yellow-fabric.jpeg?cs=tinysrgb&dpr=1&w=900' },
  { code: 'PG-03', t: 'Block-Print Dupatta', s: 'Turmeric · Pomegranate', price: 1200, sizes: ['Free Size'], img: 'https://images.pexels.com/photos/12576780/pexels-photo-12576780.jpeg?cs=tinysrgb&dpr=1&w=900' },
  { code: 'PG-04', t: 'Co-ord Set', s: 'Sanganeri', price: 3100, sizes: ['S', 'M', 'L'], img: 'https://images.pexels.com/photos/5865305/pexels-photo-5865305.jpeg?cs=tinysrgb&dpr=1&w=900' },
  { code: 'PG-05', t: 'Turmeric Dupatta', s: 'Natural Dye', price: 1200, sizes: ['Free Size'], img: 'https://images.pexels.com/photos/35854471/pexels-photo-35854471/free-photo-of-abstract-pink-fabric-with-colorful-patterns.jpeg?cs=tinysrgb&dpr=1&w=900' },
  { code: 'PG-06', t: 'Indigo Mul Kurti', s: 'Fermented Indigo', price: 2150, sizes: ['S', 'M', 'L', 'XL'], img: 'https://images.pexels.com/photos/4566670/pexels-photo-4566670.jpeg?cs=tinysrgb&dpr=1&w=900' },
  { code: 'PG-07', t: 'Heritage Silk Saree', s: 'Karigar-Made', price: 9600, sizes: ['Free Size'], img: 'https://images.pexels.com/photos/27719401/pexels-photo-27719401/free-photo-of-a-woman-in-a-colorful-sari-holding-an-umbrella.jpeg?cs=tinysrgb&dpr=1&w=900' },
  { code: 'PG-08', t: 'Batik Print Fabric', s: 'Traditional Craft', price: 1450, sizes: ['2m', '3m', '5m'], img: 'https://images.pexels.com/photos/34161635/pexels-photo-34161635/free-photo-of-traditional-batik-printing-in-jakarta-workshop.jpeg?cs=tinysrgb&dpr=1&w=900' },
  { code: 'PG-09', t: 'Sanganeri Sarees', s: 'Jaipur Craft', price: 5200, sizes: ['Free Size'], img: 'https://images.pexels.com/photos/37076600/pexels-photo-37076600/free-photo-of-traditional-handicraft-shop-in-jaisalmer-india.jpeg?cs=tinysrgb&dpr=1&w=900' },
];

const CELL_SIZE = 200;
const GAP = 14;
const STEP = CELL_SIZE + GAP;
const RADIUS_TILES = 3; // 7x7 visible grid
const MAX_ANGLE = 28; // degrees
const ARC_AMOUNT = 0.6;
const EDGE_FADE = 0.25;
const FRICTION = 0.92;
const CLICK_THRESHOLD = 6; // px — below this, a pointer-up counts as a click not a drag

export function PhantomGallery() {
  const containerRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef({ x: 0, y: 0 });
  const velocityRef = useRef({ x: 0, y: 0 });
  const draggingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const downPosRef = useRef({ x: 0, y: 0 });
  const movedRef = useRef(0);
  const lastTimeRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const [, forceRender] = useState(0);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [selected, setSelected] = useState<(typeof ITEMS)[number] | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const addTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { addToCart, openDrawer } = useCart();

  const render = useCallback(() => forceRender((n) => n + 1), []);

  // inertia loop
  useEffect(() => {
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!draggingRef.current) {
        const speed = Math.hypot(velocityRef.current.x, velocityRef.current.y);
        if (speed > 1) {
          offsetRef.current.x += velocityRef.current.x * dt;
          offsetRef.current.y += velocityRef.current.y * dt;
          const decay = Math.pow(FRICTION, dt * 60);
          velocityRef.current.x *= decay;
          velocityRef.current.y *= decay;
          render();
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [render]);

  const modalImgWrapRef = useRef<HTMLDivElement>(null);
  const flipStateRef = useRef<Flip.FlipState | null>(null);

  const openItem = (item: (typeof ITEMS)[number], cellEl: HTMLElement) => {
    flipStateRef.current = cellEl ? Flip.getState(cellEl, { props: 'borderRadius' }) : null;
    setSelected(item);
    setSelectedSize(item.sizes[0]);
  };

  const closeModal = () => setSelected(null);

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
      name: selected.t,
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

  const onPointerDown = (e: React.PointerEvent) => {
    draggingRef.current = true;
    lastPosRef.current = { x: e.clientX, y: e.clientY };
    downPosRef.current = { x: e.clientX, y: e.clientY };
    movedRef.current = 0;
    lastTimeRef.current = performance.now();
    velocityRef.current = { x: 0, y: 0 };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    const now = performance.now();
    const dt = Math.max(0.001, (now - lastTimeRef.current) / 1000);
    const dx = e.clientX - lastPosRef.current.x;
    const dy = e.clientY - lastPosRef.current.y;
    offsetRef.current.x += dx;
    offsetRef.current.y += dy;
    movedRef.current += Math.hypot(dx, dy);
    const vx = dx / dt;
    const vy = dy / dt;
    velocityRef.current.x = vx * 0.6 + velocityRef.current.x * 0.4;
    velocityRef.current.y = vy * 0.6 + velocityRef.current.y * 0.4;
    lastPosRef.current = { x: e.clientX, y: e.clientY };
    lastTimeRef.current = now;
    render();
  };

  const onPointerUp = () => {
    draggingRef.current = false;
    const speed = Math.hypot(velocityRef.current.x, velocityRef.current.y);
    if (speed < 80) velocityRef.current = { x: 0, y: 0 };
    velocityRef.current.x = Math.max(-2500, Math.min(2500, velocityRef.current.x));
    velocityRef.current.y = Math.max(-2500, Math.min(2500, velocityRef.current.y));
  };

  const baseCol = Math.floor(offsetRef.current.x / STEP) * -1;
  const baseRow = Math.floor(offsetRef.current.y / STEP) * -1;

  const cells: React.ReactElement[] = [];
  for (let dy = -RADIUS_TILES; dy <= RADIUS_TILES; dy++) {
    for (let dx = -RADIUS_TILES; dx <= RADIUS_TILES; dx++) {
      const col = baseCol + dx;
      const row = baseRow + dy;
      const screenX = col * STEP + offsetRef.current.x;
      const screenY = row * STEP + offsetRef.current.y;

      const idx = Math.abs((col + row * 3) % ITEMS.length);
      const item = ITEMS[idx];
      const key = `${col},${row}`;
      const isHovered = hoveredKey === key;

      const edgeFactorX = Math.max(-1, Math.min(1, screenX / (STEP * RADIUS_TILES)));
      const angle = edgeFactorX * MAX_ANGLE * ARC_AMOUNT;
      const rad = (angle * Math.PI) / 180;
      const radiusPx = 700;
      const z = -radiusPx * (1 - Math.cos(rad));
      const edgeFactor = Math.abs(edgeFactorX);
      const scale = (1 - EDGE_FADE * edgeFactor * edgeFactor) * (isHovered ? 1.04 : 1);
      const opacity = 1 - 0.4 * edgeFactor * ARC_AMOUNT;

      cells.push(
        <div
          key={key}
          onMouseEnter={() => setHoveredKey(key)}
          onMouseLeave={() => setHoveredKey(null)}
          onClick={(e) => { if (movedRef.current < CLICK_THRESHOLD) openItem(item, e.currentTarget); }}
          className="absolute overflow-hidden rounded-2xl"
          style={{
            width: CELL_SIZE,
            height: CELL_SIZE * 1.25,
            left: '50%',
            top: '50%',
            marginLeft: -CELL_SIZE / 2,
            marginTop: -(CELL_SIZE * 1.25) / 2,
            transform: `translate3d(${screenX}px, ${screenY}px, ${z}px) rotateY(${angle}deg) scale(${scale})`,
            opacity,
            cursor: 'pointer',
            transition: draggingRef.current ? 'none' : 'background-color .3s ease, border-color .3s ease, transform .25s ease',
            background: isHovered ? 'rgba(212,34,42,.14)' : 'rgba(0,0,0,.1)',
            border: `1px solid ${isHovered ? RED : 'rgba(214,67,47,.14)'}`,
            willChange: 'transform',
          }}
        >
          <img
            src={item.img}
            alt={item.t}
            draggable={false}
            className="pointer-events-none h-[70%] w-full object-cover"
            style={{ filter: 'saturate(1.08) contrast(1.06) brightness(0.9)' }}
          />
          <div className="px-3 py-2">
            <p className="truncate text-[0.62rem] font-medium transition-colors duration-300" style={{ color: isHovered ? RED : BLUSH }}>{item.t}</p>
            <p className="truncate text-[0.55rem] uppercase tracking-[0.1em]" style={{ color: isHovered ? 'rgba(212,34,42,.7)' : 'rgba(214,67,47,.55)' }}>{item.s}</p>
          </div>
        </div>,
      );
    }
  }

  return (
    <section id="bazaar">
      <div className="mx-auto max-w-2xl px-6 pb-10 pt-24 text-center">
        <p className="text-[0.62rem] uppercase tracking-[0.36em]" style={{ color: 'rgba(214,67,47,.7)' }}>The Bazaar</p>
        <h2 className="mt-3 text-3xl font-semibold sm:text-5xl" style={{ color: BLUSH }}>Walk the aisle.</h2>
        <p className="mt-4 text-sm font-light" style={{ color: 'rgba(214,67,47,.55)' }}>
          Drag to browse the stalls. Tap any piece to see it up close.
        </p>
      </div>
      <div
        ref={containerRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        className="relative mx-auto overflow-hidden select-none"
        style={{
          height: '60vh',
          maxHeight: 560,
          perspective: 1000,
          cursor: draggingRef.current ? 'grabbing' : 'grab',
          touchAction: 'none',
        }}
      >
        <div className="absolute inset-0" style={{ transformStyle: 'preserve-3d' }}>
          {cells}
        </div>
      </div>
      <p className="mt-6 text-center text-[0.6rem] uppercase tracking-[0.2em]" style={{ color: 'rgba(214,67,47,.4)' }}>
        Drag to explore → Tap to zoom
      </p>

      <AnimatePresence>
      {selected && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-8"
          onClick={closeModal}
          initial={{ background: 'rgba(0,0,0,0)', backdropFilter: 'blur(0px)' }}
          animate={{ background: 'rgba(0,0,0,0.86)', backdropFilter: 'blur(10px)' }}
          exit={{ background: 'rgba(0,0,0,0)', backdropFilter: 'blur(0px)' }}
          transition={{ duration: 0.2, ease: [0.2, 0.7, 0.2, 1] }}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            className="relative grid w-full max-w-4xl gap-0 overflow-hidden rounded-3xl sm:grid-cols-2"
            style={{ background: '#0a0808', border: `1px solid ${RED}` }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, boxShadow: '0 0 0 1px rgba(212,34,42,.25), 0 30px 90px rgba(212,34,42,.25)' }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.26, ease: [0.2, 0.7, 0.2, 1] }}
          >
            <button
              onClick={closeModal}
              className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full text-sm transition-colors"
              style={{ background: 'rgba(0,0,0,.55)', color: RED, border: `1px solid ${RED}` }}
            >
              ✕
            </button>

            <div ref={modalImgWrapRef} className="relative overflow-hidden" style={{ aspectRatio: '3/4', background: '#000' }}>
              <img
                src={selected.img}
                alt={selected.t}
                className="h-full w-full object-cover"
                style={{ filter: 'saturate(1.1) contrast(1.08) brightness(0.92)' }}
              />
              <div
                className="pointer-events-none absolute inset-0"
                style={{ background: 'linear-gradient(0deg, rgba(212,34,42,.22), transparent 45%)' }}
              />
            </div>

            <div className="flex flex-col justify-center p-6 sm:p-8">
              <p className="text-[0.6rem] uppercase tracking-[0.3em]" style={{ color: 'rgba(212,34,42,.75)' }}>{selected.s}</p>
              <h3 className="mt-2 text-2xl font-semibold sm:text-3xl" style={{ color: RED }}>{selected.t}</h3>
              <p className="mt-3 text-2xl font-semibold" style={{ color: BLUSH }}>
                ₹{selected.price.toLocaleString('en-IN')}
              </p>

              <div className="mt-6">
                <p className="mb-2 text-[0.6rem] uppercase tracking-[0.2em]" style={{ color: 'rgba(214,67,47,.55)' }}>Size</p>
                <div className="flex flex-wrap gap-2">
                  {selected.sizes.map((sz) => (
                    <button
                      key={sz}
                      onClick={() => setSelectedSize(sz)}
                      className="rounded-full px-4 py-2 text-xs font-medium transition-all duration-200"
                      style={{
                        border: `1px solid ${selectedSize === sz ? RED : 'rgba(214,67,47,.3)'}`,
                        background: selectedSize === sz ? RED : 'transparent',
                        color: selectedSize === sz ? '#0a0808' : BLUSH,
                      }}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleAddToTrolley}
                className="mt-8 rounded-full px-7 py-3 text-[0.65rem] font-semibold uppercase tracking-[0.18em] transition-transform"
                style={{
                  background: RED,
                  color: '#fff',
                  minWidth: '13rem',
                  transform: added ? 'scale(0.97)' : 'scale(1)',
                  transition: 'transform .15s ease',
                }}
              >
                {added ? 'Added ✓' : `Add to Trolley — ₹${selected.price.toLocaleString('en-IN')}`}
              </button>
              <p className="mt-4 text-[0.6rem] font-light" style={{ color: 'rgba(214,67,47,.4)' }}>
                Hand block-printed. Small batch. Ships in 3–5 days.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </section>
  );
}
