'use client';

/**
 * Twofoldny.com-style hero treatment: full-bleed photo(s) at ~93% opacity
 * with a warm sepia grade, crossfading between two shots — not a CSS
 * mix-blend composite, that's not how their site actually does it (their
 * "double exposure" look is baked into a single video's crossfade cut).
 * We replicate with two real product photos crossfading via CSS animation.
 */
export function HeroDuotone() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <style>{`
        @keyframes heroCrossfade {
          0%, 45%   { opacity: 1; }
          50%, 95%  { opacity: 0; }
          100%      { opacity: 1; }
        }
        .hero-duo-a { animation: heroCrossfade 12s ease-in-out infinite; }
        .hero-duo-b { animation: heroCrossfade 12s ease-in-out infinite; animation-delay: 6s; }
      `}</style>
      <img
        src="/brand/model-1.jpg"
        alt=""
        className="hero-duo-a absolute inset-0 h-full w-full object-cover"
        style={{ opacity: 0.9345, filter: 'sepia(0.35) saturate(1.15) contrast(1.05) brightness(0.95)' }}
      />
      <img
        src="/brand/model-2.jpg"
        alt=""
        className="hero-duo-b absolute inset-0 h-full w-full object-cover"
        style={{ opacity: 0, filter: 'sepia(0.35) saturate(1.15) contrast(1.05) brightness(0.95)' }}
      />
      <div className="pointer-events-none absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,.15) 0%, rgba(0,0,0,.55) 100%)' }} />
    </div>
  );
}
