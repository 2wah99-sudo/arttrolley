# ARTTROLLEY — Session Handoff Notes

State as of commit `95209f0` on branch `fix-waterfall-audio`. Build verified clean
(`npm run build` passes). **Nothing has been pushed to `main`** — all work is on the
feature branch, and Vercel treats it as a preview deploy.

## Environment quirks that cost real time — read before debugging

- **Disk**: project lives on **D:** (`D:\Projects\arttrolley`). C: filled to 100% mid-session
  and caused `ENOSPC` write failures. Keep temp/render output on D:.
- **Browser pane cannot verify animation.** Proven with a direct test:
  `requestAnimationFrame` fired **0 times** while `setInterval` fired 15, because
  `document.hidden === true` (the pane is hidden, so the browser suspends rAF).
  Screenshots fail for the same reason ("not compositing frames"). Any rAF-driven
  animation is therefore **unverifiable from inside this environment** — it must be
  checked in a real visible browser tab.
- **Blender**: at `D:\Blender\blender-5.2.0-windows-x64\blender.exe`. v5.2 API changed:
  `BLENDER_EEVEE_NEXT` → `BLENDER_EEVEE`, `action.fcurves` removed, `image_settings.file_format`
  has no `'FFMPEG'` (render PNG sequence, then mux with ffmpeg). GPU render crashes with
  `EXCEPTION_ACCESS_VIOLATION` in the Intel driver — CPU render works.
- **Claude Code CLI** (for plugin installs) is NOT on PATH. It lives at
  `C:\Users\<user>\AppData\Roaming\Claude\claude-code\<version>\claude.exe`.

## Bugs found and fixed (each was real, not cosmetic)

1. **White banding between sections** — `body` used the shadcn `--background` var, which is
   pure white (`oklch(1 0 0)`), unrelated to the site's black brand. Any gap during a sticky
   transition exposed raw white. Now hardcoded to `#000`.
2. **Music playing site-wide** — `unlock()` in `waterfall-scrub.tsx` called `music.play()` on
   the page's first click/scroll *anywhere*. If that gesture happened before reaching the
   section, audio started immediately and ran across the whole site. `isIntersecting` is now
   the sole authority on play/pause; `unlock()` only builds the AudioContext graph.
3. **Hero prop overlapping the "See the craft" button** — not CSS. It was a Three.js mesh in
   `hero-3d.tsx` (`pressGroup.position.x`), moved 2.15 → 3.3.
4. **Video scrub never advanced (two separate causes)**
   - Duration was captured only via React's synthetic `onLoadedMetadata`. If that fired before
     the listener attached, `duration` stayed `0` forever and every effect silently bailed.
     Now uses native `loadedmetadata` + `durationchange` + `canplay` listeners.
   - Smoothing (`target = raw*0.6 + target*0.4`) ran **inside the scroll handler**, so it only
     updated while scroll events fired — when the user stopped, the value froze partway and
     never reached its target. All smoothing moved into the rAF loop.
5. **Text bleeding through a video section** — `craft-scroller.tsx` used
   `background: rgba(0,0,0,.16)` (16% opaque). Fine before, but a full-bleed sticky video
   behind it showed straight through. Now `#000`.
6. **Build broken by `imageRendering: 'high-quality'`** — not a valid `ImageRendering` value;
   TypeScript rejected it and it broke two Vercel deploys before being caught.
7. **R3F `<line>` collides with the DOM/SVG `<line>`** in TS's JSX namespace, resolving to
   `SVGLineElementAttributes`. Fixed by constructing `THREE.Line` objects directly and
   rendering them via `<primitive object={...} />`.

## Asset pipeline

- **Gemini video generation** is driven through the **browser** (`gemini.google.com`), not the
  API. The API key in `.env.local` returns `limit: 0` — the free tier grants **zero**
  generation quota, so the REST path is dead. Browser + Pro model tier works.
  `scripts/gen.mjs` exists and is correct, but will only work if billing is enabled.
- **Watermark removal**: Gemini stamps a sparkle bottom-right. Scaling/cropping does *not*
  remove it (it scales with the frame). Working approach is ffmpeg `delogo`:
  `delogo=x=1130:y=555:w=140:h=140` — keep the region inside frame bounds or ffmpeg errors.
- **Quality**: Gemini output here caps at 720p. Current `dress-weave-veo.mp4` was upscaled to
  1920×1080 with `scale=...:flags=lanczos,unsharp=...` at CRF 15 (11.1 Mbps).
- Prompts need **explicit photoreal camera language** ("shot on RED 8K, 24mm lens,
  documentary cinematography, no illustration, no cartoon") or output comes back stylized.

## Current page composition (`src/app/page.tsx`)

```
ThreadWeaveIntro        typing wordmark + procedural threads → figure silhouette (pure Three.js)
HeroDuotone             Gemini-composited two-model photo, cream, whileInView pop-in
FashionScene            R3F + GSAP ScrollTrigger scene (see below)
Manifesto / Marquee / CraftInteractive / InkPressType / Numbers /
KarigarOrbit / TacticalGlobeSection / PhantomGallery / ProductGrid /
founder / Quote / Cta / Footer
```

### `src/components/fashion-scene/` — modular, per the client brief
- `ScrollAnimation.ts` — single GSAP ScrollTrigger master timeline, `pin: true`, `scrub: 1`.
  Progress is written to a **ref, not React state**, so scrolling never re-renders React.
- `FabricTransition.tsx` — 4 densified clusters (red/cream/red/cream) lerping into 2 garment
  outlines. Reversible because position is `f(progress)`, not `f(time)`.
- `OutfitModel.tsx` — **placeholder** `ExtrudeGeometry` garment. Designed to be swapped for a
  real GLB (`<primitive object={gltf.scene} />`) without touching animation code.
- `CameraController.tsx` — damped dolly + orbit driven by progress.
- `FashionScene.tsx` — canvas, 3-point lighting, composition.

## Known-unfinished / honest status

- **`OutfitModel` is placeholder geometry, not photoreal cloth.** Producing garments matching
  the reference video needs real modeled GLBs (CLO3D / Marvelous Designer). Attempts to model
  from scratch in Blender produced a smooth blob — subsurf rounds a cube into a pebble and no
  parameter tuning fixed it. This is the honest ceiling of from-scratch modeling here.
- **`ThreadWeaveIntro` silhouette is approximate.** Curve control points were hand-estimated
  from the reference sketch, not traced. User feedback was "not matching the back pose."
  Accurate fix = trace the reference into real coordinates.
- **The FashionScene has never been visually verified** (see rAF note above). Build passes and
  the scroll math was verified numerically, but nobody has watched it run.
- `dress-weave-reveal.tsx` still exists (video-scrub version) but is no longer imported —
  `FashionScene` replaced it. Kept deliberately as a fallback.
- **shadcn MCP was not installed** — it requires the user's own account and a paid Pro
  subscription. `frontend-design` plugin, `gsap-animation-expert`, and `interface-design`
  skills *are* installed.

## Verified numbers (scroll → video frame, measured live)

| scrollY | progress | frame |
|---|---|---|
| 2200 | 0.00 | 0.00s |
| 2700 | 0.344 | 3.42s |
| 3200 | 0.704 | 7.00s |
| 3700 | 1.00 | 9.95s |
