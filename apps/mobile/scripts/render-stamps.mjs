// Renders assets/stamps/<city>.jpg (the city stamp's picture) from the hand-drawn engravings in
// assets/stamps/src/*.svg. Needs Playwright's Chromium:
//   node scripts/render-stamps.mjs
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const dir = new URL('../assets/stamps', import.meta.url).pathname;
const W = 500;
const H = 560;
const cities = readdirSync(`${dir}/src`)
  .filter((f) => f.endsWith('.svg'))
  .map((f) => f.replace(/\.svg$/, ''));

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
const page = await browser.newPage();
await page.setContent(`<canvas id="c" width="${W}" height="${H}"></canvas>`);
for (const city of cities) {
  const b64 = readFileSync(`${dir}/src/${city}.svg`).toString('base64');
  const url = await page.evaluate(
    async ({ b64, W, H }) => {
      const img = new Image();
      img.src = `data:image/svg+xml;base64,${b64}`;
      await img.decode();
      const g = document.getElementById('c').getContext('2d');
      g.clearRect(0, 0, W, H);
      g.drawImage(img, 0, 0, W, H);
      return document.getElementById('c').toDataURL('image/jpeg', 0.9);
    },
    { b64, W, H },
  );
  writeFileSync(`${dir}/${city}.jpg`, Buffer.from(url.split(',')[1], 'base64'));
}
await browser.close();
console.log('Rendered', cities.join(', '));
