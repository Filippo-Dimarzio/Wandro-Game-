// Renders the explorer avatars (assets/explorers/*.png) and their kit badges from simple SVG
// drawings, and writes src/explorerArt.ts so the app can require them.
// These are placeholders in Wandro's ink-and-colour style, to be replaced by the illustrator's art
// (same file names). Needs Playwright's Chromium: node scripts/render-explorers.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const root = new URL('..', import.meta.url).pathname;
const SIZE = 192; // shown at up to 96 pt
const BADGE = 72;
const INK = '#2F3E7A';
const PAPER = '#FBF1E4';

// Outfit colours: the default jacket plus every "skin" in packages/shared/src/shop.ts.
const OUTFITS = {
  default: '#0E7C66',
  skin_ocean: '#2B6CB0',
  skin_coral: '#C05621',
  skin_midnight: '#2D3748',
  skin_gold: '#B7791F',
};

const stroke = `stroke="${INK}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"`;
const head = (skin, rx = 21, ry = 24, cy = 52) =>
  `<ellipse cx="39" cy="56" rx="4" ry="6" fill="${skin}" ${stroke}/>` +
  `<ellipse cx="81" cy="56" rx="4" ry="6" fill="${skin}" ${stroke}/>` +
  `<ellipse cx="60" cy="${cy}" rx="${rx}" ry="${ry}" fill="${skin}" ${stroke}/>`;
const face = (opts = {}) => {
  const eyes = `<circle cx="52" cy="54" r="2.4" fill="${INK}"/><circle cx="68" cy="54" r="2.4" fill="${INK}"/>`;
  const cheeks = `<circle cx="46.5" cy="62" r="3.6" fill="#E9806A" opacity="0.35"/><circle cx="73.5" cy="62" r="3.6" fill="#E9806A" opacity="0.35"/>`;
  const smile = `<path d="M53 64 Q60 70.5 67 64" fill="none" ${stroke}/>`;
  const glasses = opts.glasses
    ? `<circle cx="52" cy="54" r="6.5" fill="none" stroke="${INK}" stroke-width="2"/><circle cx="68" cy="54" r="6.5" fill="none" stroke="${INK}" stroke-width="2"/><path d="M58.5 54 L61.5 54" stroke="${INK}" stroke-width="2"/>`
    : '';
  return cheeks + eyes + glasses + smile;
};
const body = (outfit, skin) =>
  `<rect x="52" y="70" width="16" height="16" rx="5" fill="${skin}" ${stroke}/>` +
  `<path d="M12 122 C14 94 34 82 60 82 C86 82 106 94 108 122 Z" fill="${outfit}" ${stroke}/>` +
  `<path d="M50 83 L60 97 L70 83 Z" fill="#FFF8EE" ${stroke}/>`;

// Eight explorers: skin tone, hair and how they are drawn. Order matches EXPLORER_IDS.
const EXPLORERS = {
  // Long dark hair.
  e1: (o) => {
    const skin = '#C68863';
    const hair = '#2B1D16';
    return (
      `<path d="M34 50 C34 20 86 20 86 50 L88 90 C80 95 72 89 71 82 L49 82 C48 89 40 95 32 90 Z" fill="${hair}" ${stroke}/>` +
      body(o, skin) +
      head(skin) +
      `<path d="M38 50 C38 26 82 26 82 50 C74 38 50 34 38 50 Z" fill="${hair}" ${stroke}/>` +
      face()
    );
  },
  // Short curly hair.
  e2: (o) => {
    const skin = '#7A4A2E';
    const hair = '#1E1612';
    const curls = [
      [42, 36],
      [50, 30],
      [60, 28],
      [70, 30],
      [78, 36],
      [40, 44],
      [80, 44],
      [55, 34],
      [66, 33],
    ]
      .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7" fill="${hair}" ${stroke}/>`)
      .join('');
    return body(o, skin) + head(skin) + curls + face();
  },
  // Black bob and round glasses.
  e3: (o) => {
    const skin = '#F1C9A5';
    const hair = '#141414';
    return (
      `<path d="M34 52 C32 22 88 22 86 52 L86 70 L72 70 L72 60 L48 60 L48 70 L34 70 Z" fill="${hair}" ${stroke}/>` +
      body(o, skin) +
      head(skin) +
      `<path d="M37 52 C36 28 84 28 83 52 L80 44 C70 40 50 40 40 44 Z" fill="${hair}" ${stroke}/>` +
      face({ glasses: true })
    );
  },
  // Short brown hair and a beard.
  e4: (o) => {
    const skin = '#E0A97E';
    const hair = '#5A3B24';
    return (
      body(o, skin) +
      head(skin) +
      `<path d="M38 50 C36 26 84 26 82 50 C76 36 46 36 38 50 Z" fill="${hair}" ${stroke}/>` +
      `<path d="M39 58 C41 82 79 82 81 58 C76 72 44 72 39 58 Z" fill="${hair}" ${stroke}/>` +
      face()
    );
  },
  // Headscarf.
  e5: (o) => {
    const skin = '#A8714C';
    const scarf = '#7B3F6E';
    return (
      body(o, skin) +
      `<path d="M33 56 C30 20 90 20 87 56 C89 76 78 88 60 90 C42 88 31 76 33 56 Z" fill="${scarf}" ${stroke}/>` +
      `<ellipse cx="60" cy="55" rx="17" ry="20" fill="${skin}" ${stroke}/>` +
      `<path d="M43 46 C48 36 72 36 77 46" fill="none" stroke="${INK}" stroke-width="1.6" opacity="0.6"/>` +
      face()
    );
  },
  // Grey hair, glasses and a moustache.
  e6: (o) => {
    const skin = '#D9A27C';
    const hair = '#BDBDBD';
    return (
      body(o, skin) +
      head(skin) +
      `<path d="M37 56 C33 34 46 26 60 26 C74 26 87 34 83 56 C80 44 76 40 72 40 C66 34 54 34 48 40 C44 40 40 44 37 56 Z" fill="${hair}" ${stroke}/>` +
      `<path d="M52 62 C56 59 64 59 68 62 C64 64 56 64 52 62 Z" fill="${hair}" ${stroke}/>` +
      face({ glasses: true })
    );
  },
  // Big curly afro.
  e7: (o) => {
    const skin = '#5C3A24';
    const hair = '#1C130E';
    const cloud = [
      [36, 40, 12],
      [46, 26, 13],
      [60, 22, 14],
      [74, 26, 13],
      [84, 40, 12],
      [32, 56, 10],
      [88, 56, 10],
    ]
      .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${hair}" ${stroke}/>`)
      .join('');
    return (
      cloud +
      `<path d="M30 46 C30 20 90 20 90 46 L90 62 L30 62 Z" fill="${hair}"/>` +
      body(o, skin) +
      head(skin) +
      `<path d="M39 48 C42 36 78 36 81 48 C72 42 48 42 39 48 Z" fill="${hair}"/>` +
      face()
    );
  },
  // Ginger hair in a bun.
  e8: (o) => {
    const skin = '#F6D3B8';
    const hair = '#C4562B';
    return (
      `<circle cx="60" cy="22" r="10" fill="${hair}" ${stroke}/>` +
      body(o, skin) +
      head(skin) +
      `<path d="M37 52 C35 26 85 26 83 52 C78 40 66 34 60 40 C54 34 42 40 37 52 Z" fill="${hair}" ${stroke}/>` +
      `<circle cx="47" cy="59" r="1" fill="#B5603A"/><circle cx="50" cy="61" r="1" fill="#B5603A"/><circle cx="70" cy="61" r="1" fill="#B5603A"/><circle cx="73" cy="59" r="1" fill="#B5603A"/>` +
      face()
    );
  },
};

const avatarSvg = (draw, outfit) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="${SIZE}" height="${SIZE}">` +
  `<defs><clipPath id="c"><circle cx="60" cy="60" r="60"/></clipPath></defs>` +
  `<g clip-path="url(#c)"><rect width="120" height="120" fill="${PAPER}"/>${draw(outfit)}</g></svg>`;

// Kit badges: what your explorer carries as they rank up.
const KIT = {
  map:
    `<path d="M18 26 L30 20 L42 26 L54 20 L54 48 L42 54 L30 48 L18 54 Z" fill="#F2C94C" ${stroke}/>` +
    `<path d="M30 20 L30 48 M42 26 L42 54" ${stroke}/>` +
    `<path d="M23 38 C28 32 34 42 40 34 C44 30 48 36 50 32" fill="none" stroke="#C0504D" stroke-width="2" stroke-dasharray="3 3"/>`,
  backpack:
    `<path d="M28 22 C28 14 44 14 44 22" fill="none" ${stroke}/>` +
    `<rect x="20" y="22" width="32" height="34" rx="10" fill="#B5703A" ${stroke}/>` +
    `<rect x="26" y="38" width="20" height="12" rx="4" fill="#D9925A" ${stroke}/>`,
  camera:
    `<rect x="16" y="26" width="40" height="26" rx="6" fill="#3A3F4B" ${stroke}/>` +
    `<rect x="26" y="20" width="14" height="8" rx="2" fill="#3A3F4B" ${stroke}/>` +
    `<circle cx="36" cy="39" r="9" fill="#9DB4E8" ${stroke}/><circle cx="36" cy="39" r="3.5" fill="${INK}"/>`,
};
const kitSvg = (draw) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72" width="${BADGE}" height="${BADGE}">` +
  `<circle cx="36" cy="36" r="34" fill="#FFFDF8" stroke="${INK}" stroke-width="3"/>${draw}</svg>`;

mkdirSync(`${root}/assets/explorers`, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
const page = await browser.newPage();
async function render(svg, w, file) {
  await page.setViewportSize({ width: w, height: w });
  await page.setContent(`<html><body style="margin:0;background:transparent">${svg}</body></html>`);
  const el = await page.$('svg');
  writeFileSync(`${root}/assets/explorers/${file}`, await el.screenshot({ omitBackground: true }));
}

const lines = [];
for (const [id, draw] of Object.entries(EXPLORERS)) {
  const outfits = [];
  for (const [outfit, color] of Object.entries(OUTFITS)) {
    await render(avatarSvg(draw, color), SIZE, `${id}-${outfit}.png`);
    outfits.push(`    ${outfit}: require('../assets/explorers/${id}-${outfit}.png'),`);
  }
  lines.push(`  ${id}: {\n${outfits.join('\n')}\n  },`);
}
const kits = [];
for (const [kit, draw] of Object.entries(KIT)) {
  await render(kitSvg(draw), BADGE, `kit-${kit}.png`);
  kits.push(`  ${kit}: require('../assets/explorers/kit-${kit}.png'),`);
}
await browser.close();

writeFileSync(
  `${root}/src/explorerArt.ts`,
  `// Generated by scripts/render-explorers.mjs. Do not edit by hand.
import type { ImageSource } from 'expo-image';
import type { ExplorerId, ExplorerKit } from '@wandro/shared';

export type OutfitKey = ${Object.keys(OUTFITS)
    .map((k) => `'${k}'`)
    .join(' | ')};

/* eslint-disable @typescript-eslint/no-require-imports -- static asset requires for Metro */
export const EXPLORER_ART: Record<ExplorerId, Record<OutfitKey, ImageSource>> = {
${lines.join('\n')}
};

export const KIT_ART: Record<ExplorerKit, ImageSource> = {
${kits.join('\n')}
};
/* eslint-enable @typescript-eslint/no-require-imports */
`,
);
console.log(
  `Rendered ${Object.keys(EXPLORERS).length * Object.keys(OUTFITS).length} explorers and ${Object.keys(KIT).length} kit badges`,
);
