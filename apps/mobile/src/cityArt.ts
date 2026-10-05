import type { ImageSource } from 'expo-image';

/* eslint-disable @typescript-eslint/no-require-imports -- static asset requires for Metro */
/**
 * Each city's landmark, in colour once you've unlocked the city and greyed out before.
 * Drawn in assets/cities/src (drop a photo there to replace a drawing) and rendered by
 * scripts/render-cities.mjs.
 */
export const CITY_ART: Record<string, { found: ImageSource; locked: ImageSource }> = {
  sintra: {
    found: require('../assets/cities/sintra.jpg'),
    locked: require('../assets/cities/sintra-locked.jpg'),
  },
  lisbon: {
    found: require('../assets/cities/lisbon.jpg'),
    locked: require('../assets/cities/lisbon-locked.jpg'),
  },
  porto: {
    found: require('../assets/cities/porto.jpg'),
    locked: require('../assets/cities/porto-locked.jpg'),
  },
  evora: {
    found: require('../assets/cities/evora.jpg'),
    locked: require('../assets/cities/evora-locked.jpg'),
  },
  aveiro: {
    found: require('../assets/cities/aveiro.jpg'),
    locked: require('../assets/cities/aveiro-locked.jpg'),
  },
};

/**
 * The picture on each city's postage stamp: hand-drawn engravings in assets/stamps/src, rendered
 * by scripts/render-stamps.mjs.
 */
export const STAMP_ART: Record<string, ImageSource> = {
  sintra: require('../assets/stamps/sintra.jpg'),
  lisbon: require('../assets/stamps/lisbon.jpg'),
  porto: require('../assets/stamps/porto.jpg'),
  evora: require('../assets/stamps/evora.jpg'),
  aveiro: require('../assets/stamps/aveiro.jpg'),
};
/* eslint-enable @typescript-eslint/no-require-imports */
