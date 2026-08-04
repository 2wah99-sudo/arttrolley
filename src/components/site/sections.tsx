'use client';

import { useEffect, useRef, useState } from 'react';
import { MagneticButton } from './magnetic-button';
import { CraftScroller } from './craft-scroller';
import { CartIcon } from './cart';
import { setPressState, type PressState } from './press-store';

export const CHARCOAL = '#000000';
export const BLUSH = '#D6432F';

/* ---------------------------------------------------------------- reveal */
export function Reveal({
  children, delay = 0, className = '', style,
}: { children: React.ReactNode; delay?: number; className?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect(); } },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        ...style,
        opacity: seen ? 1 : 0,
        transform: seen ? 'translateY(0)' : 'translateY(38px)',
        transition: `opacity .8s cubic-bezier(.2,.6,.2,1) ${delay}s, transform .8s cubic-bezier(.2,.6,.2,1) ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------- nav */
export function Nav() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const on = () => setShow(window.scrollY > window.innerHeight * 0.55);
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  return (
    <nav
      className="fixed inset-x-0 top-0 z-50 flex items-center justify-between px-5 py-4 backdrop-blur-md transition-transform duration-500 sm:px-8"
      style={{
        background: 'rgba(51,43,43,.72)',
        borderBottom: `1px solid ${show ? 'rgba(214,67,47,.16)' : 'transparent'}`,
        transform: show ? 'translateY(0)' : 'translateY(-100%)',
      }}
    >
      <span className="text-sm font-semibold uppercase tracking-[0.3em]" style={{ color: BLUSH }}>
        Arttrolley
      </span>
      <div className="hidden gap-8 md:flex">
        {['Bazaar', 'Craft', 'Collection', 'Founder'].map((l, i) => (
          <a
            key={l}
            href={`#${l.toLowerCase()}`}
            className="text-[0.65rem] uppercase tracking-[0.2em] transition-colors"
            style={{ color: 'rgba(214,67,47,.62)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = BLUSH)}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(214,67,47,.62)')}
            onClick={() => setPressState(i as PressState)}
          >
            {l}
          </a>
        ))}
      </div>
      <CartIcon />
    </nav>
  );
}

/* --------------------------------------------------------------- marquee */
export function Marquee() {
  const items = ['Hand Block Printed', 'Natural Dyes', 'Small Batch', 'Made By Karigars', 'Slow Fashion'];
  return (
    <div className="crinkle-surface overflow-hidden py-3">
      <div className="flex whitespace-nowrap" style={{ animation: 'at-marquee 26s linear infinite' }}>
        {[0, 1].map((k) => (
          <div key={k} className="flex shrink-0">
            {items.map((it) => (
              <span
                key={it + k}
                className="px-8 text-sm font-medium uppercase tracking-[0.16em]"
                style={{ color: CHARCOAL }}
              >
                {it} <span className="opacity-45">✦</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ section head */
function Head({ eyebrow, title, blurb }: { eyebrow: string; title: string; blurb?: string }) {
  return (
    <Reveal className="mx-auto max-w-2xl px-6 pb-12 pt-24 text-center">
      <p className="text-[0.62rem] uppercase tracking-[0.36em]" style={{ color: 'rgba(214,67,47,.7)' }}>
        {eyebrow}
      </p>
      <h2 className="mt-3 font-serif text-3xl font-semibold sm:text-5xl" style={{ color: BLUSH }}>
        {title}
      </h2>
      {blurb && <p className="mt-4 text-sm font-light" style={{ color: 'rgba(214,67,47,.55)' }}>{blurb}</p>}
    </Reveal>
  );
}

/* ---------------------------------------------------------------- bazaar */
const STALLS = [
  { n: '01', t: 'Ajrakh & Bagru Sarees', s: 'Indigo · Madder', img: 'https://images.pexels.com/photos/37076600/pexels-photo-37076600/free-photo-of-traditional-handicraft-shop-in-jaisalmer-india.jpeg?cs=tinysrgb&dpr=1&w=700' },
  { n: '02', t: 'Hand-Stamped Kurtis', s: 'Cotton · Mul', img: 'https://images.pexels.com/photos/34161635/pexels-photo-34161635/free-photo-of-traditional-batik-printing-in-jakarta-workshop.jpeg?cs=tinysrgb&dpr=1&w=700' },
  { n: '03', t: 'Block-Print Dupattas', s: 'Turmeric · Pomegranate', img: 'https://images.pexels.com/photos/12576780/pexels-photo-12576780.jpeg?cs=tinysrgb&dpr=1&w=700' },
  { n: '04', t: 'Co-ord Sets', s: 'Sanganeri', img: 'https://images.pexels.com/photos/5865305/pexels-photo-5865305.jpeg?cs=tinysrgb&dpr=1&w=700' },
];

export function Bazaar() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [pct, setPct] = useState(8);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <section id="bazaar">
      <Head eyebrow="The Bazaar" title="Walk the aisle." blurb="Four stalls — scroll sideways, like weaving through the market." />
      <div className="relative px-6 pb-12">
        <div
          ref={trackRef}
          onScroll={(e) => {
            const el = e.currentTarget;
            const max = el.scrollWidth - el.clientWidth;
            setPct(max > 0 ? Math.max(8, (el.scrollLeft / max) * 100) : 8);
          }}
          className="flex gap-5 overflow-x-auto pb-6"
          style={{ scrollSnapType: 'x mandatory', scrollbarWidth: 'none', scrollBehavior: 'smooth' }}
        >
          {STALLS.map((s, i) => (
            <article
              key={s.n}
              className="group relative shrink-0 overflow-hidden rounded-3xl transition-all duration-500"
              style={{
                scrollSnapAlign: 'center',
                scrollSnapStop: 'always',
                width: 'clamp(280px,35vw,400px)',
                aspectRatio: '3/4',
                border: `1px solid ${hoveredIdx === i ? BLUSH : 'rgba(214,67,47,.18)'}`,
                background: '#000',
                transform: hoveredIdx === i ? 'scale(1.02)' : 'scale(1)',
              }}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <img
                src={s.img}
                alt={s.t}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700"
                style={{
                  filter: 'saturate(1.08) contrast(1.07) brightness(0.88)',
                  transform: hoveredIdx === i ? 'scale(1.08)' : 'scale(1)',
                }}
              />
              <div
                className="pointer-events-none absolute inset-0 transition-opacity duration-500"
                style={{
                  background:
                    'radial-gradient(ellipse at center, transparent 35%, #000 100%),' +
                    'linear-gradient(0deg, rgba(0,0,0,.95), transparent 50%)',
                  opacity: hoveredIdx === i ? 0.8 : 1,
                }}
              />
              <div className="absolute inset-x-0 bottom-0 p-6 transition-transform duration-500" style={{ transform: hoveredIdx === i ? 'translateY(-4px)' : 'translateY(0)' }}>
                <p className="text-[0.58rem] uppercase tracking-[0.26em]" style={{ color: 'rgba(214,67,47,.65)' }}>{s.n} · {s.s}</p>
                <h3 className="mt-2 text-2xl font-semibold" style={{ color: BLUSH }}>{s.t}</h3>
              </div>
            </article>
          ))}
        </div>
        <div className="mt-6 h-1 overflow-hidden rounded-full" style={{ background: 'rgba(214,67,47,.12)' }}>
          <div className="h-full transition-all duration-100" style={{ width: `${pct}%`, background: BLUSH }} />
        </div>
      </div>
      <p className="text-center text-[0.6rem] uppercase tracking-[0.2em]" style={{ color: 'rgba(214,67,47,.4)' }}>
        Scroll to explore →
      </p>
    </section>
  );
}

/* ----------------------------------------------------------------- craft */
const STEPS = [
  { n: '01', t: 'Carve the Block', d: 'Master carvers cut every motif by hand into seasoned teak. One block can take days.' },
  { n: '02', t: 'Mix the Dye', d: 'Indigo, madder root and turmeric, ground and fermented the way they have been for generations.' },
  { n: '03', t: 'Press by Hand', d: 'Dipped, aligned by eye, pressed. No two lengths of cloth ever come out identical.' },
  { n: '04', t: 'Sun-Dry & Set', d: 'The cloth rests under open sky so the colour cures naturally before it is cut and stitched.' },
];

export function Craft() {
  const wrapRef = useRef<HTMLDivElement>(null);
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
    <section id="craft" style={{ background: 'rgba(0,0,0,.16)' }}>
      <Head eyebrow="The Craft" title="From block to bolt of cloth." />
      <div ref={wrapRef} className="relative mx-auto max-w-3xl px-6 pb-24">
        <div className="absolute bottom-0 left-[3.35rem] top-0 w-px" style={{ background: 'rgba(214,67,47,.18)' }}>
          <div className="w-full transition-[height] duration-100" style={{ height: `${fill}%`, background: BLUSH }} />
        </div>
        {STEPS.map((s, i) => (
          <Reveal key={s.n} delay={i * 0.05}>
            <div className="flex gap-7 py-9">
              <div
                className="z-10 flex h-[4.6rem] w-[4.6rem] shrink-0 items-center justify-center rounded-full text-lg"
                style={{ background: CHARCOAL, border: `1px solid ${BLUSH}`, color: BLUSH }}
              >
                {s.n}
              </div>
              <div>
                <h4 className="text-xl font-medium" style={{ color: BLUSH }}>{s.t}</h4>
                <p className="mt-2 max-w-md text-sm font-light" style={{ color: 'rgba(214,67,47,.55)' }}>{s.d}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

// Export legacy name for backward compatibility
export { CraftScroller as CraftInteractive };

/* ------------------------------------------------------------ collection */
const PIECES = [
  { t: 'Ajrakh Silk Saree', tag: 'Saree', p: '₹6,400', img: 'https://images.pexels.com/photos/7920188/pexels-photo-7920188.jpeg?cs=tinysrgb&dpr=1&w=600' },
  { t: 'Bagru Cotton Kurti', tag: 'Kurti', p: '₹1,850', img: 'https://images.pexels.com/photos/37619027/pexels-photo-37619027/free-photo-of-hand-block-printing-on-yellow-fabric.jpeg?cs=tinysrgb&dpr=1&w=600' },
  { t: 'Turmeric Dupatta', tag: 'Dupatta', p: '₹1,200', img: 'https://images.pexels.com/photos/35854471/pexels-photo-35854471/free-photo-of-abstract-pink-fabric-with-colorful-patterns.jpeg?cs=tinysrgb&dpr=1&w=600' },
  { t: 'Sanganeri Co-ord', tag: 'Co-ord', p: '₹3,100', img: 'https://images.pexels.com/photos/6851130/pexels-photo-6851130.jpeg?cs=tinysrgb&dpr=1&w=600' },
  { t: 'Indigo Mul Kurti', tag: 'Kurti', p: '₹2,150', img: 'https://images.pexels.com/photos/4566670/pexels-photo-4566670.jpeg?cs=tinysrgb&dpr=1&w=600' },
  { t: 'Heritage Silk Saree', tag: 'Saree', p: '₹9,600', img: 'https://images.pexels.com/photos/27719401/pexels-photo-27719401/free-photo-of-a-woman-in-a-colorful-sari-holding-an-umbrella.jpeg?cs=tinysrgb&dpr=1&w=600' },
];

export function Collection() {
  return (
    <section id="collection">
      <Head eyebrow="Featured" title="This week's pieces." blurb="Small batches. Once a print sells out, it does not come back." />
      <div className="mx-auto grid max-w-6xl grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-6 px-6 pb-24">
        {PIECES.map((p, i) => (
          <Reveal key={p.t} delay={(i % 3) * 0.08}>
            <article className="overflow-hidden rounded-xl" style={{ border: '1px solid rgba(214,67,47,.16)' }}>
              <div
                className="relative overflow-hidden transition-transform duration-300 ease-out"
                style={{ aspectRatio: '3/4', perspective: 800, background: '#000' }}
                onMouseMove={(e) => {
                  const r = e.currentTarget.getBoundingClientRect();
                  const x = (e.clientX - r.left) / r.width - 0.5;
                  const y = (e.clientY - r.top) / r.height - 0.5;
                  e.currentTarget.style.transform = `rotateY(${x * 11}deg) rotateX(${-y * 11}deg) scale(1.04)`;
                }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'rotateY(0) rotateX(0) scale(1)'; }}
              >
                <img
                  src={p.img}
                  alt={p.t}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover"
                  style={{ filter: 'saturate(1.08) contrast(1.05) brightness(0.94)' }}
                />
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      'radial-gradient(ellipse at center, transparent 42%, #000 100%),' +
                      'linear-gradient(to top, #000 0%, transparent 30%)',
                  }}
                />
                <span
                  className="absolute left-3 top-3 rounded-full px-2 py-1 text-[0.55rem] uppercase tracking-[0.14em]"
                  style={{ background: BLUSH, color: CHARCOAL }}
                >
                  {p.tag}
                </span>
              </div>
              <div className="flex items-baseline justify-between px-4 py-4">
                <h4 className="text-sm" style={{ color: BLUSH }}>{p.t}</h4>
                <span className="text-sm" style={{ color: 'rgba(214,67,47,.7)' }}>{p.p}</span>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ manifesto */
export function Manifesto() {
  return (
    <section className="px-6 py-28 text-center">
      <Reveal>
        <p className="text-[0.62rem] uppercase tracking-[0.4em]" style={{ color: 'rgba(214,67,47,.55)' }}>
          What we believe
        </p>
        <h2
          className="mx-auto mt-6 max-w-4xl font-serif text-4xl font-semibold leading-[1.08] sm:text-5xl lg:text-6xl"
          style={{ color: BLUSH }}
        >
          The hand that carves the block should be known.
        </h2>
      </Reveal>
    </section>
  );
}

/* ---------------------------------------------------------------- numbers */
const STATS = [
  { n: 40, suffix: '+', l: 'Hand-carved blocks in rotation' },
  { n: 14, suffix: '', l: 'Karigar families we work with' },
  { n: 100, suffix: '%', l: 'Natural, plant-based dyes' },
  { n: 0, suffix: '', l: 'Mass-produced prints' },
];

/** Counts 0 -> value once visible. ~900ms, MD3 Emphasized-ish (fast start, gentle settle). */
function CountUp({ value, suffix }: { value: number; suffix: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [display, setDisplay] = useState(0);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect(); } },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!seen) return;
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplay(value);
      return;
    }
    if (value === 0) return; // nothing to count toward — the "0" stat holds as-is
    const duration = 900;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // cubic ease-out
      setDisplay(Math.round(eased * value));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [seen, value]);

  return (
    <div ref={ref} className="text-4xl font-semibold tabular-nums sm:text-5xl" style={{ color: BLUSH }}>
      {display}{suffix}
    </div>
  );
}

export function Numbers() {
  return (
    <section style={{ background: 'rgba(0,0,0,.16)' }}>
      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-10 px-6 py-20 sm:grid-cols-4">
        {STATS.map((s, i) => (
          <Reveal key={s.l} delay={i * 0.06} className="text-center">
            <CountUp value={s.n} suffix={s.suffix} />
            <p className="mx-auto mt-2 max-w-[10rem] text-[0.68rem] uppercase tracking-[0.1em]" style={{ color: 'rgba(214,67,47,.55)' }}>
              {s.l}
            </p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------- quote */
export function Quote() {
  return (
    <Reveal className="px-6 py-24 text-center">
      <blockquote className="mx-auto max-w-3xl text-2xl font-light italic leading-snug sm:text-4xl" style={{ color: BLUSH }}>
        “A block print carries the hand that carved it and the hand that pressed it — you cannot machine that into cloth.”
      </blockquote>
      <cite className="mt-6 block text-xs uppercase not-italic tracking-[0.28em]" style={{ color: 'rgba(214,67,47,.45)' }}>
        Lovely Pandranki · Founder
      </cite>
    </Reveal>
  );
}

/* ------------------------------------------------------------------- cta */
export function Cta() {
  const [status, setStatus] = useState<'idle' | 'sent'>('idle');

  return (
    <section className="relative overflow-hidden px-6 py-24 text-center">
      <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 40%, rgba(214,67,47,.16), transparent 62%)' }} />
      <Reveal className="relative">
        <p className="text-[0.62rem] uppercase tracking-[0.36em]" style={{ color: 'rgba(214,67,47,.7)' }}>Join the trolley</p>
        <h3 className="mt-3 font-serif text-3xl font-semibold sm:text-5xl" style={{ color: BLUSH }}>Get first pick of every print.</h3>
        {status === 'idle' ? (
          <form
            className="mt-9 flex flex-wrap justify-center gap-3"
            onSubmit={(e) => { e.preventDefault(); setStatus('sent'); }}
          >
            <input
              type="email"
              required
              placeholder="you@email.com"
              className="min-w-[260px] rounded-full bg-transparent px-5 py-3 text-sm outline-none transition-[border-color] duration-300 focus:border-[var(--blush,#D6432F)]"
              style={{ border: '1px solid rgba(214,67,47,.3)', color: BLUSH }}
            />
            <MagneticButton
              as="button"
              type="submit"
              className="crinkle-surface rounded-full px-7 py-3 text-[0.65rem] font-semibold uppercase tracking-[0.18em]"
              style={{ color: '#fff', display: 'inline-block' }}
            >
              Notify me
            </MagneticButton>
          </form>
        ) : (
          <p
            className="mt-9 text-sm font-medium"
            style={{ color: BLUSH, animation: 'at-up .5s both' }}
          >
            ✦ You&apos;re on the list — first pick, every drop.
          </p>
        )}
      </Reveal>
    </section>
  );
}

/* ---------------------------------------------------------------- footer */
export function Footer() {
  const cols = [
    { h: 'Shop', l: [
      { t: 'Sarees', href: '#collection' },
      { t: 'Kurtis', href: '#collection' },
      { t: 'Dupattas', href: '#collection' },
      { t: 'Co-ords', href: '#collection' },
    ] },
    { h: 'About', l: [
      { t: 'Our Story', href: '#founder' },
      { t: 'The Karigars', href: '#craft' },
      { t: 'Journal', href: '#' },
    ] },
    { h: 'Support', l: [
      { t: 'Contact', href: 'mailto:hello@arttrolley.com' },
      { t: 'Shipping', href: '#' },
      { t: 'Returns', href: '#' },
    ] },
  ];
  return (
    <footer className="px-6 pb-8 pt-16" style={{ borderTop: '1px solid rgba(214,67,47,.16)' }}>
      <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-10">
        <Reveal className="max-w-xs">
          <div className="text-xl font-semibold uppercase tracking-[0.2em]" style={{ color: BLUSH }}>Arttrolley</div>
          <p className="mt-3 text-sm font-light" style={{ color: 'rgba(214,67,47,.5)' }}>
            Hand block-printed sarees and kurtis, made in small batches by artisans across Rajasthan.
          </p>
        </Reveal>
        {cols.map((c, i) => (
          <Reveal key={c.h} delay={0.08 + i * 0.06}>
            <h5 className="mb-3 text-[0.6rem] uppercase tracking-[0.22em]" style={{ color: BLUSH }}>{c.h}</h5>
            {c.l.map((x) => (
              <a
                key={x.t}
                href={x.href}
                className="mb-2 block text-sm transition-all duration-200 hover:translate-x-1"
                style={{ color: 'rgba(214,67,47,.5)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = BLUSH)}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(214,67,47,.5)')}
              >
                {x.t}
              </a>
            ))}
          </Reveal>
        ))}
      </div>
      <Reveal
        delay={0.3}
        className="mx-auto mt-12 flex max-w-6xl flex-wrap justify-between gap-2 pt-6 text-[0.65rem]"
        style={{ borderTop: '1px solid rgba(214,67,47,.14)', color: 'rgba(214,67,47,.4)' }}
      >
        <span>© 2026 ARTTROLLEY. Pressed by hand.</span>
        <span>Jaipur · Bagru</span>
      </Reveal>
    </footer>
  );
}
