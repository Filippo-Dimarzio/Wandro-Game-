// Renders the category covers (assets/art/*.webp) in the cut-paper stamp style. Each category keeps
// its signature colour: the whole picture is cut from tones of that one colour on cream paper.
// Needs Playwright's Chromium: node scripts/render-category-art.mjs
import { blob, C, ln, range, renderWebp, svg, tones } from './paper-art.mjs';

const root = process.env.MOBILE_ROOT ?? new URL('..', import.meta.url).pathname;
const out = `${root}/assets/art`;
const S = 600; // drawn on a 600 x 600 board, saved at 1024 x 1024

const cloud = (x, y, s, fill) =>
  blob(
    `M${x} ${y} C${x} ${y - 22 * s} ${x + 30 * s} ${y - 32 * s} ${x + 50 * s} ${y - 20 * s} C${x + 66 * s} ${y - 44 * s} ${x + 116 * s} ${y - 40 * s} ${x + 124 * s} ${y - 12 * s} C${x + 150 * s} ${y - 12 * s} ${x + 160 * s} ${y + 14 * s} ${x + 140 * s} ${y + 24 * s} C${x + 110 * s} ${y + 34 * s} ${x + 40 * s} ${y + 34 * s} ${x + 16 * s} ${y + 22 * s} C${x} ${y + 18 * s} ${x - 4 * s} ${y + 8 * s} ${x} ${y}Z`,
    fill,
  );
const tree = (x, y, r, leaf, trunk) =>
  `${ln(`M${x} ${y + r * 1.6} L${x} ${y + r * 0.4}`, trunk, Math.max(6, r / 4))}<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.8}" fill="${leaf}"/>`;
const pennants = (y0, colors, sag = 30) =>
  ln(`M0 ${y0} Q300 ${y0 + sag * 2} 600 ${y0}`, colors[0], 3) +
  range(12)
    .map((i) => {
      const x = 25 + i * 50;
      const t = x / 600;
      const y = (1 - t) * (1 - t) * y0 + 2 * t * (1 - t) * (y0 + sag * 2) + t * t * y0;
      return blob(
        `M${x - 16} ${y} L${x + 16} ${y} L${x} ${y + 30}Z`,
        colors[1 + (i % (colors.length - 1))],
      );
    })
    .join('');

// ---------- Beaches & coast: sky blue ----------
const coast = (() => {
  const t = tones('#4FAFCB');
  return svg(
    S,
    S,
    `
    <circle cx="455" cy="120" r="62" fill="${t.m}"/>
    ${cloud(60, 110, 1.1, t.xl)} ${cloud(300, 190, 0.7, t.xl)}
    <rect x="-10" y="300" width="620" height="310" fill="${t.b}"/>
    ${range(5)
      .map((i) =>
        blob(
          `M-10 ${330 + i * 56} C60 ${310 + i * 56} 130 ${352 + i * 56} 210 ${332 + i * 56} C290 ${312 + i * 56} 350 ${350 + i * 56} 430 ${330 + i * 56} L430 ${352 + i * 56} C350 ${372 + i * 56} 290 ${334 + i * 56} 210 ${356 + i * 56} C130 ${376 + i * 56} 60 ${334 + i * 56} -10 ${356 + i * 56}Z`,
          i % 2 ? t.d : t.l,
        ),
      )
      .join('')}
    ${blob('M150 405 L246 405 C238 428 222 436 204 436 L178 436 C164 436 154 424 150 405Z', t.dd)}
    <rect x="196" y="330" width="6" height="75" fill="${t.dd}" class="t"/>
    ${blob('M204 334 L244 398 L204 398Z', t.xl)}
    ${blob('M360 610 C360 500 384 420 420 350 C442 306 470 270 510 254 C548 240 580 246 610 252 L610 610Z', t.d)}
    ${blob('M410 610 C414 520 432 456 466 404 C486 376 506 360 530 354 L548 610Z', t.dd)}
    ${blob('M436 318 C466 272 504 248 544 244 C576 241 596 248 610 252 L610 292 C572 284 532 290 500 306 C474 318 452 330 436 318Z', t.m)}
    <path fill="${C.card}" d="M512 250 L518 128 L544 128 L550 250Z"/>
    <rect x="520" y="164" width="22" height="12" fill="${t.d}" class="t"/>
    <rect x="520" y="208" width="22" height="12" fill="${t.d}" class="t"/>
    <rect x="510" y="102" width="42" height="28" fill="${t.b}"/>
    ${blob('M504 106 L531 80 L558 106Z', t.dd)}
    ${blob('M-10 610 L-10 470 C60 452 130 470 190 500 C240 524 270 560 280 610Z', t.xl)}
    ${ln('M80 588 L96 492', t.dd, 5)}
    ${blob('M40 500 C60 462 140 460 160 498Z', t.b)}
    ${range(3)
      .map((k) => blob(`M${52 + k * 36} 498 L${70 + k * 36} 470 L${88 + k * 36} 498Z`, t.l))
      .join('')}
    ${ln('M240 70 l10 9 l10 -9 M276 48 l8 7 l8 -7 M212 40 l7 6 l7 -6', t.dd, 3)}`,
    C.paper,
  );
})();

// ---------- Nature: leaf green ----------
const nature = (() => {
  const t = tones('#4E8A3A');
  return svg(
    S,
    S,
    `
    <circle cx="140" cy="110" r="56" fill="${t.l}"/>
    ${cloud(330, 100, 0.9, t.xl)}
    ${blob('M-10 300 L120 170 L200 240 L300 130 L420 250 L500 190 L610 280 L610 610 L-10 610Z', t.l)}
    ${blob('M-10 340 C100 300 200 330 300 316 C400 302 500 330 610 312 L610 610 L-10 610Z', t.m)}
    ${blob('M380 610 L380 330 C420 300 470 300 500 330 L500 610Z', t.d)}
    ${range(5)
      .map(
        (i) =>
          `<rect x="${396 + i * 18}" y="338" width="10" height="200" rx="5" fill="${t.xl}" class="t"/>`,
      )
      .join('')}
    ${blob('M360 540 C380 518 500 516 520 540 C500 566 380 566 360 540Z', t.l)}
    ${blob('M-10 420 C120 388 240 412 340 400 C380 396 400 400 420 404 L420 610 L-10 610Z', t.b)}
    ${tree(70, 360, 44, t.d, t.dd)} ${tree(200, 340, 34, t.dd, t.dd)} ${tree(300, 370, 40, t.d, t.dd)}
    ${tree(560, 320, 46, t.dd, t.dd)}
    ${ln('M150 610 C160 560 240 540 230 500 C222 470 260 450 300 450', t.xl, 30)}
    ${range(7)
      .map((i) => {
        const a = -160 + i * 24;
        return `<ellipse cx="${90 + 55}" cy="560" rx="55" ry="10" fill="${i % 2 ? t.dd : t.d}" transform="rotate(${a} 90 560)"/>`;
      })
      .join('')}
    ${range(6)
      .map((i) => {
        const a = -150 + i * 24;
        return `<ellipse cx="${520 + 45}" cy="580" rx="45" ry="9" fill="${i % 2 ? t.d : t.m}" transform="rotate(${a} 520 580)"/>`;
      })
      .join('')}
    ${[
      [330, 560],
      [370, 585],
      [270, 590],
    ]
      .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9" fill="${t.xl}" class="t"/>`)
      .join('')}`,
    C.paper,
  );
})();

// ---------- Heritage: terracotta ----------
const heritage = (() => {
  const t = tones('#CF6E48');
  const tower = (x, y, w, h) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${t.d}"/>` +
    blob(`M${x - 8} ${y + 4} L${x + w / 2} ${y - w * 1.1} L${x + w + 8} ${y + 4}Z`, t.dd) +
    `<rect x="${x + w / 2 - 7}" y="${y + 30}" width="14" height="26" rx="7" fill="${t.dd}" class="t"/>`;
  return svg(
    S,
    S,
    `
    <circle cx="470" cy="110" r="58" fill="${t.l}"/>
    ${cloud(60, 120, 1, t.xl)}
    ${blob('M-10 380 C100 330 200 300 300 296 C420 292 520 330 610 360 L610 610 L-10 610Z', t.m)}
    <rect x="150" y="240" width="300" height="120" fill="${t.b}"/>
    ${range(8)
      .map((i) => `<rect x="${152 + i * 38}" y="220" width="22" height="22" fill="${t.b}"/>`)
      .join('')}
    ${tower(110, 170, 64, 200)} ${tower(426, 170, 64, 200)} ${tower(266, 110, 68, 140)}
    ${blob('M270 360 L270 302 C270 270 330 270 330 302 L330 360Z', t.dd)}
    ${range(4)
      .map(
        (i) =>
          `<rect x="${186 + i * 72}" y="268" width="16" height="26" rx="8" fill="${t.dd}" class="t"/>`,
      )
      .join('')}
    ${ln('M300 110 L300 60', t.dd, 4)}
    ${blob('M302 62 L340 74 L302 86Z', t.b)}
    ${blob('M-10 450 C100 420 200 436 300 430 C400 424 500 440 610 430 L610 610 L-10 610Z', t.b)}
    ${ln('M300 610 C290 560 330 520 300 470 C290 452 296 440 300 430', t.xl, 34)}
    ${[60, 120, 500, 556].map((x, i) => blob(`M${x} ${560 - (i % 2) * 20} C${x - 24} ${500 - (i % 2) * 20} ${x - 14} ${420 - (i % 2) * 20} ${x} ${390 - (i % 2) * 20} C${x + 14} ${420 - (i % 2) * 20} ${x + 24} ${500 - (i % 2) * 20} ${x} ${560 - (i % 2) * 20}Z`, t.dd)).join('')}
    ${blob('M-10 610 C60 560 140 560 200 600 L210 610Z', t.d)}
    ${blob('M610 610 C540 566 460 570 410 606 L405 610Z', t.d)}`,
    C.paper,
  );
})();

// ---------- Culture: azulejo cobalt ----------
const culture = (() => {
  const t = tones('#3550A8');
  const facade = (x, w, top, fill) =>
    `<rect x="${x}" y="${top}" width="${w}" height="${520 - top}" fill="${fill}"/>` +
    range(Math.floor((480 - top) / 22) * Math.floor(w / 22))
      .map((k) => {
        const cols = Math.floor(w / 22);
        const cx = x + 11 + (k % cols) * 22;
        const cy = top + 14 + Math.floor(k / cols) * 22;
        return `<circle cx="${cx}" cy="${cy}" r="3.2" fill="${t.xl}" class="ns"/>`;
      })
      .join('') +
    range(3)
      .map(
        (r) =>
          `<rect x="${x + 22}" y="${top + 40 + r * 120}" width="${w - 44}" height="64" rx="6" fill="${t.d}" class="t"/>` +
          `<rect x="${x + 14}" y="${top + 98 + r * 120}" width="${w - 28}" height="10" fill="${t.dd}" class="t"/>` +
          ln(
            range(6)
              .map(
                (k) =>
                  `M${x + 20 + k * ((w - 40) / 5)} ${top + 98 + r * 120} L${x + 20 + k * ((w - 40) / 5)} ${top + 80 + r * 120}`,
              )
              .join(' '),
            t.dd,
            3,
          ),
      )
      .join('');
  return svg(
    S,
    S,
    `
    ${facade(-10, 200, 60, t.l)}
    ${facade(420, 200, 90, t.m)}
    <rect x="190" y="200" width="230" height="320" fill="${t.xl}"/>
    ${blob('M180 204 L305 130 L430 204Z', t.b)}
    ${range(2)
      .map(
        (i) =>
          `<rect x="${230 + i * 100}" y="240" width="50" height="80" rx="25" fill="${t.d}" class="t"/>`,
      )
      .join('')}
    ${pennants(40, [t.dd, t.b, t.l, t.d], 28)}
    <rect x="-10" y="512" width="620" height="100" fill="${t.xl}"/>
    ${range(12)
      .map(
        (i) =>
          `<ellipse cx="${i * 54 + 20}" cy="${560 + (i % 2) * 22}" rx="20" ry="8" fill="${t.l}" class="t"/>`,
      )
      .join('')}
    ${ln('M150 352 L300 340 L450 352', t.dd, 3)}
    <rect x="160" y="380" width="290" height="120" rx="30" fill="${t.b}"/>
    <rect x="160" y="380" width="290" height="40" rx="20" fill="${t.xl}"/>
    ${range(5)
      .map(
        (i) =>
          `<rect x="${180 + i * 54}" y="426" width="40" height="40" rx="6" fill="${t.dd}" class="t"/>`,
      )
      .join('')}
    ${ln('M300 380 L280 352', t.dd, 4)}
    <circle cx="215" cy="512" r="18" fill="${t.dd}"/><circle cx="395" cy="512" r="18" fill="${t.dd}"/>
    ${blob('M40 470 L90 470 L84 512 L46 512Z', t.b)}
    ${range(4)
      .map(
        (k) =>
          `<circle cx="${48 + k * 12}" cy="${458 - (k % 2) * 8}" r="9" fill="${t.d}" class="t"/>`,
      )
      .join('')}`,
    C.paper,
  );
})();

// ---------- Art & museums: violet ----------
const art = (() => {
  const t = tones('#8C5DB8');
  return svg(
    S,
    S,
    `
    <circle cx="500" cy="96" r="50" fill="${t.l}"/>
    ${cloud(40, 90, 0.9, t.xl)}
    ${blob('M20 214 L200 120 L380 214Z', t.d)}
    <rect x="30" y="214" width="340" height="24" fill="${t.dd}"/>
    ${range(5)
      .map((i) => `<rect x="${48 + i * 68}" y="238" width="34" height="210" fill="${t.xl}"/>`)
      .join('')}
    <rect x="30" y="448" width="340" height="24" fill="${t.dd}"/>
    <rect x="10" y="472" width="380" height="22" fill="${t.m}"/>
    <rect x="-10" y="494" width="620" height="120" fill="${t.l}"/>
    <rect x="360" y="200" width="210" height="250" fill="${t.dd}"/>
    <rect x="380" y="220" width="170" height="210" fill="${C.card}"/>
    <circle cx="480" cy="282" r="40" fill="${t.b}"/>
    ${blob('M390 420 C420 340 470 380 500 330 C520 300 548 330 540 420Z', t.m)}
    ${blob('M396 250 C420 236 446 246 440 270 C434 290 404 290 396 270Z', t.d)}
    ${ln('M410 360 C430 340 450 370 470 350', t.dd, 5)}
    ${ln('M420 450 L400 560 M510 450 L530 560 M465 450 L465 540', t.dd, 8)}
    <rect x="190" y="440" width="70" height="120" fill="${t.d}"/>
    <rect x="178" y="430" width="94" height="18" fill="${t.dd}" class="t"/>
    ${blob('M200 430 C196 400 204 382 225 380 C246 382 254 400 250 430Z', t.m)}
    <circle cx="225" cy="356" r="28" fill="${t.m}"/>
    ${blob('M200 346 C206 322 244 322 250 346 C238 338 214 338 200 346Z', t.d)}
    ${[
      [100, 560],
      [560, 540],
      [300, 590],
    ]
      .map(([x, y]) =>
        blob(
          `M${x} ${y - 16} Q${x} ${y} ${x + 16} ${y} Q${x} ${y} ${x} ${y + 16} Q${x} ${y} ${x - 16} ${y} Q${x} ${y} ${x} ${y - 16}Z`,
          t.dd,
        ),
      )
      .join('')}`,
    C.paper,
  );
})();

// ---------- Music & events: raspberry ----------
const music = (() => {
  const t = tones('#B0336E');
  return svg(
    S,
    S,
    `
    <rect x="-10" y="-10" width="620" height="360" fill="${t.dd}" class="ns"/>
    ${blob('M430 50 A46 46 0 1 0 474 128 A38 38 0 1 1 430 50Z', t.xl)}
    ${[
      [80, 70],
      [200, 40],
      [320, 90],
      [540, 190],
    ]
      .map(([x, y]) =>
        blob(
          `M${x} ${y - 10} Q${x} ${y} ${x + 10} ${y} Q${x} ${y} ${x} ${y + 10} Q${x} ${y} ${x - 10} ${y} Q${x} ${y} ${x} ${y - 10}Z`,
          t.l,
        ),
      )
      .join('')}
    ${blob('M60 330 L60 190 C60 150 540 150 540 190 L540 330Z', t.d)}
    ${range(9)
      .map((i) => `<circle cx="${100 + i * 50}" cy="186" r="11" fill="${t.xl}" class="t"/>`)
      .join('')}
    ${pennants(220, [t.xl, t.l, t.m, t.xl], 18)}
    <rect x="-10" y="330" width="620" height="40" fill="${t.b}"/>
    <g transform="rotate(-28 300 300)">
      <rect x="290" y="120" width="22" height="160" fill="${t.dd}"/>
      <rect x="282" y="96" width="38" height="34" rx="8" fill="${t.b}"/>
      ${blob('M300 260 C356 252 382 300 360 336 C392 370 370 430 300 430 C230 430 208 370 240 336 C218 300 244 252 300 260Z', t.l)}
      <circle cx="300" cy="330" r="22" fill="${t.dd}"/>
      <rect x="276" y="384" width="48" height="12" rx="4" fill="${t.dd}" class="t"/>
    </g>
    ${ln('M470 300 L470 236 L520 226 L520 290', t.xl, 7)}
    <ellipse cx="462" cy="302" rx="13" ry="10" fill="${t.xl}" class="ns"/>
    <ellipse cx="512" cy="292" rx="13" ry="10" fill="${t.xl}" class="ns"/>
    ${ln('M110 300 L110 246', t.l, 7)}
    <ellipse cx="102" cy="302" rx="13" ry="10" fill="${t.l}" class="ns"/>
    <rect x="-10" y="370" width="620" height="240" fill="${t.m}"/>
    ${range(9)
      .map((i) => {
        const x = 20 + i * 70;
        const y = 470 + (i % 3) * 22;
        const f = [t.d, t.b, t.dd][i % 3];
        return (
          `<circle cx="${x}" cy="${y}" r="26" fill="${f}"/>` +
          blob(
            `M${x - 44} 620 C${x - 44} ${y + 50} ${x - 26} ${y + 30} ${x} ${y + 30} C${x + 26} ${y + 30} ${x + 44} ${y + 50} ${x + 44} 620Z`,
            f,
          ) +
          (i % 2 ? ln(`M${x + 24} ${y + 40} L${x + 44} ${y - 30}`, f, 12) : '')
        );
      })
      .join('')}`,
    C.paper,
  );
})();

// ---------- Curiosities: deep teal ----------
const other = (() => {
  const t = tones('#2C6E62');
  return svg(
    S,
    S,
    `
    <rect x="70" y="40" width="460" height="400" rx="16" fill="${t.d}"/>
    ${range(3)
      .map(
        (r) =>
          `<rect x="92" y="${62 + r * 124}" width="416" height="104" fill="${t.l}"/><rect x="86" y="${164 + r * 124}" width="428" height="12" fill="${t.dd}" class="t"/>`,
      )
      .join('')}
    ${range(7)
      .map(
        (i) =>
          `<rect x="${110 + i * 22}" y="${84 + (i % 3) * 6}" width="18" height="${80 - (i % 3) * 6}" rx="3" fill="${[t.b, t.dd, t.m][i % 3]}" class="t"/>`,
      )
      .join('')}
    ${blob('M330 162 L330 110 C330 96 344 92 352 92 L376 92 C384 92 398 96 398 110 L398 162Z', t.xl)}
    <rect x="338" y="80" width="52" height="14" rx="4" fill="${t.dd}" class="t"/>
    ${blob('M430 162 C430 120 490 120 490 162Z', t.m)}
    <circle cx="460" cy="108" r="14" fill="${t.b}"/>
    <circle cx="160" cy="250" r="30" fill="${t.m}"/>
    ${ln('M160 220 L160 280 M130 250 L190 250', t.dd, 3)}
    ${blob('M260 286 L260 222 L340 222 L340 286Z', t.b)}
    ${ln('M266 236 L334 236 M266 256 L334 256 M266 274 L334 274', t.xl, 3)}
    ${blob('M410 286 C400 250 420 220 440 214 C462 220 480 250 470 286Z', t.xl)}
    ${range(4)
      .map(
        (i) =>
          `<circle cx="${130 + i * 50}" cy="${396 - (i % 2) * 8}" r="${16 + (i % 2) * 6}" fill="${[t.xl, t.b, t.m, t.dd][i]}" class="t"/>`,
      )
      .join('')}
    ${blob('M360 410 C360 360 440 360 440 410Z', t.dd)}
    <rect x="-10" y="440" width="620" height="180" fill="${t.b}"/>
    <circle cx="130" cy="520" r="62" fill="${t.xl}"/>
    <circle cx="130" cy="520" r="46" fill="${t.l}" class="t"/>
    ${blob('M130 478 L142 520 L130 562 L118 520Z', t.dd)}
    <circle cx="130" cy="520" r="6" fill="${C.card}" class="t"/>
    ${blob('M270 470 C270 430 360 430 360 470 L360 560 L270 560Z', t.xl)}
    ${blob('M260 556 L370 556 L376 574 L254 574Z', t.dd)}
    ${blob('M315 488 L322 508 L344 508 L326 520 L333 540 L315 528 L297 540 L304 520 L286 508 L308 508Z', t.d)}
    <circle cx="474" cy="500" r="40" fill="${t.xl}"/>
    <circle cx="474" cy="500" r="28" fill="${t.l}" class="t"/>
    ${ln('M502 528 L548 574', t.dd, 16)}
    <circle cx="430" cy="585" r="14" fill="none" class="ln" style="stroke:${t.dd};stroke-width:7"/>
    ${ln('M442 580 L520 556 M500 562 L504 574 M514 558 L518 570', t.dd, 7)}`,
    C.paper,
  );
})();

const pages = Object.entries({
  coast,
  nature,
  heritage,
  culture,
  art,
  music_events: music,
  other,
}).map(([name, s]) => [`${name}.webp`, s, S, S]);
await renderWebp(pages, out, 1024 / S);
console.log(`wrote ${pages.length} category covers to ${out}`);
