'use client';

import { motion } from 'motion/react';
import { useCinematicTransition } from './use-cinematic-transition';

const CHARCOAL = '#000000';

/** AI-generated (Gemini/Veo) red silk saree drape — hero-worthy fashion moment. */
export function SareeDrapeFilm() {
  const { ref, motionStyle } = useCinematicTransition<HTMLElement>();
  return (
    // Wrapper scopes the sticky pin to this section's own scroll runway.
    // Without it the sticky child is a direct sibling of every other
    // section in <main>, so it stays pinned behind the entire rest of the
    // page — the video kept showing through sections far below it.
    <div className="relative h-[180vh]" style={{ background: CHARCOAL }}>
    <motion.section
      ref={ref}
      className="sticky top-0 h-screen w-full overflow-hidden"
      style={{ background: CHARCOAL, ...motionStyle }}
    >
      <video
        src="/generated/saree-drape-veo.mp4"
        muted
        playsInline
        autoPlay
        loop
        preload="auto"
        className="h-full w-full object-cover"
        style={{ filter: 'contrast(1.08) saturate(1.15)' }}
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-start gap-1 p-8 sm:p-14">
        <p className="text-[0.65rem] uppercase tracking-[0.35em]" style={{ color: 'rgba(242,196,187,.75)' }}>
          Silk &amp; Colour
        </p>
        <p className="max-w-md text-xl font-medium text-white/90 sm:text-2xl">
          Every drape carries the weight of a story.
        </p>
      </div>
    </motion.section>
    </div>
  );
}
