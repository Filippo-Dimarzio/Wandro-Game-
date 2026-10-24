// Renders the arrival-screen artwork (assets/trip): a landscape for each way of travelling, a
// landmark vignette for each launch city (drawn like the Wandro stamps) and the three vehicles, all
// as clean flat vectors with thin ink outlines. Needs Playwright's Chromium:
// node scripts/render-trip.mjs (writes WebP)
import { C, range, renderWebp, shade, svgClean } from './paper-art.mjs';

const root = process.env.MOBILE_ROOT ?? new URL('..', import.meta.url).pathname;
const out = `${root}/assets/trip`;

// ---------- Clean flat-vector kit: thin ink outlines, flat fills, a shadow side for depth. ----------
const INK = '#1F2A44';
const o = (w = 2) =>
  `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const P = (d, fill, w = 2) => `<path d="${d}" fill="${fill}" ${o(w)}/>`;
const R = (x, y, w, h, fill, rx = 0, sw = 2) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" ${o(sw)}/>`;
const NS = (d, fill, op = 1) => `<path d="${d}" fill="${fill}" opacity="${op}"/>`;
const G = {
  sky: '#CFE6F2',
  cloud: '#FFFFFF',
  cloudShade: '#E3F0F7',
  far: '#A9C7B0',
  mid: '#7FAE6A',
  near: '#6B9A4E',
  dark: '#3F6B3A',
  grass: '#8DBB6A',
  field: '#E9C46A',
  soil: '#D9A86C',
  steel: '#8A93A3',
  ballast: '#B9A68C',
  sleeper: '#6B4A35',
  road: '#596070',
  water: '#4F8FC0',
  waterHi: '#8BC2E3',
  wall: '#FBF4E4',
  roof: '#C8553D',
  glass: '#2F3B57',
};
/** A flat cloud with a level base, like the reference plane's sky. */
const cloud = (x, y, s, fill = G.cloud) =>
  `<path d="M${x} ${y} C${x} ${y - 18 * s} ${x + 18 * s} ${y - 26 * s} ${x + 32 * s} ${y - 18 * s} C${x + 40 * s} ${y - 40 * s} ${x + 78 * s} ${y - 40 * s} ${x + 84 * s} ${y - 16 * s} C${x + 100 * s} ${y - 22 * s} ${x + 116 * s} ${y - 12 * s} ${x + 114 * s} ${y} Z" fill="${fill}"/>` +
  `<path d="M${x} ${y} L${x + 114 * s} ${y}" stroke="${G.cloudShade}" stroke-width="${3 * s}" stroke-linecap="round"/>`;
/** Round-crowned tree with a highlight, or a tall cypress. */
const tree = (x, y, r, crown = G.near) =>
  R(x - r * 0.09, y - r * 0.2, r * 0.18, r * 0.9, '#7A5236', 1, 1.6) +
  `<circle cx="${x}" cy="${y - r * 0.55}" r="${r}" fill="${crown}" ${o(1.8)}/>` +
  NS(
    `M${x - r * 0.62} ${y - r * 0.8} A${r * 0.7} ${r * 0.7} 0 0 1 ${x + r * 0.1} ${y - r * 1.38} A${r * 0.9} ${r * 0.9} 0 0 0 ${x - r * 0.62} ${y - r * 0.8}Z`,
    '#FFFFFF',
    0.22,
  );
const cypress = (x, y, h) =>
  `<path d="M${x} ${y - h} C${x + h * 0.16} ${y - h * 0.7} ${x + h * 0.15} ${y - h * 0.15} ${x} ${y} C${x - h * 0.15} ${y - h * 0.15} ${x - h * 0.16} ${y - h * 0.7} ${x} ${y - h}Z" fill="${G.dark}" ${o(1.8)}/>`;
/** A little white village house with a terracotta roof. */
const house = (x, y, w, h) =>
  R(x, y - h, w, h, G.wall, 0, 1.6) +
  P(`M${x - 3} ${y - h} L${x + w / 2} ${y - h - w * 0.45} L${x + w + 3} ${y - h} Z`, G.roof, 1.6) +
  R(x + w * 0.3, y - h * 0.62, w * 0.22, h * 0.32, G.glass, 1, 1);
const flowers = (pts, fill) =>
  pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" fill="${fill}" ${o(1.2)}/>`).join('');

// ---------- Scenes: 1000 x 620. ----------
const trainScene = svgClean(
  1000,
  620,
  `
  <rect width="1000" height="620" fill="${G.sky}"/>
  <circle cx="820" cy="120" r="46" fill="${C.mustard}"/>
  ${cloud(90, 120, 1.3)} ${cloud(470, 80, 0.9)} ${cloud(640, 170, 1.1)}
  ${P('M0 330 C120 250 210 270 300 300 C380 240 470 230 560 290 C660 240 780 220 1000 300 L1000 620 L0 620 Z', G.far)}
  ${P('M0 380 C140 340 260 360 380 350 C520 338 640 372 780 352 C880 340 950 348 1000 352 L1000 620 L0 620 Z', G.mid)}
  ${house(430, 352, 30, 22)} ${house(468, 350, 26, 20)} ${house(500, 352, 30, 24)}
  ${P('M330 420 C420 392 560 392 660 418 L660 440 L330 440 Z', G.field, 1.8)}
  ${[350, 380, 410, 440, 470, 500, 530, 560, 590, 620].map((x) => `<path d="M${x} 420 L${x + 10} 438" stroke="${C.ochre}" stroke-width="2" stroke-linecap="round"/>`).join('')}
  ${P('M0 440 C160 420 320 440 500 434 C680 428 840 440 1000 436 L1000 620 L0 620 Z', G.near)}
  ${tree(340, 446, 18, G.dark)} ${cypress(640, 440, 52)} ${cypress(664, 444, 40)} ${tree(700, 444, 16)}
  ${[120, 360, 600, 840].map((x) => `<path d="M${x} 492 L${x} 404 M${x - 2} 410 L${x + 34} 410" fill="none" ${o(2.2)}/>`).join('')}
  <path d="M0 414 Q120 424 240 414 T480 414 T720 414 T1000 414" fill="none" stroke="${INK}" stroke-width="1.4"/>
  ${R(-4, 486, 1008, 28, G.ballast, 0, 2)}
  ${range(46)
    .map(
      (i) =>
        `<rect x="${i * 22 + 2}" y="490" width="10" height="20" rx="1.5" fill="${G.sleeper}"/>`,
    )
    .join('')}
  <path d="M-4 494 L1004 494 M-4 506 L1004 506" stroke="${G.steel}" stroke-width="4"/>
  <path d="M-4 492 L1004 492 M-4 504 L1004 504" stroke="${INK}" stroke-width="1.2"/>
  ${P('M0 514 C200 520 360 512 520 518 C700 524 860 514 1000 518 L1000 620 L0 620 Z', G.grass)}
  ${P('M0 566 C70 548 150 556 210 584 L224 620 L0 620 Z', G.near)}
  ${P('M1000 556 C920 546 840 560 790 596 L780 620 L1000 620 Z', G.dark)}
  ${range(10)
    .map(
      (i) =>
        `<path d="M${300 + i * 34} 612 L${304 + i * 34} 596 L${308 + i * 34} 612" fill="none" stroke="${G.dark}" stroke-width="2"/>`,
    )
    .join('')}
  ${flowers(
    [
      [280, 560],
      [340, 580],
      [420, 566],
      [520, 586],
      [620, 568],
      [700, 584],
    ],
    C.coral,
  )}`,
);

const busScene = svgClean(
  1000,
  620,
  `
  <rect width="1000" height="620" fill="${G.sky}"/>
  <circle cx="180" cy="120" r="44" fill="${C.mustard}"/>
  ${cloud(520, 110, 1.2)} ${cloud(300, 190, 0.7)} ${cloud(800, 160, 0.9)}
  ${P('M0 320 C110 250 200 240 300 280 C380 250 470 240 560 286 C660 240 780 226 1000 290 L1000 620 L0 620 Z', '#B6A6CF')}
  ${P('M0 372 C140 342 280 360 420 350 C560 340 700 366 840 352 C910 346 960 350 1000 352 L1000 620 L0 620 Z', G.mid)}
  ${P('M0 404 C200 392 400 406 600 400 C760 396 900 402 1000 404 L1000 470 L0 470 Z', G.field, 1.8)}
  ${range(18)
    .map(
      (i) =>
        `<path d="M${30 + i * 54} 420 L${40 + i * 54} 446" stroke="${C.ochre}" stroke-width="2" stroke-linecap="round"/>`,
    )
    .join('')}
  ${tree(120, 410, 26, G.dark)} ${tree(520, 404, 22)} ${tree(880, 404, 28, G.dark)} ${cypress(660, 400, 46)}
  ${house(300, 396, 30, 22)} ${house(336, 396, 26, 20)}
  ${P('M0 470 L1000 470 L1000 478 L0 478 Z', '#D8D2C4', 1.6)}
  ${R(-4, 478, 1008, 48, G.road, 0, 2)}
  ${range(22)
    .map((i) => `<rect x="${i * 48 + 10}" y="499" width="26" height="5" rx="2" fill="#FBF4E4"/>`)
    .join('')}
  ${P('M0 526 L1000 526 L1000 534 L0 534 Z', '#D8D2C4', 1.6)}
  ${P('M0 534 C160 540 320 532 500 538 C680 544 840 534 1000 538 L1000 620 L0 620 Z', G.grass)}
  ${P('M620 620 C640 584 720 572 780 586 C840 600 860 620 860 620 Z', G.near)}
  ${flowers(
    [
      [160, 576],
      [240, 592],
      [330, 572],
      [930, 584],
    ],
    C.mustard,
  )}`,
);

const planeScene = svgClean(
  1000,
  620,
  `
  <rect width="1000" height="620" fill="${G.sky}"/>
  <circle cx="860" cy="110" r="44" fill="${C.mustard}"/>
  ${cloud(80, 180, 1.4)} ${cloud(420, 100, 0.8)} ${cloud(620, 280, 1.3)} ${cloud(180, 330, 0.8)}
  ${P('M0 470 C160 452 320 466 500 458 C680 450 840 466 1000 460 L1000 620 L0 620 Z', G.mid)}
  ${P('M60 500 L280 490 L300 540 L80 552 Z', G.field, 1.6)}
  ${P('M320 492 L540 486 L552 530 L332 538 Z', C.ochre, 1.6)}
  ${P('M590 488 L810 494 L820 540 L600 536 Z', G.near, 1.6)}
  ${P('M100 566 L320 556 L330 606 L110 616 Z', G.dark, 1.6)}
  ${P('M360 552 L580 546 L590 600 L370 606 Z', G.soil, 1.6)}
  ${P('M630 556 L850 562 L858 610 L640 606 Z', G.field, 1.6)}
  <path d="M-10 548 C120 520 220 590 360 544 C500 500 600 600 760 548 C860 516 940 560 1010 540" fill="none" stroke="${INK}" stroke-width="18" stroke-linecap="round"/>
  <path d="M-10 548 C120 520 220 590 360 544 C500 500 600 600 760 548 C860 516 940 560 1010 540" fill="none" stroke="${G.water}" stroke-width="14" stroke-linecap="round"/>`,
);

// ---------- City landmarks, drawn like the Wandro stamps: 400 x 400, the ground at the bottom. ----------
const shadeSide = (x, y, w, h, color) =>
  `<rect x="${x + w * 0.72}" y="${y + 1}" width="${w * 0.28 - 1}" height="${h - 2}" fill="${shade(color, -0.14)}"/>`;
const archWin = (x, y, w, h, fill = C.cobalt) =>
  `<path d="M${x} ${y + h} L${x} ${y + w / 2} A${w / 2} ${w / 2} 0 0 1 ${x + w} ${y + w / 2} L${x + w} ${y + h} Z" fill="${fill}" ${o(1.4)}/>`;
const crenels = (x, y, w, n, fill) =>
  range(n)
    .map((i) => R(x + (i * w) / n + 1, y - 12, w / n - 6, 12, fill, 0, 1.6))
    .join('');
const tower = (x, y, w, h, fill) => R(x, y, w, h, fill, 0, 2) + shadeSide(x, y, w, h, fill);
const dome = (cx, y, r, fill) =>
  P(`M${cx - r} ${y} A${r} ${r} 0 0 1 ${cx + r} ${y} Z`, fill) +
  R(cx - 2.5, y - r - 18, 5, 18, '#6B3B2A', 1, 1.4);
const hill = (fill = G.near) =>
  P('M0 400 L0 330 C70 300 140 306 200 300 C270 294 340 306 400 318 L400 400 Z', fill);

const cities = {
  sintra: `
    ${P('M30 400 C50 300 120 250 200 246 C290 242 350 300 372 400 Z', G.dark)}
    ${tower(140, 196, 150, 104, C.terra)} ${crenels(140, 196, 150, 6, C.terra)}
    ${range(5)
      .map((i) => archWin(152 + i * 27, 222, 16, 34, C.navy))
      .join('')}
    ${tower(222, 120, 48, 80, C.brick)} ${dome(246, 124, 26, C.ochre)}
    <circle cx="246" cy="152" r="12" fill="${C.card}" ${o(1.6)}/><path d="M246 152 L246 144 M246 152 L252 155" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/>
    ${tower(98, 150, 54, 160, C.mustard)} ${dome(125, 154, 31, C.ochre)}
    ${[
      [110, 176],
      [130, 176],
      [110, 224],
      [130, 224],
    ]
      .map(([x, y]) => archWin(x, y, 13, 28))
      .join('')}
    ${tower(296, 210, 58, 100, C.lilac)} ${crenels(296, 210, 58, 3, C.lilac)}
    ${archWin(308, 236, 13, 26, C.navy)} ${archWin(330, 236, 13, 26, C.navy)}
    ${hill(G.mid)}
    ${tree(56, 336, 34, G.dark)} ${tree(352, 334, 32, G.near)} ${tree(190, 352, 22, G.near)}`,
  lisbon: `
    ${[
      [24, 150, 70, C.pink],
      [94, 116, 74, C.mustard],
      [168, 156, 62, C.sky],
      [230, 104, 76, C.coral],
      [306, 138, 72, C.lilac],
    ]
      .map(
        ([x, y, w, f]) =>
          tower(x, y, w, 300 - y, f) +
          P(`M${x - 5} ${y} L${x + w / 2} ${y - 26} L${x + w + 5} ${y} Z`, G.roof) +
          range(4)
            .map((k) =>
              R(
                x + 12 + (k % 2) * (w - 36),
                y + 22 + Math.floor(k / 2) * 52,
                14,
                26,
                G.glass,
                2,
                1.4,
              ),
            )
            .join('') +
          R(x + 6, y + 56, w - 12, 5, '#3A3F4B', 1, 1.2),
      )
      .join('')}
    ${P('M0 300 L400 300 L400 400 L0 400 Z', '#C9B79C')}
    ${range(9)
      .map(
        (i) =>
          `<path d="M${i * 48} 312 L${i * 48 + 30} 312" stroke="${shade('#C9B79C', -0.2)}" stroke-width="2"/>`,
      )
      .join('')}
    <path d="M150 266 L136 214 M136 214 L176 214" fill="none" ${o(2)}/>
    ${R(70, 262, 252, 96, C.mustard, 14)}
    ${R(70, 262, 252, 32, C.card, 14, 2)}
    ${range(5)
      .map((i) => R(88 + i * 46, 300, 32, 30, G.glass, 4, 1.4))
      .join('')}
    ${R(70, 338, 252, 8, C.terra, 0, 1.6)}
    ${R(320, 304, 8, 8, '#FFF4C2', 2, 1.2)}
    ${[118, 274].map((x) => `<circle cx="${x}" cy="366" r="13" fill="#2B2F3A" ${o(1.6)}/><circle cx="${x}" cy="366" r="5" fill="#C9D2DE"/>`).join('')}
    <path d="M0 382 L400 382" stroke="${G.steel}" stroke-width="4"/>`,
  porto: `
    ${P('M0 400 L0 236 C60 222 120 232 176 256 L176 400 Z', C.ochre)}
    ${[
      [8, 250, C.coral],
      [60, 262, C.mustard],
      [112, 276, C.lilac],
    ]
      .map(
        ([x, y, f]) =>
          tower(x, y, 50, 336 - y, f) +
          P(`M${x - 4} ${y} L${x + 25} ${y - 18} L${x + 54} ${y} Z`, G.roof) +
          archWin(x + 18, y + 18, 14, 26, G.glass),
      )
      .join('')}
    ${tower(230, 120, 60, 210, '#E6DCC6')}
    ${R(222, 196, 76, 12, '#CDBF9F', 0, 1.6)} ${R(222, 260, 76, 12, '#CDBF9F', 0, 1.6)}
    ${tower(236, 70, 48, 52, '#E6DCC6')} ${dome(260, 74, 24, '#CDBF9F')}
    ${[
      [250, 84],
      [250, 140],
      [250, 214],
      [250, 280],
    ]
      .map(([x, y]) => archWin(x, y, 20, 32, G.glass))
      .join('')}
    ${P('M0 330 C100 318 200 336 300 326 C350 322 380 326 400 330 L400 400 L0 400 Z', G.water)}
    <path d="M20 360 C60 350 100 370 140 360 M220 376 C260 366 300 386 340 376" fill="none" stroke="${G.waterHi}" stroke-width="5" stroke-linecap="round"/>
    ${P('M150 346 L362 346 C350 372 322 384 292 384 L212 384 C180 384 160 372 150 346 Z', '#6B3B2A')}
    ${range(4)
      .map((k) => R(196 + k * 34, 318, 30, 28, C.ochre, 9, 1.6))
      .join('')}
    ${R(254, 246, 6, 100, '#6B3B2A', 1, 1.4)}
    ${P('M218 252 L300 252 L300 312 L218 312 Z', C.card)}`,
  evora: `
    ${hill(G.field)}
    ${R(76, 250, 248, 90, '#D9C49A')} ${shadeSide(76, 250, 248, 90, '#D9C49A')}
    ${range(6)
      .map((k) => R(80 + k * 30, 262, 22, 74, shade('#D9C49A', -0.06), 0, 1.2))
      .join('')}
    ${R(66, 236, 268, 18, '#CDB585')}
    ${range(6)
      .map(
        (k) =>
          R(96 + k * 40, 110, 22, 126, C.card, 0, 1.8) +
          R(90 + k * 40, 100, 34, 14, '#E6DCC6', 2, 1.6) +
          R(92 + k * 40, 232, 30, 8, '#E6DCC6', 1, 1.4),
      )
      .join('')}
    ${R(80, 74, 248, 28, '#E6DCC6')}
    ${R(80, 74, 248, 8, '#CDB585', 0, 1.4)}
    ${cypress(352, 340, 120)}
    ${tree(42, 340, 30, G.dark)}`,
  aveiro: `
    ${[
      [24, 150, C.terra],
      [108, 120, C.cobalt],
      [192, 160, '#3E8E6A'],
      [276, 130, C.terra],
    ]
      .map(
        ([x, y, f]) =>
          R(x, y, 76, 330 - y, C.card) +
          range(4)
            .map(
              (k) =>
                `<rect x="${x + 4 + k * 19}" y="${y + 1}" width="9" height="${328 - y}" fill="${f}"/>`,
            )
            .join('') +
          `<rect x="${x}" y="${y}" width="76" height="${330 - y}" fill="none" ${o(2)}/>` +
          P(`M${x - 6} ${y} L${x + 38} ${y - 30} L${x + 82} ${y} Z`, f) +
          R(x + 24, y + 40, 28, 34, C.card, 3, 1.6) +
          R(x + 30, y + 46, 16, 22, G.glass, 2, 1.2),
      )
      .join('')}
    ${P('M0 320 C100 310 200 326 300 318 C350 314 380 318 400 320 L400 400 L0 400 Z', G.water)}
    <path d="M20 372 C60 362 100 382 140 372 M240 386 C280 376 320 396 360 386" fill="none" stroke="${G.waterHi}" stroke-width="5" stroke-linecap="round"/>
    ${P('M40 300 C60 340 120 352 200 352 C280 352 330 336 360 290 C340 300 320 316 290 322 L110 322 C80 318 60 306 40 300 Z', '#6B3B2A')}
    ${P('M110 322 L290 322 C284 334 270 340 250 340 L150 340 C130 340 116 334 110 322 Z', C.mustard, 1.6)}
    ${P('M42 302 C34 270 40 246 56 236 C60 262 66 286 78 312 Z', C.orange, 1.6)}
    ${P('M358 292 C370 262 368 238 352 226 C350 254 344 276 330 304 Z', C.coral, 1.6)}`,
  algarve: `
    <rect x="0" y="246" width="400" height="160" fill="${G.water}"/>
    <path d="M10 290 C50 280 90 300 130 290 M200 300 C240 290 280 310 320 300" fill="none" stroke="${G.waterHi}" stroke-width="5" stroke-linecap="round"/>
    ${P('M150 400 L150 230 C170 170 220 140 270 150 C330 162 380 200 400 220 L400 400 L322 400 C322 340 296 300 264 300 C232 300 214 340 214 400 Z', '#E2A75B')}
    ${NS('M300 160 C340 176 376 204 398 224 L398 400 L360 400 C356 300 340 230 300 160 Z', shade('#E2A75B', -0.15))}
    ${P('M150 236 C170 186 220 160 270 166 C320 174 368 204 400 224 L400 212 C370 184 320 150 268 142 C210 136 160 170 150 236 Z', G.near, 1.6)}
    ${P('M0 400 L0 340 C80 330 160 344 240 352 C300 358 360 366 400 372 L400 400 Z', '#F2D79A')}
    <path d="M70 352 L70 286" stroke="${INK}" stroke-width="3"/>
    ${P('M20 290 C40 260 100 260 120 290 Z', C.orange)}
    ${range(3)
      .map((k) => P(`M${30 + k * 30} 290 L${45 + k * 30} 272 L${60 + k * 30} 290 Z`, C.card, 1.2))
      .join('')}`,
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
    svgClean(400, 400, body),
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
