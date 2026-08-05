'use client';

import { useEffect, useRef } from 'react';
import { useCinematicTransition } from './use-cinematic-transition';

const RED = '#D6432F';
const WHITE = '#FFFFFF';
const JUNGLE = '#0d1410';

/**
 * Plain, simple video playback — no 3D scene, no scroll-scrub, no
 * mouse/touch-driven interaction of any kind. One landscape 4K clip,
 * natively looped.
 */
export function WaterfallScrub() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const musicRef = useRef<HTMLAudioElement>(null);
  const { ref: sectionRef, style: transitionStyle } = useCinematicTransition<HTMLDivElement>();

  const audioCtxRef = useRef<AudioContext | null>(null);
  const musicGainRef = useRef<GainNode | null>(null);
  const waterfallGainRef = useRef<GainNode | null>(null);

  // waterfall-landscape-4k.mp4 is a pre-composited 3840x2160 landscape
  // render of the (portrait-sourced) footage: full body kept in frame,
  // sides filled with a blurred/darkened duplicate baked directly into
  // the file — no runtime CSS layering needed.
  const CLIP = '/videos/waterfall-landscape-4k.mp4';

  // Single clip, native loop — no manual "ended" handler reassigning .src
  // (that forced a full reload every loop, which briefly blanked the frame
  // to the section's bare background colour every ~4.5s).
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.play().catch(() => {});
  }, []);

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
    <section
      ref={sectionRef}
      className="relative h-screen w-full overflow-hidden"
      style={{ background: JUNGLE, ...transitionStyle }}
    >
      <audio ref={musicRef} src="/audio/background-music.mp3" loop preload="auto" />

      {/* SVG filter for cinematic colour grade on the hero video:
          warm shadows, lifted blacks, rich greens — matches a luxury
          textile brand's visual language without re-encoding the clip */}
      <svg className="absolute w-0 h-0" aria-hidden>
        <defs>
          <filter id="cinema-grade" x="0%" y="0%" width="100%" height="100%" colorInterpolationFilters="sRGB">
            {/* Lift blacks (never crush to pure 0) */}
            <feComponentTransfer>
              <feFuncR type="linear" slope="0.92" intercept="0.04" />
              <feFuncG type="linear" slope="0.94" intercept="0.03" />
              <feFuncB type="linear" slope="0.88" intercept="0.06" />
            </feComponentTransfer>
            {/* S-curve: punch midtones, protect highlights */}
            <feComponentTransfer>
              <feFuncR type="gamma" amplitude="1" exponent="0.82" offset="0" />
              <feFuncG type="gamma" amplitude="1" exponent="0.80" offset="0" />
              <feFuncB type="gamma" amplitude="1" exponent="0.88" offset="0" />
            </feComponentTransfer>
          </filter>
        </defs>
      </svg>
      <video
        ref={videoRef}
        src={CLIP}
        muted
        playsInline
        autoPlay
        loop
        preload="auto"
        className="absolute inset-0 h-full w-full object-cover"
        style={{
          filter: 'url(#cinema-grade) contrast(1.08) saturate(1.25) brightness(1.06)',
          background: 'transparent',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ boxShadow: 'inset 0 0 min(18vw,18vh) rgba(0,0,0,.65)' }}
      />
    </section>
  );
}
