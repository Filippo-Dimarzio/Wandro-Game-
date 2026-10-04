// Renders assets/cities/<city>.jpg and <city>-locked.jpg (greyed out, for cities not yet
// unlocked) from the landmark drawings in assets/cities/src/*.svg — or from a photo, if you drop
// <city>.jpg into assets/cities/src/ (photos win). Needs Playwright's Chromium:
//   node scripts/render-cities.mjs
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const dir = new URL('../assets/cities', import.meta.url).pathname;
const SIZE = 600;
const cities = [
  ...new Set(readdirSync(`${dir}/src`).map((f) => f.replace(/\.(svg|jpe?g|png)$/, ''))),
];

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
const page = await browser.newPage();
await page.setContent(`<canvas id="c" width="${SIZE}" height="${SIZE}"></canvas>`);
for (const city of cities) {
  const photo = ['jpg', 'jpeg', 'png'].map((e) => `${dir}/src/${city}.${e}`).find(existsSync);
  const file = photo ?? `${dir}/src/${city}.svg`;
  const mime = photo ? (file.endsWith('png') ? 'image/png' : 'image/jpeg') : 'image/svg+xml';
  const b64 = readFileSync(file).toString('base64');
  for (const locked of [false, true]) {
    const url = await page.evaluate(
      async ({ b64, mime, locked, S }) => {
        const img = new Image();
        img.src = `data:${mime};base64,${b64}`;
        await img.decode();
        const g = document.getElementById('c').getContext('2d');
        const s = Math.min(img.width, img.height);
        g.filter = locked ? 'grayscale(1) brightness(0.62) contrast(1.05) blur(1.5px)' : 'none';
        g.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, S, S);
        g.filter = 'none';
        if (locked) {
          // A drift of fog over the lower half: mysterious, but the landmark still reads.
          const fog = g.createLinearGradient(0, S * 0.35, 0, S);
          fog.addColorStop(0, 'rgba(200,210,220,0)');
          fog.addColorStop(1, 'rgba(200,210,220,0.35)');
          g.fillStyle = fog;
          g.fillRect(0, 0, S, S);
        }
        return document.getElementById('c').toDataURL('image/jpeg', 0.86);
      },
      { b64, mime, locked, S: SIZE },
    );
    writeFileSync(
      `${dir}/${city}${locked ? '-locked' : ''}.jpg`,
      Buffer.from(url.split(',')[1], 'base64'),
    );
  }
}
await browser.close();
console.log('Rendered', cities.join(', '));
