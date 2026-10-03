import {
  BASE_POINTS,
  DEFAULT_REGION,
  REGIONS,
  haversineMeters,
  regionBySlug,
  type Category,
  type Region,
} from '@wandro/shared';

/** Sintra and surroundings: south, west, north, east. */
export const SINTRA_BBOX = DEFAULT_REGION.bbox;

/** Reads `--region <slug>` (default: sintra). Unknown slugs list the valid ones. */
export function regionFromArgs(argv: readonly string[]): Region {
  const i = argv.indexOf('--region');
  if (i === -1) return DEFAULT_REGION;
  const slug = argv[i + 1] ?? '';
  const region = regionBySlug(slug);
  if (!region)
    throw new Error(
      `Unknown region "${slug}". Try one of: ${REGIONS.map((r) => r.slug).join(', ')}`,
    );
  return region;
}

export interface OsmElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

export interface ImportedPlace {
  source: 'osm';
  source_id: string;
  name: string;
  category: Category;
  lat: number;
  lng: number;
  base_points: number;
  wikidata_id: string | null;
  wikipedia: string | null;
  description: string | null;
}

export function buildOverpassQuery(bbox: readonly number[] = SINTRA_BBOX): string {
  const b = bbox.join(',');
  const selectors = [
    'tourism=museum',
    'tourism=gallery',
    'tourism=viewpoint',
    'tourism=attraction',
    'historic',
    'leisure=park',
    'leisure=garden',
    'natural=beach',
    'natural=peak',
    'natural=cape',
    'natural=bay',
    'amenity=theatre',
    'amenity=arts_centre',
    'amenity=music_venue',
  ];
  const parts = selectors.map((s) => {
    const [k, v] = s.split('=');
    const filter = v ? `["${k}"="${v}"]` : `["${k}"]`;
    return `nwr${filter}["name"](${b});`;
  });
  return `[out:json][timeout:120];(${parts.join('')});out center tags;`;
}

/** Reasons a place must never become a challenge (safety / private property). */
export function exclusionReason(tags: Record<string, string>): string | null {
  if (['private', 'no', 'customers'].includes(tags.access ?? '')) return 'no public access';
  if (tags.disused === 'yes' || tags['abandoned'] === 'yes' || tags.ruins === 'unsafe')
    return 'disused/unsafe';
  if (tags.historic === 'memorial' && tags.memorial === 'plaque') return 'too small (plaque)';
  if (['boundary_stone', 'milestone', 'wayside_cross'].includes(tags.historic ?? ''))
    return 'too small';
  if (tags.natural === 'cliff') return 'dangerous';
  return null;
}

export function categoryFor(tags: Record<string, string>): Category {
  if (['music_venue', 'theatre', 'arts_centre'].includes(tags.amenity ?? '')) return 'music_events';
  if (tags.tourism === 'museum' || tags.tourism === 'gallery') return 'culture';
  if (tags.historic) return 'heritage';
  if (['beach', 'bay', 'cape'].includes(tags.natural ?? '') || tags.leisure === 'beach_resort')
    return 'coast';
  if (
    tags.leisure === 'park' ||
    tags.leisure === 'garden' ||
    tags.natural ||
    tags.tourism === 'viewpoint'
  )
    return 'nature';
  return 'other';
}

export function toPlace(el: OsmElement): ImportedPlace | null {
  const tags = el.tags ?? {};
  const lat = el.lat ?? el.center?.lat;
  const lng = el.lon ?? el.center?.lon;
  const name = tags['name:en'] ?? tags.name;
  if (!name || lat === undefined || lng === undefined) return null;
  if (exclusionReason(tags)) return null;
  const category = categoryFor(tags);
  return {
    source: 'osm',
    source_id: `${el.type}/${el.id}`,
    name: name.trim(),
    category,
    lat,
    lng,
    base_points: BASE_POINTS[category],
    wikidata_id: tags.wikidata ?? null,
    wikipedia: tags.wikipedia ?? null,
    description: tags.description ?? null,
  };
}

function normalise(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Removes duplicates: the same Wikidata item, or the same normalised name within 150 m.
 * Keeps the entry with the most information (wikidata, then description).
 */
export function dedupe(places: ImportedPlace[]): ImportedPlace[] {
  const score = (p: ImportedPlace) => (p.wikidata_id ? 2 : 0) + (p.description ? 1 : 0);
  const sorted = [...places].sort((a, b) => score(b) - score(a));
  const kept: ImportedPlace[] = [];
  for (const p of sorted) {
    const dup = kept.some(
      (k) =>
        (p.wikidata_id && k.wikidata_id === p.wikidata_id) ||
        (normalise(k.name) === normalise(p.name) &&
          haversineMeters({ lat: k.lat, lng: k.lng }, { lat: p.lat, lng: p.lng }) < 150),
    );
    if (!dup) kept.push(p);
  }
  return kept.sort((a, b) => a.source_id.localeCompare(b.source_id));
}
