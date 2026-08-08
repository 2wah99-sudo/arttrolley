'use client';

/**
 * True double-exposure blend, matching the twofoldny.com reference: both
 * women overlapping and visible simultaneously in one frame. Generated
 * via Gemini from our own two product photos (not CSS blend-mode — that
 * gave a flat, unconvincing result; this is a real AI-composited image).
 */
export function HeroDuotone() {
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: '#DBC9B1' }}>
      <img
        src="/brand/hero-duotone.png"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'linear-gradient(180deg, rgba(0,0,0,.1) 0%, rgba(0,0,0,.6) 100%)' }}
      />
    </div>
  );
}
