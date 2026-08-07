'use client';

import { motion } from 'motion/react';
import { useCinematicTransition } from './use-cinematic-transition';

const CHARCOAL = '#000000';

/**
 * AI-generated (Gemini/Veo) close-up of hand-block printing — the craft
 * moment right after the hero. Same sticky-crossfade treatment as the
 * removed video sections.
 */
export function BlockPressFilm() {
  const { ref, motionStyle } = useCinematicTransition<HTMLElement>();
  return (
    <motion.section
      ref={ref}
      className="sticky top-0 h-screen w-full overflow-hidden"
      style={{ background: CHARCOAL, ...motionStyle }}
    >
      <video
        src="/generated/block-press-veo.mp4"
        muted
        playsInline
        autoPlay
        loop
        preload="auto"
        className="h-full w-full object-cover"
        style={{ filter: 'contrast(1.1) saturate(1.2) brightness(1.03)' }}
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-start gap-1 p-8 sm:p-14">
        <p className="text-[0.65rem] uppercase tracking-[0.35em]" style={{ color: 'rgba(242,196,187,.75)' }}>
          The Craft
        </p>
        <p className="max-w-md text-xl font-medium text-white/90 sm:text-2xl">
          Every block is carved by hand, pressed by hand.
        </p>
      </div>
    </motion.section>
  );
}
