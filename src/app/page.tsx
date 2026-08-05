'use client';

import dynamic from 'next/dynamic';
import { motion } from 'motion/react';
import { AuroraText } from '@/components/ui/aurora-text';
import { Spotlight } from '@/components/ui/spotlight';
import { MagneticButton } from '@/components/site/magnetic-button';
import { ScrollReveal, ScrollParallax, ScrollScale, ScrollFadeOut } from '@/components/site/scroll-sections';
import {
  Nav, Marquee, Manifesto, Numbers, Quote, Cta, Footer, Reveal,
  CHARCOAL, BLUSH, CraftInteractive,
} from '@/components/site/sections';
import { PhantomGallery } from '@/components/site/phantom-gallery';
import { TeamSpotlight } from '@/components/site/team-spotlight';
import { SmoothScroll } from '@/components/site/smooth-scroll';
import { CustomCursor } from '@/components/site/custom-cursor';
import { ProductGrid } from '@/components/site/product-grid';
import { LiquidBackground } from '@/components/site/liquid-background';
import { CartProvider, CartDrawer } from '@/components/site/cart';
import { CheckoutView } from '@/components/site/checkout';
import { CinematicIntro } from '@/components/site/cinematic-intro';
import { InkPressType } from '@/components/site/ink-press-type';
import { KarigarOrbit } from '@/components/site/karigar-orbit';
import { WaterfallScrub } from '@/components/site/waterfall-scrub';
import { ThreadsIntro } from '@/components/site/threads-intro';
import { useCinematicTransition } from '@/components/site/use-cinematic-transition';

const Hero3D = dynamic(() => import('@/components/site/hero-3d'), {
  ssr: false,
  loading: () => <div className="absolute inset-0" style={{ background: CHARCOAL }} />,
});
const TacticalGlobeSection = dynamic(
  () => import('@/components/site/tactical-globe').then((m) => m.TacticalGlobeSection),
  { ssr: false, loading: () => <div className="h-[100svh]" style={{ background: CHARCOAL }} /> },
);

// aurora sweep kept inside the blush family so it reads as ARTTROLLEY, not rainbow
const AURORA = ['#D6432F', '#F2C4BB', '#A8291F', '#E8705C'];

const COLLECTION_ITEMS = [
  {
    id: 1,
    type: 'image',
    title: 'Ajrakh Silk Saree',
    desc: 'Indigo & madder — ₹6,400',
    url: 'https://images.pexels.com/photos/7920188/pexels-photo-7920188.jpeg?cs=tinysrgb&dpr=1&w=800',
    span: 'md:col-span-1 md:row-span-3 sm:col-span-1 sm:row-span-2',
  },
  {
    id: 2,
    type: 'image',
    title: 'Bagru Cotton Kurti',
    desc: 'Hand block printed — ₹1,850',
    url: 'https://images.pexels.com/photos/37619027/pexels-photo-37619027/free-photo-of-hand-block-printing-on-yellow-fabric.jpeg?cs=tinysrgb&dpr=1&w=800',
    span: 'md:col-span-2 md:row-span-2 col-span-1 sm:col-span-2 sm:row-span-2',
  },
  {
    id: 3,
    type: 'image',
    title: 'Turmeric Dupatta',
    desc: 'Natural dye print — ₹1,200',
    url: 'https://images.pexels.com/photos/35854471/pexels-photo-35854471/free-photo-of-abstract-pink-fabric-with-colorful-patterns.jpeg?cs=tinysrgb&dpr=1&w=800',
    span: 'md:col-span-1 md:row-span-3 sm:col-span-2 sm:row-span-2',
  },
  {
    id: 4,
    type: 'image',
    title: 'Sanganeri Co-ord',
    desc: 'Small-batch cotton — ₹3,100',
    url: 'https://images.pexels.com/photos/6851130/pexels-photo-6851130.jpeg?cs=tinysrgb&dpr=1&w=800',
    span: 'md:col-span-2 md:row-span-2 sm:col-span-1 sm:row-span-2',
  },
  {
    id: 5,
    type: 'image',
    title: 'Indigo Mul Kurti',
    desc: 'Fermented indigo dye — ₹2,150',
    url: 'https://images.pexels.com/photos/4566670/pexels-photo-4566670.jpeg?cs=tinysrgb&dpr=1&w=800',
    span: 'md:col-span-1 md:row-span-3 sm:col-span-1 sm:row-span-2',
  },
  {
    id: 6,
    type: 'image',
    title: 'Heritage Silk Saree',
    desc: 'Karigar-made — ₹9,600',
    url: 'https://images.pexels.com/photos/27719401/pexels-photo-27719401/free-photo-of-a-woman-in-a-colorful-sari-holding-an-umbrella.jpeg?cs=tinysrgb&dpr=1&w=800',
    span: 'md:col-span-2 md:row-span-2 sm:col-span-1 sm:row-span-2',
  },
];

export default function Home() {
  const { ref: heroRef, motionStyle: heroMotionStyle } = useCinematicTransition<HTMLElement>();
  return (
    <CartProvider>
    <div style={{ background: CHARCOAL }}>
      <SmoothScroll />
      <CustomCursor />
      <CinematicIntro />
      <a
        href="#main-content"
        className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-full px-5 py-2.5 text-xs font-semibold uppercase tracking-wide transition-transform focus:translate-y-0"
        style={{ background: BLUSH, color: CHARCOAL }}
      >
        Skip to content
      </a>
      <Nav />

      <main id="main-content">
      {/* ------------------------------------------------ hero */}
      <motion.section
        ref={heroRef}
        className="sticky top-0 flex min-h-svh flex-col items-center justify-center overflow-hidden"
        style={heroMotionStyle}
      >
        {/* CSS fallback so the hero is never empty if WebGL is unavailable */}
        <LiquidBackground className="absolute inset-0" />
        <Hero3D dark={CHARCOAL} light={BLUSH} className="absolute inset-0 h-full w-full" />
        <Spotlight className="-top-40 left-0 md:left-40 md:-top-20" fill={BLUSH} />
        <span aria-hidden className="at-hero-orb at-hero-orb-one" />
        <span aria-hidden className="at-hero-orb at-hero-orb-two" />
        <span aria-hidden className="at-hero-orb at-hero-orb-three" />

        <ScrollFadeOut className="relative z-10 px-6 text-center">
          <p
            className="text-[0.62rem] uppercase tracking-[0.42em]"
            style={{ color: 'rgba(214,67,47,.72)', animation: 'at-up .9s .1s both' }}
          >
            Handblock Sarees &amp; Kurtis
          </p>
          <h1
            className="mt-5 font-extrabold uppercase leading-[0.92] tracking-[0.06em] text-[15vw] sm:text-[11vw] lg:text-[8.5rem]"
            style={{ animation: 'at-up 1s .25s both' }}
          >
            <AuroraText
              colors={AURORA}
              speed={0.8}
            className="at-hero-word [filter:drop-shadow(0_0_42px_rgba(214,67,47,.34))]"
            >
              Arttrolley
            </AuroraText>
          </h1>
          <p
            className="mx-auto mt-6 max-w-lg text-sm font-light sm:text-base"
            style={{ color: 'rgba(214,67,47,.62)', animation: 'at-up 1s .45s both' }}
          >
            Every press tells a story. Hand-carved blocks, natural dyes, and the karigars of
            Rajasthan — carried straight to your wardrobe.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3" style={{ animation: 'at-up 1s .6s both' }}>
            <MagneticButton
              href="#bazaar"
              strength={0.4}
              className="at-pulse-button crinkle-surface rounded-full px-7 py-3 text-[0.65rem] font-semibold uppercase tracking-[0.18em]"
              style={{ color: '#fff', display: 'inline-block' }}
            >
              Enter the bazaar
            </MagneticButton>
            <MagneticButton
              href="#craft"
              strength={0.4}
              className="rounded-full px-7 py-3 text-[0.65rem] uppercase tracking-[0.18em]"
              style={{ border: `1px solid ${BLUSH}`, color: BLUSH, display: 'inline-block' }}
            >
              See the craft
            </MagneticButton>
          </div>
        </ScrollFadeOut>

        <div className="absolute bottom-8 z-10 flex flex-col items-center gap-2">
          <span className="text-[0.55rem] uppercase tracking-[0.24em]" style={{ color: 'rgba(214,67,47,.45)' }}>
            Scroll
          </span>
          <span className="relative h-9 w-px overflow-hidden" style={{ background: 'rgba(214,67,47,.25)' }}>
            <span className="absolute left-0 h-full w-full" style={{ background: BLUSH, animation: 'at-run 1.9s ease-in-out infinite' }} />
          </span>
        </div>
      </motion.section>

      <ThreadsIntro />
      <WaterfallScrub />
      <Manifesto />
      <Marquee />

      {/* ---- ACT 2 · STORY: how it's made, the proof, where it's made -------
          Grouped deliberately. The globe used to sit marooned between two
          shopping sections, which buried its point (provenance). */}
      <CraftInteractive />
      <InkPressType />
      <Numbers />
      <KarigarOrbit />
      <TacticalGlobeSection />

      {/* ---- ACT 3 · SHOP: one memorable interaction, then the buy moment ---
          Previously six galleries showed the same ~8 products. Kept the
          Phantom drag gallery (the one with real personality) and the clean
          ProductGrid (the one that actually sells). Removed the bento
          gallery, 3D slider, prints gallery and parallax scroll gallery —
          all four were the same products in a different wrapper. */}
      <PhantomGallery />
      <ProductGrid />

      {/* ---------------------------------------------- founder
          Asymmetric editorial layout (Getty Tracing Art's scattered-negative-space
          principle) + a quiet black gallery rule line (thevertmenthe's restraint) —
          replaces the old centered two-column card. */}
      <section id="founder" className="relative overflow-hidden px-6 py-32" style={{ background: 'rgba(0,0,0,.16)' }}>
        <div className="mx-auto grid max-w-5xl items-start gap-x-16 gap-y-12 md:grid-cols-[0.85fr_1.15fr]">
          <ScrollParallax className="relative md:justify-self-end">
            <TeamSpotlight name="Lovely Pandranki" role="Founder, Arttrolley" src="/brand/hero-portrait.jpg" />
          </ScrollParallax>

          <ScrollScale className="md:pt-10">
            <span className="mb-5 block h-px w-14" style={{ background: 'rgba(214,67,47,.4)' }} />
            <p className="text-[0.62rem] uppercase tracking-[0.36em]" style={{ color: 'rgba(214,67,47,.7)' }}>
              The Founder
            </p>
            <h2
              className="mt-4 font-serif text-4xl italic leading-tight sm:text-5xl"
              style={{ color: BLUSH }}
            >
              Lovely Pandranki
            </h2>
            <p className="mt-7 max-w-md text-sm font-light leading-relaxed" style={{ color: 'rgba(214,67,47,.6)' }}>
              ARTTROLLEY began with a simple conviction: that the people who carve the blocks and
              press the cloth should be named, paid fairly, and known to the people who wear their work.
            </p>
            <p className="mt-4 max-w-md text-sm font-light leading-relaxed" style={{ color: 'rgba(214,67,47,.6)' }}>
              Every piece is made in small batches with hand-carved teak blocks and natural dyes —
              nothing mass-printed, nothing rushed, nothing anonymous.
            </p>
          </ScrollScale>
        </div>
      </section>

      <Quote />
      <Cta />
      </main>

      <Footer />
      <CartDrawer />
      <CheckoutView />
    </div>
    </CartProvider>
  );
}
