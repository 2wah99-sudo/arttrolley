'use client';

import { useEffect, useRef } from 'react';

export type RenderMode =
  | 'characters' | 'dither' | 'mosaic' | 'pixel' | 'dots' | 'cross' | 'diamond'
  | 'voxel' | 'lego' | 'mixed' | 'lines' | 'diagonal' | 'braille' | 'disco'
  | 'hexdump' | 'matrix' | 'rings' | 'hearts' | 'stars' | 'hexagons'
  | 'triangles' | 'bubbles' | 'hatch' | 'contour' | 'halfblocks';

type Fx = { enabled: boolean; intensity: number };

export interface AsciiEffectProps {
  src: string;
  renderMode?: RenderMode;
  bgMode?: 'blur' | 'color' | 'photo' | 'none';
  bgColor?: string;
  bgBlur?: number;
  bgOpacity?: number;
  cellSize?: number;
  coverage?: number;
  invert?: boolean;
  styleBlend?: GlobalCompositeOperation;
  charSet?: 'standard' | 'blocks' | 'binary' | 'hex' | 'minimal';
  customChars?: string;
  brightness?: number;
  contrast?: number;
  edgeEmphasis?: number;
  density?: number;
  tint?: string;
  tintOpacity?: number;
  overlayBlend?: GlobalCompositeOperation;
  saturation?: number;
  grayscale?: number;
  blurType?: 'off' | 'gaussian';
  blurAmount?: number;
  pfx?: Partial<Record<
    'vignette' | 'scanLines' | 'chromatic' | 'bloom' | 'filmGrain' |
    'glitch' | 'pixelate' | 'halftone' | 'filmDust', Fx>>;
  animated?: boolean;
  animStyle?: 'wave' | 'pulse' | 'shimmer' | 'ripple' | 'flicker';
  animSpeed?: Fx;
  animIntensity?: Fx;
  /** Map luminance across two brand colours: [shadow, highlight]. Overrides tint. */
  duotone?: [string, string];
  lights?: { enabled: boolean; points: { x: number; y: number; radius: number; intensity: number }[] };
  mask?: { enabled: boolean; dataUrl: string | null; invert?: boolean };
  className?: string;
}

const CHAR_SETS: Record<string, string> = {
  standard: '@%#*+=-:. ',
  blocks: '█▓▒░ ',
  binary: '10 ',
  hex: '0123456789ABCDEF',
  minimal: '#. ',
};

const lum = (r: number, g: number, b: number) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

function hexRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const v = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
}

/** Draws one cell's primitive for the given render mode. */
function drawCell(
  ctx: CanvasRenderingContext2D,
  mode: RenderMode,
  x: number, y: number, s: number,
  r: number, g: number, b: number,
  L: number, chars: string, seed: number,
) {
  const col = `rgb(${r | 0},${g | 0},${b | 0})`;
  ctx.fillStyle = col;
  ctx.strokeStyle = col;
  const cx = x + s / 2, cy = y + s / 2;
  const lighten = (k: number) => `rgb(${Math.min(255, r * k) | 0},${Math.min(255, g * k) | 0},${Math.min(255, b * k) | 0})`;

  switch (mode) {
    case 'lego': {
      ctx.fillRect(x, y, s, s);
      ctx.fillStyle = lighten(1.18);
      ctx.fillRect(x, y, s, Math.max(1, s * 0.14));
      ctx.fillRect(x, y, Math.max(1, s * 0.14), s);
      ctx.fillStyle = lighten(0.75);
      ctx.fillRect(x, y + s - Math.max(1, s * 0.14), s, Math.max(1, s * 0.14));
      ctx.fillRect(x + s - Math.max(1, s * 0.14), y, Math.max(1, s * 0.14), s);
      ctx.fillStyle = lighten(1.32);
      ctx.beginPath();
      ctx.arc(cx, cy, Math.max(0.6, s * 0.28), 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'voxel': {
      const d = s * 0.28;
      ctx.fillRect(x, y + d, s - d, s - d);
      ctx.fillStyle = lighten(1.25);
      ctx.beginPath();
      ctx.moveTo(x, y + d); ctx.lineTo(x + d, y);
      ctx.lineTo(x + s, y); ctx.lineTo(x + s - d, y + d);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = lighten(0.7);
      ctx.beginPath();
      ctx.moveTo(x + s - d, y + d); ctx.lineTo(x + s, y);
      ctx.lineTo(x + s, y + s - d); ctx.lineTo(x + s - d, y + s);
      ctx.closePath(); ctx.fill();
      break;
    }
    case 'pixel':
    case 'mosaic':
      ctx.fillRect(x, y, s, s);
      break;
    case 'dither': {
      const m = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
      const step = Math.max(1, s / 4);
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
        if (L * 16 > m[j][i]) ctx.fillRect(x + i * step, y + j * step, step, step);
      }
      break;
    }
    case 'dots':
    case 'bubbles': {
      ctx.beginPath();
      ctx.arc(cx, cy, (s / 2) * (mode === 'bubbles' ? 0.95 : 1) * Math.max(0.08, L), 0, Math.PI * 2);
      if (mode === 'bubbles') { ctx.lineWidth = Math.max(0.5, s * 0.12); ctx.stroke(); } else ctx.fill();
      break;
    }
    case 'rings': {
      ctx.lineWidth = Math.max(0.5, s * 0.16);
      for (let k = 1; k <= 2; k++) {
        ctx.beginPath();
        ctx.arc(cx, cy, (s / 2) * L * (k / 2), 0, Math.PI * 2);
        ctx.stroke();
      }
      break;
    }
    case 'cross': {
      ctx.lineWidth = Math.max(0.5, s * 0.22 * Math.max(0.2, L));
      ctx.beginPath();
      ctx.moveTo(x, cy); ctx.lineTo(x + s, cy);
      ctx.moveTo(cx, y); ctx.lineTo(cx, y + s);
      ctx.stroke();
      break;
    }
    case 'diamond': {
      const h = (s / 2) * Math.max(0.15, L);
      ctx.beginPath();
      ctx.moveTo(cx, cy - h); ctx.lineTo(cx + h, cy);
      ctx.lineTo(cx, cy + h); ctx.lineTo(cx - h, cy);
      ctx.closePath(); ctx.fill();
      break;
    }
    case 'triangles': {
      ctx.beginPath();
      if ((seed & 1) === 0) { ctx.moveTo(x, y + s); ctx.lineTo(x + s, y + s); ctx.lineTo(x, y); }
      else { ctx.moveTo(x + s, y); ctx.lineTo(x + s, y + s); ctx.lineTo(x, y); }
      ctx.closePath(); ctx.fill();
      break;
    }
    case 'hexagons': {
      const R = (s / 2) * 1.05;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i - Math.PI / 6;
        const px = cx + R * Math.cos(a) * Math.max(0.2, L);
        const py = cy + R * Math.sin(a) * Math.max(0.2, L);
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.closePath(); ctx.fill();
      break;
    }
    case 'stars': {
      const R = (s / 2) * Math.max(0.2, L);
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = (Math.PI / 5) * i - Math.PI / 2;
        const rr = i % 2 ? R * 0.45 : R;
        const px = cx + rr * Math.cos(a), py = cy + rr * Math.sin(a);
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.closePath(); ctx.fill();
      break;
    }
    case 'hearts': {
      const k = (s / 2) * Math.max(0.2, L);
      ctx.beginPath();
      ctx.moveTo(cx, cy + k * 0.8);
      ctx.bezierCurveTo(cx + k * 1.4, cy - k * 0.4, cx + k * 0.5, cy - k * 1.2, cx, cy - k * 0.35);
      ctx.bezierCurveTo(cx - k * 0.5, cy - k * 1.2, cx - k * 1.4, cy - k * 0.4, cx, cy + k * 0.8);
      ctx.fill();
      break;
    }
    case 'lines':
    case 'diagonal':
    case 'hatch': {
      ctx.lineWidth = Math.max(0.5, s * 0.2 * Math.max(0.15, L));
      ctx.beginPath();
      if (mode === 'lines') { ctx.moveTo(x, cy); ctx.lineTo(x + s, cy); }
      else { ctx.moveTo(x, y + s); ctx.lineTo(x + s, y); }
      if (mode === 'hatch' && L > 0.5) { ctx.moveTo(x, y); ctx.lineTo(x + s, y + s); }
      ctx.stroke();
      break;
    }
    case 'contour': {
      const band = Math.abs((L * 6) % 1 - 0.5);
      if (band < 0.16) { ctx.lineWidth = Math.max(0.5, s * 0.2); ctx.beginPath(); ctx.arc(cx, cy, s * 0.42, 0, Math.PI * 2); ctx.stroke(); }
      break;
    }
    case 'halfblocks': {
      ctx.fillRect(x, y, s, s / 2);
      ctx.fillStyle = lighten(0.72);
      ctx.fillRect(x, y + s / 2, s, s / 2);
      break;
    }
    case 'braille': {
      const dr = Math.max(0.5, s * 0.13);
      for (let i = 0; i < 2; i++) for (let j = 0; j < 4; j++) {
        if (Math.random() < L) {
          ctx.beginPath();
          ctx.arc(x + s * (0.3 + i * 0.4), y + s * (0.15 + j * 0.24), dr, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      break;
    }
    case 'disco': {
      ctx.fillStyle = `hsl(${(seed * 37) % 360} 85% ${25 + L * 55}%)`;
      ctx.fillRect(x, y, s, s);
      break;
    }
    case 'matrix': {
      ctx.fillStyle = `rgb(0,${(80 + L * 175) | 0},${(40 + L * 60) | 0})`;
      ctx.font = `${s}px monospace`;
      ctx.textBaseline = 'top';
      ctx.fillText(String.fromCharCode(0x30a0 + (seed % 96)), x, y);
      break;
    }
    case 'hexdump': {
      ctx.font = `${s}px monospace`;
      ctx.textBaseline = 'top';
      ctx.fillText('0123456789ABCDEF'[Math.min(15, (L * 16) | 0)], x, y);
      break;
    }
    case 'mixed': {
      const pick: RenderMode[] = ['lego', 'dots', 'cross', 'diamond'];
      drawCell(ctx, pick[seed % pick.length], x, y, s, r, g, b, L, chars, seed);
      break;
    }
    case 'characters':
    default: {
      const idx = Math.min(chars.length - 1, Math.floor((1 - L) * (chars.length - 1)));
      ctx.font = `${s * (0.8 + L * 0.4)}px monospace`;
      ctx.textBaseline = 'top';
      ctx.fillText(chars[idx], x, y);
      break;
    }
  }
}

export default function AsciiEffect({
  src,
  renderMode = 'lego',
  bgMode = 'blur',
  bgColor = '#000000',
  bgBlur = 60,
  bgOpacity = 100,
  cellSize = 6,
  coverage = 100,
  invert = true,
  styleBlend = 'screen',
  charSet = 'standard',
  customChars = '',
  brightness = -14,
  contrast = 18,
  edgeEmphasis = 0,
  density = 0,
  tint = '#000000',
  tintOpacity = 0,
  overlayBlend = 'soft-light',
  saturation = 100,
  grayscale = 0,
  blurType = 'off',
  blurAmount = 3,
  pfx = {
    scanLines: { enabled: true, intensity: 70 },
    glitch: { enabled: true, intensity: 20 },
    halftone: { enabled: true, intensity: 10 },
  },
  animated = true,
  animStyle = 'flicker',
  animSpeed = { enabled: true, intensity: 100 },
  animIntensity = { enabled: true, intensity: 70 },
  duotone,
  lights = { enabled: false, points: [] },
  mask = { enabled: false, dataUrl: null },
  className,
}: AsciiEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let cancelled = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      if (cancelled) return;

      const W = img.naturalWidth, H = img.naturalHeight;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = W; canvas.height = H;
      canvas.style.width = '100%';
      canvas.style.height = 'auto';
      void dpr;

      const mk = () => {
        const c = document.createElement('canvas');
        c.width = W; c.height = H;
        return { c, x: c.getContext('2d')! };
      };

      // --- 1. background layer
      const bg = mk();
      if (bgMode === 'color') {
        bg.x.fillStyle = bgColor;
        bg.x.fillRect(0, 0, W, H);
      } else if (bgMode !== 'none') {
        bg.x.filter = bgMode === 'blur' ? `blur(${(bgBlur / 100) * 40}px)` : 'none';
        bg.x.drawImage(img, 0, 0, W, H);
        bg.x.filter = 'none';
      }

      // --- 2. sample the grid
      const src2 = mk();
      src2.x.drawImage(img, 0, 0, W, H);
      const data = src2.x.getImageData(0, 0, W, H).data;

      const cols = Math.ceil(W / cellSize), rows = Math.ceil(H / cellSize);
      const cellR = new Float32Array(cols * rows);
      const cellG = new Float32Array(cols * rows);
      const cellB = new Float32Array(cols * rows);
      const cellL = new Float32Array(cols * rows);

      for (let cy = 0; cy < rows; cy++) {
        for (let cx = 0; cx < cols; cx++) {
          let r = 0, g = 0, b = 0, n = 0;
          const yEnd = Math.min((cy + 1) * cellSize, H), xEnd = Math.min((cx + 1) * cellSize, W);
          for (let y = cy * cellSize; y < yEnd; y++) {
            for (let x = cx * cellSize; x < xEnd; x++) {
              const i = (y * W + x) * 4;
              r += data[i]; g += data[i + 1]; b += data[i + 2]; n++;
            }
          }
          const k = cy * cols + cx;
          if (!n) continue;
          r /= n; g /= n; b /= n;
          if (invert) { r = 255 - r; g = 255 - g; b = 255 - b; }
          cellR[k] = r; cellG[k] = g; cellB[k] = b;
          cellL[k] = lum(r, g, b) / 255;
        }
      }

      // --- 3. draw the cells
      const fx = mk();
      const chars = customChars || CHAR_SETS[charSet] || CHAR_SETS.standard;
      for (let cy = 0; cy < rows; cy++) {
        for (let cx = 0; cx < cols; cx++) {
          if (coverage < 100 && Math.random() * 100 > coverage) continue;
          const k = cy * cols + cx;
          let r = cellR[k], g = cellG[k], b = cellB[k];
          const L = cellL[k];

          if (edgeEmphasis > 0) {
            const rt = cx + 1 < cols ? cellL[k + 1] : L;
            const dn = cy + 1 < rows ? cellL[k + cols] : L;
            const e = (Math.abs(L - rt) + Math.abs(L - dn)) * (edgeEmphasis / 100) * 3;
            r = Math.min(255, r * (1 + e)); g = Math.min(255, g * (1 + e)); b = Math.min(255, b * (1 + e));
          }

          drawCell(fx.x, renderMode, cx * cellSize, cy * cellSize, cellSize, r, g, b, L, chars, cx * 7 + cy * 13);

          if (density > 0) {
            fx.x.fillStyle = `rgba(0,0,0,${(density / 100) * 0.5})`;
            fx.x.fillRect(cx * cellSize, cy * cellSize + cellSize - 1, cellSize, 1);
          }
        }
      }

      // --- 4. colour adjustments
      const adj = mk();
      adj.x.filter =
        `brightness(${100 + brightness}%) contrast(${100 + contrast}%) ` +
        `saturate(${saturation}%) grayscale(${grayscale}%)` +
        (blurType !== 'off' ? ` blur(${blurAmount}px)` : '');
      adj.x.drawImage(fx.c, 0, 0);
      adj.x.filter = 'none';

      // --- 5. composite over background, then tint
      const proc = mk();
      proc.x.globalAlpha = bgOpacity / 100;
      proc.x.drawImage(bg.c, 0, 0);
      proc.x.globalAlpha = 1;
      proc.x.globalCompositeOperation = styleBlend;
      proc.x.drawImage(adj.c, 0, 0);
      proc.x.globalCompositeOperation = 'source-over';

      if (duotone) {
        const [d, l] = [hexRgb(duotone[0]), hexRgb(duotone[1])];
        const id = proc.x.getImageData(0, 0, W, H);
        const px = id.data;
        for (let i = 0; i < px.length; i += 4) {
          const t = lum(px[i], px[i + 1], px[i + 2]) / 255;
          px[i] = d[0] + (l[0] - d[0]) * t;
          px[i + 1] = d[1] + (l[1] - d[1]) * t;
          px[i + 2] = d[2] + (l[2] - d[2]) * t;
        }
        proc.x.putImageData(id, 0, 0);
      }

      if (!duotone && tintOpacity > 0) {
        proc.x.globalCompositeOperation = overlayBlend;
        proc.x.globalAlpha = tintOpacity / 100;
        proc.x.fillStyle = tint;
        proc.x.fillRect(0, 0, W, H);
        proc.x.globalAlpha = 1;
        proc.x.globalCompositeOperation = 'source-over';
      }

      // --- 6. static post-effects
      const P = (k: keyof NonNullable<AsciiEffectProps['pfx']>) => pfx?.[k];

      if (P('bloom')?.enabled) {
        const a = P('bloom')!.intensity / 100;
        proc.x.globalCompositeOperation = 'lighter';
        proc.x.globalAlpha = a * 0.5;
        proc.x.filter = `blur(${6 + a * 14}px) brightness(140%)`;
        proc.x.drawImage(proc.c, 0, 0);
        proc.x.filter = 'none';
        proc.x.globalAlpha = 1;
        proc.x.globalCompositeOperation = 'source-over';
      }

      if (P('chromatic')?.enabled) {
        const d = (P('chromatic')!.intensity / 100) * 12;
        proc.x.globalCompositeOperation = 'lighten';
        proc.x.globalAlpha = 0.5;
        proc.x.drawImage(proc.c, -d, 0);
        proc.x.drawImage(proc.c, d, 0);
        proc.x.globalAlpha = 1;
        proc.x.globalCompositeOperation = 'source-over';
      }

      if (P('pixelate')?.enabled) {
        const px = Math.max(2, (P('pixelate')!.intensity / 100) * 24);
        const sw = Math.max(1, Math.round(W / px)), sh = Math.max(1, Math.round(H / px));
        const t = mk();
        t.x.imageSmoothingEnabled = false;
        t.x.drawImage(proc.c, 0, 0, sw, sh);
        proc.x.imageSmoothingEnabled = false;
        proc.x.clearRect(0, 0, W, H);
        proc.x.drawImage(t.c, 0, 0, sw, sh, 0, 0, W, H);
        proc.x.imageSmoothingEnabled = true;
      }

      if (P('halftone')?.enabled) {
        const a = P('halftone')!.intensity / 100;
        const step = 4;
        proc.x.fillStyle = `rgba(0,0,0,${a})`;
        for (let y = 0; y < H; y += step)
          for (let x = 0; x < W; x += step) {
            proc.x.beginPath();
            proc.x.arc(x + step / 2, y + step / 2, 1, 0, Math.PI * 2);
            proc.x.fill();
          }
      }

      if (P('scanLines')?.enabled) {
        const a = (P('scanLines')!.intensity / 100) * 0.5;
        proc.x.fillStyle = `rgba(0,0,0,${a})`;
        for (let y = 0; y < H; y += 2) proc.x.fillRect(0, y, W, 1);
      }

      if (P('filmGrain')?.enabled) {
        const a = P('filmGrain')!.intensity / 100;
        const id = proc.x.getImageData(0, 0, W, H);
        const d = id.data;
        for (let i = 0; i < d.length; i += 4) {
          const n = (Math.random() - 0.5) * 255 * a * 0.5;
          d[i] += n; d[i + 1] += n; d[i + 2] += n;
        }
        proc.x.putImageData(id, 0, 0);
      }

      if (P('filmDust')?.enabled) {
        const a = P('filmDust')!.intensity / 100;
        const count = Math.floor(a * 400);
        for (let i = 0; i < count; i++) {
          proc.x.fillStyle = `rgba(255,255,255,${Math.random() * a})`;
          proc.x.fillRect(Math.random() * W, Math.random() * H, 1, Math.random() * 6);
        }
      }

      if (P('vignette')?.enabled) {
        const a = P('vignette')!.intensity / 100;
        const grd = proc.x.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.25, W / 2, H / 2, Math.max(W, H) * 0.72);
        grd.addColorStop(0, 'rgba(0,0,0,0)');
        grd.addColorStop(1, `rgba(0,0,0,${a})`);
        proc.x.fillStyle = grd;
        proc.x.fillRect(0, 0, W, H);
      }

      // --- 7. lights
      if (lights?.enabled) {
        proc.x.globalCompositeOperation = 'lighter';
        for (const p of lights.points) {
          const grd = proc.x.createRadialGradient(p.x * W, p.y * H, 0, p.x * W, p.y * H, p.radius * Math.max(W, H));
          grd.addColorStop(0, `rgba(255,240,210,${p.intensity / 100})`);
          grd.addColorStop(1, 'rgba(255,240,210,0)');
          proc.x.fillStyle = grd;
          proc.x.fillRect(0, 0, W, H);
        }
        proc.x.globalCompositeOperation = 'source-over';
      }

      // --- 8. mask reveal back to the plain photo
      const paint = (m?: HTMLImageElement) => {
        if (!m) return;
        const t = mk();
        t.x.drawImage(img, 0, 0, W, H);
        t.x.globalCompositeOperation = mask.invert ? 'destination-out' : 'destination-in';
        t.x.drawImage(m, 0, 0, W, H);
        t.x.globalCompositeOperation = 'source-over';
        proc.x.drawImage(t.c, 0, 0);
      };
      if (mask?.enabled && mask.dataUrl) {
        const mi = new Image();
        mi.onload = () => paint(mi);
        mi.src = mask.dataUrl;
      }

      // --- 9. animate: cheap per-frame flicker + glitch over the baked layer
      const speed = (animSpeed?.enabled ? animSpeed.intensity : 0) / 100;
      const amt = (animIntensity?.enabled ? animIntensity.intensity : 0) / 100;
      const glitchFx = P('glitch');
      const t0 = performance.now();

      const frame = () => {
        const t = ((performance.now() - t0) / 1000) * (0.4 + speed * 2.2);

        ctx.clearRect(0, 0, W, H);
        ctx.drawImage(proc.c, 0, 0);

        if (animated && amt > 0) {
          let k = 0;
          switch (animStyle) {
            case 'pulse': k = (Math.sin(t * 2) * 0.5 + 0.5) * amt * 0.45; break;
            case 'wave': k = (Math.sin(t * 3) * 0.5 + 0.5) * amt * 0.3; break;
            case 'shimmer': k = Math.abs(Math.sin(t * 6)) * amt * 0.25; break;
            case 'ripple': k = Math.abs(Math.sin(t * 4)) * amt * 0.35; break;
            case 'flicker':
            default:
              k = (Math.random() * 0.55 + Math.sin(t * 24) * 0.2) * amt * 0.4;
              break;
          }
          if (k > 0) {
            ctx.globalCompositeOperation = 'lighter';
            ctx.fillStyle = `rgba(255,255,255,${Math.min(0.5, k)})`;
            ctx.fillRect(0, 0, W, H);
            ctx.globalCompositeOperation = 'source-over';
          }
        }

        if (glitchFx?.enabled) {
          const gi = glitchFx.intensity / 100;
          const bands = 2 + Math.floor(gi * 8);
          for (let i = 0; i < bands; i++) {
            if (Math.random() > 0.35) continue;
            const by = Math.random() * H;
            const bh = 2 + Math.random() * 14;
            const dx = (Math.random() - 0.5) * gi * 110;
            ctx.drawImage(proc.c, 0, by, W, bh, dx, by, W, bh);
          }
        }

        rafRef.current = requestAnimationFrame(frame);
      };

      if (animated || glitchFx?.enabled) frame();
      else { ctx.clearRect(0, 0, W, H); ctx.drawImage(proc.c, 0, 0); }
    };

    img.src = src;

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
    };
  }, [
    src, renderMode, bgMode, bgColor, bgBlur, bgOpacity, cellSize, coverage, invert,
    styleBlend, charSet, customChars, brightness, contrast, edgeEmphasis, density,
    tint, tintOpacity, overlayBlend, saturation, grayscale, blurType, blurAmount,
    pfx, animated, animStyle, animSpeed, animIntensity, lights, mask, duotone,
  ]);

  return <canvas ref={canvasRef} className={className} />;
}
