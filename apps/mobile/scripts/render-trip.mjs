// Renders the arrival-screen artwork (assets/trip): a cut-paper landscape for each way of
// travelling, a landmark vignette for each launch city and the three vehicles. Flat shapes with
// paper-coloured gaps between them, like the Wandro stamps. Needs Playwright's Chromium:
// node scripts/render-trip.mjs (writes WebP)
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const root = process.env.MOBILE_ROOT ?? new URL('..', import.meta.url).pathname;
const out = `${root}/assets/trip`;

const C = {
  paper: '#F6EBD5',
  card: '#FBF4E4',
  orange: '#E4572E',
  coral: '#EE8C7E',
  pink: '#F2B5B0',
  lilac: '#A88BC7',
  cobalt: '#2F5C9C',
  navy: '#1F3F73',
  sky: '#9CC7E0',
  teal: '#3E8E8A',
  ochre: '#E9A93B',
  mustard: '#F2C14E',
  olive: '#6B8E3D',
  forest: '#2F5D3A',
  brown: '#6B3B2A',
  terra: '#C8553D',
  brick: '#B0443A',
};

const css = `.a path,.a rect,.a circle,.a ellipse{stroke:${C.paper};stroke-width:6;stroke-linejoin:round}
.a .t{stroke-width:3}.a .ns{stroke:none}.a .ln{fill:none;stroke-linecap:round;stroke-linejoin:round}`;
const ln = (d, color, w) => `<path d="${d}" class="ln" style="stroke:${color};stroke-width:${w}"/>`;
const blob = (d, fill) => `<path fill="${fill}" d="${d}"/>`;
const range = (n) => Array.from({ length: n }, (_, i) => i);

/** Wobbly cut edges plus a little print grain, kept inside the shapes so PNGs stay transparent. */
const paperFilter = `
  <filter id="paper" x="-4%" y="-4%" width="108%" height="108%">
    <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="4" result="w"/>
    <feDisplacementMap in="SourceGraphic" in2="w" scale="5" result="d"/>
    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" seed="9" result="n"/>
    <feColorMatrix in="n" values="0 0 0 0 0.35 0 0 0 0 0.25 0 0 0 0 0.15 0.55 0 0 0 -0.2" result="g"/>
    <feComposite in="g" in2="d" operator="in" result="gg"/>
    <feMerge><feMergeNode in="d"/><feMergeNode in="gg"/></feMerge>
  </filter>`;
const svg = (w, h, body, bg = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
    <defs><style>${css}</style>${paperFilter}</defs>
    ${bg ? `<rect width="${w}" height="${h}" fill="${bg}"/>` : ''}
    <g class="a" filter="url(#paper)">${body}</g></svg>`;

// ---------- Scenes: 1000 x 620. The track sits at y = 496 (0.8 of the height). ----------
const trainScene = svg(
  1000,
  620,
  `
  <circle cx="700" cy="150" r="72" fill="${C.orange}"/>
  ${blob('M70 120 C72 80 120 66 160 82 C190 44 270 46 296 84 C344 74 380 108 362 142 C350 168 296 168 264 158 C222 180 140 176 116 158 C80 168 66 148 70 120Z', C.coral)}
  ${blob('M760 120 C766 92 806 84 830 100 C856 84 908 92 912 120 C916 146 880 154 856 146 C826 158 772 152 760 120Z', C.lilac)}
  ${blob('M0 352 C120 300 230 330 330 312 C450 290 560 332 680 304 C800 276 900 302 1000 292 L1000 620 L0 620Z', C.olive)}
  ${blob('M420 360 C480 330 560 340 600 370 C560 392 470 392 420 360Z', C.ochre)}
  ${blob('M0 424 C150 386 260 414 400 398 C540 382 640 418 780 400 C880 388 940 400 1000 396 L1000 620 L0 620Z', C.forest)}
  ${[
    [90, 404, 46, C.teal],
    [250, 410, 36, C.olive],
    [610, 404, 42, C.teal],
    [900, 396, 50, C.olive],
  ]
    .map(([x, y, r, f]) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.72}" fill="${f}"/>`)
    .join('')}
  ${[220, 500, 780].map((x) => ln(`M${x} 484 L${x} 400`, C.brown, 5)).join('')}
  ${ln('M220 412 Q360 440 500 412 Q640 440 780 412', C.brown, 2.5)}
  <rect x="-10" y="484" width="1020" height="34" fill="${C.terra}"/>
  ${range(40)
    .map(
      (i) => `<rect x="${i * 26 + 4}" y="486" width="11" height="28" fill="${C.brown}" class="t"/>`,
    )
    .join('')}
  ${ln('M-10 492 L1010 492', C.navy, 5)}
  ${ln('M-10 506 L1010 506', C.navy, 5)}
  ${blob('M0 530 C120 520 220 540 330 532 C460 522 560 546 700 536 C820 528 920 540 1000 534 L1000 620 L0 620Z', C.ochre)}
  ${blob('M0 568 C80 548 160 560 220 590 L230 620 L0 620Z', C.olive)}
  ${blob('M1000 560 C920 548 840 566 800 600 L790 620 L1000 620Z', C.forest)}
  ${[
    [300, 570],
    [420, 585],
    [560, 568],
    [660, 590],
  ]
    .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9" fill="${C.coral}" class="t"/>`)
    .join('')}`,
  C.paper,
);

const busScene = svg(
  1000,
  620,
  `
  <circle cx="180" cy="130" r="64" fill="${C.mustard}"/>
  ${blob('M560 96 C566 62 612 52 640 72 C668 46 730 52 740 88 C784 84 812 114 796 144 C780 170 730 166 704 156 C670 176 604 170 586 150 C556 152 546 124 560 96Z', C.pink)}
  ${blob('M300 180 C304 160 334 154 352 166 C372 152 410 160 412 182 C414 202 386 208 368 202 C344 212 306 206 300 180Z', C.sky)}
  ${blob('M0 330 C110 250 200 230 300 290 C380 250 470 240 560 296 C660 240 780 220 1000 300 L1000 620 L0 620Z', C.lilac)}
  ${blob('M0 380 C140 340 280 370 420 350 C560 330 700 370 840 350 C910 340 960 346 1000 350 L1000 620 L0 620Z', C.olive)}
  ${blob('M640 368 C700 350 780 356 820 380 C780 400 690 398 640 368Z', C.mustard)}
  ${[
    [120, 380],
    [520, 372],
    [880, 372],
  ]
    .map(
      ([x, y]) =>
        `${ln(`M${x} ${y + 70} L${x} ${y + 10}`, C.brown, 12)}<ellipse cx="${x}" cy="${y}" rx="54" ry="34" fill="${C.forest}"/>`,
    )
    .join('')}
  ${blob('M0 452 C200 440 400 456 600 448 C760 442 900 450 1000 452 L1000 620 L0 620Z', C.ochre)}
  <rect x="-10" y="478" width="1020" height="46" fill="${C.navy}"/>
  ${range(25)
    .map(
      (i) =>
        `<rect x="${i * 44 + 8}" y="498" width="24" height="6" rx="3" fill="${C.card}" class="ns"/>`,
    )
    .join('')}
  ${blob('M0 540 C140 530 260 548 400 540 C540 532 680 552 820 542 C900 536 960 540 1000 540 L1000 620 L0 620Z', C.olive)}
  ${blob('M600 620 C620 580 700 566 760 580 C820 594 840 620 840 620Z', C.forest)}
  ${[
    [160, 574],
    [240, 590],
    [330, 572],
    [930, 584],
  ]
    .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9" fill="${C.mustard}" class="t"/>`)
    .join('')}`,
  C.paper,
);

const planeScene = svg(
  1000,
  620,
  `
  <rect x="-10" y="-10" width="1020" height="500" fill="${C.sky}" class="ns"/>
  <circle cx="860" cy="110" r="64" fill="${C.orange}"/>
  ${blob('M60 150 C64 110 118 96 156 114 C190 76 270 82 290 122 C340 116 368 152 350 186 C334 212 278 210 248 198 C206 218 124 214 104 194 C70 202 56 180 60 150Z', C.card)}
  ${blob('M420 90 C424 66 458 58 480 72 C502 56 546 62 550 90 C554 114 524 120 504 114 C478 124 432 118 420 90Z', C.pink)}
  ${blob('M620 230 C626 198 668 188 696 206 C726 184 788 192 796 226 C836 224 860 252 846 278 C832 302 786 300 760 290 C726 310 656 304 640 284 C612 288 604 258 620 230Z', C.card)}
  ${blob('M170 300 C174 280 204 274 222 286 C242 272 280 280 282 302 C284 322 256 328 238 322 C214 332 176 326 170 300Z', C.lilac)}
  ${blob('M0 470 C160 450 320 466 500 458 C680 450 840 466 1000 460 L1000 620 L0 620Z', C.olive)}
  ${blob('M80 500 L300 490 L320 540 L100 552Z', C.mustard)}
  ${blob('M340 492 L560 486 L570 530 L352 538Z', C.ochre)}
  ${blob('M600 488 L820 494 L830 540 L610 536Z', C.forest)}
  ${blob('M110 566 L330 556 L340 606 L120 616Z', C.forest)}
  ${blob('M370 552 L590 546 L598 600 L380 606Z', C.coral)}
  ${blob('M640 556 L860 562 L866 610 L648 606Z', C.mustard)}
  ${ln('M-10 548 C120 520 220 590 360 544 C500 500 600 600 760 548 C860 516 940 560 1010 540', C.cobalt, 16)}`,
  C.paper,
);

// ---------- City vignettes: 400 x 400, the ground line at the bottom. ----------
const mound = (fill = C.olive) =>
  blob('M0 400 L0 352 C80 326 160 336 220 330 C300 322 360 334 400 344 L400 400Z', fill);
const cities = {
  sintra: `
    ${blob('M10 400 C40 290 120 250 200 246 C290 242 360 290 390 400Z', C.forest)}
    <rect x="200" y="176" width="110" height="90" fill="${C.terra}"/>
    ${[202, 228, 254, 280].map((x) => `<rect x="${x}" y="160" width="16" height="16" fill="${C.terra}"/>`).join('')}
    <rect x="248" y="112" width="40" height="70" fill="${C.brick}"/>
    ${blob('M242 116 C242 80 294 80 294 116Z', C.ochre)}
    <circle cx="268" cy="140" r="11" fill="${C.card}" class="t"/>
    <rect x="140" y="140" width="56" height="130" fill="${C.mustard}"/>
    ${blob('M133 144 C133 98 203 98 203 144Z', C.ochre)}
    <rect x="164" y="80" width="8" height="24" fill="${C.brown}" class="t"/>
    ${[
      [154, 170],
      [176, 170],
      [154, 214],
      [176, 214],
    ]
      .map(
        ([x, y]) =>
          `<rect x="${x}" y="${y}" width="12" height="22" rx="6" fill="${C.cobalt}" class="t"/>`,
      )
      .join('')}
    ${[214, 240, 266, 292].map((x) => `<rect x="${x - 4}" y="200" width="13" height="24" rx="6.5" fill="${C.navy}" class="t"/>`).join('')}
    ${blob('M0 400 L0 300 C60 280 110 300 150 290 C210 276 260 296 320 286 C360 280 390 290 400 294 L400 400Z', C.olive)}
    <ellipse cx="60" cy="300" rx="50" ry="36" fill="${C.forest}"/>
    <ellipse cx="350" cy="298" rx="50" ry="34" fill="${C.teal}"/>`,
  lisbon: `
    ${[
      [40, 150, 70, C.pink],
      [104, 120, 76, C.mustard],
      [174, 160, 64, C.sky],
      [232, 110, 80, C.coral],
      [306, 140, 74, C.lilac],
    ]
      .map(
        ([x, y, w, f]) =>
          `<rect x="${x}" y="${y}" width="${w}" height="${400 - y}" fill="${f}"/>` +
          blob(`M${x - 6} ${y + 4} L${x + w / 2} ${y - 26} L${x + w + 6} ${y + 4}Z`, C.terra) +
          range(3)
            .map(
              (k) =>
                `<rect x="${x + 12 + (k % 2) * (w - 36)}" y="${y + 24 + Math.floor(k / 2) * 46}" width="14" height="24" rx="3" fill="${C.navy}" class="t"/>`,
            )
            .join(''),
      )
      .join('')}
    ${mound(C.ochre)}
    <rect x="70" y="262" width="250" height="96" rx="18" fill="${C.mustard}"/>
    <rect x="70" y="262" width="250" height="34" rx="16" fill="${C.card}"/>
    ${[92, 140, 188, 236, 280].map((x) => `<rect x="${x}" y="300" width="30" height="30" rx="5" fill="${C.navy}" class="t"/>`).join('')}
    ${ln('M190 262 L170 222 L230 222', C.navy, 4)}
    <rect x="70" y="338" width="250" height="10" fill="${C.terra}" class="t"/>
    <circle cx="120" cy="364" r="14" fill="${C.brown}"/><circle cx="270" cy="364" r="14" fill="${C.brown}"/>`,
  porto: `
    ${blob('M0 400 L0 250 C60 236 120 246 170 270 L170 400Z', C.ochre)}
    ${[
      [10, 262, C.coral],
      [62, 276, C.mustard],
      [114, 290, C.lilac],
    ]
      .map(
        ([x, y, f]) =>
          `<rect x="${x}" y="${y}" width="50" height="${330 - y}" fill="${f}"/><rect x="${x + 18}" y="${y + 16}" width="14" height="22" rx="7" fill="${C.navy}" class="t"/>`,
      )
      .join('')}
    <rect x="232" y="120" width="56" height="200" fill="${C.card}"/>
    <rect x="224" y="196" width="72" height="14" fill="${C.ochre}" class="t"/>
    <rect x="236" y="70" width="48" height="52" fill="${C.card}"/>
    ${blob('M232 74 C232 30 288 30 288 74Z', C.ochre)}
    <rect x="256" y="10" width="8" height="26" fill="${C.brown}" class="t"/>
    ${[
      [248, 84],
      [248, 140],
      [248, 230],
      [248, 274],
    ]
      .map(
        ([x, y]) =>
          `<rect x="${x}" y="${y}" width="24" height="34" rx="12" fill="${C.cobalt}" class="t"/>`,
      )
      .join('')}
    ${blob('M0 330 C100 318 200 336 300 326 C350 322 380 326 400 330 L400 400 L0 400Z', C.cobalt)}
    ${ln('M20 356 C60 346 100 366 140 356 M220 370 C260 360 300 380 340 370', C.sky, 6)}
    ${blob('M150 344 L360 344 C350 370 320 382 290 382 L210 382 C180 382 160 370 150 344Z', C.brown)}
    ${range(4)
      .map(
        (k) =>
          `<rect x="${196 + k * 34}" y="318" width="30" height="26" rx="10" fill="${C.ochre}" class="t"/>`,
      )
      .join('')}
    <rect x="252" y="250" width="6" height="94" fill="${C.brown}" class="t"/>
    <rect x="216" y="252" width="80" height="58" fill="${C.card}"/>`,
  evora: `
    ${mound(C.ochre)}
    <rect x="80" y="250" width="240" height="96" fill="${C.ochre}"/>
    <rect x="70" y="236" width="260" height="20" fill="${C.terra}" class="t"/>
    ${range(6)
      .map((k) => `<rect x="${98 + k * 40}" y="${110}" width="22" height="128" fill="${C.card}"/>`)
      .join('')}
    ${range(6)
      .map(
        (k) =>
          `<rect x="${92 + k * 40}" y="100" width="34" height="16" fill="${C.card}" class="t"/>`,
      )
      .join('')}
    <rect x="80" y="74" width="240" height="26" fill="${C.card}"/>
    ${ln('M330 346 C334 300 346 270 350 250', C.brown, 14)}
    <ellipse cx="350" cy="236" rx="52" ry="34" fill="${C.forest}"/>
    <ellipse cx="320" cy="214" rx="34" ry="24" fill="${C.olive}"/>
    ${blob('M0 400 L0 350 C60 340 120 352 200 348 C280 344 340 352 400 356 L400 400Z', C.olive)}`,
  aveiro: `
    ${[
      [24, 150, 76, C.terra],
      [108, 120, 76, C.cobalt],
      [192, 160, 76, C.olive],
      [276, 130, 76, C.terra],
    ]
      .map(
        ([x, y, w, f]) =>
          `<rect x="${x}" y="${y}" width="${w}" height="${330 - y}" fill="${C.card}"/>` +
          range(4)
            .map(
              (k) =>
                `<rect x="${x + 4 + k * 19}" y="${y + 2}" width="9" height="${326 - y}" fill="${f}" class="ns"/>`,
            )
            .join('') +
          blob(`M${x - 6} ${y + 4} L${x + w / 2} ${y - 28} L${x + w + 6} ${y + 4}Z`, f) +
          `<rect x="${x + 26}" y="${y + 40}" width="24" height="30" rx="4" fill="${C.mustard}" class="t"/>`,
      )
      .join('')}
    ${blob('M0 320 C100 310 200 326 300 318 C350 314 380 318 400 320 L400 400 L0 400Z', C.sky)}
    ${ln('M20 372 C60 362 100 382 140 372 M240 386 C280 376 320 396 360 386', C.cobalt, 6)}
    ${blob('M40 300 C60 340 120 352 200 352 C280 352 330 336 360 290 C340 300 320 316 290 322 L110 322 C80 318 60 306 40 300Z', C.brown)}
    ${blob('M110 322 L290 322 C284 334 270 340 250 340 L150 340 C130 340 116 334 110 322Z', C.mustard)}
    ${blob('M42 302 C34 270 40 246 56 236 C60 262 66 286 78 312Z', C.orange)}
    ${blob('M358 292 C370 262 368 238 352 226 C350 254 344 276 330 304Z', C.coral)}`,
  algarve: `
    <rect x="-10" y="250" width="420" height="160" fill="${C.cobalt}" class="ns"/>
    ${ln('M10 290 C50 280 90 300 130 290 M200 300 C240 290 280 310 320 300', C.sky, 6)}
    ${blob('M150 400 L150 230 C170 170 220 140 270 150 C330 162 380 200 400 220 L400 400 L320 400 C320 340 296 300 264 300 C232 300 214 340 214 400Z', C.ochre)}
    ${blob('M180 236 C210 196 250 180 290 186 L280 230 C250 224 220 236 200 254Z', C.terra)}
    ${blob('M150 236 C170 186 220 160 270 166 C320 174 368 204 400 224 L400 214 C370 186 320 150 268 142 C210 136 160 170 150 236Z', C.olive)}
    ${blob('M0 400 L0 340 C80 330 160 344 240 352 C300 358 360 366 400 372 L400 400Z', C.mustard)}
    ${ln('M70 352 L70 284', C.brown, 6)}
    ${blob('M20 290 C40 260 100 260 120 290Z', C.orange)}
    ${range(3)
      .map((k) => blob(`M${30 + k * 30} 290 L${45 + k * 30} 270 L${60 + k * 30} 290Z`, C.card))
      .join('')}`,
};

// ---------- Vehicles, facing right. ----------
const vehicles = {
  train: svg(
    700,
    200,
    `
    ${ln('M190 40 L230 10 L270 40 M470 40 L510 10 L550 40', C.navy, 4)}
    <rect x="10" y="40" width="330" height="120" rx="20" fill="${C.card}"/>
    ${blob('M350 40 L600 40 C660 40 690 90 690 130 L690 160 L350 160Z', C.card)}
    <rect x="10" y="66" width="330" height="40" fill="${C.navy}" class="t"/>
    <rect x="350" y="66" width="250" height="40" fill="${C.navy}" class="t"/>
    ${blob('M604 66 C640 70 664 92 672 112 L620 112 L604 106Z', C.sky)}
    ${range(5)
      .map(
        (k) =>
          `<rect x="${28 + k * 62}" y="72" width="44" height="28" rx="6" fill="${C.sky}" class="t"/>`,
      )
      .join('')}
    ${range(4)
      .map(
        (k) =>
          `<rect x="${366 + k * 58}" y="72" width="42" height="28" rx="6" fill="${C.sky}" class="t"/>`,
      )
      .join('')}
    <rect x="10" y="118" width="330" height="16" fill="${C.orange}" class="t"/>
    <rect x="350" y="118" width="340" height="16" fill="${C.orange}" class="t"/>
    <rect x="150" y="110" width="40" height="50" rx="4" fill="${C.mustard}" class="t"/>
    <rect x="470" y="110" width="40" height="50" rx="4" fill="${C.mustard}" class="t"/>
    <circle cx="676" cy="146" r="7" fill="${C.mustard}" class="t"/>
    ${[60, 280, 410, 620].map((x) => `<circle cx="${x}" cy="172" r="22" fill="${C.brown}"/><circle cx="${x}" cy="172" r="7" fill="${C.ochre}" class="t"/>`).join('')}`,
  ),
  coach: svg(
    420,
    170,
    `
    ${blob('M14 30 L340 30 C380 30 404 60 408 96 L410 130 L14 130 C8 130 6 124 6 118 L6 40 C6 34 10 30 14 30Z', C.teal)}
    <rect x="22" y="44" width="300" height="40" rx="8" fill="${C.card}" class="t"/>
    ${range(5)
      .map(
        (k) =>
          `<rect x="${30 + k * 58}" y="50" width="46" height="28" rx="5" fill="${C.sky}" class="t"/>`,
      )
      .join('')}
    ${blob('M334 44 C364 46 388 66 394 96 L334 96Z', C.sky)}
    <rect x="6" y="98" width="404" height="14" fill="${C.mustard}" class="t"/>
    <circle cx="398" cy="118" r="7" fill="${C.mustard}" class="t"/>
    ${[90, 320].map((x) => `<circle cx="${x}" cy="136" r="26" fill="${C.navy}"/><circle cx="${x}" cy="136" r="9" fill="${C.card}" class="t"/>`).join('')}`,
  ),
  plane: svg(
    360,
    180,
    `
    ${blob('M150 80 L210 80 L120 10 L90 10Z', C.orange)}
    ${blob('M20 60 L60 60 L40 20 L18 20Z', C.orange)}
    ${blob('M20 66 C20 56 30 50 44 50 L290 50 C330 50 352 70 352 90 C352 110 330 120 290 120 L60 120 C34 120 20 100 20 66Z', C.card)}
    ${blob('M300 58 C320 60 338 72 342 86 L306 86Z', C.navy)}
    ${range(7)
      .map((k) => `<circle cx="${90 + k * 28}" cy="78" r="8" fill="${C.cobalt}" class="t"/>`)
      .join('')}
    <rect x="40" y="96" width="290" height="10" fill="${C.orange}" class="t"/>
    ${blob('M140 96 L220 96 L130 170 L96 170Z', C.coral)}
    ${blob('M30 92 L70 92 L44 130 L24 130Z', C.coral)}`,
  ),
};

const pages = [
  ['scene-train.webp', trainScene, 1000, 620],
  ['scene-bus.webp', busScene, 1000, 620],
  ['scene-plane.webp', planeScene, 1000, 620],
  ...Object.entries(cities).map(([slug, body]) => [
    `city-${slug}.webp`,
    svg(400, 400, body),
    400,
    400,
  ]),
  ...Object.entries(vehicles).map(([name, s]) => {
    const [, w, h] = s.match(/viewBox="0 0 (\d+) (\d+)"/);
    return [`vehicle-${name}.webp`, s, +w, +h];
  }),
];

mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
const page = await browser.newPage({ deviceScaleFactor: 1.6 });
for (const [file, s, w, h] of pages) {
  await page.setViewportSize({ width: w, height: h });
  await page.setContent(`<html><body style="margin:0;background:transparent">${s}</body></html>`);
  const png = await page.locator('svg').screenshot({ omitBackground: true });
  // Chromium's canvas encodes WebP, so the art ships small without an image library.
  const webp = await page.evaluate(async (b64) => {
    const img = new Image();
    img.src = `data:image/png;base64,${b64}`;
    await img.decode();
    const canvas = Object.assign(document.createElement('canvas'), {
      width: img.width,
      height: img.height,
    });
    canvas.getContext('2d').drawImage(img, 0, 0);
    return canvas.toDataURL('image/webp', 0.82).split(',')[1];
  }, png.toString('base64'));
  writeFileSync(`${out}/${file}`, Buffer.from(webp, 'base64'));
}
await browser.close();
console.log(`wrote ${pages.length} files to ${out}`);
