// Renders the game backdrop tiles (assets/backdrop/light.png, dark.png): a faint treasure-map
// pattern (dotted trails, a compass rose, mountains, waves, trees, stars and X marks) that repeats
// behind every screen, so wide screens never look like empty white space. Needs Playwright's
// Chromium:
//   node scripts/render-backdrop.mjs
import { writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const out = new URL('../assets/backdrop', import.meta.url).pathname;
const S = 360;

// Colours match theme.ts: bg is the paper, ink a slightly darker tone of it.
const THEMES = {
  light: { paper: '#FAF3E6', ink: '#E8D6B8', accent: '#EFC9A8' },
  dark: { paper: '#14121F', ink: '#262138', accent: '#2E2440' },
};

// Everything stays clear of the tile's edges, so the tiles meet without seams; the trail runs
// off two edges at the same height so it continues into the next tile.
const drawing = ({ ink, accent }) => `
  <g fill="none" stroke="${ink}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
    <path d="M0 250 C40 230 70 270 110 250 S180 200 220 230 S300 290 360 250" stroke-dasharray="2 10"/>
    <!-- compass rose -->
    <g transform="translate(280 80)">
      <circle r="30"/>
      <path d="M0 -40 L8 0 L0 40 L-8 0 Z" fill="${ink}"/>
      <path d="M-40 0 L0 -7 L40 0 L0 7 Z"/>
    </g>
    <!-- mountains -->
    <path d="M30 120 L58 72 L86 120 M70 100 L92 64 L120 120"/>
    <path d="M52 82 L58 72 L64 82" />
    <!-- waves -->
    <path d="M190 160 q10 -10 20 0 t20 0 t20 0"/>
    <path d="M200 176 q10 -10 20 0 t20 0"/>
    <!-- trees -->
    <path d="M60 310 l12 -26 l12 26 Z M72 310 v10"/>
    <path d="M96 318 l10 -22 l10 22 Z M106 318 v8"/>
    <!-- X marks the spot -->
    <path d="M236 316 l16 16 M252 316 l-16 16" stroke="${accent}" stroke-width="4"/>
    <!-- little stars -->
    <path d="M150 40 v12 M144 46 h12"/>
    <path d="M330 200 v10 M325 205 h10"/>
    <path d="M24 196 v10 M19 201 h10"/>
    <!-- a tiny flag -->
    <path d="M160 300 v-34 l18 8 l-18 8"/>
  </g>`;

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
const page = await browser.newPage({ viewport: { width: S, height: S } });
for (const [name, theme] of Object.entries(THEMES)) {
  await page.setContent(
    `<html><body style="margin:0"><svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}">` +
      `<rect width="${S}" height="${S}" fill="${theme.paper}"/>${drawing(theme)}</svg></body></html>`,
  );
  writeFileSync(`${out}/${name}.png`, await (await page.$('svg')).screenshot());
}
await browser.close();
console.log('Rendered backdrop tiles');
