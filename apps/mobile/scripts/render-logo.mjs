// Renders the Wandro "W" logo and every app icon from one SVG drawing: a W drawn as a single
// wandering route, with a yellow "you are here" dot. Needs Playwright's Chromium:
//   node scripts/render-logo.mjs
import { writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const mobile = new URL('..', import.meta.url).pathname;
const desktop = new URL('../../desktop', import.meta.url).pathname;

const TEAL = '#0E7C66';
const CREAM = '#FBF1E4';
const SUN = '#F2C94C';

/** The W route and its dot, in a 1024 box. `scale` shrinks it about the centre (adaptive icons). */
function mark(color, dot, scale = 1) {
  const t = `translate(${512 * (1 - scale)} ${512 * (1 - scale)}) scale(${scale})`;
  return (
    `<g transform="${t}">` +
    `<path d="M214 318 C236 420 300 600 368 716 C410 610 452 506 512 420 C572 506 614 610 656 716 C724 600 788 420 810 318" ` +
    `fill="none" stroke="${color}" stroke-width="112" stroke-linecap="round" stroke-linejoin="round"/>` +
    (dot ? `<circle cx="846" cy="196" r="56" fill="${dot}"/>` : '') +
    `</g>`
  );
}

const svg = (body, bg) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">` +
  (bg ? `<rect width="1024" height="1024" fill="${bg}"/>` : '') +
  body +
  `</svg>`;
const rounded = (body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">` +
  `<rect width="1024" height="1024" rx="230" fill="${TEAL}"/>${body}</svg>`;

const outputs = [
  // App store icon: full-bleed (iOS rounds the corners itself).
  [`${mobile}/assets/icon.png`, svg(mark(CREAM, SUN, 0.92), TEAL), 1024, false],
  // Android adaptive icon: the system crops to a circle or squircle, so keep the mark small.
  [`${mobile}/assets/android-icon-foreground.png`, svg(mark(CREAM, SUN, 0.6)), 1024, true],
  [`${mobile}/assets/android-icon-background.png`, svg('', TEAL), 1024, false],
  [
    `${mobile}/assets/android-icon-monochrome.png`,
    svg(mark('#FFFFFF', '#FFFFFF', 0.6)),
    1024,
    true,
  ],
  // Splash: the mark alone, in teal.
  [`${mobile}/assets/splash-icon.png`, svg(mark(TEAL, SUN, 0.7)), 1024, true],
  // In-app logo: a rounded tile that reads on light and dark screens.
  [`${mobile}/assets/logo.png`, rounded(mark(CREAM, SUN, 0.82)), 512, true],
  [`${mobile}/assets/favicon.png`, rounded(mark(CREAM, SUN, 0.86)), 48, true],
  [`${mobile}/public/icon-192.png`, svg(mark(CREAM, SUN, 0.86), TEAL), 192, false],
  [`${mobile}/public/icon-512.png`, svg(mark(CREAM, SUN, 0.86), TEAL), 512, false],
  [`${desktop}/resources/icon.png`, rounded(mark(CREAM, SUN, 0.82)), 1024, true],
];

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
const page = await browser.newPage();
for (const [file, drawing, size, transparent] of outputs) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<html><body style="margin:0;background:transparent">${drawing.replace('width="1024" height="1024"', `width="${size}" height="${size}"`)}</body></html>`,
  );
  const el = await page.$('svg');
  writeFileSync(file, await el.screenshot({ omitBackground: transparent }));
}
await browser.close();
console.log(`Rendered ${outputs.length} logo and icon files`);
