'use client';

import { useRef } from 'react';
import { useScroll, useTransform, useReducedMotion } from 'motion/react';
import type { MotionValue } from 'motion/react';

/**
 * Sticky-pinned crossfade transition between the big hero/video sections.
 * The section this attaches to must be `position: sticky; top: 0` so that
 * as the NEXT section scrolls up and physically covers it, this one is
 * still fully visible underneath — guaranteeing there's never a gap where
 * neither section is on screen.
 *
 * Returns raw MotionValues, not React state — bind them straight to a
 * `motion.section`'s `style` prop. Driving this through useState/setState
 * (the previous version) re-rendered the whole component on every scroll
 * tick, which is exactly what read as laggy/stuttery; motion values update
 * the DOM directly on the compositor thread, no React render involved.
 */
export function useCinematicTransition<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const reduceMotion = useReducedMotion();

  // Entry: settles in as the section's top travels from the bottom of the
  // viewport up to being pinned at the top. Responds immediately, not
  // back-loaded — it's the section arriving, should track the scroll 1:1.
  const { scrollYProgress: entryRaw } = useScroll({ target: ref, offset: ['start end', 'start start'] });
  // Exit: the next section sliding over this one, from the moment its own
  // top first reaches this section's bottom through to fully covering it.
  const { scrollYProgress: exitRaw } = useScroll({ target: ref, offset: ['end end', 'end start'] });

  const inP = useTransform(entryRaw, [0, 1], [0, 1]);
  // Ease-out, not cubic ease-in: moves right away, most of the fade/blur
  // happens in the first half of the exit range rather than being saved
  // up for the last few percent (that's what read as "unnecessary push"
  // — a long dead scroll before anything visibly happened).
  const outP = useTransform(exitRaw, (v) => 1 - Math.pow(1 - v, 2));

  const scale = useTransform([inP, outP], ([i, o]: number[]) => (reduceMotion ? 1 : 1.06 - i * 0.06 + o * 0.08));
  const blur = useTransform([inP, outP], ([i, o]: number[]) => (reduceMotion ? 0 : (1 - i) * 8 + o * 10));
  const brightness = useTransform(outP, (o) => (reduceMotion ? 1 : 1 - o * 0.35));
  const filter = useTransform([blur, brightness], ([b, br]: number[]) => `blur(${b}px) brightness(${br})`);
  const opacity = useTransform([inP, outP], ([i, o]: number[]) =>
    reduceMotion ? 1 : Math.max(0.15, i) * (1 - o * 0.8),
  );
  const transform = useTransform(scale, (s) => `scale(${s})`);

  return { ref, motionStyle: { opacity, filter, transform } };
}

export type CinematicMotionStyle = {
  opacity: MotionValue<number>;
  filter: MotionValue<string>;
  transform: MotionValue<string>;
};
