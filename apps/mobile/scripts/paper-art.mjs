// Shared drawing kit for Wandro's cut-paper artwork (trip scenes, category covers): flat shapes
// with paper-coloured gaps between them, wobbly hand-cut edges and a little print grain.
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

export const C = {
  paper: '#F6EBD5',
  card: '#FBF4E4',
  orange: '#E4572E',
  coral: '#EE8C7E',
  pink: '#F2B5B0',
  lilac: '#A88BC7',
  cobalt: '#2F5C9C',
  navy: '#1F3F73',
  sky: '#9CC7E0',
  teal: '#3E8E8A',
  ochre: '#E9A93B',
  mustard: '#F2C14E',
  olive: '#6B8E3D',
  forest: '#2F5D3A',
  brown: '#6B3B2A',
  terra: '#C8553D',
  brick: '#B0443A',
};

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
/** Mix a colour towards white (t > 0) or black (t < 0). */
export const shade = (h, t) =>
  '#' +
  hex(h)
    .map((v) => Math.round(t > 0 ? v + (255 - v) * t : v * (1 + t)))
    .map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0'))
    .join('');
/** Five tones of one colour, lightest to darkest. */
export const tones = (base) => ({
  xl: shade(base, 0.72),
  l: shade(base, 0.45),
  m: shade(base, 0.2),
  b: base,
  d: shade(base, -0.3),
  dd: shade(base, -0.55),
});

const css = `.a path,.a rect,.a circle,.a ellipse,.a polygon{stroke:${C.paper};stroke-width:6;stroke-linejoin:round}
.a .t{stroke-width:3}.a .ns{stroke:none}.a .ln{fill:none;stroke-linecap:round;stroke-linejoin:round}`;
export const ln = (d, color, w) =>
  `<path d="${d}" class="ln" style="stroke:${color};stroke-width:${w}"/>`;
export const blob = (d, fill) => `<path fill="${fill}" d="${d}"/>`;
export const range = (n) => Array.from({ length: n }, (_, i) => i);

/** Wobbly cut edges plus a little print grain, kept inside the shapes so cut-outs stay transparent. */
const paperFilter = `
  <filter id="paper" x="-4%" y="-4%" width="108%" height="108%">
    <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="4" result="w"/>
    <feDisplacementMap in="SourceGraphic" in2="w" scale="5" result="d"/>
    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" seed="9" result="n"/>
    <feColorMatrix in="n" values="0 0 0 0 0.35 0 0 0 0 0.25 0 0 0 0 0.15 0.55 0 0 0 -0.2" result="g"/>
    <feComposite in="g" in2="d" operator="in" result="gg"/>
    <feMerge><feMergeNode in="d"/><feMergeNode in="gg"/></feMerge>
  </filter>`;
export const svg = (w, h, body, bg = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
    <defs><style>${css}</style>${paperFilter}</defs>
    ${bg ? `<rect width="${w}" height="${h}" fill="${bg}"/>` : ''}
    <g class="a" filter="url(#paper)">${body}</g></svg>`;

/** Renders [file, svg, width, height] entries to WebP in `out`, at `scale` times their size. */
export async function renderWebp(pages, out, scale = 1.6) {
  mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
  const page = await browser.newPage({ deviceScaleFactor: scale });
  for (const [file, s, w, h] of pages) {
    await page.setViewportSize({ width: w, height: h });
    await page.setContent(`<html><body style="margin:0;background:transparent">${s}</body></html>`);
    const png = await page.locator('svg').screenshot({ omitBackground: true });
    // Chromium's canvas encodes WebP, so the art ships small without an image library.
    const webp = await page.evaluate(async (b64) => {
      const img = new Image();
      img.src = `data:image/png;base64,${b64}`;
      await img.decode();
      const canvas = Object.assign(document.createElement('canvas'), {
        width: img.width,
        height: img.height,
      });
      canvas.getContext('2d').drawImage(img, 0, 0);
      return canvas.toDataURL('image/webp', 0.82).split(',')[1];
    }, png.toString('base64'));
    writeFileSync(`${out}/${file}`, Buffer.from(webp, 'base64'));
  }
  await browser.close();
}
