// Minimal runtime shim for Framer marketplace code components used outside
// the Framer canvas. `addPropertyControls`/`ControlType` only matter inside
// Framer's editor UI, so they're safe no-ops here. `RenderTarget`/
// `useIsStaticRenderer` just need to report "not in the Framer canvas" so
// the component always renders its live (non-static-export) branch.
export function addPropertyControls() {}

export const ControlType = new Proxy({}, { get: (_, key) => key });

export const RenderTarget = {
  current: () => 'unknown',
  canvas: 'canvas',
  export: 'export',
  preview: 'preview',
  thumbnail: 'thumbnail',
};

export function useIsStaticRenderer() {
  return false;
}
