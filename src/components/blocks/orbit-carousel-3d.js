/**
 * Orbit Carousel — Framer code component
 *
 * A tilted ring of portrait cards that spins slowly on its own, can be
 * grabbed and spun by hand (mouse drag or a horizontal touch swipe) and
 * gently rocks like a boat as the mouse moves across the screen. The ring
 * NEVER listens to the mouse wheel or page scroll: scrolling stays fully
 * native everywhere, vertical touch swipes keep scrolling the page. Real depth:
 * the back row peeks out behind the front cards, smaller and dimmed; card
 * backs show the same photo mirrored and darkened. Cards are gently CURVED:
 * each one is built from vertical slices hugging the ring cylinder, so the
 * wheel silhouette reads as a true circle, not a 12-chord polygon.
 *
 * The scene has a FIXED size (baked constants): resizing the component frame
 * never squeezes the wheel itself. The Clip control picks whether the frame
 * crops the wheel at its edges or lets cards float outside it.
 *
 * A drag release is a SPEED handoff, not a turn request: a flick leaves the
 * ring spinning at the hand's release speed and the momentum bleeds off over
 * several seconds back to the idle drift — a heavy wheel with real momentum,
 * never a snap between fast and slow. Grabbing the ring again arrests that
 * glide instantly, like a palm on a spinning globe.
 *
 * Intro reveal: on page load the front card fades in first, then the rest
 * fly along the ring into their slots. The reveal is DECODE-GATED: it waits
 * (capped at INTRO_DECODE_MS) until every photo has downloaded and decoded,
 * so cards never fly in as empty rectangles and the flight never freezes on
 * a mid-air image decode. It starts as soon as the gate opens no matter
 * where the section sits on the page (it never waits for scroll-into-view),
 * so a reader scrolling down later finds the wheel already assembled. Never
 * plays on the Framer canvas, in exports or in thumbnails; skipped under
 * reduced motion.
 *
 * Phones run a COMPACT profile: 3 coarser slices per card instead of 6, a
 * lighter texture oversample and the smallest srcSet photo variant. Mobile
 * WebKit gives a page a hard graphics-memory budget, and the full desktop
 * layer set (up to 15 cards × 6 oversampled slices at DPR 3, with 2048px
 * photo decodes) blows past it — iOS then drops the page's ENTIRE layer
 * tree and the whole site renders as bare background color. Detected once
 * per load (coarse pointer + phone-sized screen); tablet and desktop
 * rendering is untouched.
 *
 * Zero dependencies: react + framer only (no framer-motion). Single file.
 *
 * License: MIT
 */import{jsx as _jsx}from"react/jsx-runtime";import{addPropertyControls,ControlType,RenderTarget,useIsStaticRenderer}from"./framer-shim";import{useEffect,useMemo,useRef}from"react";// ---------------------------------------------------------------------------
// Baked geometry — tuned live in prototype.html (2026-07-09).
// Free build keeps these as constants on purpose; exposing them (card count,
// size, radius, tilt, gap…) is reserved for a future Pro version.
// ---------------------------------------------------------------------------
const MIN_SLOTS=12// ring has at least this many slots; fewer photos loop around
;const PERSPECTIVE=730// px, camera depth
;const RADIUS=400// px, ring radius — invariant: RADIUS < 0.85 * PERSPECTIVE
;const CARD_W=160// px
;const CARD_H=200// px
;const TILT_X=0// deg, negative = looking into the "bowl" from above
;const TILT_Z=-18// deg, negative = right edge up (mirrored reference pose)
;const RING_Y_OFFSET=-160// px, vertical push of the ring inside the frame
;const ORIGIN_Y=10// %, perspective-origin vertical
;const POSE_ANGLE=0// deg, base pose offset
;const BACK_DIM=.65// 0..1, how dark the card backs get
;const RING_R=Math.min(RADIUS,.85*PERSPECTIVE)// front card must not pierce the camera
;// Perspective magnifies the front card ~2.2× (PERSPECTIVE / (PERSPECTIVE −
// RADIUS)). Cards are laid out this many times larger and scaled back down
// inside their 3D transform, so the texture the browser rasterizes has enough
// pixels when the wheel brings a card close to the camera. Without this the
// front card pixelates in Preview: during a composited animation
// (will-change) browsers never re-rasterize at the perspective-boosted scale.
const OVERSAMPLE=2.25;// ---------------------------------------------------------------------------
// Compact profile — phones
// ---------------------------------------------------------------------------
// Mobile WebKit enforces a hard graphics-memory budget per page. The desktop
// profile keeps ~90 oversampled slice layers alive inside one composited
// spinner; at DPR 3 (×9 pixels per layer vs DPR 1) plus 2048px photo decodes
// that lands at roughly 250–300 MB — over the budget, and iOS answers by
// dropping the page's ENTIRE layer tree: the whole site (text, badge,
// everything) renders as bare background color right after the intro, when
// the decode gate lifts and every texture uploads at once. The compact
// profile trades a bit of front-card sharpness for staying far under that
// ceiling. Applied per load, never on canvas/export; tablets (which have the
// headroom and shipped fine) and desktops keep the full profile.
const COMPACT_SEGMENTS=3// vertical slices per card on phones (6 on desktop)
;const COMPACT_OVERSAMPLE=1.5// texture oversample on phones (2.25 on desktop)
;const PHONE_SCREEN_MAX=700// px; phones have min(screen w/h) below this, tablets sit above
;function isPhone(){if(typeof window==="undefined"||!window.matchMedia)return false;return window.matchMedia("(pointer: coarse)").matches&&Math.min(window.screen.width,window.screen.height)<PHONE_SCREEN_MAX;}// "url 640w, url 1280w, …" → the url with the smallest width descriptor.
// The compact profile swaps every slice <img> onto that candidate: a 240px
// texture never needs the 1280w/2048px decode a DPR-3 srcset pick would keep
// resident (~10 MB per photo vs ~2.5 MB).
function smallestCandidate(srcset){let bestUrl=null;let bestW=Infinity;for(const entry of srcset.split(",")){const[url,desc]=entry.trim().split(/\s+/);const w=parseFloat(desc||"");if(url&&w&&w<bestW){bestW=w;bestUrl=url;}}return bestUrl;}// ---------------------------------------------------------------------------
// Curved cards — slice geometry
// ---------------------------------------------------------------------------
// A DOM element is always a flat plane, so each card is built from vertical
// strips, every strip tangent to the ring cylinder at its own angle (the
// ring-construction pattern, recursed into the card). With the desktop's 6
// strips the kink between neighbours is CARD_ARC / 6 (~3.8°) and a strip's
// deviation from the true arc stays under a third of a pixel, so the wheel
// silhouette reads as a genuine circle instead of a 12-chord polygon.
// Everything is static inside the spinner — the per-frame cost is unchanged
// (only the spinner transform animates), there are just more composited
// layers, built once.
//
// The DOM always carries CURVE_SEGMENTS slice boxes per card (that is the
// indexing stride of the ref arrays and it matches the server-rendered
// markup, so hydration never mismatches). The ACTIVE profile may use fewer:
// applyLayout() widens the first `seg` slices to cover the whole card and
// parks the rest at display:none, where they paint and cost nothing.
const CURVE_SEGMENTS=6// slice boxes per card in the DOM (= desktop profile)
;const SLICE_BLEED=1// px (oversampled) of extra crop each side; neighbours overlap to hide AA hairline seams
;const CARD_ARC=CARD_W/RING_R*(180/Math.PI)// deg of ring arc one card hugs — invariant: < 360 / MIN_SLOTS
;// Hard cap on photos. Above MIN_SLOTS every photo gets its own slot, so the
// slot spacing shrinks with the photo count — and once it drops below
// CARD_ARC, neighbouring curved cards share the same cylinder surface and
// interpenetrate (the ring reads as one striped drum, with z-fighting).
const MAX_PHOTOS=Math.floor(360/CARD_ARC)// 15 with the baked geometry
;// px of card texture one slice window covers.
function sliceStep(seg=CURVE_SEGMENTS,ov=OVERSAMPLE){return CARD_W*ov/seg;}// Slice box width (oversampled px): window plus bleed on both sides.
function sliceWidth(seg=CURVE_SEGMENTS,ov=OVERSAMPLE){return sliceStep(seg,ov)+2*SLICE_BLEED;}// Angular center of slice j relative to the card's slot angle (deg).
function sliceAngle(j,seg=CURVE_SEGMENTS){return((j+.5)/seg-.5)*CARD_ARC;}// Same rotate → translateZ → 2D-scale pattern as the cards themselves used
// before curving: the trailing scale() never touches Z, so translateZ stays
// in real px while the slice box is authored oversampled.
function sliceTransform(j,seg=CURVE_SEGMENTS,ov=OVERSAMPLE){return`translate(-50%,-50%) rotateY(${sliceAngle(j,seg)}deg) translateZ(${RING_R}px) scale(${1/ov})`;}// Card corners: only the first slice rounds the left pair, only the last
// slice of the ACTIVE profile rounds the right pair.
function sliceCornerStyle(j,br,seg=CURVE_SEGMENTS){const l=j===0?br:0;const r=j===seg-1?br:0;return{borderTopLeftRadius:l,borderBottomLeftRadius:l,borderTopRightRadius:r,borderBottomRightRadius:r};}function applySliceCorners(style,j,br,seg=CURVE_SEGMENTS){style.borderTopLeftRadius=j===0?`${br}px`:"0";style.borderBottomLeftRadius=j===0?`${br}px`:"0";style.borderTopRightRadius=j===seg-1?`${br}px`:"0";style.borderBottomRightRadius=j===seg-1?`${br}px`:"0";}// Photos: every slice holds a full-size <img> shifted so its strip lines up
// with the slice window, clipped to that window (+bleed). clip-path is a
// grouping property, but it sits on the img LEAF — harmless; the slice box
// above it keeps preserve-3d so both of the photo's faces render in the ring.
function imgSliceClip(j,br,seg=CURVE_SEGMENTS,ov=OVERSAMPLE){const step=sliceStep(seg,ov);const left=Math.max(0,j*step-SLICE_BLEED);const right=Math.max(0,CARD_W*ov-((j+1)*step+SLICE_BLEED));const l=j===0?br:0;const r=j===seg-1?br:0;return`inset(0 ${right}px 0 ${left}px round ${l}px ${r}px ${r}px ${l}px)`;}// ---------------------------------------------------------------------------
// Motion feel
// ---------------------------------------------------------------------------
const SPIN_SMOOTH=7// 1/s, how fast the wheel catches up with its target angle
;const DRAG_SPEED=.15// deg of ring turn per dragged px (~1:1 with the front card)
;const DRAG_VEL_SMOOTH=.2// 0..1, EMA weight of the newest sample in the hand-speed estimate
;// A drag release hands its SPEED to the ring, not a turn: the glide velocity
// starts at the flick's release rate and bleeds off at GLIDE_FALL back to the
// idle drift. Perceived wind-down from a hard fling ≈ 3/GLIDE_FALL s (~6–8 s).
// Raise the constant to snap that phase up, lower it for a lazier glide.
const GLIDE_FALL=.45// 1/s, momentum bleed-off after the hand lets go
;const GLIDE_SETTLE=.5// deg/s, below this the leftover glide snaps to 0
;const FLICK_MAX=720// deg/s, hardest spin a single flick can impart
;const ROCK_TILT=2.5// deg of extra rotateX when the mouse reaches a screen edge
;const ROCK_SHIFT=10// px of sideways drift when the mouse reaches a screen edge
;const ROCK_SMOOTH=2.5// 1/s, lazy "boat on calm water" catch-up rate
;const MAX_DT=.05// s, clamp frame delta (background-tab time jumps)
;const ANGLE_EPSILON=.01// deg, skip sub-pixel spinner writes (anti-shimmer)
;const ROCK_TILT_EPSILON=.005// deg, skip sub-perceptual rocking-tilt writes (anti-shimmer)
;const ROCK_SHIFT_EPSILON=.05// px, skip sub-pixel camera-shift writes (anti-shimmer)
;// Intro reveal (page load only; skipped on canvas, export, thumbnail and
// under reduced motion): the front card fades in first, then the rest fly
// along the ring into their slots. Runs on the Web Animations API, so it
// advances even while the section is offscreen — by the time a reader
// scrolls down to the carousel it has long finished.
const INTRO_FRONT_MS=600// front-card fade-in
;const INTRO_CARD_MS=900// one flying card, launch to landing
;const INTRO_STAGGER_MS=90// gap between successive cards taking off
;const INTRO_START_MS=250// flying cards wait for the front card's lead
;const INTRO_SWEEP=60// deg of ring arc a card flies before settling; flip the sign to reverse the fly-in direction
;const INTRO_EASE="cubic-bezier(0.22, 1, 0.36, 1)"// fast launch, soft landing
;const INTRO_FADE_FRACTION=.4// of INTRO_CARD_MS — a card materializes over the flight's first stretch
;const INTRO_DECODE_MS=2500// max wait for photo decode before the reveal starts anyway
;// Back-dim: cosine-driven brightness() written onto the face leaves
// themselves, ONE value per card. Earlier builds overlaid a flipped black
// div per slice, but per-slice overlays can never tile seamlessly:
// neighbouring slices meet at a ~4° kink, and the antialiased edges of two
// separate translucent layers don't close ranks — a hairline of undimmed
// photo glowed through exactly where the dim was strongest (the ring's back
// arc). Darkening the photo itself leaves nothing to misalign, halves the
// carousel's DOM, and is mathematically identical: brightness(1−x) equals a
// black overlay at opacity x. filter on the img/placeholder LEAF is safe —
// the preserve-3d flattening hazard only applies to 3D-chain containers.
const STYLE_DEFAULTS={radius:10,clipContent:false};const CAMERA_DEFAULTS={zoom:1,offsetX:0,offsetY:0};const MOTION_DEFAULTS={autoSpeed:4,rocking:1};// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function prefersReducedMotion(){if(typeof window==="undefined"||!window.matchMedia)return false;return window.matchMedia("(prefers-reduced-motion: reduce)").matches;}// Placeholder card colors — Pantone "Convergence" palette (6 colors), run
// around the ring in order: slots 1-6 get the palette, slots 7-12 repeat it.
const PLACEHOLDER_PALETTE=["#833E8D","#E25800","#F0B285","#D2E177","#FB83AD","#F08592"];// 0 photos -> MIN_SLOTS placeholders; 1..MIN_SLOTS-1 -> loop into MIN_SLOTS;
// >= MIN_SLOTS -> one slot per photo, capped at MAX_PHOTOS. The panel's
// maxCount already enforces the cap; the slice here covers props from code.
function buildSlots(photos){const usable=photos.filter(p=>p&&p.src).slice(0,MAX_PHOTOS);if(usable.length===0)return Array.from({length:MIN_SLOTS},()=>null);const count=Math.max(MIN_SLOTS,usable.length);return Array.from({length:count},(_,i)=>usable[i%usable.length]);}// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 720
 */export default function OrbitCarousel({photos=[],styleProps,cameraProps,motionProps,style}){const{radius,clipContent}={...STYLE_DEFAULTS,...styleProps};const camera={...CAMERA_DEFAULTS,...cameraProps};const motion={...MOTION_DEFAULTS,...motionProps};const slots=useMemo(()=>buildSlots(photos),[photos]);const frameRef=useRef(null);const cameraRef=useRef(null);const tiltRef=useRef(null);const spinnerRef=useRef(null);const cardRefs=useRef([]);const faceRefs=useRef([]);// Marketplace-required static check: true on the canvas and during
// export, where animations must never run. Belt-and-braces with the
// RenderTarget gate inside the effect (which also catches thumbnails).
const isStatic=useIsStaticRenderer();// Motion state lives OUTSIDE the effect so tweaking a property in the
// Framer panel never resets the wheel position or the rocking pose.
const stateRef=useRef({angle:POSE_ANGLE,drift:0,dragOffset:0,glideVel:0,introPlayed:false,rockTilt:0,rockShift:0,pointerX:0,pointerY:0});useEffect(()=>{const frame=frameRef.current;const cam=cameraRef.current;const tilt=tiltRef.current;const spinner=spinnerRef.current;if(!frame||!cam||!tilt||!spinner)return;const st=stateRef.current;const slotCount=slots.length;// Profile pick, once per effect run. Canvas/export/thumbnail always
// render on desktop machines, so the static branch below never sees
// compact; on a published site this is the phone check.
const compact=isPhone();const seg=compact?COMPACT_SEGMENTS:CURVE_SEGMENTS;const ov=compact?COMPACT_OVERSAMPLE:OVERSAMPLE;// Callback refs fill these by index and null out whatever unmounts,
// so after a slot-count decrease the arrays keep a stale null tail —
// trim it. (Here rather than in the render body: render must stay
// free of side effects for React 18.)
cardRefs.current.length=slotCount;faceRefs.current.length=slotCount*CURVE_SEGMENTS;// Shade intro gate: per-card multiplier over the cosine back-dim. The
// rAF loop owns the faces' brightness filter, so the intro can't
// WAAPI-fade the shade without fighting the per-frame writes —
// instead each card's gate ramps 0 -> 1 on the same clock as its
// face fade.
const shadeGates=Array(slotCount).fill(1);let shadeRamps=null;function updateShade(angle){// ONE brightness per card, not per slice: neighbouring strips sit
// a few degrees apart on the cylinder, and giving each its own
// cosine paints visible brightness steps — facet lines — across
// the card back. The card-center angle shades all slices as one.
let stillRamping=false;const nowMs=shadeRamps?performance.now():0;for(let slot=0;slot*CURVE_SEGMENTS<faceRefs.current.length;slot++){if(shadeRamps){const r=shadeRamps[slot];if(r){const g=Math.min(1,Math.max(0,(nowMs-r.start)/r.dur));shadeGates[slot]=g;if(g<1)stillRamping=true;}}const world=slot*360/slotCount+angle;const t=world*Math.PI/180;const b=(1-BACK_DIM*Math.max(0,-Math.cos(t))*shadeGates[slot]).toFixed(3);for(let j=0;j<seg;j++){const face=faceRefs.current[slot*CURVE_SEGMENTS+j];if(face)face.style.filter=`brightness(${b})`;}}if(shadeRamps&&!stillRamping)shadeRamps=null;}function writeSpinner(){if(!spinner)return;spinner.style.transform=`rotateY(${st.angle}deg)`;updateShade(st.angle);}function writeTilt(){if(!tilt)return;tilt.style.transform=`translateY(${RING_Y_OFFSET}px) rotateZ(${TILT_Z}deg) rotateX(${TILT_X+st.rockTilt}deg)`;}// Pan in screen px (translate applies after scale, so panning feel is
// zoom-independent), then 2D-zoom the FINISHED render — never the
// geometry, or the vanishing point would shift the viewing angle.
function writeCamera(){if(!cam)return;cam.style.transform=`translate(${camera.offsetX+st.rockShift}px, ${camera.offsetY}px) scale(${camera.zoom})`;}// Constants -> styles. Runs on mount and on any prop change. The
// scene is fixed-size (no dependence on the frame), so there is no
// resize handling: the frame just crops the wheel. The JSX ships the
// full desktop profile (matching the server markup); this pass owns
// the ACTIVE profile's slice geometry, so on phones it re-slices
// every card into fewer, wider, lighter strips before first use.
function applyLayout(){// Cards are laid out oversample× larger and scaled back down —
// see the OVERSAMPLE note above (anti-pixelation in Preview).
const w=CARD_W*ov;const h=CARD_H*ov;const br=radius*ov;const step=sliceStep(seg,ov);for(let i=0;i<cardRefs.current.length;i++){const card=cardRefs.current[i];if(!card)continue;card.style.width=`${w}px`;card.style.height=`${h}px`;// The card only orients its slot on the ring; pushing out to
// the cylinder and the oversample scale-down happen per
// SLICE (sliceTransform), so each strip hugs the curve.
card.style.transform=`translate(-50%,-50%) rotateY(${i*360/slotCount}deg)`;}for(let idx=0;idx<faceRefs.current.length;idx++){const face=faceRefs.current[idx];if(!face)continue;const j=idx%CURVE_SEGMENTS;const box=face.parentElement;if(box){// Slice boxes beyond the active profile sit at
// display:none — no paint, no composited layer. The
// surviving ones widen to cover the whole card.
box.style.display=j<seg?"":"none";if(j<seg){box.style.width=`${sliceWidth(seg,ov)}px`;box.style.height=`${h}px`;box.style.transform=sliceTransform(j,seg,ov);}}if(j>=seg)continue;if(face.tagName==="IMG"){face.style.left=`${SLICE_BLEED-j*step}px`;face.style.width=`${w}px`;face.style.height=`${h}px`;const clip=imgSliceClip(j,br,seg,ov);face.style.clipPath=clip;face.style.setProperty("-webkit-clip-path",clip);}else{applySliceCorners(face.style,j,br,seg);}}writeCamera();writeTilt();writeSpinner();}// --- canvas / export / thumbnail: static pose, no listeners, no loop
// (Theater pattern). Anything that is not the live preview renders a
// still: an export snapshot or a marketplace thumbnail must never
// catch the wheel mid-spin. useIsStaticRenderer covers canvas/export;
// the RenderTarget check additionally covers thumbnails.
if(isStatic||RenderTarget.current()!==RenderTarget.preview){applyLayout();return;}// --- live: IO-gated rAF loop + pointer rocking -----------------------
let rafId=null;let inView=false;let lastT=0;let lastWrittenAngle=Number.NaN;let lastWrittenTilt=Number.NaN;let lastWrittenShift=Number.NaN;function tick(now){const dt=Math.min(MAX_DT,lastT?(now-lastT)/1e3:0);lastT=now;// Idle drift: the wheel always turns, very slowly...
st.drift+=motion.autoSpeed*dt;// ...plus the flick glide: momentum handed over on drag release
// bleeds off exponentially (GLIDE_FALL) — fast-to-slow takes
// seconds, not a blink.
if(dt>0&&st.glideVel!==0){st.glideVel*=Math.exp(-GLIDE_FALL*dt);if(Math.abs(st.glideVel)<GLIDE_SETTLE)st.glideVel=0;st.dragOffset+=st.glideVel*dt;}// Drag feeds dragOffset directly; the target runs ahead and the
// ring chases it with an exponential catch-up (spring-like weight).
const target=POSE_ANGLE+st.drift+st.dragOffset;st.angle+=(target-st.angle)*(1-Math.exp(-SPIN_SMOOTH*dt));if(Number.isNaN(lastWrittenAngle)||Math.abs(st.angle-lastWrittenAngle)>=ANGLE_EPSILON){writeSpinner();lastWrittenAngle=st.angle;}// While the intro's shade ramp runs, the back-dim must keep
// fading even if the wheel itself is parked (Auto Spin 0, no
// drag) and the angle-epsilon skip above kept writeSpinner from
// firing.
if(shadeRamps)updateShade(st.angle);// Boat rocking: lazily follow the mouse. Mouse up -> the near edge
// dips (deeper bowl view); mouse right -> the picture drifts left.
const k=1-Math.exp(-ROCK_SMOOTH*dt);st.rockTilt+=(st.pointerY*ROCK_TILT*motion.rocking-st.rockTilt)*k;st.rockShift+=(-st.pointerX*ROCK_SHIFT*motion.rocking-st.rockShift)*k;if(Number.isNaN(lastWrittenTilt)||Math.abs(st.rockTilt-lastWrittenTilt)>ROCK_TILT_EPSILON){writeTilt();lastWrittenTilt=st.rockTilt;}if(Number.isNaN(lastWrittenShift)||Math.abs(st.rockShift-lastWrittenShift)>ROCK_SHIFT_EPSILON){writeCamera();lastWrittenShift=st.rockShift;}rafId=requestAnimationFrame(tick);}function syncLoop(){const shouldRun=inView&&!prefersReducedMotion();if(shouldRun&&rafId===null){lastT=0;rafId=requestAnimationFrame(tick);}else if(!shouldRun&&rafId!==null){cancelAnimationFrame(rafId);rafId=null;}}const io=new IntersectionObserver(entries=>{inView=entries.some(e=>e.isIntersecting);syncLoop();},{threshold:0});io.observe(frame);// Drag anywhere on the wheel to spin it by hand — mouse or touch.
// This is the ONLY gesture the ring listens to, so page scroll stays
// native everywhere. A flick on release hands the hand's speed to the
// ring and it glides down for seconds. touch-action: pan-y on the
// frame keeps vertical swipes scrolling the page on touch.
// The grab cursor is only honest while dragging is possible — the
// handlers bail under reduced motion, so no hand affordance there.
const idleCursor=()=>prefersReducedMotion()?"":"grab";let dragPointerId=null// the one pointer that owns the drag
;let dragLastX=0;let dragLastT=0;let dragVel=0// px/s, smoothed horizontal pointer speed
;function onDragStart(e){if(!frame||prefersReducedMotion())return;if(e.pointerType==="mouse"&&e.button!==0)return;// One pointer owns the drag: a second finger landing mid-drag
// must not splice its own movement into the wheel speed.
if(dragPointerId!==null)return;dragPointerId=e.pointerId;// A hand on the wheel arrests any leftover glide instantly,
// like a palm on a spinning globe — drag and glide never fight.
st.glideVel=0;dragLastX=e.clientX;dragLastT=performance.now();dragVel=0;frame.setPointerCapture?.(e.pointerId);frame.style.cursor="grabbing";}function onDragMove(e){if(e.pointerId!==dragPointerId)return;const dx=e.clientX-dragLastX;dragLastX=e.clientX;const now=performance.now();const dtMs=Math.max(1,now-dragLastT);dragLastT=now;dragVel=dragVel*(1-DRAG_VEL_SMOOTH)+dx/dtMs*1e3*DRAG_VEL_SMOOTH;st.dragOffset+=dx*DRAG_SPEED;}function onDragEnd(e){if(e.pointerId!==dragPointerId||!frame)return;dragPointerId=null;// Momentum handoff: the ring keeps spinning at the hand's release
// speed (clamped) and GLIDE_FALL bleeds it off over seconds —
// the same heavy-flywheel wind-down the wheel input used to have.
st.glideVel=Math.max(-FLICK_MAX,Math.min(FLICK_MAX,dragVel*DRAG_SPEED));dragVel=0;frame.style.cursor=idleCursor();}// pointercancel means the browser reclaimed the gesture (the pan-y
// vertical scroll took over, a system dialog appeared…) — the user
// was scrolling, not throwing, so unlike a real release it imparts
// NO flick: the wheel just settles back to its idle drift.
function onDragCancel(e){if(e.pointerId!==dragPointerId||!frame)return;dragPointerId=null;dragVel=0;frame.style.cursor=idleCursor();}frame.style.cursor=idleCursor();frame.addEventListener("pointerdown",onDragStart);frame.addEventListener("pointermove",onDragMove);frame.addEventListener("pointerup",onDragEnd);frame.addEventListener("pointercancel",onDragCancel);// Mouse only: on touch there is no hover-style parallax (the slow
// auto-spin carries the "alive" feel there instead).
function onPointerMove(e){if(e.pointerType!=="mouse")return;const vw=window.innerWidth;const vh=window.innerHeight;if(!vw||!vh)return;st.pointerX=e.clientX/vw*2-1;st.pointerY=e.clientY/vh*2-1;}window.addEventListener("pointermove",onPointerMove,{passive:true});const rmq=window.matchMedia("(prefers-reduced-motion: reduce)");function onRmqChange(){if(prefersReducedMotion()){st.angle=POSE_ANGLE;st.drift=0;st.dragOffset=0;st.glideVel=0;st.rockTilt=0;st.rockShift=0;writeSpinner();writeTilt();writeCamera();}if(frame)frame.style.cursor=idleCursor();syncLoop();}rmq.addEventListener("change",onRmqChange);// Compact profile: pin every slice <img> to the photo's smallest
// srcSet candidate. Left to itself a DPR-3 phone resolves the srcset
// to a 1280w/2048px variant and keeps ~10 MB of decode per photo
// resident; the smallest candidate is plenty for the compact 240px
// texture. Done BEFORE the decode gate below collects its promises,
// so the intro waits for these files, not the heavyweights.
if(compact){for(const face of faceRefs.current){if(!face||face.tagName!=="IMG")continue;const img=face;const small=smallestCandidate(img.srcset);if(small){img.removeAttribute("srcset");img.removeAttribute("sizes");img.src=small;}}}applyLayout();syncLoop();// --- intro reveal: once per page load, driven by WAAPI ---------------
// Runs in preview/live only — the static gate above already returned
// for canvas, export and thumbnail, so those render assembled.
// WAAPI timelines advance regardless of viewport visibility, so the
// reveal effectively "pre-plays" while the section is still below the
// fold — exactly the wanted behavior — and while offscreen the
// browser skips painting it, so those frames cost nothing.
//
// Decode gate: the reveal waits until every card <img> has finished
// downloading AND decoding (capped at INTRO_DECODE_MS so one dead
// URL can't stall the reveal forever). Flying in before that shows
// empty rectangles, and a mid-flight decode of a big photo freezes
// the whole animation for a beat. While the gate is closed the faces
// are hidden inline — the ring drifts invisibly and the photos
// stream in behind the curtain.
const intros=[];const hiddenEls=[];let introCancelled=false;let introDecodeTimer;if(!st.introPlayed){st.introPlayed=true;if(!prefersReducedMotion()&&cardRefs.current[0]?.animate){const hide=el=>{if(!el)return;el.style.opacity="0";hiddenEls.push(el);};for(let idx=0;idx<faceRefs.current.length;idx++){hide(faceRefs.current[idx]);}// The back-shade can't hide behind the inline curtain (the
// rAF loop owns the brightness filter and would overwrite it
// next frame) — close the gates instead, so no darkened backs
// float around before the reveal.
shadeGates.fill(0);updateShade(st.angle);// Per-card flight geometry, shared by the transform keyframes,
// the face fades and the shade ramps. The launch angle is
// CLAMPED at the front card's slot (0°): with a plain
// a − INTRO_SWEEP the first cards (slot spacing is smaller
// than the sweep) would launch from negative angles — on
// screen, ahead of and overlapping the already-revealed front
// card, then fly straight through it. No card may ever appear
// beyond the front card's position; short-arc cards emerge
// exactly from it. Flight time scales with the clamped arc so
// every card flies at the same angular speed — a 24° hop must
// not crawl through the full-sweep time budget.
const flightOf=i=>{const a=i*360/slotCount;const from=INTRO_SWEEP>=0?Math.max(a-INTRO_SWEEP,0):Math.min(a-INTRO_SWEEP,360);const ms=INTRO_CARD_MS*Math.abs(a-from)/(Math.abs(INTRO_SWEEP)||1);return{a,from,ms};};const startIntro=()=>{if(introCancelled)return;// Each card's shade gate opens on the same clock as its
// face fade below, so backs darken in step with the
// photos materializing — never before, never after.
const t0=performance.now();shadeRamps=slots.map((_,i)=>i===0?{start:t0,dur:INTRO_FRONT_MS}:{start:t0+INTRO_START_MS+(i-1)*INTRO_STAGGER_MS,dur:flightOf(i).ms*INTRO_FADE_FRACTION});// Opacity is animated on the face LEAVES, never on the
// card itself: opacity < 1 is a CSS grouping property
// that flattens the card's preserve-3d children, which
// would break the mirrored card backs for the whole
// flight. The rAF loop owns the back-shade filter, so
// only the face fades here — the shade follows the same
// clock via shadeRamps above.
const fadeIn=(el,timing)=>{if(!el)return;// Lift the decode-gate curtain; the animation owns
// opacity from here (fill backwards covers pre-delay).
el.style.opacity="";intros.push(el.animate([{opacity:0},{opacity:1}],timing));};// All slices of a card materialize as one: their faces
// share the card's fade timing.
const fadeCard=(i,timing)=>{for(let j=0;j<CURVE_SEGMENTS;j++){fadeIn(faceRefs.current[i*CURVE_SEGMENTS+j],timing);}};for(let i=0;i<cardRefs.current.length;i++){const card=cardRefs.current[i];if(!card)continue;if(i===0){// The front (biggest) card leads with a plain fade —
// its pose is already correct.
fadeCard(i,{duration:INTRO_FRONT_MS,easing:"ease-out",fill:"backwards"});continue;}// The rest fly the ring arc into place. Keyframe
// transforms must mirror applyLayout()'s string
// exactly so the landing frame equals the inline
// style underneath.
const{a,from,ms}=flightOf(i);const pose=deg=>`translate(-50%,-50%) rotateY(${deg}deg)`;const delay=INTRO_START_MS+(i-1)*INTRO_STAGGER_MS;intros.push(card.animate([{transform:pose(from)},{transform:pose(a)}],{duration:ms,delay,easing:INTRO_EASE,fill:"backwards"}));// Materialize over the first stretch of the flight.
fadeCard(i,{duration:ms*INTRO_FADE_FRACTION,delay,easing:"ease-out",fill:"backwards"});}};// decode() resolves instantly for cache-hot images; catch()
// keeps one broken photo from vetoing everyone's reveal. One
// img per card is enough — all its slices share the URL.
const decodes=[];for(let i=0;i<slotCount;i++){const el=faceRefs.current[i*CURVE_SEGMENTS];if(el&&el.tagName==="IMG")decodes.push(el.decode().catch(()=>{}));}if(decodes.length===0)startIntro();else Promise.race([Promise.all(decodes),new Promise(r=>{introDecodeTimer=window.setTimeout(r,INTRO_DECODE_MS);})]).then(startIntro);}}return()=>{io.disconnect();rmq.removeEventListener("change",onRmqChange);window.removeEventListener("pointermove",onPointerMove);frame.removeEventListener("pointerdown",onDragStart);frame.removeEventListener("pointermove",onDragMove);frame.removeEventListener("pointerup",onDragEnd);frame.removeEventListener("pointercancel",onDragCancel);frame.style.cursor="";if(rafId!==null)cancelAnimationFrame(rafId);// Killing a mid-flight intro just snaps cards to their final
// inline pose (fill "backwards" holds nothing after cancel).
// A still-pending decode gate must not fire into a dead effect,
// and its curtain (inline opacity 0) must lift so a re-run of
// the effect never inherits invisible cards.
introCancelled=true;if(introDecodeTimer!==undefined)clearTimeout(introDecodeTimer);shadeRamps=null;shadeGates.fill(1);for(const anim of intros)anim.cancel();for(const el of hiddenEls)el.style.opacity="";};},[isStatic,slots,radius,camera.zoom,camera.offsetX,camera.offsetY,motion.autoSpeed,motion.rocking]);// ---- static JSX; the effect above owns every animated style ------------
// First-paint styles match applyLayout()'s output exactly.
const slotCount=slots.length;const br=radius*OVERSAMPLE;// Slice styles live in OVERSAMPLE-scaled space and describe the full
// desktop profile — they match the server-rendered markup byte for byte;
// applyLayout() re-slices for the active profile after mount. The slice
// box keeps preserve-3d (Safari backface compositing quirks); the face
// inside is a leaf.
const sliceBox=j=>({position:"absolute",left:"50%",top:"50%",width:sliceWidth(),height:CARD_H*OVERSAMPLE,transformStyle:"preserve-3d",transform:sliceTransform(j)});const imgFace=(i,j)=>({position:"absolute",top:0,left:SLICE_BLEED-j*sliceStep(),width:CARD_W*OVERSAMPLE,height:CARD_H*OVERSAMPLE,maxWidth:"none",display:"block",objectFit:"cover",// Until the photo arrives the card shows its Pantone tint (same
    // palette as the no-photos state) instead of a transparent hole —
    // only ever visible on a network slower than the decode-gate cap.
    backgroundColor:PLACEHOLDER_PALETTE[i%PLACEHOLDER_PALETTE.length],clipPath:imgSliceClip(j,br),WebkitClipPath:imgSliceClip(j,br),userSelect:"none",WebkitUserSelect:"none"});const placeholderFace=(i,j)=>({position:"absolute",inset:0,background:PLACEHOLDER_PALETTE[i%PLACEHOLDER_PALETTE.length],...sliceCornerStyle(j,br)});return /*#__PURE__*/_jsx("div",{ref:frameRef,style:{position:"relative",width:"100%",height:"100%",// The scene inside is fixed-size and centered; resizing the
// component reveals/hides the sides of the wheel, never
// rescales it. Clip (property control) decides whether the
// frame crops the wheel or lets cards float outside it.
overflow:clipContent?"hidden":"visible",// Horizontal touch drag spins the wheel; vertical swipes keep
// scrolling the page.
touchAction:"pan-y",userSelect:"none",WebkitUserSelect:"none",...style},children:/*#__PURE__*/_jsx("div",{ref:cameraRef,style:{position:"absolute",inset:0},children:/*#__PURE__*/_jsx("div",{style:{position:"absolute",inset:0,perspective:PERSPECTIVE,perspectiveOrigin:`50% ${ORIGIN_Y}%`},children:/*#__PURE__*/_jsx("div",{ref:tiltRef,style:{position:"absolute",inset:0,transformStyle:"preserve-3d",transform:`translateY(${RING_Y_OFFSET}px) rotateZ(${TILT_Z}deg) rotateX(${TILT_X}deg)`},children:/*#__PURE__*/_jsx("div",{ref:spinnerRef,style:{position:"absolute",inset:0,transformStyle:"preserve-3d",willChange:"transform",transform:`rotateY(${POSE_ANGLE}deg)`},children:slots.map((photo,i)=>/*#__PURE__*/_jsx("div",{ref:el=>{cardRefs.current[i]=el;},style:{position:"absolute",left:"50%",top:"50%",width:CARD_W*OVERSAMPLE,height:CARD_H*OVERSAMPLE,// preserve-3d required on cards too
    // (Safari backface compositing bugs)
    transformStyle:"preserve-3d",transform:`translate(-50%,-50%) rotateY(${i*360/slotCount}deg)`},children:Array.from({length:CURVE_SEGMENTS},(_,j)=>{const idx=i*CURVE_SEGMENTS+j;return /*#__PURE__*/_jsx("div",{style:sliceBox(j),children:photo?/*#__PURE__*/_jsx("img",{ref:el=>{faceRefs.current[idx]=el;},src:photo.src,srcSet:photo.srcSet,// Matches the oversampled layout
    // width so the browser picks a
    // variant sharp enough for the
    // enlarged texture raster.
    sizes:`${CARD_W*OVERSAMPLE}px`,alt:j===0?photo.alt??"":"",draggable:false,decoding:"async",style:imgFace(i,j)}):/*#__PURE__*/_jsx("div",{ref:el=>{faceRefs.current[idx]=el;},style:placeholderFace(i,j)})},j);})},i))})})})})});}addPropertyControls(OrbitCarousel,{photos:{type:ControlType.Array,title:"Photos",control:{type:ControlType.ResponsiveImage},maxCount:MAX_PHOTOS,description:"Portrait photos (3:4) look best — up to 15 fit the ring. Tip: for the smoothest motion, add light images — lower-resolution or WebP files load faster and keep the spin fluid. Empty shows Pantone-colored placeholders."},styleProps:{type:ControlType.Object,title:"Style",controls:{radius:{type:ControlType.Number,title:"Corner Radius",min:0,max:40,step:1,defaultValue:10,unit:"px",description:"Card corner radius"},clipContent:{type:ControlType.Boolean,title:"Clip",defaultValue:false,enabledTitle:"On",disabledTitle:"Off",description:"Crop the wheel at the component edges. Off lets cards float outside the frame."}}},cameraProps:{type:ControlType.Object,title:"Camera",controls:{zoom:{type:ControlType.Number,title:"Zoom",min:.4,max:2.5,step:.05,defaultValue:1,description:"Scales the finished picture — never distorts the 3D angle"},offsetX:{type:ControlType.Number,title:"Shift X",min:-600,max:600,step:5,defaultValue:0,unit:"px"},offsetY:{type:ControlType.Number,title:"Shift Y",min:-600,max:600,step:5,defaultValue:0,unit:"px"}}},motionProps:{type:ControlType.Object,title:"Motion",controls:{autoSpeed:{type:ControlType.Number,title:"Auto Spin",min:0,max:40,step:.5,defaultValue:4,description:"Idle rotation, degrees per second"},rocking:{type:ControlType.Number,title:"Rocking",min:0,max:2,step:.05,defaultValue:1,description:"Boat-like sway following the mouse"}}}});
export const __FramerMetadata__ = {"exports":{"Props":{"type":"tsType","annotations":{"framerContractVersion":"1"}},"CarouselImage":{"type":"tsType","annotations":{"framerContractVersion":"1"}},"StyleProps":{"type":"tsType","annotations":{"framerContractVersion":"1"}},"CameraProps":{"type":"tsType","annotations":{"framerContractVersion":"1"}},"MotionProps":{"type":"tsType","annotations":{"framerContractVersion":"1"}},"default":{"type":"reactComponent","name":"OrbitCarousel","slots":[],"annotations":{"framerContractVersion":"1","framerIntrinsicWidth":"1200","framerSupportedLayoutWidth":"fixed","framerIntrinsicHeight":"720","framerSupportedLayoutHeight":"fixed"}},"__FramerMetadata__":{"type":"variable"}}}
//# sourceMappingURL=./Orbit_Carousel_3D.map