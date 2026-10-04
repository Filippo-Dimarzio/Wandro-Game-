import type { Category } from '@wandro/shared';

/* eslint-disable @typescript-eslint/no-require-imports -- static asset requires for Metro */
/**
 * Round map pins with each category's hand-drawn illustration, with a check badge once discovered and
 * with a lock badge before. Rendered from assets/art by scripts/render-markers.mjs.
 */
export const MARKERS: Record<Category, { found: number; locked: number }> = {
  coast: {
    found: require('../../assets/markers/coast.png'),
    locked: require('../../assets/markers/coast-locked.png'),
  },
  nature: {
    found: require('../../assets/markers/nature.png'),
    locked: require('../../assets/markers/nature-locked.png'),
  },
  heritage: {
    found: require('../../assets/markers/heritage.png'),
    locked: require('../../assets/markers/heritage-locked.png'),
  },
  culture: {
    found: require('../../assets/markers/culture.png'),
    locked: require('../../assets/markers/culture-locked.png'),
  },
  art: {
    found: require('../../assets/markers/art.png'),
    locked: require('../../assets/markers/art-locked.png'),
  },
  music_events: {
    found: require('../../assets/markers/music_events.png'),
    locked: require('../../assets/markers/music_events-locked.png'),
  },
  other: {
    found: require('../../assets/markers/other.png'),
    locked: require('../../assets/markers/other-locked.png'),
  },
};
/* eslint-enable @typescript-eslint/no-require-imports */

/** Image name used in map styles: `marker-coast` or `marker-coast-locked`. */
export const markerName = (cat: Category, locked: boolean) =>
  `marker-${cat}${locked ? '-locked' : ''}`;
