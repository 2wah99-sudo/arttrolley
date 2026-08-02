'use client';

import { useRef, useState, useCallback } from 'react';
import { motion } from 'motion/react';

type MagneticButtonProps = {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  strength?: number;
  as?: 'button' | 'a';
  href?: string;
  type?: 'button' | 'submit';
  onClick?: () => void;
};

/**
 * Cursor-attracted button: the label drifts toward the pointer within its
 * bounds and springs back on leave. No-ops to a plain scale-tap under
 * prefers-reduced-motion.
 */
export function MagneticButton({
  children,
  className = '',
  style,
  strength = 0.35,
  as = 'a',
  href,
  type = 'button',
  onClick,
}: MagneticButtonProps) {
  const ref = useRef<HTMLElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const onMove = useCallback(
    (e: React.MouseEvent) => {
      if (reduced || !ref.current) return;
      const r = ref.current.getBoundingClientRect();
      setPos({
        x: (e.clientX - r.left - r.width / 2) * strength,
        y: (e.clientY - r.top - r.height / 2) * strength,
      });
    },
    [reduced, strength],
  );

  const onLeave = useCallback(() => setPos({ x: 0, y: 0 }), []);

  const MotionTag = motion[as] as typeof motion.a;

  return (
    <MotionTag
      ref={ref as never}
      href={as === 'a' ? href : undefined}
      type={as === 'button' ? type : undefined}
      onClick={onClick}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      animate={{ x: pos.x, y: pos.y }}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
      whileFocus={{ scale: 1.04 }}
      transition={{ type: 'spring', stiffness: 320, damping: 20, mass: 0.6 }}
      className={className}
      style={style}
    >
      {children}
    </MotionTag>
  );
}
