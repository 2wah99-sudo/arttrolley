'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Module-level singleton so other components (modals) can pause/resume the
// same Lenis instance via lenis.stop()/start() — toggling document.body's
// native `overflow` does NOT stop Lenis, which hijacks scroll itself via
// wheel/touch listeners + its own rAF loop, so the two fighting in the same
// frame is what causes the whole page to visibly jump/judder.
let lenisInstance: Lenis | null = null;

export function pauseSmoothScroll() {
  lenisInstance?.stop();
}

export function resumeSmoothScroll() {
  lenisInstance?.start();
}

// Wires up buttery momentum scrolling (igloo.inc-style lerp easing) and
// syncs it with GSAP's ScrollTrigger so all scroll-driven animations
// (parallax, reveals) track the smoothed position instead of raw scroll.
export function SmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.15,
      easing: (t: number) => 1 - Math.pow(1 - t, 4), // quartic ease-out — heavy, premium deceleration
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.4,
    });
    lenisInstance = lenis;

    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.destroy();
      lenisInstance = null;
      gsap.ticker.remove((time) => lenis.raf(time * 1000));
    };
  }, []);

  return null;
}
