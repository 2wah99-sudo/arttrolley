'use client';

import { useEffect, useRef, useState } from 'react';

type Frame = { kind: 'bitmap'; img: ImageBitmap } | { kind: 'element'; img: HTMLImageElement; url: string };

async function decodeBlob(blob: Blob): Promise<Frame> {
  try {
    const img = await createImageBitmap(blob);
    return { kind: 'bitmap', img };
  } catch {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.decoding = 'async';
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('img decode failed'));
      img.src = url;
    });
    return { kind: 'element', img, url };
  }
}

function releaseFrame(f: Frame) {
  if (f.kind === 'bitmap') f.img.close();
  else URL.revokeObjectURL(f.url);
}

export function useFrameSequence(name: string) {
  const blobs = useRef<(Blob | null)[]>([]);
  const frames = useRef<Map<number, Frame>>(new Map());
  const decoding = useRef<Set<number>>(new Set());
  const countRef = useRef(0);
  const lastProgress = useRef(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const m = await fetch(`frames/${name}/manifest.json`).then((r) => r.json());
      if (!alive) return;
      countRef.current = m.count;
      blobs.current = new Array(m.count).fill(null);
      const url = (i: number) => m.pattern.replace('%03d', String(i + 1).padStart(3, '0'));

      await Promise.all(
        Array.from({ length: m.count }, async (_, i) => {
          try {
            const b = await fetch(url(i)).then((r) => r.blob());
            if (alive) blobs.current[i] = b;
          } catch {}
        }),
      );
      if (!alive) return;
      if (blobs.current[0]) {
        try {
          const f = await decodeBlob(blobs.current[0]);
          if (!alive) return releaseFrame(f);
          frames.current.set(0, f);
        } catch {}
      }
      setReady(true);
    })();
    return () => {
      alive = false;
      frames.current.forEach(releaseFrame);
      frames.current.clear();
    };
  }, [name]);

  function decode(i: number) {
    if (frames.current.has(i) || decoding.current.has(i) || !blobs.current[i]) return;
    decoding.current.add(i);
    decodeBlob(blobs.current[i]!)
      .then((f) => frames.current.set(i, f))
      .catch(() => {})
      .finally(() => decoding.current.delete(i));
  }

  function manageWindow(center: number) {
    const AHEAD = 16;
    const KEEP = 32;
    for (let d = 0; d <= AHEAD; d++) {
      const a = center + d;
      const b = center - d;
      if (a < countRef.current) decode(a);
      if (b >= 0) decode(b);
    }
    if (frames.current.size > KEEP * 2) {
      for (const [idx, f] of frames.current) {
        if (Math.abs(idx - center) > KEEP) {
          releaseFrame(f);
          frames.current.delete(idx);
        }
      }
    }
  }

  function nearestDecoded(i: number): Frame | null {
    if (frames.current.has(i)) return frames.current.get(i)!;
    for (let d = 1; d < countRef.current; d++) {
      if (frames.current.has(i - d)) return frames.current.get(i - d)!;
      if (frames.current.has(i + d)) return frames.current.get(i + d)!;
    }
    return null;
  }

  function draw(canvas: HTMLCanvasElement | null, progress: number) {
    if (!canvas || countRef.current === 0) return;
    lastProgress.current = progress;
    const i = Math.round(Math.min(1, Math.max(0, progress)) * (countRef.current - 1));
    manageWindow(i);
    const frame = nearestDecoded(i);
    if (!frame) return;
    const src = frame.img;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cw = Math.round(canvas.clientWidth * dpr);
    const ch = Math.round(canvas.clientHeight * dpr);
    if (canvas.width !== cw || canvas.height !== ch) {
      canvas.width = cw;
      canvas.height = ch;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, cw, ch);
    const s = Math.min(cw / src.width, ch / src.height);
    const w = src.width * s;
    const h = src.height * s;
    ctx.drawImage(src, (cw - w) / 2, (ch - h) / 2, w, h);
  }

  return { ready, draw, lastProgress };
}
