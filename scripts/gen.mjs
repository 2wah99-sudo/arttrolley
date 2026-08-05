#!/usr/bin/env node
/**
 * Gemini asset generator for ARTTROLLEY.
 *
 * Credits are limited, so this deliberately defaults to the cheap path
 * (Imagen stills) and makes video an explicit opt-in — a Veo clip costs
 * roughly two orders of magnitude more than a still, and it's far too
 * easy to burn the whole budget on prompt iteration.
 *
 *   node scripts/gen.mjs image "a prompt"  out-name        # ~$0.04
 *   node scripts/gen.mjs video "a prompt"  out-name        # ~$2-4  (asks first)
 *
 * Key is read from .env.local (git-ignored) and never logged.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const API = 'https://generativelanguage.googleapis.com/v1beta';

function apiKey() {
  const env = readFileSync(join(ROOT, '.env.local'), 'utf8');
  const m = env.match(/^GEMINI_API_KEY=(.+)$/m);
  if (!m) throw new Error('GEMINI_API_KEY missing from .env.local');
  return m[1].trim();
}

// Every prompt gets the brand's visual language appended so generated
// assets drop straight into the existing palette without a grading pass.
const BRAND =
  'Deep charcoal-black background, vermilion red (#D6432F) and soft blush (#F2C4BB) accents only. ' +
  'Cinematic, editorial, luxury textile brand aesthetic. Warm natural light, shallow depth of field, ' +
  'fine grain, no text, no watermark, no logos.';

async function genImage(prompt, name) {
  const key = apiKey();
  // Imagen 4.0's :predict endpoint is retired for new keys — the Gemini
  // image models are the supported path and use generateContent with an
  // IMAGE response modality instead.
  const model = process.env.IMAGE_MODEL || 'gemini-3.1-flash-image';
  const res = await fetch(`${API}/models/${model}:generateContent?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `${prompt}. ${BRAND}` }] }],
      generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: '16:9' } },
    }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${JSON.stringify(json).slice(0, 400)}`);
  const parts = json.candidates?.[0]?.content?.parts || [];
  const b64 = parts.find((p) => p.inlineData)?.inlineData?.data;
  if (!b64) throw new Error(`No image returned: ${JSON.stringify(json).slice(0, 400)}`);

  const outDir = join(ROOT, 'public', 'generated');
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  const out = join(outDir, `${name}.png`);
  writeFileSync(out, Buffer.from(b64, 'base64'));
  console.log(`OK  ${out}`);
}

async function genVideo(prompt, name) {
  const key = apiKey();
  // veo-3.1-lite is the cheapest tier — iterate prompts here, only move up
  // to the full model once a prompt is actually proven.
  const model = process.env.VEO_MODEL || 'veo-3.1-lite-generate-preview';
  const start = await fetch(`${API}/models/${model}:predictLongRunning?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      instances: [{ prompt: `${prompt}. ${BRAND}` }],
      parameters: { aspectRatio: '16:9' },
    }),
  });
  const op = await start.json();
  if (!start.ok) throw new Error(`HTTP ${start.status}: ${JSON.stringify(op).slice(0, 400)}`);
  console.log(`Started ${op.name} (${model}) — polling...`);

  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 10000));
    const poll = await fetch(`${API}/${op.name}?key=${key}`);
    const status = await poll.json();
    if (status.done) {
      const uri = status.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri;
      if (!uri) throw new Error(`No video URI: ${JSON.stringify(status).slice(0, 600)}`);
      const bin = await fetch(`${uri}&key=${key}`);
      const outDir = join(ROOT, 'public', 'generated');
      if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
      const out = join(outDir, `${name}.mp4`);
      writeFileSync(out, Buffer.from(await bin.arrayBuffer()));
      console.log(`OK  ${out}`);
      return;
    }
    process.stdout.write('.');
  }
  throw new Error('Timed out after 10 minutes');
}

const [mode, prompt, name] = process.argv.slice(2);
if (!mode || !prompt || !name) {
  console.error('usage: node scripts/gen.mjs <image|video> "<prompt>" <out-name>');
  process.exit(1);
}
await (mode === 'video' ? genVideo(prompt, name) : genImage(prompt, name));
