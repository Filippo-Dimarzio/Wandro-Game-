import { regionFor, type Category, type Place } from '@wandro/shared';

/* eslint-disable @typescript-eslint/no-require-imports -- static asset requires for Metro */
/**
 * Game-style map pins: one bold pictogram per category, with a lock badge while the place is still
 * to explore and a gold tick once discovered. Rendered by scripts/render-markers.mjs.
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

/** Big illustrated badges for each city's signature landmark (from the stamp engravings). */
export const LANDMARK_MARKERS: Record<string, { found: number; locked: number }> = {
  sintra: {
    found: require('../../assets/markers/landmark-sintra.png'),
    locked: require('../../assets/markers/landmark-sintra-locked.png'),
  },
  lisbon: {
    found: require('../../assets/markers/landmark-lisbon.png'),
    locked: require('../../assets/markers/landmark-lisbon-locked.png'),
  },
  porto: {
    found: require('../../assets/markers/landmark-porto.png'),
    locked: require('../../assets/markers/landmark-porto-locked.png'),
  },
  evora: {
    found: require('../../assets/markers/landmark-evora.png'),
    locked: require('../../assets/markers/landmark-evora-locked.png'),
  },
  aveiro: {
    found: require('../../assets/markers/landmark-aveiro.png'),
    locked: require('../../assets/markers/landmark-aveiro-locked.png'),
  },
};
/* eslint-enable @typescript-eslint/no-require-imports */

/** Each city's signature landmark, by place name (the same in demo mode and the database). */
export const LANDMARK_NAMES: Record<string, string> = {
  sintra: 'Pena Palace',
  lisbon: 'Belém Tower',
  porto: 'Dom Luís I Bridge',
  evora: 'Roman Temple of Évora',
  aveiro: 'Moliceiro Boat Ride',
};

/** The city whose signature landmark this place is, or '' for every other place. */
export function landmarkOf(place: Place): string {
  const city = place.region ?? regionFor(place)?.slug;
  return city && LANDMARK_NAMES[city] === place.name ? city : '';
}

export const landmarkName = (city: string, locked: boolean) =>
  `landmark-${city}${locked ? '-locked' : ''}`;

/**
 * Map-style expression choosing each place's pin: the landmark badge for a signature landmark,
 * otherwise its category pin; `-locked` while still to explore.
 */
export const PIN_IMAGE = [
  'case',
  ['!=', ['get', 'landmark'], ''],
  ['concat', 'landmark-', ['get', 'landmark'], ['case', ['get', 'unlocked'], '', '-locked']],
  ['concat', 'marker-', ['get', 'category'], ['case', ['get', 'unlocked'], '', '-locked']],
];

/** Landmarks on top, then places still to explore, then discovered ones. */
export const PIN_SORT = ['case', ['!=', ['get', 'landmark'], ''], 2, ['get', 'unlocked'], 0, 1];

/** Image name used in map styles: `marker-coast` or `marker-coast-locked`. */
export const markerName = (cat: Category, locked: boolean) =>
  `marker-${cat}${locked ? '-locked' : ''}`;
