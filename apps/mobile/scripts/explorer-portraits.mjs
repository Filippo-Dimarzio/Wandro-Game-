// Semi-realistic painted portraits of the explorers: soft gradients and shading, no ink outlines.
// Used by scripts/render-explorers.mjs.

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const toHex = (rgb) =>
  '#' +
  rgb
    .map((v) =>
      Math.max(0, Math.min(255, Math.round(v)))
        .toString(16)
        .padStart(2, '0'),
    )
    .join('');
/** Mix a colour towards white (t > 0) or black (t < 0). */
export const shade = (h, t) => {
  const c = hex(h);
  return toHex(c.map((v) => (t > 0 ? v + (255 - v) * t : v * (1 + t))));
};

/** Everything a portrait needs: gradients and soft-focus filters, keyed by `id`. */
function defs(p, outfit) {
  const { skin, hair, iris, lips } = p;
  return `<defs>
    <radialGradient id="bg" cx="50%" cy="38%" r="75%">
      <stop offset="0" stop-color="#F7F1E8"/><stop offset="0.65" stop-color="#E4D7C6"/><stop offset="1" stop-color="#C9B59D"/>
    </radialGradient>
    <radialGradient id="skin" cx="44%" cy="38%" r="70%">
      <stop offset="0" stop-color="${shade(skin, 0.16)}"/><stop offset="0.55" stop-color="${skin}"/><stop offset="1" stop-color="${shade(skin, -0.28)}"/>
    </radialGradient>
    <linearGradient id="neck" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${shade(skin, -0.32)}"/><stop offset="0.45" stop-color="${shade(skin, -0.08)}"/><stop offset="1" stop-color="${skin}"/>
    </linearGradient>
    <linearGradient id="hair" x1="0.2" y1="0" x2="0.8" y2="1">
      <stop offset="0" stop-color="${shade(hair, 0.22)}"/><stop offset="0.45" stop-color="${hair}"/><stop offset="1" stop-color="${shade(hair, -0.35)}"/>
    </linearGradient>
    <radialGradient id="iris" cx="50%" cy="40%" r="60%">
      <stop offset="0" stop-color="${shade(iris, 0.35)}"/><stop offset="0.7" stop-color="${iris}"/><stop offset="1" stop-color="${shade(iris, -0.45)}"/>
    </radialGradient>
    <linearGradient id="lips" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${shade(lips, -0.18)}"/><stop offset="1" stop-color="${shade(lips, 0.12)}"/>
    </linearGradient>
    <linearGradient id="jacket" x1="0.1" y1="0" x2="0.9" y2="1">
      <stop offset="0" stop-color="${shade(outfit, 0.18)}"/><stop offset="0.5" stop-color="${outfit}"/><stop offset="1" stop-color="${shade(outfit, -0.4)}"/>
    </linearGradient>
    <linearGradient id="scarf" x1="0.2" y1="0" x2="0.8" y2="1">
      <stop offset="0" stop-color="${shade(p.scarf ?? hair, 0.2)}"/><stop offset="0.5" stop-color="${p.scarf ?? hair}"/><stop offset="1" stop-color="${shade(p.scarf ?? hair, -0.38)}"/>
    </linearGradient>
    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.1"/></filter>
    <filter id="softer" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.4"/></filter>
    <filter id="hairy" x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="1.4" xChannelSelector="R" yChannelSelector="G" result="d"/>
      <feGaussianBlur in="d" stdDeviation="0.3"/>
    </filter>
    <filter id="curly" x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="turbulence" baseFrequency="0.35" numOctaves="3" seed="7" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="4" xChannelSelector="R" yChannelSelector="G" result="d"/>
      <feGaussianBlur in="d" stdDeviation="0.45"/>
    </filter>
  </defs>`;
}

// Face geometry (viewBox 0 0 120 120). The head's top sits near y = 28 so hats land on it.
const FACE =
  'M41 50 C41 34 49.5 28.5 60 28.5 C70.5 28.5 79 34 79 50 C79 61 76.5 69.5 71 74.5 C67.5 77.6 63.8 79 60 79 C56.2 79 52.5 77.6 49 74.5 C43.5 69.5 41 61 41 50 Z';

function body(p) {
  return (
    // Shoulders and jacket, with a soft shadow where the neck meets the collar.
    `<path d="M6 122 C8 98 26 86 46 82 L74 82 C94 86 112 98 114 122 Z" fill="url(#jacket)"/>` +
    `<path d="M50 74 L50 86 C54 90 66 90 70 86 L70 74 Z" fill="url(#neck)"/>` +
    `<path d="M46 82 C50 90 70 90 74 82 L74 86 C70 96 50 96 46 86 Z" fill="${p.tee}"/>` +
    `<path d="M46 82 C50 89 70 89 74 82" fill="none" stroke="${shade(p.tee, -0.25)}" stroke-width="1.2" filter="url(#soft)"/>` +
    // Jacket collar and zip.
    `<path d="M44 82 L54 98 L50 122 M76 82 L66 98 L70 122" fill="none" stroke="rgba(0,0,0,0.28)" stroke-width="1.6" filter="url(#soft)"/>` +
    `<path d="M40 84 C44 88 48 92 52 100 L46 102 C42 96 39 90 36 86 Z" fill="rgba(255,255,255,0.10)"/>` +
    `<path d="M80 84 C76 88 72 92 68 100 L74 102 C78 96 81 90 84 86 Z" fill="rgba(0,0,0,0.15)"/>` +
    `<path d="M14 112 C20 100 28 94 36 92" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="3" filter="url(#softer)"/>`
  );
}

function ears(p) {
  const e = (x, flip) =>
    `<g transform="translate(${x} 55) scale(${flip ? -1 : 1} 1)">` +
    `<path d="M0 -7 C-5 -7 -6 -1 -5 3 C-4 7 -1 8 1 7 Z" fill="url(#skin)"/>` +
    `<path d="M-1 -4 C-4 -3 -4 2 -2 4" fill="none" stroke="${shade(p.skin, -0.35)}" stroke-width="1" filter="url(#soft)"/>` +
    `</g>`;
  return e(42, false) + e(78, true);
}

function eye(p, cx) {
  const lash = shade(p.hair === '#BDBDBD' ? '#3A3030' : p.hair, -0.4);
  return (
    // Socket shadow, white, iris, pupil, catchlight, lid and lashes.
    `<ellipse cx="${cx}" cy="51.6" rx="5.2" ry="3" fill="${shade(p.skin, -0.22)}" opacity="0.55" filter="url(#soft)"/>` +
    `<path d="M${cx - 4} 53 C${cx - 2} 50.6 ${cx + 2} 50.6 ${cx + 4} 53 C${cx + 2} 54.8 ${cx - 2} 54.8 ${cx - 4} 53 Z" fill="#F6F1EA"/>` +
    `<circle cx="${cx}" cy="52.8" r="2.05" fill="url(#iris)"/>` +
    `<circle cx="${cx}" cy="52.8" r="0.95" fill="#140F0D"/>` +
    `<circle cx="${cx + 0.75}" cy="52.1" r="0.5" fill="#fff"/>` +
    `<path d="M${cx - 4.3} 53 C${cx - 2} 50.2 ${cx + 2} 50.2 ${cx + 4.3} 53" fill="none" stroke="${lash}" stroke-width="0.9" stroke-linecap="round"/>` +
    `<path d="M${cx - 3.5} 54.6 C${cx - 1.5} 55.6 ${cx + 1.5} 55.6 ${cx + 3.5} 54.6" fill="none" stroke="${shade(p.skin, -0.3)}" stroke-width="0.5" opacity="0.6"/>`
  );
}

function brows(p) {
  const c = p.brow ?? shade(p.hair, -0.1);
  return (
    `<path d="M47 47.6 C49.5 45.6 53.5 45.4 56.4 46.6 L56.2 47.6 C53.5 46.8 50 47.2 47.6 48.6 Z" fill="${c}" opacity="0.92"/>` +
    `<path d="M73 47.6 C70.5 45.6 66.5 45.4 63.6 46.6 L63.8 47.6 C66.5 46.8 70 47.2 72.4 48.6 Z" fill="${c}" opacity="0.92"/>`
  );
}

function nose(p) {
  const d = shade(p.skin, -0.3);
  return (
    `<path d="M58.6 52 C58.2 56 57 59.5 56 61.5" fill="none" stroke="${d}" stroke-width="1.3" opacity="0.55" filter="url(#soft)"/>` +
    `<ellipse cx="60.6" cy="61" rx="2.3" ry="1.5" fill="${shade(p.skin, 0.2)}" opacity="0.6" filter="url(#soft)"/>` +
    `<ellipse cx="57.6" cy="63.1" rx="1.1" ry="0.6" fill="${shade(p.skin, -0.45)}" opacity="0.7"/>` +
    `<ellipse cx="62.4" cy="63.1" rx="1.1" ry="0.6" fill="${shade(p.skin, -0.45)}" opacity="0.7"/>` +
    `<path d="M55.6 62.6 C57.5 64.8 62.5 64.8 64.4 62.6" fill="none" stroke="${d}" stroke-width="0.8" opacity="0.5" filter="url(#soft)"/>`
  );
}

function mouth(p) {
  return (
    `<path d="M54 68.6 C56 67.4 58.4 67.4 60 68 C61.6 67.4 64 67.4 66 68.6 C63.5 69.4 56.5 69.4 54 68.6 Z" fill="url(#lips)"/>` +
    `<path d="M54.2 68.8 C56.5 72.4 63.5 72.4 65.8 68.8 C63.5 69.6 56.5 69.6 54.2 68.8 Z" fill="url(#lips)"/>` +
    `<path d="M54 68.7 C57 70 63 70 66 68.7" fill="none" stroke="${shade(p.lips, -0.45)}" stroke-width="0.7" stroke-linecap="round"/>` +
    `<ellipse cx="60" cy="70.6" rx="2.6" ry="0.7" fill="#fff" opacity="0.25" filter="url(#soft)"/>` +
    `<path d="M53 68 C53.3 68.8 53.8 69.4 54.4 69.6 M67 68 C66.7 68.8 66.2 69.4 65.6 69.6" fill="none" stroke="${shade(p.skin, -0.3)}" stroke-width="0.7" opacity="0.6"/>`
  );
}

function head(p) {
  return (
    ears(p) +
    `<path d="${FACE}" fill="url(#skin)"/>` +
    // Contour: cheeks and jaw in shadow, forehead and cheekbones catching the light.
    `<path d="M41.5 52 C42 63 45.5 70 50 74.5 C46 69 44.5 61 44.5 52 Z" fill="${shade(p.skin, -0.3)}" opacity="0.45" filter="url(#softer)"/>` +
    `<path d="M78.5 52 C78 63 74.5 70 70 74.5 C74 69 75.5 61 75.5 52 Z" fill="${shade(p.skin, -0.3)}" opacity="0.45" filter="url(#softer)"/>` +
    `<ellipse cx="60" cy="38" rx="11" ry="5" fill="${shade(p.skin, 0.25)}" opacity="0.35" filter="url(#softer)"/>` +
    `<ellipse cx="48.5" cy="62" rx="4" ry="2.6" fill="${p.blush ?? '#E07A6A'}" opacity="0.22" filter="url(#softer)"/>` +
    `<ellipse cx="71.5" cy="62" rx="4" ry="2.6" fill="${p.blush ?? '#E07A6A'}" opacity="0.22" filter="url(#softer)"/>` +
    brows(p) +
    eye(p, 52) +
    eye(p, 68) +
    nose(p) +
    mouth(p) +
    `<path d="M55 76.5 C58 78.2 62 78.2 65 76.5" fill="none" stroke="${shade(p.skin, 0.2)}" stroke-width="1" opacity="0.4" filter="url(#soft)"/>`
  );
}

function glasses() {
  const lens = (cx) =>
    `<circle cx="${cx}" cy="53" r="6" fill="rgba(210,225,235,0.18)" stroke="#2E2624" stroke-width="1.1"/>` +
    `<path d="M${cx - 3.5} 49.8 C${cx - 1.5} 48.6 ${cx + 1} 48.6 ${cx + 2.5} 49.4" fill="none" stroke="#fff" stroke-width="0.8" opacity="0.6"/>`;
  return (
    lens(52) +
    lens(68) +
    `<path d="M58 52.4 C59.2 51.4 60.8 51.4 62 52.4" fill="none" stroke="#2E2624" stroke-width="1.1"/>` +
    `<path d="M46 52 L42 51 M74 52 L78 51" stroke="#2E2624" stroke-width="1.1"/>`
  );
}

/** Freckles scattered over nose and cheeks. */
const freckles = (c) =>
  [
    [47, 60],
    [49.5, 61.5],
    [52, 60.4],
    [55, 59.4],
    [65, 59.4],
    [68, 60.4],
    [70.5, 61.5],
    [73, 60],
    [50, 63.2],
    [70, 63.2],
  ]
    .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="0.55" fill="${c}" opacity="0.65"/>`)
    .join('');

/** Light strands so hair reads as hair, not a flat shape. */
const strands = (paths, c, w = 0.8, o = 0.35) =>
  paths
    .map(
      (d) =>
        `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" opacity="${o}" stroke-linecap="round"/>`,
    )
    .join('');

// Eight explorers. Order matches EXPLORER_IDS; descriptions match explorer.e1…e8 in the app.
export const EXPLORERS = {
  // Long dark hair.
  e1: {
    skin: '#C68863',
    hair: '#2B1D16',
    iris: '#5A3A22',
    lips: '#B0605A',
    tee: '#F4EFE6',
    back: () =>
      `<path d="M36 50 C33 20 87 20 84 50 L87 94 C81 101 71 97 70 86 L50 86 C49 97 39 101 33 94 Z" fill="url(#hair)" filter="url(#hairy)"/>`,
    front: (p) =>
      `<path d="M39 54 C35 26 45 17.5 60 17.5 C75 17.5 85 26 81 54 C79.5 45 76 39 70 37 C63 41 52 43 44 42.5 C41.5 45.5 39.8 49.5 39 54 Z" fill="url(#hair)" filter="url(#hairy)"/>` +
      strands(
        [
          'M45 40 C52 33 66 32 74 37',
          'M42 48 C44 40 50 36 58 35',
          'M78 48 C77 42 74 38 68 36',
          'M37 60 C36 72 37 82 38 90',
          'M83 60 C84 72 83 82 82 90',
        ],
        shade(p.hair, 0.45),
      ),
  },
  // Short curly hair.
  e2: {
    skin: '#7A4A2E',
    hair: '#1E1612',
    iris: '#3A2416',
    lips: '#7E4434',
    blush: '#A0503A',
    tee: '#F4EFE6',
    back: () => '',
    front: (p) =>
      `<path d="M39 51 C35 28 45 19 60 19 C75 19 85 28 81 51 C79.5 43 75 38.5 69 37.5 C63 40 57 40 51 37.5 C45.5 38.5 41 43 39 51 Z" fill="url(#hair)" filter="url(#curly)"/>` +
      [
        [44, 34],
        [50, 28],
        [58, 26],
        [66, 27],
        [73, 31],
        [78, 38],
        [42, 42],
        [62, 31],
        [54, 32],
      ]
        .map(
          ([x, y]) =>
            `<circle cx="${x}" cy="${y}" r="2.2" fill="${shade(p.hair, 0.35)}" opacity="0.35" filter="url(#soft)"/>`,
        )
        .join(''),
  },
  // Black bob and round glasses.
  e3: {
    skin: '#F1C9A5',
    hair: '#141414',
    iris: '#2E2018',
    lips: '#C9767A',
    tee: '#EDE6DA',
    back: () =>
      `<path d="M35 52 C32 20 88 20 85 52 L86 75 C80 78 73 76 72 70 L48 70 C47 76 40 78 34 75 Z" fill="url(#hair)" filter="url(#hairy)"/>`,
    front: (p) =>
      `<path d="M38.5 55 C34.5 16 85.5 16 81.5 55 C80.5 47 78.5 43 76 41.5 C66 45 54 45 44 41.5 C41.5 43 39.5 48 38.5 55 Z" fill="url(#hair)" filter="url(#hairy)"/>` +
      strands(
        ['M44 38 C52 33 68 33 76 38', 'M39 58 C38 64 38 68 39 72', 'M81 58 C82 64 82 68 81 72'],
        shade(p.hair, 0.6),
        0.9,
        0.3,
      ),
    extra: () => glasses(),
  },
  // Short brown hair and a beard.
  e4: {
    skin: '#E0A97E',
    hair: '#5A3B24',
    iris: '#5E6B3A',
    lips: '#B26E5E',
    tee: '#F4EFE6',
    back: () => '',
    front: (p) =>
      `<path d="M40 50 C36.5 18 83.5 18 80 50 C78.5 42 75 37.5 68 36.5 C61 38.5 52 38 46 38 C43 40.5 41 45 40 50 Z" fill="url(#hair)" filter="url(#hairy)"/>` +
      strands(['M46 36 C54 31 68 31 76 37', 'M50 33 C56 30 64 30 70 32'], shade(p.hair, 0.4)),
    extra: (p) =>
      `<path d="M42.5 58 C43 70 49 78.5 60 79.5 C71 78.5 77 70 77.5 58 C75 66 71 71 66 72.5 C63 70.6 57 70.6 54 72.5 C49 71 45 66 42.5 58 Z" fill="url(#hair)" opacity="0.92" filter="url(#hairy)"/>` +
      `<path d="M53.6 66.4 C56 64.6 64 64.6 66.4 66.4 C64 66 56 66 53.6 66.4 Z" fill="${shade(p.hair, -0.1)}" filter="url(#hairy)"/>`,
  },
  // Headscarf.
  e5: {
    skin: '#A8714C',
    hair: '#2A1A14',
    scarf: '#7B3F6E',
    iris: '#4A2E1C',
    lips: '#9A5A50',
    tee: '#E9DFD2',
    back: () =>
      `<path d="M32 56 C29 18 91 18 88 56 C90 78 80 92 60 94 C40 92 30 78 32 56 Z" fill="url(#scarf)"/>`,
    front: (p) =>
      `<path d="M37.5 53 C34 17 86 17 82.5 53 C80.5 41 72 36.5 60 36.5 C48 36.5 39.5 41 37.5 53 Z" fill="url(#scarf)"/>` +
      `<path d="M41 49 C46 40 74 40 79 49" fill="none" stroke="${shade(p.scarf, 0.3)}" stroke-width="1.2" opacity="0.5" filter="url(#soft)"/>` +
      `<path d="M38 70 C44 84 76 84 82 70" fill="none" stroke="${shade(p.scarf, -0.4)}" stroke-width="2" opacity="0.5" filter="url(#soft)"/>` +
      `<path d="M36 80 C46 92 74 92 84 80 L88 96 C74 104 46 104 32 96 Z" fill="url(#scarf)"/>`,
  },
  // Grey hair, glasses and a moustache.
  e6: {
    skin: '#D9A27C',
    hair: '#BDBDBD',
    brow: '#8E8A86',
    iris: '#5C7486',
    lips: '#A8675C',
    tee: '#F4EFE6',
    back: () => '',
    front: (p) =>
      `<path d="M40 56 C35 32 47 24.5 60 24.5 C73 24.5 85 32 80 56 C79 46 76.5 41.5 72 40 C66 37 54 37 48 40 C43.5 41.5 41 46 40 56 Z" fill="url(#hair)" filter="url(#hairy)"/>` +
      strands(
        ['M44 44 C48 36 56 32 62 32', 'M76 44 C74 38 70 34 64 32'],
        shade(p.hair, 0.5),
        0.9,
        0.5,
      ) +
      // Lines of a life well travelled.
      `<path d="M45 57 C46 58 47 58 48 57.4 M75 57 C74 58 73 58 72 57.4" fill="none" stroke="${shade(p.skin, -0.3)}" stroke-width="0.5" opacity="0.6"/>`,
    extra: () =>
      `<path d="M53 66.6 C55.5 64.4 64.5 64.4 67 66.6 C65 67.4 62 67 60 66.4 C58 67 55 67.4 53 66.6 Z" fill="url(#hair)" filter="url(#hairy)"/>` +
      glasses(),
  },
  // Big curly afro.
  e7: {
    skin: '#5C3A24',
    hair: '#1C130E',
    iris: '#2E1C10',
    lips: '#6A3628',
    blush: '#8A4030',
    tee: '#F4EFE6',
    back: () =>
      `<ellipse cx="60" cy="40" rx="34" ry="28" fill="url(#hair)" filter="url(#curly)"/>` +
      `<ellipse cx="60" cy="52" rx="30" ry="22" fill="url(#hair)" filter="url(#curly)"/>`,
    front: (p) =>
      `<path d="M41 49 C43 36 77 36 79 49 C72 42 48 42 41 49 Z" fill="url(#hair)" filter="url(#curly)"/>` +
      [
        [38, 30],
        [48, 20],
        [60, 17],
        [72, 20],
        [82, 30],
        [32, 44],
        [88, 44],
        [54, 24],
        [67, 24],
      ]
        .map(
          ([x, y]) =>
            `<circle cx="${x}" cy="${y}" r="3" fill="${shade(p.hair, 0.3)}" opacity="0.3" filter="url(#soft)"/>`,
        )
        .join(''),
  },
  // Ginger hair in a bun, with freckles.
  e8: {
    skin: '#F6D3B8',
    hair: '#C4562B',
    iris: '#4E7A4A',
    lips: '#D07C76',
    blush: '#F08A7A',
    tee: '#F4EFE6',
    back: () => `<circle cx="60" cy="19" r="10.5" fill="url(#hair)" filter="url(#hairy)"/>`,
    front: (p) =>
      `<path d="M39 53 C35.5 17 84.5 17 81 53 C78.5 43 71 37.5 60 38.5 C49 37.5 41.5 43 39 53 Z" fill="url(#hair)" filter="url(#hairy)"/>` +
      strands(
        [
          'M44 44 C48 36 56 32 60 31',
          'M76 44 C72 36 64 32 60 31',
          'M53 16 C57 13 63 13 67 16',
          'M51 24 C55 28 65 28 69 24',
        ],
        shade(p.hair, 0.45),
        0.9,
        0.5,
      ),
    extra: (p) => freckles(shade(p.skin, -0.4)),
  },
};

/** One portrait as an SVG string: explorer `id` wearing a jacket of colour `outfit`. */
export function portraitSvg(id, outfit, size, key = `${id}${outfit.slice(1)}`) {
  const p = EXPLORERS[id];
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="${size}" height="${size}">` +
    defs(p, outfit) +
    `<clipPath id="c"><circle cx="60" cy="60" r="60"/></clipPath>` +
    `<g clip-path="url(#c)"><rect width="120" height="120" fill="url(#bg)"/>` +
    `<g transform="translate(60 64) scale(1.08) translate(-60 -64)">` +
    `<ellipse cx="60" cy="118" rx="58" ry="12" fill="rgba(0,0,0,0.18)" filter="url(#softer)"/>` +
    p.back(p) +
    body(p) +
    head(p) +
    p.front(p) +
    (p.extra ? p.extra(p) : '') +
    `</g></g></svg>`;
  // Gradient and filter ids are global in a document: prefix them so portraits can share a page.
  return svg
    .replace(/id="([\w-]+)"/g, `id="${key}-$1"`)
    .replace(/url\(#([\w-]+)\)/g, `url(#${key}-$1)`);
}
