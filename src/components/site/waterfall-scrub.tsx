'use client';

import { useEffect, useRef, useState } from 'react';

const RED = '#D6432F';
const WHITE = '#FFFFFF';
const JUNGLE = '#0d1410';

/**
 * Plain, simple video playback — no 3D scene, no scroll-scrub, no
 * mouse/touch-driven interaction of any kind. Clip 1 (her, trimmed) plays
 * through, then clip 2 (the full original footage) plays after it, then
 * loops back to clip 1 — two clips lined up one after another. Labels
 * flash briefly at the very start, timed off the video itself, not scroll.
 */
export function WaterfallScrub() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const musicRef = useRef<HTMLAudioElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [clipIndex, setClipIndex] = useState(0);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const musicGainRef = useRef<GainNode | null>(null);
  const waterfallGainRef = useRef<GainNode | null>(null);

  const CLIPS = ['/videos/waterfall-trimmed-4k.mp4', '/videos/waterfall-full-hq.mp4'];

  // Advance to the next clip when the current one ends; wraps back to 0.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onEnded = () => setClipIndex((i) => (i + 1) % CLIPS.length);
    video.addEventListener('ended', onEnded);
    return () => video.removeEventListener('ended', onEnded);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.src = CLIPS[clipIndex];
    video.play().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clipIndex]);

  // Audio: waterfall's own track + background music, mixed through one
  // graph. Gated behind the first user gesture (browser autoplay policy) —
  // that's a platform requirement, not a discretionary interaction.
  useEffect(() => {
    const video = videoRef.current;
    const music = musicRef.current;
    if (!video || !music) return;

    let unlocked = false;
    const unlock = () => {
      if (unlocked) return;
      unlocked = true;
      video.muted = false;
      const ctx = new AudioContext();

      const waterfallSource = ctx.createMediaElementSource(video);
      const waterfallGain = ctx.createGain();
      waterfallGain.gain.value = 0.7;
      waterfallSource.connect(waterfallGain).connect(ctx.destination);

      const musicSource = ctx.createMediaElementSource(music);
      const musicGain = ctx.createGain();
      musicGain.gain.value = 0.28;
      musicSource.connect(musicGain).connect(ctx.destination);

      audioCtxRef.current = ctx;
      musicGainRef.current = musicGain;
      waterfallGainRef.current = waterfallGain;
      music.play().catch(() => {});

      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('wheel', unlock);
      window.removeEventListener('touchstart', unlock);
    };
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('wheel', unlock, { once: true });
    window.addEventListener('touchstart', unlock, { once: true });

    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          video.play().catch(() => {});
          music.play().catch(() => {});
        } else {
          video.pause();
          music.pause();
          // Belt-and-braces: silence immediately via gain too, not just
          // .pause() — the music must never be audible outside this
          // section, even for one stray frame.
          const ctx = audioCtxRef.current;
          if (ctx && musicGainRef.current) musicGainRef.current.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
        }
      },
      { threshold: 0.15 },
    );
    if (sectionRef.current) io.observe(sectionRef.current);

    return () => {
      io.disconnect();
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('wheel', unlock);
      window.removeEventListener('touchstart', unlock);
      audioCtxRef.current?.close().catch(() => {});
    };
  }, []);

  return (
    <section ref={sectionRef} className="relative h-screen w-full overflow-hidden" style={{ background: JUNGLE }}>
      <audio ref={musicRef} src="/audio/background-music.mp3" loop preload="auto" />

      <video
        ref={videoRef}
        muted
        playsInline
        autoPlay
        preload="auto"
        className="absolute inset-0 h-full w-full object-contain"
        style={{ filter: 'contrast(1.03) saturate(1.08) brightness(1.07)', background: '#000' }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ boxShadow: 'inset 0 0 min(20vw,20vh) rgba(0,0,0,.7)' }}
      />
    </section>
  );
}
