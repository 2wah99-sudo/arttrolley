'use client';

import { useScrollScrub } from './use-scroll-scrub';

const CREAM = '#DBC9B1';

/**
 * The dress-weave film, scrubbed by scroll: scroll down runs it forward
 * (four thread clusters pull together into two floating outfits), scroll
 * up rewinds it. Nothing autoplays — scroll position IS the playhead.
 *
 * The 300vh wrapper is the scroll runway; the inner sticky pane holds the
 * video on screen while that runway passes, which is what gives the clip
 * room to scrub through rather than flashing by.
 */
export function DressWeaveReveal() {
  const { sectionRef, videoRef, onLoadedMetadata } = useScrollScrub<HTMLDivElement>();
  return (
    <div ref={sectionRef} className="relative h-[300vh]" style={{ background: CREAM }}>
      <div className="sticky top-0 flex h-screen w-full items-center justify-center overflow-hidden">
        <video
          ref={videoRef}
          src="/generated/dress-weave-veo.mp4"
          muted
          playsInline
          preload="auto"
          onLoadedMetadata={onLoadedMetadata}
          className="h-full w-full object-contain"
        />
        <p
          className="pointer-events-none absolute bottom-14 text-xs uppercase tracking-[0.3em]"
          style={{ color: 'rgba(168,41,31,.7)' }}
        >
          Four threads. Two dresses. Scroll to pull them together.
        </p>
      </div>
    </div>
  );
}
