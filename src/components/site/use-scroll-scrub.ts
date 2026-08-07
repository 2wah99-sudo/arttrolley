'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Video frame scrubbed directly by scroll position — forward on scroll
 * down, reverse on scroll up. Speed dialed to 60% of raw scroll delta
 * (40% slower, per spec) so it never feels frantic.
 */
export function useScrollScrub<T extends HTMLElement>() {
  const sectionRef = useRef<T>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [duration, setDuration] = useState(0);
  const target = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const el = sectionRef.current;
      if (!el || !duration) return;
      const r = el.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      const raw = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0;
      target.current = raw * 0.6 + target.current * 0.4; // 40% slower response
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [duration]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !duration) return;
    let raf: number;
    const tick = () => {
      const t = target.current * (duration - 0.05);
      video.currentTime += (t - video.currentTime) * 0.12;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [duration]);

  return { sectionRef, videoRef, onLoadedMetadata: (e: React.SyntheticEvent<HTMLVideoElement>) => setDuration(e.currentTarget.duration) };
}
