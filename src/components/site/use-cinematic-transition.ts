'use client';

import { useRef, useState, type CSSProperties } from 'react';
import { useScroll, useMotionValueEvent } from 'motion/react';

/**
 * "Crazy" cinematic wipe used between the big hero/video sections: an iris
 * (circular clip-path) reveal that opens as the section enters, blurred and
 * scaled up until it snaps into focus — then, as the section is about to be
 * covered by the next one, it punches in, blurs and desaturates on the way
 * out. Reads as a deliberate transition cut rather than a plain scroll
 * boundary between blocks.
 */
export function useCinematicTransition<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const entryP = useRef(0);
  const exitP = useRef(0);
  const [style, setStyle] = useState<CSSProperties>({
    clipPath: 'circle(8% at 50% 50%)',
    filter: 'blur(16px)',
    transform: 'scale(1.08)',
  });

  // Entry: circle irises open as the section's top travels from the bottom
  // of the viewport up to 35% of viewport height.
  const { scrollYProgress: entryProgress } = useScroll({ target: ref, offset: ['start end', 'start 35%'] });
  // Exit: circle irises closed again as the section's bottom travels from
  // 65% of viewport height up past the top — the "punch out" cut.
  const { scrollYProgress: exitProgress } = useScroll({ target: ref, offset: ['end 65%', 'end start'] });

  const recompute = () => {
    const inP = Math.min(1, Math.max(0, entryP.current));
    const outP = Math.min(1, Math.max(0, exitP.current));
    // Circle grows open on entry (8% -> 150%, fully covers), then closes
    // again on exit (150% -> 8%) — whichever is smaller wins so it can
    // never re-open once the close has started.
    const clipPct = Math.min(8 + inP * 142, 150 - outP * 142);
    const blur = (1 - inP) * 16 + outP * 10;
    const scale = 1.08 - inP * 0.08 + outP * 0.06;
    const saturate = 1 - outP * 0.5;
    setStyle({
      clipPath: `circle(${clipPct}% at 50% 50%)`,
      filter: `blur(${blur}px) saturate(${saturate})`,
      transform: `scale(${scale})`,
      willChange: 'transform, filter, clip-path',
    });
  };

  useMotionValueEvent(entryProgress, 'change', (v) => {
    entryP.current = v;
    recompute();
  });
  useMotionValueEvent(exitProgress, 'change', (v) => {
    exitP.current = v;
    recompute();
  });

  return { ref, style };
}
