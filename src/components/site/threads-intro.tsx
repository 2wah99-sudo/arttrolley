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
 */
export function ThreadsIntro() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [duration, setDuration] = useState(0);
  const targetRef = useRef(0);

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end end'] });

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    targetRef.current = Math.min(1, Math.max(0, v));
  });

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !duration) return;
    let raf: number;
    const tick = (t: number) => {
      // Small continuous idle drift layered on top of the scroll target —
      // it never looks fully frozen even while scroll position is held.
      const idle = Math.sin(t / 1400) * 0.015 * duration;
      // Start ~20% into the clip, not frame 0 — the opening frames are
      // sparse/near-empty, which read as dead black space at the cut from
      // the hero. Map the full 0-1 scroll range onto the [0.2, 1] portion
      // of the clip instead, so it's visually alive from the very start.
      const base = 0.2 * duration;
      const target = base + targetRef.current * (duration - base) + idle;
      video.currentTime += (Math.max(0, Math.min(duration - 0.05, target)) - video.currentTime) * 0.15;
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
          src="/videos/threads-intro.mp4"
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
