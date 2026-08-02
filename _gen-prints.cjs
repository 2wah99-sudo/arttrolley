const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const OUT = 'C:/Users/Hello/Downloads/arttrolley-app/public/prints';
fs.mkdirSync(OUT, { recursive: true });

const BLACK = '#000000';
const RED = '#da1a32';
const WHITE = '#FFFFFF';
const EMBERS = '#a00c30';

const flower = (cx, cy, r, fill, stroke) => {
  let p = '';
  for (let i = 0; i < 8; i++) {
    const a = (Math.PI / 4) * i;
    const px = cx + Math.cos(a) * r * 0.62;
    const py = cy + Math.sin(a) * r * 0.62;
    p += `<ellipse cx="${px.toFixed(2)}" cy="${py.toFixed(2)}" rx="${(r * 0.34).toFixed(2)}" ry="${(r * 0.2).toFixed(2)}"
          transform="rotate(${((a * 180) / Math.PI).toFixed(1)} ${px.toFixed(2)} ${py.toFixed(2)})"
          fill="${fill}" opacity=".92"/>`;
  }
  p += `<circle cx="${cx}" cy="${cy}" r="${(r * 0.26).toFixed(2)}" fill="${stroke}"/>`;
  return p;
};

const paisley = (cx, cy, s, fill, stroke) => `
  <g transform="translate(${cx} ${cy}) scale(${s / 100})">
    <path d="M0,-46 C26,-40 40,-16 34,6 C28,30 6,44 -10,40 C-28,35 -34,14 -24,0 C-16,-11 -2,-10 2,-1 C5,6 0,13 -6,12"
          fill="${fill}" stroke="${stroke}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M6,-30 C20,-24 27,-8 23,6 C19,22 6,30 -3,27" fill="none" stroke="${stroke}" stroke-width="2.4" opacity=".75"/>
    <circle cx="4" cy="-12" r="3.4" fill="${stroke}"/>
    <circle cx="12" cy="2" r="2.8" fill="${stroke}"/>
  </g>`;

const star8 = (cx, cy, r, fill, stroke) => {
  const pts = [];
  for (let i = 0; i < 16; i++) {
    const a = (Math.PI / 8) * i - Math.PI / 2;
    const rr = i % 2 ? r * 0.46 : r;
    pts.push(`${(cx + Math.cos(a) * rr).toFixed(2)},${(cy + Math.sin(a) * rr).toFixed(2)}`);
  }
  return `<polygon points="${pts.join(' ')}" fill="${fill}" stroke="${stroke}" stroke-width="2"/><circle cx="${cx}" cy="${cy}" r="${(r * 0.2).toFixed(2)}" fill="${stroke}"/>`;
};

const W = 640, H = 860;

function frame(ground, inner) {
  return `<rect width="${W}" height="${H}" fill="${ground}"/>${inner}`;
}

function butiField(ground, ink, accent, step = 92, motif = 'flower') {
  let s = '';
  for (let y = step * 0.5, row = 0; y < H + step; y += step, row++) {
    for (let x = step * 0.5 + (row % 2 ? step / 2 : 0); x < W + step; x += step) {
      const r = step * 0.3;
      if (motif === 'flower') s += flower(x, y, r, ink, accent);
      else if (motif === 'paisley') s += paisley(x, y, step * 0.82, ink, accent);
      else if (motif === 'star') s += star8(x, y, r, ink, accent);
    }
  }
  return frame(ground, s);
}

const PALETTES = [
  { g: BLACK, i: RED, a: WHITE },
  { g: RED, i: BLACK, a: WHITE },
  { g: WHITE, i: BLACK, a: RED },
  { g: BLACK, i: EMBERS, a: RED },
  { g: RED, i: WHITE, a: EMBERS },
];

const SPECS = [
  ['saree-ajrakh', (p) => butiField(p.g, p.i, p.a, 96, 'star')],
  ['kurti-bagru', (p) => butiField(p.g, p.i, p.a, 88, 'flower')],
  ['dupatta-buta', (p) => butiField(p.g, p.i, p.a, 132, 'paisley')],
];

(async () => {
  const made = [];
  for (const [name, fn] of SPECS) {
    for (let pi = 0; pi < PALETTES.length; pi++) {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${fn(PALETTES[pi])}</svg>`;
      const file = `${name}-${pi + 1}.jpg`;
      await sharp(Buffer.from(svg)).jpeg({ quality: 86 }).toFile(path.join(OUT, file));
      made.push(`/prints/${file}`);
    }
  }
  fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(made, null, 2));
  console.log(`✓ generated ${made.length} prints`);
})().catch(e => { console.error(e); process.exit(1); });
