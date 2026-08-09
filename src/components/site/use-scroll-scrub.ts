'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Video frame position tied directly to scroll position: scroll down =
 * video plays forward, scroll up = video rewinds. Fully reversible,
 * because currentTime is derived from scroll position rather than being
 * a time-based animation with its own state.
 */
export function useScrollScrub<T extends HTMLElement>() {
  const sectionRef = useRef<T>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [duration, setDuration] = useState(0);
  const target = useRef(0);

  // Duration must be captured no matter when the metadata actually lands.
  // Relying on React's synthetic onLoadedMetadata alone was the bug: if the
  // event fires before that listener attaches, duration stays 0 forever and
  // every effect below silently bails, so the scrub never runs. A single
  // mount-time readyState check isn't enough either — at mount the metadata
  // usually isn't parsed yet. Native listeners cover both directions.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const capture = () => {
      if (video.duration && !Number.isNaN(video.duration)) setDuration(video.duration);
    };
    capture(); // already-loaded case
    video.addEventListener('loadedmetadata', capture);
    video.addEventListener('durationchange', capture);
    video.addEventListener('canplay', capture);
    return () => {
      video.removeEventListener('loadedmetadata', capture);
      video.removeEventListener('durationchange', capture);
      video.removeEventListener('canplay', capture);
    };
  }, []);

  useEffect(() => {
    if (!duration) return;
    const read = () => {
      const el = sectionRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      // Raw scroll progress through this section, 0..1. Stored directly —
      // NOT smoothed here. Smoothing in the scroll handler was a real bug:
      // it only ran while scroll events fired, so when the user stopped
      // scrolling the value froze partway and never reached its target.
      // All smoothing belongs in the rAF loop below, which runs every frame.
      target.current = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0;
    };
    window.addEventListener('scroll', read, { passive: true });
    window.addEventListener('resize', read);
    read();
    return () => {
      window.removeEventListener('scroll', read);
      window.removeEventListener('resize', read);
    };
  }, [duration]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !duration) return;
    let raf: number;
    const tick = () => {
      const want = target.current * (duration - 0.05);
      const diff = want - video.currentTime;
      // Ease toward the scroll-derived frame; snap when close enough so it
      // actually settles instead of asymptotically creeping forever.
      if (Math.abs(diff) < 0.005) {
        video.currentTime = want;
      } else {
        video.currentTime += diff * 0.12;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [duration]);

  return {
    sectionRef,
    videoRef,
    onLoadedMetadata: (e: React.SyntheticEvent<HTMLVideoElement>) => setDuration(e.currentTarget.duration),
  };
}
