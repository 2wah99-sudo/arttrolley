'use client';

import { motion } from 'motion/react';
import { useCinematicTransition } from './use-cinematic-transition';

const CHARCOAL = '#000000';

/**
 * Plain 4K video playback — no scroll-scrub, no idle drift, no 3D/motion
 * interaction of any kind. Just the clip, looping, full-bleed. Sticky-
 * pinned so the next section physically slides up and over it as you
 * scroll past — a real, visible crossfade transition, not just a scroll
 * boundary between two blocks.
 */
export function ThreadsIntro() {
  const { ref, motionStyle } = useCinematicTransition<HTMLElement>();
  return (
    <motion.section
      ref={ref}
      className="sticky top-0 h-screen w-full overflow-hidden"
      style={{ background: CHARCOAL, ...motionStyle }}
    >
      <video
        src="/videos/threads-intro-4k.mp4"
        muted
        playsInline
        autoPlay
        loop
        preload="auto"
        className="h-full w-full object-cover"
        style={{
          background: CHARCOAL,
          // Premium colour grade: warm teal-tone shadows, lifted contrast,
          // cinema-quality look — no re-encode needed.
          filter: 'contrast(1.15) saturate(1.35) brightness(1.05) sepia(0.08)',
        }}
      />
      {/* fades into the black sections above/below — same exact black,
          no boxed-in seam */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-32"
        style={{ background: `linear-gradient(to bottom, ${CHARCOAL}, transparent)` }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-32"
        style={{ background: `linear-gradient(to top, ${CHARCOAL}, transparent)` }}
      />
    </motion.section>
  );
}
