'use client';

import React from 'react';

type Props = { children: React.ReactNode; fallback: React.ReactNode };
type State = { hasError: boolean };

/**
 * Guards the WebGL Scroll3DSlider. If it throws for any reason (no WebGL
 * support, a shader/runtime error, a browser quirk we haven't hit yet), we
 * fall back to a plain image row instead of leaving a blank/black section.
 */
export class SliderErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    // eslint-disable-next-line no-console
    console.error('Scroll3DSlider failed, falling back to static gallery:', error);
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}
