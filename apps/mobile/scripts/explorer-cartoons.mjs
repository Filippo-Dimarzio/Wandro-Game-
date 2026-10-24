// The eight explorers as bold cartoon portraits: flat colours, thick ink outlines, big eyes and
// rosy cheeks on a bright halftone badge. Original characters for Wandro, drawn for a young crowd.
// Used by scripts/render-explorers.mjs.

const INK = '#222033';
const o = (w = 2.2) =>
  `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const line = (d, w = 2.2, color = INK) =>
  `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
/** Mix a colour towards white (t > 0) or black (t < 0). */
export const shade = (h, t) =>
  '#' +
  hex(h)
    .map((v) => Math.round(t > 0 ? v + (255 - v) * t : v * (1 + t)))
    .map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0'))
    .join('');

/** A big cartoon eye. `look` shifts the pupil left (-1) or right (1); `lid` gives a sleepy, cool look. */
function eye(p, cx, cy) {
  const look = p.look ?? 0;
  let s =
    `<ellipse cx="${cx}" cy="${cy}" rx="6.2" ry="5.6" fill="#fff" ${o(1.8)}/>` +
    `<circle cx="${cx + look * 1.8}" cy="${cy + 0.7}" r="2.8" fill="${INK}"/>` +
    `<circle cx="${cx + look * 1.8 + 1}" cy="${cy - 0.3}" r="0.9" fill="#fff"/>`;
  if (p.lid)
    s += `<path d="M${cx - 6.7} ${cy - 0.6} C${cx - 5} ${cy - 7} ${cx + 5} ${cy - 7} ${cx + 6.7} ${cy - 0.6} Z" fill="${p.skin}" ${o(1.8)}/>`;
  if (p.lashes) {
    const out = cx < 60 ? -1 : 1;
    s += line(`M${cx + out * 6} ${cy - 2.4} L${cx + out * 8.6} ${cy - 4.8}`, 1.8);
  }
  return s;
}

const MOUTHS = {
  smile: () => line('M55 74 C58 77.5 62 77.5 65 74'),
  grin: () =>
    `<path d="M53.5 72.5 C56 79.5 64 79.5 66.5 72.5 Z" fill="#fff" ${o(1.9)}/>` +
    line('M54.5 74.2 L65.5 74.2', 1.2),
  open: () =>
    `<path d="M55 72.5 C56.5 79 63.5 79 65 72.5 Z" fill="#C8433F" ${o(1.9)}/>` +
    `<path d="M57 76.4 C58.6 75 61.4 75 63 76.4 C61.6 77.6 58.4 77.6 57 76.4Z" fill="#F28B9B"/>`,
  oh: () => `<ellipse cx="61" cy="75" rx="2.6" ry="3.2" fill="#C8433F" ${o(1.8)}/>`,
  smirk: () => line('M55.5 74.5 C58.5 76.5 62.5 76 65.5 72.5'),
};

function face(p) {
  const brow = shade(p.hair, -0.25);
  return (
    // Ears, neck and the shoulders of the jacket.
    `<ellipse cx="38.5" cy="62" rx="4.4" ry="6" fill="${p.skin}" ${o()}/>` +
    `<ellipse cx="81.5" cy="62" rx="4.4" ry="6" fill="${p.skin}" ${o()}/>` +
    (p.earring ?? '') +
    `<path d="M53 80 L53 94 L67 94 L67 80 Z" fill="${shade(p.skin, -0.12)}" ${o()}/>` +
    `<path d="M20 124 C20 103 36 92 60 92 C84 92 100 103 100 124 Z" fill="${p.outfit}" ${o()}/>` +
    `<path d="M51 92 L60 104 L69 92 Z" fill="${p.tee}" ${o(1.9)}/>` +
    line('M51 92 L46 104 M69 92 L74 104', 1.9) +
    (p.strap
      ? `<path d="M34 98 C38 106 40 114 41 124" fill="none" stroke="${INK}" stroke-width="7" stroke-linecap="round"/><path d="M34 98 C38 106 40 114 41 124" fill="none" stroke="${p.strap}" stroke-width="4" stroke-linecap="round"/>`
      : '') +
    // The face: a soft, wide oval with a small chin.
    `<path d="M39 52 C39 35 48.5 28 60 28 C71.5 28 81 35 81 52 L81 61 C81 75 72 84.5 60 84.5 C48 84.5 39 75 39 61 Z" fill="${p.skin}" ${o()}/>` +
    `<circle cx="46.5" cy="69" r="4.6" fill="#F28B9B" opacity="0.75"/>` +
    `<circle cx="73.5" cy="69" r="4.6" fill="#F28B9B" opacity="0.75"/>` +
    (p.extra ?? '') +
    eye(p, 51, 60) +
    eye(p, 69, 60) +
    line(
      p.brows ?? 'M45.5 48.5 C48 46.2 52 46.2 54.5 47.4 M65.5 47.4 C68 46.2 72 46.2 74.5 48.5',
      2.6,
      brow,
    ) +
    line('M60 64 C62.2 65.4 62.2 67.6 59.6 68.4', 1.7) +
    MOUTHS[p.mouth ?? 'smile']()
  );
}

const hairPath = (d, p, w = 2.2) => `<path d="${d}" fill="${p.hair}" ${o(w)}/>`;
const shine = (d, p) => line(d, 2, shade(p.hair, 0.35));
const hoops = (c) =>
  `<circle cx="37.5" cy="72" r="3.6" fill="none" stroke="${c}" stroke-width="2"/>` +
  `<circle cx="82.5" cy="72" r="3.6" fill="none" stroke="${c}" stroke-width="2"/>`;
const curls = (pts, p) =>
  pts
    .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${p.hair}" ${o(2)}/>`)
    .join('');

export const EXPLORERS = {
  // Long wavy brown hair with a middle parting.
  e1: {
    skin: '#F7D6C1',
    hair: '#7A4A2A',
    bg: '#F28C45',
    tee: '#FBF4E4',
    look: 1,
    lashes: true,
    mouth: 'smile',
    back: (p) =>
      hairPath(
        'M36 52 C33 26 87 26 84 52 C86 68 92 82 94 100 C86 108 76 104 73 96 L47 96 C44 104 34 108 26 100 C28 82 34 68 36 52Z',
        p,
      ),
    front: (p) =>
      hairPath(
        'M37.5 58 C35 34 46 25 60 25 C74 25 85 34 82.5 58 C80 46 72 39.5 62 37.5 L60 41 L58 37.5 C48 39.5 40 46 37.5 58Z',
        p,
      ) + shine('M29 90 C33 84 31 78 34 72 M91 90 C87 84 89 78 86 72 M66 31 C72 32 77 36 79 41', p),
  },
  // Blond high ponytail with a scrunchie.
  e2: {
    skin: '#F9DCC8',
    hair: '#F2C14E',
    bg: '#F49AB0',
    tee: '#FBF4E4',
    look: -1,
    lid: true,
    lashes: true,
    mouth: 'oh',
    earring: `<circle cx="38" cy="69.5" r="1.9" fill="#E9A93B" ${o(1.2)}/><circle cx="82" cy="69.5" r="1.9" fill="#E9A93B" ${o(1.2)}/>`,
    back: (p) =>
      hairPath(
        'M72 30 C84 14 104 24 99 44 C97 56 101 66 106 74 C92 77 84 66 84 54 C84 45 80 37 73 35Z',
        p,
      ) +
      `<ellipse cx="76" cy="29" rx="6" ry="4.6" fill="#E4572E" ${o(2)} transform="rotate(-30 76 29)"/>`,
    front: (p) =>
      hairPath(
        'M37.5 58 C34.5 34 46 24.5 61 24.5 C75 24.5 85.5 33 82.5 56 C78.5 44 70 37.5 57 36.5 C49 40 42.5 48 37.5 58Z',
        p,
      ) + shine('M46 33 C52 29 60 28 66 29 M98 46 C97 54 99 60 102 66', p),
  },
  // Tan skin, long straight black hair with blunt bangs and gold hoops.
  e3: {
    skin: '#D9A27A',
    hair: '#1E1A22',
    bg: '#6CC5A0',
    tee: '#F2C14E',
    look: 1,
    lashes: true,
    mouth: 'smirk',
    earring: hoops('#E9A93B'),
    back: (p) => hairPath('M35 50 C33 25 87 25 85 50 L89 102 C76 106 44 106 31 102Z', p),
    front: (p) =>
      hairPath(
        'M37 56 C35 30 47 24 60 24 C73 24 85 30 83 56 L83 47.5 C77 46 69 46 60 46 C51 46 43 46 37 47.5Z',
        p,
      ) + shine('M47 29 C53 27 60 27 66 28 M34 70 L34 92 M86 70 L86 92', p),
  },
  // Black man with short curly hair and a big grin.
  e4: {
    skin: '#7A4A2E',
    hair: '#1E1A22',
    bg: '#F2C14E',
    tee: '#E4572E',
    look: -1,
    mouth: 'open',
    strap: '#E4572E',
    front: (p) =>
      hairPath(
        'M38.5 52 C36.5 34 46 25 60 25 C74 25 83.5 34 81.5 52 C80 46 72 42.5 60 42.5 C48 42.5 40 46 38.5 52Z',
        p,
      ) +
      curls(
        [
          [41, 40, 5.4],
          [46, 32, 5.6],
          [53, 27, 5.8],
          [60, 25.5, 6],
          [67, 27, 5.8],
          [74, 32, 5.6],
          [79, 40, 5.4],
          [50, 37, 5],
          [60, 34, 5.2],
          [70, 37, 5],
        ],
        p,
      ),
  },
  // White man, brown hair swept up into a quiff.
  e5: {
    skin: '#F5CFB4',
    hair: '#6B3F26',
    bg: '#7FB2E5',
    tee: '#FBF4E4',
    look: 1,
    mouth: 'grin',
    strap: '#C8553D',
    front: (p) =>
      hairPath(
        'M38.5 55 C34.5 37 42 27 52 24 C58 17 73 17 79 25.5 C86.5 32 85.5 44 81.5 55 C79.5 47 75.5 42.5 69 40.5 C61 42.5 50 42 44.5 44 C41.5 46.5 39.5 50 38.5 55Z',
        p,
      ) + shine('M54 23 C62 20 70 22 75 27 M47 33 C52 29 58 28 63 29', p),
  },
  // White man with blond curtains (a middle parting down to the ears) and freckles.
  e6: {
    skin: '#F8D8C3',
    hair: '#E8B94A',
    bg: '#B79BE0',
    tee: '#2F5C9C',
    look: -1,
    lid: true,
    mouth: 'smile',
    extra:
      '<g fill="#C9876A">' +
      [
        [45, 65],
        [48, 63.5],
        [47.5, 67],
        [72, 65],
        [75, 63.5],
        [72.5, 67],
      ]
        .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="0.9"/>`)
        .join('') +
      '</g>',
    front: (p) =>
      hairPath(
        'M37 63 C34 34 46 24 60 24 C74 24 86 34 83 63 C82 53 78 47 70 45 C66 44 62 41 60 37 C58 41 54 44 50 45 C42 47 38 53 37 63Z',
        p,
      ) + shine('M48 29 C54 26 66 26 72 29 M42 52 C44 47 48 45 52 44', p),
  },
  // Brown woman with a high bun, a scrunchie, a nose stud and gold hoops.
  e7: {
    skin: '#B07650',
    hair: '#2A1A14',
    bg: '#4FB3A9',
    tee: '#F49AB0',
    look: 1,
    lashes: true,
    mouth: 'open',
    earring: hoops('#F2C14E'),
    extra: `<circle cx="62.6" cy="67.4" r="1" fill="#F2C14E" ${o(0.6)}/>`,
    back: (p) => `<circle cx="60" cy="18" r="11" fill="${p.hair}" ${o()}/>`,
    front: (p) =>
      `<ellipse cx="60" cy="27.5" rx="9" ry="3.6" fill="#3E8E8A" ${o(2)}/>` +
      hairPath(
        'M38.5 56 C36.5 35 46 27.5 60 27.5 C74 27.5 83.5 35 81.5 56 C79.5 46 73.5 40 66 38 C60 42 50 42 44.5 44 C41.5 47 39.5 51 38.5 56Z',
        p,
      ) +
      shine('M47 34 C52 31 58 30.5 63 31 M54 12 C57 10 62 10 65 12', p),
  },
  // Brown man with wavy black hair swept to one side, round glasses and light stubble.
  e8: {
    skin: '#A8704A',
    hair: '#1E1A22',
    bg: '#EE6E5A',
    tee: '#FBF4E4',
    look: 0,
    mouth: 'smile',
    strap: '#2F5C9C',
    extra:
      `<g fill="${'#6E4630'}">` +
      [
        [50, 79],
        [54, 81.5],
        [58, 82.4],
        [62, 82.4],
        [66, 81.5],
        [70, 79],
        [47, 76],
        [73, 76],
      ]
        .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="0.8"/>`)
        .join('') +
      '</g>',
    glasses: true,
    front: (p) =>
      hairPath(
        'M38.5 56 C35 33 46 23 61 23 C77 23 87 33 82 54 C80 45 74 39 64 38 C56 38 50 40 46 44 C42 47 40 51 38.5 56Z',
        p,
      ) + shine('M52 27 C60 25.5 70 27 76 32', p),
  },
};

const glasses = () =>
  `<circle cx="51" cy="60" r="8.2" fill="none" ${o(2.2)}/><circle cx="69" cy="60" r="8.2" fill="none" ${o(2.2)}/>` +
  line('M59.2 59.5 C59.8 58.5 60.2 58.5 60.8 59.5 M42.8 58.5 L39.5 57 M77.2 58.5 L80.5 57', 2);

/** One portrait as an SVG string: explorer `id` wearing a jacket of colour `outfit`. */
export function portraitSvg(id, outfit, size, key = `${id}${outfit.slice(1)}`) {
  const p = { ...EXPLORERS[id], outfit };
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="${size}" height="${size}">` +
    `<defs><clipPath id="c"><circle cx="60" cy="60" r="60"/></clipPath>` +
    `<pattern id="dots" width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="3.5" cy="3.5" r="1.3" fill="#fff" opacity="0.28"/></pattern></defs>` +
    `<g clip-path="url(#c)"><rect width="120" height="120" fill="${p.bg}"/><rect width="120" height="120" fill="url(#dots)"/>` +
    `<g transform="translate(60 66) scale(1.06) translate(-60 -64)">` +
    (p.back ? p.back(p) : '') +
    face(p) +
    p.front(p) +
    (p.glasses ? glasses() : '') +
    `</g></g></svg>`;
  // Pattern and clip ids are global in a document: prefix them so portraits can share a page.
  return svg
    .replace(/id="([\w-]+)"/g, `id="${key}-$1"`)
    .replace(/url\(#([\w-]+)\)/g, `url(#${key}-$1)`);
}
