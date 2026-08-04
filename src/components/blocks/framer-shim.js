// Minimal runtime shim for Framer marketplace code components used outside
// the Framer canvas. `addPropertyControls`/`ControlType` only matter inside
// Framer's editor UI, so they're safe no-ops here. `RenderTarget`/
// `useIsStaticRenderer` just need to report "not in the Framer canvas" so
// the component always renders its live (non-static-export) branch.
export function addPropertyControls() {}

export const ControlType = new Proxy({}, { get: (_, key) => key });

// `current()` reports 'preview' (i.e. "published site, not the Framer
// canvas") since that's the live-rendering branch components expect outside
// Framer. `useIsStaticRenderer` below is the other, more common gate.
export const RenderTarget = {
  current: () => 'preview',
  canvas: 'canvas',
  export: 'export',
  preview: 'preview',
  thumbnail: 'thumbnail',
};

export function useIsStaticRenderer() {
  return false;
}
