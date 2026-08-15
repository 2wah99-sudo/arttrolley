# ARTTROLLEY — Session Handoff Notes

State as of commit `59b4e33` on branch `fix-waterfall-audio`. Working tree **clean**,
**0 unpushed commits**, local and remote hashes identical. Build verified clean
(`npm run build` passes). **Nothing has been pushed to `main`** — all work is on the
feature branch, and Vercel treats it as a preview deploy.

Repo: `github.com/2wah99-sudo/arttrolley`

---

## ✅ APPROVED BASELINE — `aec4bf3` (tag `approved-baseline`)

The user reviewed the site running from this exact commit and said **"this is the website I
want."** Treat it as the known-good reference point. To return to it:
`git checkout approved-baseline`.

Verified live at this commit: 3 canvases render at correct sizes, 15 sections, ~13,200px
scroll, **no console errors**.

**Nothing was missing or lost.** A concern was raised that "the transitions / thread
animations are gone" — investigated directly against `origin` and it was a false alarm.
All animation components and all cream styling are present and pushed. Two things that
can create that impression, both intentional:
- `body` is `#000000`, not cream. Cream is applied **per-section**, not site-wide. A full
  cream reskin was deliberately *not* done — it would abandon the black/red brand identity
  and require recolouring every section plus flipping text colours for legibility. Still an
  open option if wanted.
- The **red-swirl hero is gone because it was explicitly deleted on request** ("remove this
  from the website"). It held Hero3D + AuroraText + the "Enter the bazaar" buttons. The page
  now opens on `ThreadWeaveIntro`. Recoverable from commit `a83bfda`
  ("Archive: red/orange swirl hero + cream tokens + thread-weave intro").

**Also worth knowing:** `useGLTF` in `OutfitModel` suspends, and there is **no `<Suspense>`
boundary** in `FashionScene`. This was checked and is currently *not* breaking anything — the
canvas renders fine. But it is fragile: a slower GLB load or a larger model could surface it.
Adding a `<Suspense>` boundary around the garments is cheap insurance.

## ▶ START HERE — active work and next step

**Active thread:** procedural **kurti** 3D garment generator (Blender → GLB → Three.js),
now wired into the live site. See "Kurti generator" below.

**Next concrete step — pick one:**
1. **Fix the print mismatch** (recommended, highest visual payoff). The reference kurta is
   *cream with delicate rose sprigs*; the model currently renders **bold red-on-black**,
   because that is genuinely what `public/prints/kurti-bagru-1.jpg` is. Try the other
   `kurti-bagru-2..5.jpg` prints, or generate a cream floral. Change one line:
   `material.print_texture` in `blender/config/kurti_01.json`, then rerun the generator.
2. **Fix square shoulders.** The yoke goes straight out horizontally; real garments have a
   shoulder slope. Needs a downward slope applied to the shoulder ring in
   `create_kurti_body()`.

**⚠ DECISION NEEDED — saree vs kurti (do this before more garment work):**
`blender/generate_garment.py` + `blender/garment-config.json` are the **saree** generator
(pallu sway, procedural drape folds, `cloth_sim.enabled: false`, fitted blouse). They were
edited **outside the main working thread** and are committed and pushed. They are now a
**parallel, unused path** — the site consumes `generate_kurti.py` → `kurti.glb`, not the
saree output. The user pivoted saree → kurti mid-session.
Decide: **keep** the saree generator (useful if sarees return as a product line) or
**retire** it (delete, or move to `blender/archive/`) so future sessions don't confuse the
two pipelines. Nothing currently imports the saree GLBs.

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
8. **Texture rendered as flat grey — the single most misleading bug so far.** A red-on-black
   print came out washed-out pale grey. It looked exactly like "texture failed to load", and
   two rounds of lighting/exposure tuning did nothing. Root cause: the *same* Image Texture
   node was wired into **both** Base Color **and** the Bump `Height` input. Blender then
   reclassifies that image as **Non-Color** data, so the print is read as raw linear values
   instead of sRGB. Diagnosed by dumping the material graph (`blender/debug_material.py`),
   which printed `colorspace=Non-Color`. **Rule: colour and relief must never share a texture
   node.** Base Color gets an explicit `colorspace_settings.name = 'sRGB'`; the weave bump now
   comes from a procedural noise node (a printed motif is flat on real cloth anyway — it is
   not embossed).

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
- `OutfitModel.tsx` — **now loads the real kurti GLB** (no longer `ExtrudeGeometry`). Props are
  deliberately unchanged (`x` / `color` / `progress` / `delay`) so `FashionScene` needed zero
  edits during the swap. `color` is now an optional tint (`tintStrength`, default `0` = leave
  the print untouched).
- `GarmentLoader.tsx` — the swap layer: `OutfitModel → GarmentLoader → kurti.glb`. Recentres on
  the bounding box and normalises to a target height (the Blender model is at real-world scale,
  z ≈ 0.62–1.38), so no magic offsets at call sites. **Clones materials per instance** —
  `scene.clone(true)` shares materials, so without this, animating opacity on one garment bleeds
  into every other instance. Swapping garments = change `GARMENT_URL` only.
- `CameraController.tsx` — damped dolly + orbit driven by progress.
- `FashionScene.tsx` — canvas, 3-point lighting, composition.

## Known-unfinished / honest status

- **The kurti is a clean stylised garment, not photoreal cloth.** It has real geometry
  (collar, sleeves, slits, folds) and a correct print, but no seam allowances, no collar roll,
  no fabric self-shadowing in the folds. Procedural sine folds can *suggest* drape but cannot
  reproduce how cloth gathers at the elbow or breaks over the hip — that needs cloth
  simulation, which is not viable here (2 cores, no CUDA; headless cloth sim silently
  no-opped). Closing that gap needs a CUDA machine or a CLO3D/Marvelous export. The
  `GarmentLoader` abstraction makes swapping one in a single-URL change.
- **Photogrammetry is a dead end for the AI videos — do not retry it.** Two independent
  blockers, both verified: (1) no CUDA on this machine — Meshroom's `DepthMap` node and
  COLMAP's `patch_match_stereo` are both CUDA-only with no CPU fallback, so dense
  reconstruction hard-fails at step 5; (2) more fundamentally, AI-generated video has no real
  camera and no temporally consistent geometry, so feature matching has nothing valid to
  match. This is a category mismatch, not a tuning problem.
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

## Kurti generator (the active garment pipeline)

```
blender/config/kurti_01.json     all tunable params — edit this, not the code
blender/generate_kurti.py        the generator (modular functions)
blender/preview_kurti.py         renders front/side/back → public/generated/kurti_{view}.png
blender/debug_material.py        dumps material graph + UV ranges (caught the sRGB bug)
```

Run:
```bash
"/d/Blender/blender-5.2.0-windows-x64/blender.exe" -noaudio --background \
  --python blender/generate_kurti.py -- config/kurti_01.json
```

Outputs `public/models/kurti_high.glb` (7.6k faces) / `kurti.glb` (5.4k, site default) /
`kurti_low.glb` (3.0k). Verified serving in-browser: `200`, `model/gltf-binary`, ~272 KB,
no console errors.

**Adding another garment:** copy `config/kurti_01.json` → `kurti_02.json`, edit values, pass it
as the arg. No code changes. Functions are split as
`create_kurti_body / create_neckline / create_sleeves / create_folds / create_fabric_material`.

Real geometry (not painted into the texture): mandarin collar, 3/4 tapered sleeves, side slits
(faces omitted below the hip), straight hem, 4 mm `Solidify` thickness, and three superimposed
fold scales (macro drape + pleats + micro wrinkles) with amplitude biased toward the hem.

**Geometry bugs already fixed — don't reintroduce:**
- Sleeves swept outward as fast as they dropped → flat "wings". Arms hang; keep
  `sleeves.outward` small (~0.022).
- Sleeves started *below* shoulder height → visible detached notch. They now start level with
  the shoulder and overlap into the body.
- Sleeve UVs used a fixed scale → motifs ~3× denser than the body. Sleeve UV scale is now
  **derived proportionally** from the body's UV scale and relative circumference, so the print
  stays the same physical size across panels even if the config changes.

**Config gotcha:** colours in the Blender configs are **linear**, not sRGB. sRGB `#A8291F`
becomes ~`[0.39, 0.022, 0.013]`. Entering sRGB hex directly renders washed-out/pink.

## Verified numbers (scroll → video frame, measured live)

| scrollY | progress | frame |
|---|---|---|
| 2200 | 0.00 | 0.00s |
| 2700 | 0.344 | 3.42s |
| 3200 | 0.704 | 7.00s |
| 3700 | 1.00 | 9.95s |
