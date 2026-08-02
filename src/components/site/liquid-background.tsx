'use client';

import { Warp } from '@paper-design/shaders-react';

/**
 * Liquid warp background for the hero, via @paper-design/shaders-react —
 * the actual open-source shader library the Framer "AnimatedLiquidBackground"
 * component wraps (its export is literally named `Warp`). Recolored from the
 * component's stock indigo defaults to ARTTROLLEY's red/near-black brand.
 */
export function LiquidBackground({ className = '' }: { className?: string }) {
  return (
    <Warp
      className={className}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      colors={['#160D0C', '#D6432F', '#160D0C', '#7A241A']}
      proportion={0.45}
      softness={1}
      distortion={0.28}
      swirl={0.75}
      swirlIterations={10}
      shapeScale={0.1}
      shape="checks"
      scale={1}
      speed={0.6}
    />
  );
}
