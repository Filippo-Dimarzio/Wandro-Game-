// Renders the map pins in assets/markers: a bold game-style pin per category with a pictogram
// (`<category>.png` once discovered, `<category>-locked.png` while still to explore), and a big
// illustrated badge for each city's signature landmark (`landmark-<city>.png`, from the stamp
// engravings in assets/stamps). Needs Playwright's Chromium: node scripts/render-markers.mjs
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const root = new URL('../assets', import.meta.url).pathname;
const W = 96; // pins: shown at 48 x 56 pt (pixel ratio 2)
const H = 112;
const B = 132; // landmark badges: shown at 66 x 78 pt
const BH = 156;

// Category colour and a white pictogram drawn in a 60 x 60 box.
const CATS = {
  coast: [
    '#0B6FB8',
    '<circle cx="40" cy="18" r="9"/><path d="M4 38c6-7 12-7 18 0s12 7 18 0s12-7 18 0M4 50c6-7 12-7 18 0s12 7 18 0s12-7 18 0" fill="none" stroke="#0B6FB8" stroke-width="6" stroke-linecap="round"/>',
  ],
  nature: [
    '#2E7D32',
    '<path d="M30 6l14 18h-7l11 14h-8l10 12H10l10-12h-8l11-14h-7z"/><rect x="26" y="50" width="8" height="8" rx="1"/>',
  ],
  heritage: [
    '#B4441A',
    '<path fill-rule="evenodd" d="M8 54V24h7v-7h6v7h5v-7h8v7h5v-7h6v7h7v30zM24 54V43a6 6 0 0 1 12 0v11z"/><path d="M27 17V6l9 3l-9 3"/>',
  ],
  culture: [
    '#3949AB',
    '<path d="M30 5l26 13H4zM8 21h44v5H8zM10 29h6v19h-6zM22 29h6v19h-6zM34 29h6v19h-6zM46 29h6v19h-6zM5 50h50v6H5z"/>',
  ],
  art: [
    '#7B3FC4',
    '<path fill-rule="evenodd" d="M30 6C14 6 4 17 4 30s10 24 24 24c5 0 7-3 5-7c-2-5 1-8 6-8h6c7 0 11-5 11-11C56 15 44 6 30 6zM16 30a5 5 0 1 0 0.1 0zM22 18a5 5 0 1 0 0.1 0zM36 14a5 5 0 1 0 0.1 0zM46 24a5 5 0 1 0 0.1 0z"/>',
  ],
  music_events: [
    '#A3195B',
    '<path d="M22 10l30-6v36a8 7 0 1 1-5-6.4V15l-20 4v26a8 7 0 1 1-5-6.4z"/>',
  ],
  other: ['#0A706F', '<path d="M30 4l6 18l18 0l-14 11l5 18l-15-11l-15 11l5-18L6 22l18 0z"/>'],
};

const pin = (color, glyph, locked) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <filter id="s" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#000" flood-opacity="0.35"/>
    </filter>
  </defs>
  <g filter="url(#s)">
    <path d="M48 106C40 92 10 74 10 46a38 38 0 0 1 76 0c0 28-30 46-38 60z" fill="${color}" stroke="#fff" stroke-width="5"/>
  </g>
  <circle cx="48" cy="45" r="29" fill="#fff"/>
  <g transform="translate(19 16)" fill="${color}">${glyph}</g>
  ${
    locked
      ? `<circle cx="78" cy="18" r="15" fill="#1A2238" stroke="#fff" stroke-width="3"/>
         <rect x="70" y="16" width="16" height="12" rx="2" fill="#fff"/>
         <path d="M73 17v-3a5 5 0 0 1 10 0v3" fill="none" stroke="#fff" stroke-width="3"/>`
      : `<circle cx="78" cy="18" r="15" fill="#F2B705" stroke="#fff" stroke-width="3"/>
         <path d="M70 18l5 5l10-10" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`
  }
</svg>`;

const badge = (art, locked) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${B}" height="${BH}" viewBox="0 0 ${B} ${BH}">
  <defs>
    <filter id="s" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000" flood-opacity="0.4"/>
    </filter>
    <clipPath id="c"><circle cx="66" cy="62" r="50"/></clipPath>
  </defs>
  <g filter="url(#s)">
    <path d="M66 150C58 136 8 110 8 62a58 58 0 0 1 116 0c0 48-50 74-58 88z" fill="#C8902A" stroke="#fff" stroke-width="5"/>
  </g>
  <circle cx="66" cy="62" r="53" fill="#FFF6E0"/>
  <image href="${art}" x="10" y="2" width="112" height="126" clip-path="url(#c)" preserveAspectRatio="xMidYMid slice"/>
  <circle cx="66" cy="62" r="50" fill="none" stroke="#F2B705" stroke-width="5"/>
  <path d="M66 4l5 9l10 1l-7 7l2 10l-10-5l-10 5l2-10l-7-7l10-1z" fill="#F2B705" stroke="#fff" stroke-width="2"/>
  ${
    locked
      ? `<circle cx="110" cy="24" r="17" fill="#1A2238" stroke="#fff" stroke-width="3"/>
         <rect x="101" y="22" width="18" height="13" rx="2" fill="#fff"/>
         <path d="M104 23v-4a6 6 0 0 1 12 0v4" fill="none" stroke="#fff" stroke-width="3"/>`
      : `<circle cx="110" cy="24" r="17" fill="#F2B705" stroke="#fff" stroke-width="3"/>
         <path d="M101 24l6 6l11-11" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`
  }
</svg>`;

mkdirSync(`${root}/markers`, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
const page = await browser.newPage();

async function render(svg, w, h) {
  return page.evaluate(
    async ({ svg, w, h }) => {
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const img = new Image();
      img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
      await img.decode();
      c.getContext('2d').drawImage(img, 0, 0, w, h);
      return c.toDataURL('image/png');
    },
    { svg, w, h },
  );
}
const save = (name, url) =>
  writeFileSync(`${root}/markers/${name}.png`, Buffer.from(url.split(',')[1], 'base64'));

for (const [cat, [color, glyph]] of Object.entries(CATS))
  for (const locked of [false, true])
    save(`${cat}${locked ? '-locked' : ''}`, await render(pin(color, glyph, locked), W, H));

for (const city of ['sintra', 'lisbon', 'porto', 'evora', 'aveiro']) {
  const art = `data:image/jpeg;base64,${readFileSync(`${root}/stamps/${city}.jpg`).toString('base64')}`;
  for (const locked of [false, true])
    save(`landmark-${city}${locked ? '-locked' : ''}`, await render(badge(art, locked), B, BH));
}
await browser.close();
console.log('Rendered pins and landmark badges');
