'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { getPressState, subscribePress, type PressState } from './press-store';

// ---------------------------------------------------------------------------
// THE PRESS — a single anchored block that morphs between four nav-triggered
// states (Craft -> Dye -> Weave -> Drape). Lives inside this file's existing
// scene/renderer/loop rather than a second canvas, so it shares one GL
// context with the cloth backdrop and is never unmounted between clicks.
// ---------------------------------------------------------------------------

const BLOCK_VERT = /* glsl */ `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const BLOCK_FRAG = /* glsl */ `
  uniform vec3 uRim;
  uniform vec3 uBase;
  uniform float uOpacity;
  varying vec3 vNormal;
  void main() {
    float fresnel = pow(1.0 - max(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0)), 0.0), 2.2);
    vec3 col = mix(uBase, uRim, fresnel);
    gl_FragColor = vec4(col, uOpacity);
  }
`;

const VERT = /* glsl */ `
  uniform float uTime;
  uniform vec2  uMouse;
  varying float vWave;
  varying vec2  vUv;

  void main() {
    vUv = uv;
    vec3 p = position;

    // layered cloth waves
    float w  = sin(p.x * 1.6 + uTime * 0.9) * 0.42;
          w += sin(p.y * 2.1 - uTime * 0.7) * 0.30;
          w += sin((p.x + p.y) * 1.1 + uTime * 0.5) * 0.22;

    // mouse lifts the fabric
    float d = distance(vec2(p.x, p.y), uMouse * 3.2);
    w += exp(-d * d * 0.28) * 0.85;

    p.z += w;
    vWave = w;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const FRAG = /* glsl */ `
  uniform vec3  uDark;
  uniform vec3  uLight;
  uniform float uTime;
  varying float vWave;
  varying vec2  vUv;

  void main() {
    float t = clamp(vWave * 0.55 + 0.5, 0.0, 1.0);

    // weave lines running through the cloth
    float weave = smoothstep(0.42, 0.5, abs(fract(vUv.y * 190.0) - 0.5))
                * smoothstep(0.42, 0.5, abs(fract(vUv.x * 190.0) - 0.5));

    vec3 col = mix(uDark, uLight, t * 0.85 + weave * 0.28);

    // slow shimmer sweep
    float sweep = smoothstep(0.0, 0.10, abs(fract(vUv.y - uTime * 0.06) - 0.5));
    col += uLight * (1.0 - sweep) * 0.10;

    float edge = smoothstep(0.0, 0.30, vUv.x) * smoothstep(1.0, 0.70, vUv.x)
               * smoothstep(0.0, 0.22, vUv.y) * smoothstep(1.0, 0.78, vUv.y);

    gl_FragColor = vec4(col, edge);
  }
`;

export default function Hero3D({
  dark = '#332B2B',
  light = '#D6432F',
  className,
}: { dark?: string; light?: string; className?: string }) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      return; // no WebGL -> CSS fallback stays visible
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 100);
    camera.position.set(0, 0, 6.4);

    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.setClearColor(0x000000, 0);
    host.appendChild(renderer.domElement);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';

    const uniforms = {
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uDark: { value: new THREE.Color(dark) },
      uLight: { value: new THREE.Color(light) },
    };

    // --- cloth
    const cloth = new THREE.Mesh(
      new THREE.PlaneGeometry(9, 6.4, 190, 140),
      new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        uniforms,
        transparent: true,
        wireframe: true,
      }),
    );
    cloth.rotation.x = -0.42;
    scene.add(cloth);

    // --- drifting motes
    const N = 420;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 12;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 8;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 5;
    }
    const motesGeo = new THREE.BufferGeometry();
    motesGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const motes = new THREE.Points(
      motesGeo,
      new THREE.PointsMaterial({
        color: new THREE.Color(light),
        size: 0.035,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
      }),
    );
    scene.add(motes);

    // --- THE PRESS: teak block, rim-lit, one mesh/material, never remounted
    const pressGroup = new THREE.Group();
    // x pushed out to 3.3 (was 2.15) — at that x it was sitting directly on
    // top of the "See the craft" button and clipping the subtitle text.
    // pressGroup.position.y is reassigned every frame in the render loop
    // below (base -0.25 plus a breathing dip), so only x/z are fixed here.
    pressGroup.position.set(3.3, -0.25, 0.6);
    scene.add(pressGroup);

    const blockUniforms = {
      uRim: { value: new THREE.Color('#D4222A') },
      uBase: { value: new THREE.Color('#332B2B') },
      uOpacity: { value: 1 },
    };
    const block = new THREE.Mesh(
      new THREE.BoxGeometry(1.05, 0.34, 1.05),
      new THREE.ShaderMaterial({
        vertexShader: BLOCK_VERT,
        fragmentShader: BLOCK_FRAG,
        uniforms: blockUniforms,
        transparent: true,
      }),
    );
    pressGroup.add(block);

    // ink-flash — full-bleed plane behind the block, opacity-only pulse on stamp contact
    const inkFlash = new THREE.Mesh(
      new THREE.PlaneGeometry(16, 12),
      new THREE.MeshBasicMaterial({ color: new THREE.Color('#D6432F'), transparent: true, opacity: 0, depthWrite: false }),
    );
    inkFlash.position.set(0, 0, -2.5);
    scene.add(inkFlash);

    // drape cloth — separate mesh from the main backdrop cloth, cross-fades
    // in as the block lifts off-frame at Weave -> Drape (no block-to-saree
    // vertex morph, which is where a shared-topology morph target breaks).
    const drapeUniforms = {
      uTime: { value: 0 },
      uDark: { value: new THREE.Color('#332B2B') },
      uLight: { value: new THREE.Color('#D6432F') },
      uOpacity: { value: 0 },
    };
    const drape = new THREE.Mesh(
      new THREE.PlaneGeometry(1.7, 1.9, 40, 44),
      new THREE.ShaderMaterial({
        vertexShader: /* glsl */ `
          uniform float uTime;
          varying float vWave;
          void main() {
            vec3 p = position;
            float w = sin(p.x * 3.2 + uTime * 0.6) * 0.07 + sin(p.y * 2.4 + uTime * 0.4) * 0.05;
            p.z += w;
            vWave = w;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uDark;
          uniform vec3 uLight;
          uniform float uOpacity;
          varying float vWave;
          void main() {
            float t = clamp(vWave * 3.0 + 0.5, 0.0, 1.0);
            gl_FragColor = vec4(mix(uDark, uLight, t), uOpacity);
          }
        `,
        uniforms: drapeUniforms,
        transparent: true,
      }),
    );
    drape.position.copy(pressGroup.position);
    scene.add(drape);

    // --- press state: click-driven spring, sampled every frame (no restart)
    // State values interpolate continuously while the block moves, so these
    // are numbers rather than the discrete PressState union.
    let fromState: number = getPressState();
    let toState: number = fromState;
    let morphStart = performance.now();
    let bumpStart = -Infinity;
    let flashStart = -Infinity;
    const unsubscribe = subscribePress((next) => {
      fromState = pressLerpState;
      toState = next;
      morphStart = performance.now();
      bumpStart = performance.now();
      if (next === 2) flashStart = performance.now();
    });
    let pressLerpState = fromState as number;

    // --- sizing (no ResizeObserver: measure the host directly)
    const resize = () => {
      const w = host.clientWidth || window.innerWidth;
      const h = host.clientHeight || window.innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    window.addEventListener('resize', resize);

    const target = new THREE.Vector2(0, 0);
    const onMove = (e: MouseEvent) => {
      const r = host.getBoundingClientRect();
      target.set(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1));
    };
    window.addEventListener('mousemove', onMove);

    // per-state pose: [tiltX(rad), dipY, liftZ, blockOpacity, drapeOpacity]
    const POSES: [number, number, number, number, number][] = [
      [0, 0, 0, 1, 0], // Craft — flat teak block
      [-0.14, -0.12, 0, 1, 0], // Dye — tilts 8deg-ish, dips
      [-0.14, -0.28, 0.05, 1, 0.15], // Weave — stamps down (ink-flash fires here)
      [-0.14, 0.55, -0.6, 0, 1], // Drape — block lifts off-frame, cloth takes over
    ];
    const clock = new THREE.Clock();
    let raf = 0;
    const loop = () => {
      const now = performance.now();
      const t = clock.getElapsedTime();
      uniforms.uTime.value = t;
      uniforms.uMouse.value.lerp(target, 0.05);

      cloth.rotation.z = Math.sin(t * 0.14) * 0.05;
      motes.rotation.y = t * 0.02;
      motes.position.y = Math.sin(t * 0.25) * 0.25;

      // ---- THE PRESS morph, sampled from spring-eased state (no restart) ----
      const morphElapsed = now - Math.max(morphStart, bumpStart - 0);
      const morphP = Math.min(1, (now - morphStart) / 900);
      const easedMorph = 1 - Math.pow(1 - morphP, 3); // cubic ease-out (0.16,1,0.3,1)-ish
      pressLerpState = fromState + (toState - fromState) * easedMorph;

      const lo = POSES[Math.max(0, Math.min(3, Math.floor(pressLerpState)))];
      const hiIdx = Math.max(0, Math.min(3, Math.ceil(pressLerpState)));
      const hi = POSES[hiIdx];
      const f = pressLerpState - Math.floor(pressLerpState);
      const tiltX = lo[0] + (hi[0] - lo[0]) * f;
      const dipY = lo[1] + (hi[1] - lo[1]) * f;
      const liftZ = lo[2] + (hi[2] - lo[2]) * f;
      const blockOpacity = lo[3] + (hi[3] - lo[3]) * f;
      const drapeOpacity = lo[4] + (hi[4] - lo[4]) * f;

      // phase-1 press bump: quick Z-drop that springs back (~140ms drop, decays by ~340ms)
      const bumpElapsed = now - bumpStart;
      const bump = bumpElapsed >= 0 ? -0.4 * Math.exp(-bumpElapsed / 90) : 0;

      pressGroup.rotation.x = tiltX;
      pressGroup.position.y = -0.25 + dipY;
      pressGroup.position.z = 0.6 + liftZ + bump;
      pressGroup.rotation.z = Math.sin(t * 1.0) * (morphElapsed > 1200 ? 0.026 : 0); // idle breathing, resumes ~1.2s after interaction
      block.material && (blockUniforms.uOpacity.value = blockOpacity);

      // ink-flash: decays to 0 over 300ms from the stamp contact frame
      const flashElapsed = now - flashStart;
      (inkFlash.material as THREE.MeshBasicMaterial).opacity =
        flashElapsed >= 0 && flashElapsed < 300 ? 0.4 * (1 - flashElapsed / 300) : 0;

      drapeUniforms.uTime.value = t;
      drapeUniforms.uOpacity.value = drapeOpacity * 0.9;
      drape.position.x = pressGroup.position.x;
      drape.position.y = pressGroup.position.y + 0.3;
      drape.position.z = pressGroup.position.z - 0.2;

      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
      unsubscribe();
      cloth.geometry.dispose();
      (cloth.material as THREE.Material).dispose();
      motesGeo.dispose();
      (motes.material as THREE.Material).dispose();
      block.geometry.dispose();
      (block.material as THREE.Material).dispose();
      inkFlash.geometry.dispose();
      (inkFlash.material as THREE.Material).dispose();
      drape.geometry.dispose();
      (drape.material as THREE.Material).dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === host) host.removeChild(renderer.domElement);
    };
  }, [dark, light]);

  return <div ref={hostRef} className={className} aria-hidden />;
}
