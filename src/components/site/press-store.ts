'use client';

// Tiny external store shared between the Nav (trigger) and the R3F/Three
// press object living inside Hero3D (listener). Kept out of React context so
// the click -> mesh update path stays cheap and framework-agnostic.

export type PressState = 0 | 1 | 2 | 3;

export const PRESS_LABELS = ['Craft', 'Dye', 'Weave', 'Drape'] as const;

type Listener = (s: PressState) => void;

let current: PressState = 0;
const listeners = new Set<Listener>();

export function getPressState() {
  return current;
}

export function setPressState(next: PressState) {
  if (next === current) return;
  current = next;
  listeners.forEach((l) => l(next));
}

export function subscribePress(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
