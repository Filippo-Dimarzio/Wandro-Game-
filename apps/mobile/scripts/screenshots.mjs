// Walks through the web app (demo mode) like a new player and takes a screenshot of each main
// screen: used by the "PR preview" workflow so every pull request shows how the app looks.
//   node scripts/screenshots.mjs <app url> <output dir>
// Needs Playwright with Chromium (CHROMIUM_PATH can point at a Chromium binary).
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const [url = 'http://localhost:8082/', out = 'screenshots'] = process.argv.slice(2);
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));

const wait = (ms) => page.waitForTimeout(ms);
const byId = (id) => page.locator(`[data-testid="${id}"]:visible`).first();
// Tap the newest element with this test id even if something sits on top of it.
const tap = (id) =>
  page.evaluate((i) => [...document.querySelectorAll(`[data-testid="${i}"]`)].pop()?.click(), id);
const hold = async (id, ms) => {
  const box = await byId(id).boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await wait(ms);
  await page.mouse.up();
};
const tab = (name) => page.getByRole('tab', { name }).click();
let n = 0;
const shot = (name) =>
  page.screenshot({ path: `${out}/${String(++n).padStart(2, '0')}-${name}.png` });

/** Runs one step; a failing step is reported but doesn't stop the tour. */
async function step(name, fn) {
  try {
    await fn();
  } catch (e) {
    errors.push(`${name}: ${e.message.split('\n')[0]}`);
  }
}

await page.goto(url, { waitUntil: 'networkidle' });
await wait(1500);
await step('welcome', () => shot('welcome'));
await step('onboarding', async () => {
  await hold('portal-hold', 2500);
  await wait(800);
  await page.getByText('Start exploring').click();
  await wait(600);
  await byId('username').fill('explorer');
  await byId('profile-next').click();
  await byId('style-castles').click();
  await byId('guidelines').click();
  await byId('finish').click();
  await wait(2500);
});
await step('home', () => shot('home'));
await step('check-in', async () => {
  await tab(/Check in/);
  await wait(1500);
  await shot('check-in');
});
await step('discovery', async () => {
  await hold('start-discovery', 1300);
  await wait(11000);
  await shot('reward-and-stamp');
  await tap('celebration-done');
  await wait(800);
  await shot('reward');
});
await step('map', async () => {
  await tab(/Explore/);
  await wait(9000);
  await shot('map');
  await tap('map-key');
  await wait(600);
  await shot('map-key');
  await tap('map-key');
  await tap('theme-toggle');
  await wait(2500);
  await shot('map-dark');
  await tap('theme-toggle');
  await wait(800);
});
await step('collections', async () => {
  await tab(/Collections/);
  await wait(2500);
  await shot('collections');
  await tap('city-card-sintra');
  await wait(1200);
  await shot('city-sheet');
  await tap('close-city');
  await wait(800);
});
await step('passport', async () => {
  await tab(/Home/);
  await wait(1500);
  await tap('open-passport');
  await wait(1500);
  await shot('passport');
});
await step('store', async () => {
  await page.goBack();
  await wait(1000);
  await tap('coin-pill');
  await wait(1500);
  await shot('store');
});

await browser.close();
console.log(`${n} screenshots in ${out}`);
if (errors.length) console.log(`Notes:\n- ${errors.join('\n- ')}`);
