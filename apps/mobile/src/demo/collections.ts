import {
  CITY_SETS,
  COLLECTION_COMPLETION_BONUS,
  COLLECTION_STEP_BONUS,
  type Category,
  type Place,
} from '@wandro/shared';

export interface CollectionDef {
  id: string;
  title: string;
  description: string;
  /** Cover art and colour come from this category. */
  theme: Category;
  region: string;
  placeIds: string[];
  /** Paid once the whole set is found. */
  bonus: number;
  /** Paid for each place of the set you find. */
  stepBonus: number;
}

const set = (c: Omit<CollectionDef, 'bonus' | 'stepBonus'>): CollectionDef => ({
  ...c,
  bonus: COLLECTION_COMPLETION_BONUS,
  stepBonus: COLLECTION_STEP_BONUS,
});

/** Curated demo collections (with a backend these come from the `collections` table). */
export const DEMO_COLLECTIONS: CollectionDef[] = [
  set({
    id: 'demo-col-palaces',
    title: "Sintra's palaces",
    description: 'Romantic palaces, castles and estates in the hills.',
    theme: 'heritage',
    region: 'sintra',
    placeIds: ['demo-pena', 'demo-regaleira', 'demo-mouros', 'demo-monserrate', 'demo-condessa'],
  }),
  set({
    id: 'demo-col-coast',
    title: 'The wild coast',
    description: 'Cliffs, coves and the westernmost point of Europe.',
    theme: 'coast',
    region: 'sintra',
    placeIds: ['demo-cabo', 'demo-adraga'],
  }),
  set({
    id: 'demo-col-gems',
    title: 'Hidden gems',
    description: 'Places fewer than 20 explorers have found.',
    theme: 'other',
    region: 'sintra',
    placeIds: ['demo-condessa', 'demo-cruz-alta', 'demo-brinquedo', 'demo-music'],
  }),
  ...CITY_SETS.map((s) =>
    set({
      id: `demo-col-${s.slug}`,
      title: s.title,
      description: s.description,
      theme: s.theme,
      region: s.region,
      placeIds: s.placeIds,
    }),
  ),
];

export function collectionPlaces(c: CollectionDef, places: Place[]): Place[] {
  return c.placeIds.map((id) => places.find((p) => p.id === id)).filter((p): p is Place => !!p);
}
