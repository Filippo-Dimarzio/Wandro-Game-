import { EUROPE_PLACES } from './europe-places';
import { REGIONS } from './regions';
import type { Category, Place } from './types';

/** A set of 5 places in one city. Each one found pays a step bonus, the full set a completion bonus. */
export interface PlaceSet {
  slug: string;
  region: string;
  title: string;
  description: string;
  /** Cover art and colour come from this category. */
  theme: Category;
  placeIds: string[];
}

export const SET_SIZE = 5;

const byVisitors = (a: Place, b: Place) =>
  b.uniqueVisitors - a.uniqueVisitors || a.id.localeCompare(b.id);

/**
 * Two sets per launch city (Sintra has its own curated ones): the city's best-known landmarks,
 * and its 3 art + 2 travel places. The seed mirrors these (sets.test.ts checks).
 */
export const CITY_SETS: PlaceSet[] = REGIONS.filter((r) => r.slug !== 'sintra').flatMap((r) => {
  const inCity = EUROPE_PLACES.filter((p) => p.region === r.slug && !p.hidden);
  const icons = inCity
    .filter((p) => p.category !== 'art' && p.category !== 'travel')
    .sort(byVisitors)
    .slice(0, SET_SIZE);
  const artRails = [
    ...inCity.filter((p) => p.category === 'art'),
    ...inCity.filter((p) => p.category === 'travel'),
  ];
  return [
    {
      slug: `${r.slug}-icons`,
      region: r.slug,
      title: `${r.name} icons`,
      description: 'The landmarks everyone talks about.',
      theme: icons[0]?.category ?? 'heritage',
      placeIds: icons.map((p) => p.id),
    },
    {
      slug: `${r.slug}-art-rails`,
      region: r.slug,
      title: `${r.name} art & rails`,
      description: 'Three works of art and two rides worth taking.',
      theme: 'art',
      placeIds: artRails.map((p) => p.id),
    },
  ];
});
