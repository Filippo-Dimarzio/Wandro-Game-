// Renders the arrival-screen artwork (assets/trip): a landscape for each way of travelling, a
// landmark vignette for each launch city (engraved like the Wandro stamps) and the three vehicles.
// Needs Playwright's Chromium:
// node scripts/render-trip.mjs (writes WebP)
import { C, range, renderWebp, svgClean } from './paper-art.mjs';

const root = process.env.MOBILE_ROOT ?? new URL('..', import.meta.url).pathname;
const out = `${root}/assets/trip`;

// ---------- Kit. The landscapes are drawn like a travel poster: no outlines, layered hills that
// fade into the haze with distance, and real Portuguese trees and villages at a believable
// scale. Only the vehicles and landmarks carry ink lines, like the stamps. ----------
const INK = '#1F2A44';
const o = (w = 2) =>
  `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;

/** Small seeded random generator, so every render draws the same landscape. */
const rng = (seed) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const mix = (a, b, t) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return (
    '#' +
    pa
      .map((v, i) =>
        Math.round(v + (pb[i] - v) * t)
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')
  );
};
const f1 = (n) => Math.round(n * 10) / 10;
const grad = (id, stops, vertical = true) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="${vertical ? 0 : 1}" y2="${vertical ? 1 : 0}">${stops
    .map(([at, c, op = 1]) => `<stop offset="${at}" stop-color="${c}" stop-opacity="${op}"/>`)
    .join('')}</linearGradient>`;

/** A hill line from left to right, closed down to `bottom`: gentle swells plus fine roughness. */
const ridge = (y, amp, seed, { bottom = 620, rough = 0.18, waves = 3 } = {}) => {
  const r = rng(seed);
  const ph = [r() * 6, r() * 6, r() * 6];
  const pts = [];
  for (let x = -10; x <= 1010; x += 10) {
    const v =
      Math.sin((x / 1000) * Math.PI * waves + ph[0]) * 0.6 +
      Math.sin((x / 1000) * Math.PI * waves * 2.3 + ph[1]) * 0.28 +
      Math.sin((x / 1000) * Math.PI * waves * 5.1 + ph[2]) * 0.12 +
      (r() - 0.5) * rough;
    pts.push(`${x} ${f1(y - v * amp)}`);
  }
  return `M${pts.join(' L')} L1010 ${bottom} L-10 ${bottom} Z`;
};
/** The height of a ridge at x, to stand trees and houses on it. */
const ridgeY = (path, x) => {
  const pts = path
    .slice(1)
    .split(' L')
    .map((p) => p.split(' ').map(Number));
  const i = Math.max(0, Math.min(pts.length - 2, Math.floor((x + 10) / 10)));
  const [x0, y0] = pts[i];
  const [x1, y1] = pts[i + 1];
  return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
};

/** Long, soft strands of cloud rather than cartoon puffs. */
const stratus = (x, y, w, op = 0.55) =>
  `<g filter="url(#soft)" opacity="${op}"><ellipse cx="${x}" cy="${y}" rx="${w}" ry="${w * 0.07}" fill="#FFFFFF"/><ellipse cx="${x + w * 0.25}" cy="${y - w * 0.05}" rx="${w * 0.5}" ry="${w * 0.06}" fill="#FFFFFF"/></g>`;

/** Umbrella (stone) pine: a bare, leaning trunk under a flat, layered canopy. */
const pine = (x, y, h, dark = '#3E5B37', light = '#58784A') => {
  const w = h * 0.95;
  const lean = h * 0.08;
  return (
    `<path d="M${x} ${y} C${x + 1} ${y - h * 0.4} ${x + lean} ${y - h * 0.6} ${x + lean} ${y - h * 0.78}" fill="none" stroke="#5C4A3A" stroke-width="${Math.max(1.4, h * 0.05)}" stroke-linecap="round"/>` +
    `<path d="M${x + lean - w / 2} ${y - h * 0.74} C${x + lean - w * 0.42} ${y - h * 0.98} ${x + lean - w * 0.1} ${y - h * 1.04} ${x + lean + w * 0.08} ${y - h * 1.0} C${x + lean + w * 0.3} ${y - h * 1.05} ${x + lean + w * 0.5} ${y - h * 0.94} ${x + lean + w / 2} ${y - h * 0.74} Z" fill="${dark}"/>` +
    `<path d="M${x + lean - w * 0.42} ${y - h * 0.86} C${x + lean - w * 0.3} ${y - h * 1.0} ${x + lean + w * 0.2} ${y - h * 1.04} ${x + lean + w * 0.4} ${y - h * 0.88} C${x + lean + w * 0.1} ${y - h * 0.93} ${x + lean - w * 0.2} ${y - h * 0.93} ${x + lean - w * 0.42} ${y - h * 0.86} Z" fill="${light}"/>`
  );
};
/** Cork or holm oak: a short trunk and a rounded, lumpy crown. */
const oak = (x, y, h, seed, dark = '#46633A', light = '#62824F') => {
  const r = rng(seed);
  const cx = x;
  const cy = y - h * 0.62;
  const rad = h * 0.42;
  const lumps = Array.from({ length: 6 }, (_, i) => {
    const a = Math.PI + (i / 5) * Math.PI;
    return `<circle cx="${f1(cx + Math.cos(a) * rad * 0.6)}" cy="${f1(cy + Math.sin(a) * rad * 0.45)}" r="${f1(rad * (0.5 + r() * 0.15))}" fill="${dark}"/>`;
  }).join('');
  return (
    `<ellipse cx="${x + h * 0.12}" cy="${y}" rx="${h * 0.38}" ry="${h * 0.06}" fill="#000" opacity="0.12"/>` +
    `<path d="M${x - 1} ${y} L${x - 1.5} ${y - h * 0.45} M${x} ${y - h * 0.35} L${x + h * 0.14} ${y - h * 0.55}" stroke="#4E3F33" stroke-width="${Math.max(1.4, h * 0.07)}" stroke-linecap="round"/>` +
    lumps +
    `<ellipse cx="${f1(cx - rad * 0.15)}" cy="${f1(cy - rad * 0.35)}" rx="${f1(rad * 0.55)}" ry="${f1(rad * 0.28)}" fill="${light}"/>`
  );
};
const cypress = (x, y, h, fill = '#34502F') =>
  `<path d="M${x} ${y - h} C${x + h * 0.12} ${y - h * 0.7} ${x + h * 0.11} ${y - h * 0.15} ${x} ${y} C${x - h * 0.11} ${y - h * 0.15} ${x - h * 0.12} ${y - h * 0.7} ${x} ${y - h}Z" fill="${fill}"/>` +
  `<path d="M${x} ${y - h} C${x - h * 0.12} ${y - h * 0.7} ${x - h * 0.11} ${y - h * 0.15} ${x} ${y} Z" fill="#FFFFFF" opacity="0.08"/>`;
/** A whitewashed house with a terracotta roof, lit from the left, at village scale. */
const cottage = (x, y, w, h, trim = '') =>
  `<rect x="${x}" y="${y - h}" width="${w}" height="${h}" fill="#F4EEE2"/>` +
  `<rect x="${x + w * 0.7}" y="${y - h}" width="${w * 0.3}" height="${h}" fill="#DCD3C2"/>` +
  `<path d="M${x - 1} ${y - h} L${x + w * 0.15} ${y - h - w * 0.32} L${x + w * 0.85} ${y - h - w * 0.32} L${x + w + 1} ${y - h} Z" fill="#B9583E"/>` +
  `<path d="M${x + w * 0.5} ${y - h - w * 0.32} L${x + w * 0.85} ${y - h - w * 0.32} L${x + w + 1} ${y - h} L${x + w * 0.5} ${y - h} Z" fill="#9C4733"/>` +
  (trim ? `<rect x="${x}" y="${y - 1.6}" width="${w}" height="1.6" fill="${trim}"/>` : '') +
  `<rect x="${x + w * 0.22}" y="${y - h * 0.62}" width="${Math.max(1.4, w * 0.12)}" height="${h * 0.3}" fill="#5B5248"/>`;
const village = (x, y, n, seed, trim = '') => {
  const r = rng(seed);
  let out = '';
  let cx = x;
  for (let i = 0; i < n; i++) {
    const w = 9 + r() * 9;
    const h = 6 + r() * 5;
    const dy = (r() - 0.5) * 6 - Math.sin((i / n) * Math.PI) * 6;
    out += cottage(cx, y + dy, w, h, trim);
    cx += w * (0.7 + r() * 0.5);
  }
  return out;
};
const church = (x, y, s = 1) =>
  `<rect x="${x}" y="${y - 30 * s}" width="${9 * s}" height="${30 * s}" fill="#F4EEE2"/>` +
  `<rect x="${x + 6 * s}" y="${y - 30 * s}" width="${3 * s}" height="${30 * s}" fill="#DCD3C2"/>` +
  `<path d="M${x - 1} ${y - 30 * s} L${x + 4.5 * s} ${y - 38 * s} L${x + 9 * s + 1} ${y - 30 * s} Z" fill="#B9583E"/>` +
  `<rect x="${x + 3 * s}" y="${y - 26 * s}" width="${3 * s}" height="${4 * s}" fill="#5B5248"/>` +
  `<rect x="${x + 9 * s}" y="${y - 16 * s}" width="${24 * s}" height="${16 * s}" fill="#F4EEE2"/>` +
  `<path d="M${x + 9 * s} ${y - 16 * s} L${x + 21 * s} ${y - 22 * s} L${x + 33 * s + 1} ${y - 16 * s} Z" fill="#B9583E"/>`;
/** Rows of olive trees across a field, smaller towards the horizon. */
const grove = (x0, x1, y0, y1, seed, fill = '#5D7647') => {
  const r = rng(seed);
  let out = '';
  for (let y = y0; y <= y1; y += 5 + ((y - y0) / Math.max(1, y1 - y0)) * 5) {
    const s = 1.4 + ((y - y0) / Math.max(1, y1 - y0)) * 1.8;
    for (let x = x0 + r() * 8; x < x1; x += s * 4.2) {
      out += `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(s * 1.2)}" ry="${f1(s)}" fill="${fill}"/>`;
    }
  }
  return out;
};
/** Fine blades of grass for the foreground. */
const blades = (y0, y1, n, seed, color) => {
  const r = rng(seed);
  return `<g stroke="${color}" stroke-width="1.1" stroke-linecap="round" opacity="0.55">${Array.from(
    { length: n },
    () => {
      const x = r() * 1000;
      const y = y0 + r() * (y1 - y0);
      const h = 4 + r() * 9;
      return `<path d="M${f1(x)} ${f1(y)} q${f1((r() - 0.5) * 4)} ${f1(-h / 2)} ${f1((r() - 0.5) * 6)} ${f1(-h)}"/>`;
    },
  ).join('')}</g>`;
};
/** Gravel, as fine speckles inside a band. */
const speckle = (y0, y1, n, seed, colors) => {
  const r = rng(seed);
  return Array.from(
    { length: n },
    () =>
      `<circle cx="${f1(r() * 1000)}" cy="${f1(y0 + r() * (y1 - y0))}" r="${f1(0.6 + r() * 1.1)}" fill="${colors[Math.floor(r() * colors.length)]}"/>`,
  ).join('');
};
const sceneDefs = (sky) => `<defs>
  ${grad('sky', sky)}
  <filter id="soft" x="-20%" y="-200%" width="140%" height="500%"><feGaussianBlur stdDeviation="5"/></filter>
  <filter id="haze" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="0.6"/></filter>
</defs>`;
const HAZE = '#E6E3D4';
/** A hill layer, its colour faded towards the haze by `far` (0 near, 1 at the horizon). */
const layer = (d, color, far, id) =>
  `${grad(id, [
    [0, mix(color, HAZE, far * 0.85)],
    [1, mix(color, HAZE, far * 0.55)],
  ])}<path d="${d}" fill="url(#${id})"/>`;

// ---------- Scenes: 1000 x 620. ----------
const SKY = [
  [0, '#9DBFD6'],
  [0.5, '#CFE0E6'],
  [0.78, '#EDE6D2'],
  [1, '#F4E4C4'],
];

// The train runs along the Sintra line: wooded serra behind, olive groves and a white village.
const trainFar = ridge(318, 34, 11, { waves: 2.2 });
const trainMid = ridge(362, 16, 23, { waves: 3 });
const trainHills = ridge(402, 10, 37, { waves: 2.4, rough: 0.1 });
const trainNear = ridge(450, 5, 41, { waves: 2, rough: 0.06 });
const trainScene = svgClean(
  1000,
  620,
  `${sceneDefs(SKY)}
  <rect width="1000" height="620" fill="url(#sky)"/>
  ${stratus(220, 120, 160)} ${stratus(640, 84, 220, 0.45)} ${stratus(860, 190, 120, 0.4)}
  ${layer(trainFar, '#6F8C86', 1, 'l1')}
  ${layer(trainMid, '#5F7F5E', 0.75, 'l2')}
  ${[120, 190, 260, 610, 690, 760, 830].map((x, i) => pine(x, ridgeY(trainMid, x) + 4, 14 + (i % 3) * 3, mix('#3E5B37', HAZE, 0.5), mix('#58784A', HAZE, 0.5))).join('')}
  ${layer(trainHills, '#7C9A5E', 0.35, 'l3')}
  <path d="M300 ${ridgeY(trainHills, 300) + 6} L520 ${ridgeY(trainHills, 520) + 4} L540 446 L280 446 Z" fill="#C2AE6A" opacity="0.75"/>
  ${grove(560, 760, ridgeY(trainHills, 660) + 8, 440, 5)}
  ${church(420, ridgeY(trainHills, 420) + 8, 0.9)}
  ${village(452, ridgeY(trainHills, 470) + 8, 7, 9)}
  ${cypress(400, ridgeY(trainHills, 400) + 10, 30)} ${cypress(560, ridgeY(trainHills, 560) + 10, 26)}
  ${layer(trainNear, '#6E8C4C', 0, 'l4')}
  ${pine(330, 470, 44)} ${oak(250, 474, 30, 3)} ${oak(720, 472, 34, 4)} ${pine(800, 468, 52)} ${cypress(660, 470, 40)}
  ${[80, 300, 520, 740, 960].map((x) => `<path d="M${x} 490 L${x} 384 M${x} 391 L${x + 30} 391" fill="none" stroke="#5C6370" stroke-width="2.2" stroke-linecap="round"/>`).join('')}
  <path d="M-10 392 Q190 396 300 392 T520 392 T740 392 T960 392 T1010 392" fill="none" stroke="#4A505C" stroke-width="1"/>
  ${grad('ballast', [
    [0, '#B7AA95'],
    [1, '#968A77'],
  ])}
  <rect x="-10" y="484" width="1020" height="32" fill="url(#ballast)"/>
  ${speckle(486, 514, 700, 7, ['#8A7F6D', '#C8BCA8', '#7B7162'])}
  ${range(52)
    .map(
      (i) =>
        `<rect x="${i * 20 + 3}" y="490" width="9" height="22" rx="1" fill="#5E4A3B" opacity="0.85"/>`,
    )
    .join('')}
  <path d="M-10 495 L1010 495 M-10 507 L1010 507" stroke="#6E7682" stroke-width="3.4"/>
  <path d="M-10 493.6 L1010 493.6 M-10 505.6 L1010 505.6" stroke="#D5DBE2" stroke-width="1"/>
  ${grad('fg', [
    [0, '#7F9D58'],
    [1, '#5A7A3D'],
  ])}
  <path d="M-10 514 L1010 514 L1010 620 L-10 620 Z" fill="url(#fg)"/>
  <path d="${ridge(590, 14, 53, { waves: 1.6 })}" fill="#4F6D37" opacity="0.6"/>
  ${blades(526, 620, 520, 13, '#3F5A2C')}`,
);

// The coach crosses the Alentejo plain: golden wheat, cork oaks and a white farmstead.
const busFar = ridge(316, 22, 61, { waves: 1.8 });
const busMid = ridge(368, 10, 67, { waves: 2.6, rough: 0.08 });
const busPlain = ridge(420, 5, 71, { waves: 2, rough: 0.05 });
const busScene = svgClean(
  1000,
  620,
  `${sceneDefs(SKY)}
  <rect width="1000" height="620" fill="url(#sky)"/>
  ${stratus(300, 110, 200, 0.5)} ${stratus(760, 150, 160, 0.4)}
  ${layer(busFar, '#8C8AA2', 1, 'b1')}
  ${layer(busMid, '#9AA36A', 0.6, 'b2')}
  ${village(600, ridgeY(busMid, 620) + 8, 5, 21, '#3F6FA8')}
  ${layer(busPlain, '#C9AE62', 0.2, 'b3')}
  ${range(14)
    .map(
      (i) =>
        `<path d="M-10 ${430 + i * 3.4} C300 ${428 + i * 3.4} 700 ${432 + i * 3.4} 1010 ${430 + i * 3.4}" fill="none" stroke="#B49853" stroke-width="0.8" opacity="0.5"/>`,
    )
    .join('')}
  ${oak(90, 448, 34, 5)} ${oak(200, 436, 22, 6)} ${oak(420, 440, 26, 7)} ${oak(560, 434, 18, 8)} ${oak(880, 444, 32, 9)} ${oak(760, 432, 16, 10)}
  ${cottage(300, 440, 34, 16, '#3F6FA8')} ${cottage(334, 440, 20, 12, '#3F6FA8')}
  <path d="M-10 466 L1010 466 L1010 478 L-10 478 Z" fill="#C9BBA0"/>
  ${speckle(467, 477, 220, 17, ['#B3A487', '#DDD1B8'])}
  ${grad('road', [
    [0, '#6A6E76'],
    [1, '#4E525A'],
  ])}
  <rect x="-10" y="478" width="1020" height="48" fill="url(#road)"/>
  <path d="M-10 481 L1010 481 M-10 523 L1010 523" stroke="#ECE6D8" stroke-width="2"/>
  ${range(21)
    .map((i) => `<rect x="${i * 50 + 8}" y="500.5" width="28" height="3" fill="#ECE6D8"/>`)
    .join('')}
  <path d="M-10 526 L1010 526 L1010 536 L-10 536 Z" fill="#C9BBA0"/>
  ${grad('bfg', [
    [0, '#BFA65E'],
    [1, '#98843F'],
  ])}
  <path d="M-10 536 L1010 536 L1010 620 L-10 620 Z" fill="url(#bfg)"/>
  ${range(12)
    .map(
      (i) =>
        `<rect x="${i * 90 + 30}" y="536" width="4" height="16" fill="#F4EEE2"/><rect x="${i * 90 + 30}" y="540" width="4" height="3" fill="#C8553D"/>`,
    )
    .join('')}
  ${blades(548, 620, 520, 19, '#7A6830')}`,
);

// From the plane: the patchwork of fields seen from above, a river, haze at the horizon.
const FIELD = [
  '#9DAA6A',
  '#B9B176',
  '#8C9F5E',
  '#C7B57E',
  '#A9A46C',
  '#7E9358',
  '#CDBD8A',
  '#94A16A',
];
const planeFields = (() => {
  const r = rng(91);
  let out = '';
  let y = 418;
  let h = 5;
  while (y < 620) {
    const far = Math.max(0, 1 - (y - 418) / 200);
    let x = -10 - r() * 40;
    while (x < 1010) {
      const w = (40 + r() * 70) * (0.6 + (h / 30) * 0.8);
      out += `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" fill="${mix(FIELD[Math.floor(r() * FIELD.length)], HAZE, far * 0.7)}"/>`;
      if (r() > 0.55 && h > 10)
        out += grove(
          x + 4,
          x + w - 4,
          y + 3,
          y + h - 3,
          Math.floor(r() * 1e6),
          mix('#5D7647', HAZE, far * 0.6),
        );
      if (r() > 0.85 && h > 14)
        out += village(x + 6, y + h - 3, 3 + Math.floor(r() * 3), Math.floor(r() * 1e6));
      x += w + 1;
    }
    out += `<path d="M-10 ${f1(y + h)} L1010 ${f1(y + h)}" stroke="${mix('#6E8350', HAZE, far * 0.7)}" stroke-width="${f1(0.6 + h / 30)}"/>`;
    y += h + 1;
    h = h * 1.22 + 1;
  }
  return out;
})();
const planeScene = svgClean(
  1000,
  620,
  `${sceneDefs([
    [0, '#8FB6D2'],
    [0.55, '#CADDE6'],
    [0.68, '#EAE6D6'],
    [1, '#EAE6D6'],
  ])}
  <rect width="1000" height="620" fill="url(#sky)"/>
  ${stratus(180, 150, 180, 0.6)} ${stratus(560, 90, 240, 0.5)} ${stratus(820, 250, 170, 0.5)} ${stratus(380, 320, 200, 0.45)}
  ${layer(ridge(414, 8, 97, { waves: 2.5 }), '#8FA1A6', 1, 'p1')}
  ${planeFields}
  <path d="M-10 470 C160 462 300 488 420 474 C560 458 640 520 800 540 C880 552 960 600 1010 620" fill="none" stroke="#6F9AB6" stroke-width="7" stroke-linecap="round" opacity="0.9"/>
  <path d="M-10 470 C160 462 300 488 420 474 C560 458 640 520 800 540 C880 552 960 600 1010 620" fill="none" stroke="#A9C7D8" stroke-width="1.5" stroke-linecap="round" opacity="0.8"/>
  <rect y="400" width="1000" height="40" fill="url(#sky)" opacity="0"/>`,
);

// ---------- City landmarks: 400 x 400, engraved like the city stamps (thin ink, flat inks,
// fine hatching), each standing on a patch of ground that fades out so it sits in any scene. ----------
const LINE = '#4A2A2E';
const l = (w = 2.4) =>
  `stroke="${LINE}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const P = (d, fill, w = 2.4) => `<path d="${d}" fill="${fill}" ${l(w)}/>`;
const R = (x, y, w, h, fill, sw = 2.4) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${l(sw)}/>`;
/** Engraving hatch over a shape, as on the stamps. */
const H = (d, op = 0.18) => `<path d="${d}" fill="url(#hatch)" opacity="${op}"/>`;
const RH = (x, y, w, h, fill, sw = 2.4) =>
  R(x, y, w, h, fill, sw) +
  `<rect x="${x}" y="${y}" width="${w * 0.35}" height="${h}" fill="url(#hatch)" opacity="0.2" transform="translate(${w * 0.65} 0)"/>`;
const arch = (x, y, w, h, fill = '#2C3E66', sw = 2) =>
  `<path d="M${x} ${y + h} L${x} ${y + w / 2} A${w / 2} ${w / 2} 0 0 1 ${x + w} ${y + w / 2} L${x + w} ${y + h} Z" fill="${fill}" ${l(sw)}/>`;
const merlons = (x, y, w, n, fill, mh = 10) =>
  range(n)
    .map((i) => R(f1(x + (i * w) / n + 2), y - mh, f1(w / n - 5), mh, fill, 2))
    .join('');
const waves = (y0, y1, seed) => {
  const r = rng(seed);
  let out = '';
  for (let y = y0; y < y1; y += 12) {
    const x = r() * 80;
    out += `<path d="M${f1(x)} ${y} q10 -4 20 0 t20 0 t20 0 M${f1(x + 180)} ${y + 5} q10 -4 20 0 t20 0" fill="none" stroke="${LINE}" stroke-width="1.4" opacity="0.35"/>`;
  }
  return out;
};
const cityDefs = `<defs>
  <pattern id="hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0 L0 5" stroke="${LINE}" stroke-width="1.2"/></pattern>
  <radialGradient id="fade" cx="200" cy="300" r="210" gradientUnits="userSpaceOnUse" gradientTransform="translate(200 300) scale(1 0.55) translate(-200 -300)">
    <stop offset="0.6" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
  </radialGradient>
  <mask id="ground" maskUnits="userSpaceOnUse" x="0" y="0" width="400" height="400"><rect width="400" height="400" fill="url(#fade)"/></mask>
</defs>`;
/** Ground or water under a landmark, fading out all round so it sits in any scene. */
const base = (body) => `<g mask="url(#ground)">${body}</g>`;
const WATER = '#7E9FB6';

const cities = {
  // Pena Palace: the yellow domed tower, red keep, lilac clock tower and the red-domed turret.
  sintra: `
    ${base(`<path d="M0 400 L0 330 C60 300 130 286 200 288 C280 290 340 306 400 330 L400 400 Z" fill="#3F5D3A"/>
      ${range(16)
        .map(
          (i) =>
            `<circle cx="${12 + i * 25}" cy="${312 + Math.abs(8 - i) * 2.6}" r="${15 + (i % 3) * 3}" fill="${i % 2 ? '#47683F' : '#3A5634'}"/>`,
        )
        .join('')}`)}
    ${RH(150, 196, 140, 104, '#B8433A')} ${merlons(150, 196, 140, 7, '#B8433A')}
    ${range(5)
      .map((i) => arch(160 + i * 26, 220, 14, 30))
      .join('')}
    ${range(4)
      .map((i) => arch(168 + i * 30, 262, 16, 34, '#5A1F22'))
      .join('')}
    ${RH(226, 118, 44, 80, '#B7A2CF')} ${merlons(226, 118, 44, 3, '#B7A2CF')}
    <circle cx="248" cy="146" r="12" fill="#FBF4E4" ${l(2)}/><path d="M248 146 L248 138 M248 146 L254 149" stroke="${LINE}" stroke-width="2" stroke-linecap="round"/>
    ${arch(240, 166, 16, 26, '#5A1F22')}
    ${RH(104, 150, 52, 152, '#E9B23F')}
    ${R(98, 146, 64, 12, '#E9B23F', 2)}
    ${P('M106 146 C106 112 120 94 130 88 C140 94 154 112 154 146 Z', '#E39B2E')} ${H('M106 146 C106 112 120 94 130 88 C140 94 154 112 154 146 Z', 0.15)}
    <path d="M130 88 L130 72" stroke="${LINE}" stroke-width="2.4"/><circle cx="130" cy="70" r="4" fill="#B8433A" ${l(1.6)}/>
    ${[
      [114, 172],
      [136, 172],
      [114, 222],
      [136, 222],
    ]
      .map(([x, y]) => arch(x, y, 12, 26, '#5A1F22'))
      .join('')}
    ${RH(290, 214, 50, 88, '#E6DCC8')} ${R(286, 208, 58, 10, '#E6DCC8', 2)}
    ${P('M292 208 C292 186 304 172 315 164 C326 172 338 186 338 208 Z', '#C2443B')}
    ${arch(300, 232, 12, 24, '#5A1F22')} ${arch(320, 232, 12, 24, '#5A1F22')}`,
  // Belém Tower standing in the Tagus.
  lisbon: `
    ${base(`<rect x="0" y="300" width="400" height="100" fill="${WATER}"/>${waves(318, 396, 3)}`)}
    ${RH(116, 236, 168, 72, '#EDE3CB')}
    ${merlons(116, 236, 168, 9, '#EDE3CB', 9)}
    ${[116, 276].map((x) => P(`M${x - 4} 236 L${x + 12} 236 L${x + 12} 222 C${x + 12} 212 ${x - 4} 212 ${x - 4} 222 Z`, '#EDE3CB', 2) + P(`M${x - 4} 222 C${x - 4} 210 ${x + 4} 204 ${x + 4} 204 C${x + 4} 204 ${x + 12} 210 ${x + 12} 222 Z`, '#DCCFAF', 1.8)).join('')}
    ${[136, 164, 222, 250].map((x) => arch(x, 262, 14, 30)).join('')}
    ${RH(164, 100, 72, 140, '#EDE3CB')}
    ${merlons(164, 100, 72, 5, '#EDE3CB', 9)}
    ${[164, 236].map((x) => P(`M${x - 8} 100 L${x + 8} 100 L${x + 8} 88 C${x + 8} 78 ${x - 8} 78 ${x - 8} 88 Z`, '#EDE3CB', 2) + P(`M${x - 8} 88 C${x - 8} 76 ${x} 68 ${x} 68 C${x} 68 ${x + 8} 76 ${x + 8} 88 Z`, '#DCCFAF', 1.8)).join('')}
    ${arch(186, 118, 28, 40)} ${R(176, 160, 48, 6, '#DCCFAF', 1.8)}
    ${arch(190, 184, 20, 30)}
    ${P('M193 214 L207 214 L207 226 C207 232 200 234 200 234 C200 234 193 232 193 226 Z', '#E9B23F', 1.8)}
    ${P('M296 300 L330 300 L326 292 L300 292 Z', '#8C5A3C', 1.8)} <path d="M313 292 L313 262" stroke="${LINE}" stroke-width="2"/>${P('M314 264 L330 284 L314 284 Z', '#FBF4E4', 1.8)}`,
  // The Dom Luís I bridge over the Douro, the Ribeira houses and a rabelo boat.
  porto: `
    ${base(`<rect x="0" y="300" width="400" height="100" fill="${WATER}"/>${waves(318, 396, 5)}`)}
    ${[
      [0, 180, '#C2443B'],
      [36, 196, '#E9B23F'],
      [70, 186, '#8FB0D6'],
      [104, 206, '#E07A5F'],
      [138, 214, '#9DBA7C'],
    ]
      .map(
        ([x, y, f]) =>
          RH(x, y, 34, 300 - y, f, 2) +
          P(`M${x - 2} ${y} L${x + 17} ${y - 14} L${x + 36} ${y} Z`, '#9C4733', 2) +
          R(x + 9, y + 18, 7, 12, '#2C3E66', 1.6) +
          R(x + 20, y + 18, 7, 12, '#2C3E66', 1.6) +
          R(x + 9, y + 44, 7, 12, '#2C3E66', 1.6),
      )
      .join('')}
    ${(() => {
      // Two iron arches, outer and inner, braced by a zigzag lattice; the deck rests on the crown.
      const outer = (t) => 300 - 4 * t * (1 - t) * 146;
      const inner = (t) => 300 - 4 * t * (1 - t) * 122;
      const X = (t) => 30 + t * 340;
      const pts = range(25).map((i) => {
        const t = 0.02 + (i / 24) * 0.96;
        return [f1(X(t)), f1(i % 2 ? inner(t) : outer(t))];
      });
      const curve = (fn) =>
        range(41)
          .map((i) => `${f1(X(i / 40))} ${f1(fn(i / 40))}`)
          .join(' L');
      return (
        `<path d="M${curve(outer)}" fill="none" stroke="#7A2E36" stroke-width="6" stroke-linejoin="round"/>` +
        `<path d="M${curve(inner)}" fill="none" stroke="#7A2E36" stroke-width="3" stroke-linejoin="round"/>` +
        `<path d="M${pts.map(([x, y]) => `${x} ${y}`).join(' L')}" fill="none" stroke="#7A2E36" stroke-width="1.6"/>` +
        [0.12, 0.2, 0.28, 0.72, 0.8, 0.88]
          .map(
            (t) =>
              `<path d="M${f1(X(t))} 152 L${f1(X(t))} ${f1(outer(t))}" stroke="#7A2E36" stroke-width="2.4"/>`,
          )
          .join('') +
        R(16, 144, 368, 9, '#7A2E36', 2)
      );
    })()}
    ${P('M196 316 L330 316 C322 334 300 342 276 342 L232 342 C212 342 200 332 196 316 Z', '#6B3B2A', 2)}
    ${range(3)
      .map((k) => R(226 + k * 26, 296, 22, 20, '#C9A66B', 1.8))
      .join('')}
    <path d="M262 316 L262 252" stroke="${LINE}" stroke-width="2.4"/>${R(240, 256, 44, 34, '#FBF4E4', 2)}`,
  // The Roman temple of Évora, with a cypress.
  evora: `
    ${base(`<path d="M0 400 L0 312 C120 300 280 300 400 312 L400 400 Z" fill="#CDB67E"/>${H('M0 400 L0 312 C120 300 280 300 400 312 L400 400 Z', 0.12)}`)}
    ${RH(70, 236, 260, 76, '#CBBB97')}
    ${range(4)
      .map(
        (k) =>
          `<path d="M70 ${254 + k * 16} L330 ${254 + k * 16}" stroke="${LINE}" stroke-width="1.2" opacity="0.5"/>`,
      )
      .join('')}
    ${range(12)
      .map(
        (k) =>
          `<path d="M${84 + k * 22 + (k % 2) * 8} ${254} L${84 + k * 22 + (k % 2) * 8} 270" stroke="${LINE}" stroke-width="1.2" opacity="0.4"/>`,
      )
      .join('')}
    ${R(60, 224, 280, 14, '#DCCFAF', 2)}
    ${range(6)
      .map(
        (k) =>
          R(84 + k * 44, 106, 22, 118, '#F1E9D6', 2) +
          `<path d="M${90 + k * 44} 112 L${90 + k * 44} 220 M${95 + k * 44} 112 L${95 + k * 44} 220 M${100 + k * 44} 112 L${100 + k * 44} 220" stroke="${LINE}" stroke-width="0.9" opacity="0.45"/>` +
          P(
            `M${78 + k * 44} 106 L${112 + k * 44} 106 L${108 + k * 44} 92 L${82 + k * 44} 92 Z`,
            '#E3D7BC',
            1.8,
          ),
      )
      .join('')}
    ${R(70, 74, 260, 18, '#E3D7BC', 2)} ${R(96, 62, 150, 12, '#E3D7BC', 2)}
    ${cypress(362, 316, 150, '#3E5B37')} ${cypress(36, 318, 96, '#4A6A40')}`,
  // Costa Nova's striped palheiros and a moliceiro on the ria.
  aveiro: `
    ${base(`<rect x="0" y="296" width="400" height="104" fill="${WATER}"/>${waves(314, 396, 7)}`)}
    ${[
      [18, 168, '#B8433A'],
      [104, 146, '#2F5C9C'],
      [190, 176, '#3E8E6A'],
      [276, 156, '#C9A13B'],
    ]
      .map(
        ([x, y, f]) =>
          `<rect x="${x}" y="${y}" width="80" height="${296 - y}" fill="#FBF4E4"/>` +
          range(5)
            .map(
              (k) =>
                `<rect x="${x + 3 + k * 16}" y="${y}" width="8" height="${296 - y}" fill="${f}"/>`,
            )
            .join('') +
          `<rect x="${x}" y="${y}" width="80" height="${296 - y}" fill="none" ${l(2.2)}/>` +
          P(`M${x - 4} ${y} L${x + 40} ${y - 30} L${x + 84} ${y} Z`, f, 2.2) +
          R(x + 26, y + 34, 28, 34, '#FBF4E4', 2) +
          R(x + 32, y + 40, 16, 22, '#2C3E66', 1.6),
      )
      .join('')}
    ${P('M44 286 C60 330 130 340 200 340 C280 340 330 326 356 280 C340 292 318 306 290 312 L112 312 C84 308 62 298 44 286 Z', '#2B2F3A', 2.2)}
    ${P('M112 312 L290 312 C284 324 270 330 250 330 L150 330 C130 330 118 324 112 312 Z', '#E9B23F', 2)}
    ${P('M46 288 C38 258 44 236 58 226 C62 252 68 276 80 302 Z', '#C2443B', 2)}
    ${P('M354 282 C366 254 364 230 350 218 C348 246 342 268 328 296 Z', '#3E8E6A', 2)}`,
  // Ponta da Piedade: golden cliffs, a sea arch and the lighthouse.
  algarve: `
    ${base(`<rect x="0" y="290" width="400" height="110" fill="#5E9AA8"/>${waves(308, 396, 9)}`)}
    ${P('M0 300 L0 180 C30 170 70 176 96 190 L110 300 Z', '#D99A4E')} ${H('M0 300 L0 180 C30 170 70 176 96 190 L110 300 Z', 0.22)}
    ${R(40, 140, 14, 40, '#FBF4E4', 2)} ${R(38, 132, 18, 10, '#C2443B', 2)} ${P('M40 132 L47 122 L54 132 Z', '#C2443B', 2)}
    ${R(56, 162, 26, 18, '#FBF4E4', 2)} ${P('M54 162 L69 152 L84 162 Z', '#C2443B', 2)}
    ${P('M150 300 L150 214 C170 176 214 160 262 166 C320 174 372 200 400 214 L400 300 L330 300 C330 256 304 228 272 228 C240 228 222 256 222 300 Z', '#E2A75B')}
    ${H('M150 300 L150 214 C170 176 214 160 262 166 C320 174 372 200 400 214 L400 300 L330 300 C330 256 304 228 272 228 C240 228 222 256 222 300 Z', 0.22)}
    ${P('M150 214 C170 176 214 160 262 166 C320 174 372 200 400 214 L400 204 C370 180 320 156 262 152 C210 150 166 170 150 214 Z', '#6B8E3D', 2)}
    ${P('M118 300 C118 270 126 248 136 244 C146 250 150 272 150 300 Z', '#D99A4E', 2)}`,
};
// ---------- Vehicles, facing right: crisp flat vectors with thin ink outlines. ----------
const GLASS = '#22293A';
const GLASS_HI = '#5C6B85';
const STEEL = '#C9D2DE';
const bogie = (x, w) =>
  `<rect x="${x}" y="170" width="${w}" height="12" rx="3" fill="#3A3F4B" ${o(1.6)}/>` +
  [x + 22, x + w - 22]
    .map(
      (cx) =>
        `<circle cx="${cx}" cy="184" r="13" fill="#2B2F3A" ${o(1.6)}/><circle cx="${cx}" cy="184" r="5" fill="${STEEL}" class="ns"/>`,
    )
    .join('');
const vehicles = {
  train: svgClean(
    700,
    200,
    `
    <path d="M232 44 L262 14 L292 44 M250 14 L276 14" fill="none" ${o(2.4)}/>
    <rect x="200" y="40" width="120" height="8" rx="3" fill="${STEEL}" ${o(1.6)}/>
    <path d="M10 50 L586 50 C636 50 670 74 688 118 L694 148 L694 168 L10 168 Z" fill="#FFFFFF" ${o(2.6)}/>
    <path d="M10 120 L688 120 L694 148 L694 168 L10 168 Z" fill="#2E2A72" class="ns"/>
    <path d="M10 117 L687 117" fill="none" stroke="${C.mustard}" stroke-width="5"/>
    <path d="M586 52 C634 52 666 76 684 116" fill="none" stroke="${C.mustard}" stroke-width="5"/>
    <path d="M598 64 C630 66 654 84 668 108 L598 108 Z" fill="${GLASS}" ${o(1.8)}/>
    <path d="M606 72 L626 72 L612 100 L604 100 Z" fill="${GLASS_HI}" class="ns"/>
    ${[22, 84, 186, 248, 360, 422, 508]
      .map(
        (x) =>
          `<rect x="${x}" y="66" width="52" height="34" rx="6" fill="${GLASS}" ${o(1.6)}/><path d="M${x + 6} ${70} L${x + 18} 70 L${x + 10} 96 L${x + 4} 96 Z" fill="${GLASS_HI}" class="ns"/>`,
      )
      .join('')}
    ${[140, 302, 566]
      .map(
        (x) =>
          `<rect x="${x}" y="58" width="40" height="110" rx="3" fill="#2E2A72" ${o(1.8)}/><rect x="${x + 6}" y="66" width="12" height="34" rx="2" fill="${GLASS}" class="ns"/><rect x="${x + 22}" y="66" width="12" height="34" rx="2" fill="${GLASS}" class="ns"/><path d="M${x + 20} 58 L${x + 20} 168" stroke="${INK}" stroke-width="1.4"/><path d="M${x + 14} 112 L${x + 14} 140 M${x + 26} 112 L${x + 26} 140" stroke="${C.mustard}" stroke-width="2.4" stroke-linecap="round"/>`,
      )
      .join('')}
    <path d="M296 52 L296 166" stroke="${STEEL}" stroke-width="2"/>
    <circle cx="470" cy="140" r="10" fill="${C.mustard}" ${o(1.4)}/>
    <circle cx="494" cy="140" r="10" fill="#4FB3D9" ${o(1.4)}/>
    <rect x="672" y="134" width="16" height="8" rx="3" fill="#FFF4C2" ${o(1.4)}/>
    <rect x="10" y="166" width="684" height="8" fill="#4A4F5C" ${o(1.6)}/>
    ${bogie(54, 120)} ${bogie(470, 130)}`,
  ),
  coach: svgClean(
    420,
    170,
    `
    <path d="M12 28 L356 28 C390 28 406 52 410 86 L412 134 L12 134 C8 134 6 130 6 126 L6 34 C6 30 8 28 12 28 Z" fill="#FFFFFF" ${o(2.4)}/>
    <path d="M6 96 L411 96 L412 134 L12 134 C8 134 6 130 6 126 Z" fill="#2E8B6A" class="ns"/>
    <path d="M6 94 C120 94 220 78 410 70" fill="none" stroke="${C.mustard}" stroke-width="5"/>
    <rect x="18" y="40" width="304" height="40" rx="6" fill="${GLASS}" ${o(1.6)}/>
    ${[78, 138, 198, 258].map((x) => `<path d="M${x} 40 L${x} 80" stroke="#FFFFFF" stroke-width="3"/>`).join('')}
    ${[22, 82, 142, 202, 262].map((x) => `<path d="M${x + 6} 44 L${x + 18} 44 L${x + 10} 76 L${x + 4} 76 Z" fill="${GLASS_HI}" class="ns"/>`).join('')}
    <path d="M354 38 C384 40 400 60 404 86 L354 86 Z" fill="${GLASS}" ${o(1.6)}/>
    <path d="M362 44 L378 44 L366 80 L360 80 Z" fill="${GLASS_HI}" class="ns"/>
    <rect x="326" y="40" width="24" height="92" rx="3" fill="${GLASS}" ${o(1.6)}/>
    <path d="M338 40 L338 132" stroke="${INK}" stroke-width="1.2"/>
    <rect x="398" y="104" width="12" height="8" rx="3" fill="#FFF4C2" ${o(1.2)}/>
    <path d="M404 44 L414 40 L416 58" fill="none" ${o(2)}/>
    <rect x="6" y="132" width="406" height="8" fill="#3A3F4B" ${o(1.4)}/>
    ${[88, 318]
      .map(
        (x) =>
          `<path d="M${x - 30} 134 A30 30 0 0 1 ${x + 30} 134" fill="#2B2F3A" class="ns"/><circle cx="${x}" cy="140" r="22" fill="#2B2F3A" ${o(1.6)}/><circle cx="${x}" cy="140" r="9" fill="${STEEL}" ${o(1.2)}/>`,
      )
      .join('')}`,
  ),
  plane: svgClean(
    360,
    180,
    `
    <path d="M38 94 L26 26 L58 26 L98 88 Z" fill="#4F78A8" ${o(2)}/>
    <path d="M30 40 L64 40 M33 52 L72 52" stroke="#D9534F" stroke-width="4"/>
    <path d="M42 102 L86 102 L74 116 L38 116 Z" fill="#4F78A8" ${o(1.8)}/>
    <path d="M30 98 C30 86 44 80 62 80 L284 80 C318 80 346 92 352 104 C346 118 318 126 284 126 L62 126 C44 126 30 116 30 104 Z" fill="#FFFFFF" ${o(2.2)}/>
    <path d="M34 112 L348 112 C336 121 314 126 284 126 L62 126 C48 126 38 120 34 112 Z" fill="#4F78A8" class="ns"/>
    <path d="M34 109 L346 109" stroke="#D9534F" stroke-width="3"/>
    <path d="M316 88 C330 90 340 96 345 103 L316 103 Z" fill="#9DB8D6" ${o(1.6)}/>
    ${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<rect x="${136 + i * 20}" y="89" width="10" height="11" rx="3" fill="#9DB8D6" ${o(1.3)}/>`).join('')}
    <rect x="104" y="86" width="12" height="22" rx="3" fill="none" ${o(1.4)}/>
    <rect x="296" y="86" width="12" height="22" rx="3" fill="none" ${o(1.4)}/>
    <path d="M150 114 L236 114 L200 160 L178 160 Z" fill="#FFFFFF" ${o(2)}/>
    <rect x="166" y="128" width="46" height="20" rx="10" fill="#4F78A8" ${o(1.8)}/>
    <path d="M204 128 L204 148" stroke="#D9534F" stroke-width="3"/>
    <path d="M0 92 L22 92 M6 106 L24 106" stroke="#4F78A8" stroke-width="2.4" stroke-linecap="round"/>`,
  ),
};

const pages = [
  ['scene-train.webp', trainScene, 1000, 620],
  ['scene-bus.webp', busScene, 1000, 620],
  ['scene-plane.webp', planeScene, 1000, 620],
  ...Object.entries(cities).map(([slug, body]) => [
    `city-${slug}.webp`,
    svgClean(400, 400, cityDefs + body),
    400,
    400,
  ]),
  ...Object.entries(vehicles).map(([name, s]) => {
    const [, w, h] = s.match(/viewBox="0 0 (\d+) (\d+)"/);
    return [`vehicle-${name}.webp`, s, +w, +h];
  }),
];

await renderWebp(pages, out);
console.log(`wrote ${pages.length} files to ${out}`);
