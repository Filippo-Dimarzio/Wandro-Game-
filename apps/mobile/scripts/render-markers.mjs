// Renders assets/markers/*.png (round map pins) from the category art in assets/art.
// Needs Playwright's Chromium: node scripts/render-markers.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const root = new URL('../assets', import.meta.url).pathname;
// Category colour and which illustration it uses.
const CATS = {
  coast: ['#0B6FB8', 'coast'],
  nature: ['#2E7D32', 'nature'],
  heritage: ['#B4441A', 'heritage'],
  culture: ['#3949AB', 'culture'],
  art: ['#7B3FC4', 'art'],
  music_events: ['#A3195B', 'music_events'],
  other: ['#0A706F', 'other'],
};
const SIZE = 84; // shown at 42 pt (scale 2)

mkdirSync(`${root}/markers`, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
const page = await browser.newPage();
await page.setContent(`<canvas id="c" width="${SIZE}" height="${SIZE}"></canvas>`);
for (const [cat, [color, art]] of Object.entries(CATS)) {
  const b64 = readFileSync(`${root}/art/${art}.webp`).toString('base64');
  for (const locked of [false, true]) {
    const url = await page.evaluate(
      async ({ b64, color, locked, S }) => {
        const img = new Image();
        img.src = `data:image/webp;base64,${b64}`;
        await img.decode();
        const g = document.getElementById('c').getContext('2d');
        const cx = S / 2,
          cy = S / 2 - 1,
          R = S / 2 - 5;
        g.clearRect(0, 0, S, S);
        // White disc with a soft shadow.
        g.save();
        g.shadowColor = 'rgba(0,0,0,0.35)';
        g.shadowBlur = 5;
        g.shadowOffsetY = 2;
        g.beginPath();
        g.arc(cx, cy, R, 0, Math.PI * 2);
        g.fillStyle = '#fff';
        g.fill();
        g.restore();
        // Category ring: thick once discovered, thin before.
        const ring = locked ? 3 : 6;
        g.beginPath();
        g.arc(cx, cy, R - 2, 0, Math.PI * 2);
        g.lineWidth = ring;
        g.strokeStyle = color;
        g.stroke();
        // The illustration.
        const r = R - 3 - ring;
        g.save();
        g.beginPath();
        g.arc(cx, cy, r, 0, Math.PI * 2);
        g.clip();
        const s = Math.min(img.width, img.height);
        g.drawImage(
          img,
          (img.width - s) / 2,
          (img.height - s) / 2,
          s,
          s,
          cx - r,
          cy - r,
          r * 2,
          r * 2,
        );
        if (locked) {
          g.fillStyle = 'rgba(255,255,255,0.18)';
          g.fillRect(0, 0, S, S);
        }
        g.restore();
        // Badge: lock or check.
        const bx = S - 16,
          by = S - 17,
          br = 11;
        g.beginPath();
        g.arc(bx, by, br, 0, Math.PI * 2);
        g.fillStyle = locked ? '#3D4752' : color;
        g.fill();
        g.lineWidth = 2.5;
        g.strokeStyle = '#fff';
        g.stroke();
        g.strokeStyle = '#fff';
        g.fillStyle = '#fff';
        g.lineWidth = 2.2;
        g.lineCap = 'round';
        g.lineJoin = 'round';
        if (locked) {
          g.fillRect(bx - 5, by - 1, 10, 7);
          g.beginPath();
          g.arc(bx, by - 2, 3.5, Math.PI, 0);
          g.stroke();
        } else {
          g.beginPath();
          g.moveTo(bx - 5, by);
          g.lineTo(bx - 1.5, by + 4);
          g.lineTo(bx + 5, by - 4);
          g.stroke();
        }
        return document.getElementById('c').toDataURL('image/png');
      },
      { b64, color, locked, S: SIZE },
    );
    writeFileSync(
      `${root}/markers/${cat}${locked ? '-locked' : ''}.png`,
      Buffer.from(url.split(',')[1], 'base64'),
    );
  }
}
await browser.close();
console.log('Rendered', Object.keys(CATS).length * 2, 'markers');
