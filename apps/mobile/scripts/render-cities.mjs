// Renders the Collections city art, assets/cities/<city>.jpg and <city>-locked.jpg (greyed out
// until unlocked), as terracotta ink sketches on cream paper: the landmark engravings in
// assets/stamps/src are traced into ink lines with a soft wash, a hand-drawn frame, stars and
// swirls. Needs Playwright's Chromium: node scripts/render-cities.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const assets = new URL('../assets', import.meta.url).pathname;
const S = 600;
const cities = ['sintra', 'lisbon', 'porto', 'evora', 'aveiro'];

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
const page = await browser.newPage();
for (const city of cities) {
  const b64 = readFileSync(`${assets}/stamps/src/${city}.svg`).toString('base64');
  for (const locked of [false, true]) {
    const url = await page.evaluate(
      async ({ b64, S, seed, locked }) => {
        const img = new Image();
        img.src = `data:image/svg+xml;base64,${b64}`;
        await img.decode();
        const c = document.createElement('canvas');
        c.width = S;
        c.height = S;
        const g = c.getContext('2d');
        // Inner picture, without the stamp frame: x 26..474, y 60..508 of the 500 x 560 engraving.
        g.drawImage(img, 26, 60, 448, 448, 0, 0, S, S);
        const src = g.getImageData(0, 0, S, S).data;
        const L = new Float32Array(S * S);
        for (let i = 0; i < S * S; i++)
          L[i] = 0.299 * src[i * 4] + 0.587 * src[i * 4 + 1] + 0.114 * src[i * 4 + 2];
        const mag = (ch, x, y) => {
          const v = (xx, yy) => src[(yy * S + xx) * 4 + ch];
          const gx =
            -v(x - 1, y - 1) -
            2 * v(x - 1, y) -
            v(x - 1, y + 1) +
            v(x + 1, y - 1) +
            2 * v(x + 1, y) +
            v(x + 1, y + 1);
          const gy =
            -v(x - 1, y - 1) -
            2 * v(x, y - 1) -
            v(x + 1, y - 1) +
            v(x - 1, y + 1) +
            2 * v(x, y + 1) +
            v(x + 1, y + 1);
          return Math.hypot(gx, gy);
        };
        let r = seed;
        const rnd = () => (r = (r * 9301 + 49297) % 233280) / 233280;
        const outImg = g.createImageData(S, S);
        const o = outImg.data;
        const cream = [247, 239, 226],
          wash = [222, 150, 116],
          ink = [168, 80, 47];
        for (let y = 0; y < S; y++)
          for (let x = 0; x < S; x++) {
            const i = y * S + x;
            let m = 0;
            if (x > 0 && y > 0 && x < S - 1 && y < S - 1)
              m = Math.max(mag(0, x, y), mag(1, x, y), mag(2, x, y));
            const line = Math.min(1, Math.max(0, (m - 60) / 140));
            const dark = 1 - L[i] / 255;
            const w = Math.min(0.55, (Math.round(dark * 4) / 4) * 0.5 + 0.03);
            const n = (rnd() - 0.5) * 8;
            for (let k = 0; k < 3; k++) {
              let v = cream[k] + n;
              v = v * (1 - w) + wash[k] * w;
              v = v * (1 - line * 0.92) + ink[k] * line * 0.92;
              o[i * 4 + k] = v;
            }
            o[i * 4 + 3] = 255;
          }
        g.putImageData(outImg, 0, 0);
        // Hand-drawn frame and doodles in the same ink.
        g.strokeStyle = 'rgb(168,80,47)';
        g.lineCap = 'round';
        g.lineJoin = 'round';
        const wobble = (pts, wd) => {
          g.lineWidth = wd;
          g.beginPath();
          pts.forEach(([x, y], k) => {
            const jx = x + (rnd() - 0.5) * 3,
              jy = y + (rnd() - 0.5) * 3;
            if (k) g.lineTo(jx, jy);
            else g.moveTo(jx, jy);
          });
          g.stroke();
        };
        const rect = (m, wd) => {
          const p = [];
          for (let t = 0; t <= 40; t++) p.push([m + ((S - 2 * m) * t) / 40, m]);
          for (let t = 0; t <= 40; t++) p.push([S - m, m + ((S - 2 * m) * t) / 40]);
          for (let t = 0; t <= 40; t++) p.push([S - m - ((S - 2 * m) * t) / 40, S - m]);
          for (let t = 0; t <= 40; t++) p.push([m, S - m - ((S - 2 * m) * t) / 40]);
          wobble(p, wd);
        };
        rect(14, 3);
        rect(24, 1.5);
        const star = (cx, cy, rr) => {
          g.lineWidth = 2.5;
          for (let a = 0; a < 4; a++) {
            const t = (a * Math.PI) / 4;
            g.beginPath();
            g.moveTo(cx - Math.cos(t) * rr, cy - Math.sin(t) * rr);
            g.lineTo(cx + Math.cos(t) * rr, cy + Math.sin(t) * rr);
            g.stroke();
          }
        };
        const swirl = (cx, cy, rr, turns) => {
          g.lineWidth = 2.5;
          g.beginPath();
          for (let t = 0; t <= turns * 40; t++) {
            const a = (t / 40) * Math.PI * 2,
              rad = rr * (1 - t / (turns * 40));
            const px = cx + Math.cos(a) * rad,
              py = cy + Math.sin(a) * rad * 0.8;
            if (t) g.lineTo(px, py);
            else g.moveTo(px, py);
          }
          g.stroke();
        };
        star(70 + rnd() * 40, 70 + rnd() * 30, 10);
        star(S - 90 - rnd() * 30, 110 + rnd() * 40, 8);
        star(S / 2 + 120 * (rnd() - 0.5), 60, 6);
        swirl(90 + rnd() * 30, 150 + rnd() * 30, 26, 2.2);
        swirl(S - 80, 70 + rnd() * 20, 20, 2);
        if (locked) {
          // Greyed out and misty until the city is unlocked: the landmark still reads.
          const grey = g.getImageData(0, 0, S, S);
          const d = grey.data;
          for (let i = 0; i < d.length; i += 4) {
            const v = (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) * 0.72;
            d[i] = d[i + 1] = d[i + 2] = v;
          }
          g.putImageData(grey, 0, 0);
          const fog = g.createLinearGradient(0, S * 0.35, 0, S);
          fog.addColorStop(0, 'rgba(200,210,220,0)');
          fog.addColorStop(1, 'rgba(200,210,220,0.35)');
          g.fillStyle = fog;
          g.fillRect(0, 0, S, S);
        }
        return c.toDataURL('image/jpeg', 0.88);
      },
      { b64, S, seed: city.length * 977, locked },
    );
    writeFileSync(
      `${assets}/cities/${city}${locked ? '-locked' : ''}.jpg`,
      Buffer.from(url.split(',')[1], 'base64'),
    );
  }
}
await browser.close();
console.log('Rendered', cities.join(', '));
