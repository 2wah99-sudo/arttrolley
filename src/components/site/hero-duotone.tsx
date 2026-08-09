'use client';

import { motion } from 'motion/react';

/**
 * True double-exposure blend, matching the twofoldny.com reference: both
 * women overlapping and visible simultaneously in one frame. Generated
 * via Gemini from our own two product photos (not CSS blend-mode — that
 * gave a flat, unconvincing result; this is a real AI-composited image).
 *
 * Slow pop-in as it scrolls into view (was a hard cut from the thread
 * intro before) — whileInView instead of manual scroll-scrub math, which
 * is what caused the earlier stuck-scrub bugs elsewhere in this project.
 */
export function HeroDuotone() {
  return (
    <motion.div
      className="absolute inset-0 overflow-hidden"
      style={{ background: '#DBC9B1' }}
      initial={{ opacity: 0, scale: 0.88 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
    >
      <img
        src="/brand/hero-duotone.png"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      {/* Feathers the photo edges into the site's flat cream */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-24"
        style={{ background: 'linear-gradient(180deg, #DBC9B1 0%, transparent 100%)' }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24"
        style={{ background: 'linear-gradient(0deg, #DBC9B1 0%, transparent 100%)' }}
      />
    </motion.div>
  );
}
