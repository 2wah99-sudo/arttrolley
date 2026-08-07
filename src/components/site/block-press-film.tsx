'use client';

import { useScrollScrub } from './use-scroll-scrub';

const CHARCOAL = '#000000';

/**
 * Scroll-scrubbed craft moment: video frame position is driven by scroll
 * (forward down, reverse up, 40% slower response), not autoplay. Headline
 * sits center-left over a dark gradient so it reads against any frame.
 */
export function BlockPressFilm() {
  const { sectionRef, videoRef, onLoadedMetadata } = useScrollScrub<HTMLDivElement>();
  return (
    <div ref={sectionRef} className="relative h-[300vh]" style={{ background: CHARCOAL }}>
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <video
          ref={videoRef}
          src="/generated/block-press-veo.mp4"
          muted
          playsInline
          preload="auto"
          onLoadedMetadata={onLoadedMetadata}
          className="h-full w-full object-cover"
          style={{ filter: 'contrast(1.1) saturate(1.2) brightness(1.03)' }}
        />
        {/* dark gradient, strongest on the left where the headline sits */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: 'linear-gradient(90deg, rgba(0,0,0,.75) 0%, rgba(0,0,0,.25) 45%, transparent 70%)' }}
        />
        <div className="pointer-events-none absolute inset-y-0 left-0 flex max-w-md flex-col justify-center gap-2 p-8 sm:p-14">
          <p className="text-[0.65rem] uppercase tracking-[0.35em]" style={{ color: 'rgba(242,196,187,.85)' }}>
            The Craft
          </p>
          <p className="text-2xl font-medium text-white sm:text-3xl">
            Every block is carved by hand, pressed by hand.
          </p>
          <p className="mt-2 text-xs uppercase tracking-[0.2em] text-white/40">Scroll to press</p>
        </div>
      </div>
    </div>
  );
}
