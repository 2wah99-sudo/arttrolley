'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') gsap.registerPlugin(ScrollTrigger);

/**
 * Master scroll timeline for the fashion scene. Progress is written to a
 * plain ref, NOT React state — per the performance requirement, nothing
 * here should trigger a React re-render on every scroll tick. Consumers
 * (FabricTransition, CameraController, OutfitModel) read progress.current
 * inside their own useFrame loops.
 *
 * ScrollTrigger's own `pin: true` holds the section on screen while its
 * scroll runway passes — this replaces the manual position:sticky +
 * getBoundingClientRect math used elsewhere in this project. `scrub: 1`
 * gives a light damping lag (not raw 1:1) so it reads as smoothed
 * momentum rather than mechanically locked to the wheel, and reverses
 * exactly on scroll-up since ScrollTrigger's progress is itself just a
 * function of scroll position.
 */
export function useScrollTimeline(triggerRef: React.RefObject<HTMLElement | null>, scrollLengthVh = 400) {
  const progress = useRef(0);

  useEffect(() => {
    const el = triggerRef.current;
    if (!el) return;

    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top top',
      end: `+=${scrollLengthVh}%`,
      scrub: 1,
      pin: true,
      anticipatePin: 1,
      onUpdate: (self) => {
        progress.current = self.progress;
      },
    });

    return () => st.kill();
  }, [triggerRef, scrollLengthVh]);

  return progress;
}
