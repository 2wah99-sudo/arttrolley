'use client';

import { motion } from 'motion/react';
import { useCinematicTransition } from './use-cinematic-transition';

const CHARCOAL = '#000000';

/** AI-generated (Gemini/Veo Pro) red-toned forest waterfall — nature accent, black water. */
export function ForestFilm() {
  const { ref, motionStyle } = useCinematicTransition<HTMLElement>();
  return (
    <motion.section
      ref={ref}
      className="sticky top-0 h-screen w-full overflow-hidden"
      style={{ background: CHARCOAL, ...motionStyle }}
    >
      <video
        src="/generated/forest-veo.mp4"
        muted
        playsInline
        autoPlay
        loop
        preload="auto"
        className="h-full w-full object-cover"
        style={{ filter: 'contrast(1.1) saturate(1.1)' }}
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-start gap-1 p-8 sm:p-14">
        <p className="text-[0.65rem] uppercase tracking-[0.35em]" style={{ color: 'rgba(242,196,187,.75)' }}>
          Rooted in Nature
        </p>
        <p className="max-w-md text-xl font-medium text-white/90 sm:text-2xl">
          Dyes drawn from the same earth that raised these forests.
        </p>
      </div>
    </motion.section>
  );
}
