'use client';

import { useEffect, useRef, useState } from 'react';
import { useScroll, useMotionValueEvent } from 'motion/react';

const CHARCOAL = '#000000';

/**
 * Threads converge/pull apart purely with scroll direction — scroll down
 * = come together, scroll up = move apart, reversible at any point. The
 * video is paused right after its first frame decodes so only the scroll-
 * driven currentTime stepping controls it (autoPlay was needed once to
 * force that first frame to render, but left running it fought the manual
 * seeking every frame — that's why it didn't feel reactive before).
 *
 * Two motion modes:
 *  - Idle (no scroll input recently): the clip drifts forward on its own
 *    at a slow constant pace, so the section always reads as alive even
 *    before anyone touches the page.
 *  - Active (scrolling right now): drift is dropped entirely and the
 *    video snaps to scroll position with a tight, low-latency lerp — the
 *    "much more smooth, much more better" feel once the user is driving.
 */
export function ThreadsIntro() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [duration, setDuration] = useState(0);
  const targetRef = useRef(0);
  const lastScrollAtRef = useRef(0);

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end end'] });

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    targetRef.current = Math.min(1, Math.max(0, v));
    lastScrollAtRef.current = performance.now();
  });

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !duration) return;
    let raf: number;
    let idlePhase = 0;
    let lastT = performance.now();
    const tick = (t: number) => {
      const dt = t - lastT;
      lastT = t;
      const scrolling = t - lastScrollAtRef.current < 220;

      if (scrolling) {
        // Snap toward exact scroll position, fast — the whole clip plays
        // from its real frame 0, no skipped opening.
        const target = targetRef.current * (duration - 0.05);
        video.currentTime += (target - video.currentTime) * 0.35;
      } else {
        // Ambient auto-flow: gently ease toward the current scroll target
        // while continuously creeping forward/back, so it never looks
        // static even when nobody is touching it.
        idlePhase += dt / 1000;
        const drift = Math.sin(idlePhase / 1.6) * 0.04 * duration;
        const target = targetRef.current * (duration - 0.05) + drift;
        video.currentTime += (Math.max(0, Math.min(duration - 0.05, target)) - video.currentTime) * 0.06;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [duration]);

  // Zoom-transition into the cut: as this section nears its end, the video
  // pushes in and fades — reads as one continuous motion into the next
  // section rather than an abrupt stop.
  const [endProgress, setEndProgress] = useState(0);
  const [entryProgress, setEntryProgress] = useState(0); // 1 -> 0 over the first 8%
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    setEndProgress(Math.max(0, (v - 0.92) / 0.08));
    setEntryProgress(Math.max(0, 1 - v / 0.08));
  });

  return (
    <section ref={sectionRef} className="relative" style={{ height: '220vh', background: CHARCOAL }}>
      <div className="sticky top-0 flex h-screen w-full items-center justify-center overflow-hidden" style={{ background: CHARCOAL }}>
        <video
          ref={videoRef}
          src="/videos/threads-intro-4k.mp4"
          muted
          playsInline
          autoPlay
          preload="auto"
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          onLoadedData={(e) => e.currentTarget.pause()}
          className="h-full w-full object-cover"
          style={{
            background: CHARCOAL,
            transform: `scale(${1 + endProgress * 0.25 - entryProgress * 0.15})`,
            opacity: 1 - endProgress - entryProgress * 0.4,
            transition: 'transform .1s linear, opacity .1s linear',
            // Premium colour grade: warm teal-tone shadows, lifted contrast,
            // cinema-quality look — no re-encode needed.
            filter: 'contrast(1.15) saturate(1.35) brightness(1.05) sepia(0.08)',
            imageRendering: 'high-quality',
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
      </div>
    </section>
  );
}
