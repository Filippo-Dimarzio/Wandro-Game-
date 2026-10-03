import {
  buildOverpassQuery,
  categoryFor,
  dedupe,
  exclusionReason,
  regionFromArgs,
  toPlace,
  type OsmElement,
} from './mapping';

const el = (id: number, tags: Record<string, string>, lat = 38.79, lon = -9.39): OsmElement => ({
  type: 'node',
  id,
  lat,
  lon,
  tags,
});

describe('importer mapping', () => {
  it('builds a bbox query that requires names', () => {
    const q = buildOverpassQuery();
    expect(q).toContain('nwr["tourism"="museum"]["name"](38.73,-9.52,38.85,-9.3);');
    expect(q).toContain('out center tags');
  });

  it('maps tags to categories', () => {
    expect(categoryFor({ tourism: 'museum' })).toBe('culture');
    expect(categoryFor({ historic: 'castle' })).toBe('heritage');
    expect(categoryFor({ tourism: 'viewpoint' })).toBe('nature');
    expect(categoryFor({ natural: 'beach' })).toBe('coast');
    expect(categoryFor({ natural: 'cape' })).toBe('coast');
    expect(categoryFor({ amenity: 'music_venue' })).toBe('music_events');
    expect(categoryFor({ tourism: 'attraction' })).toBe('other');
  });

  it('excludes private, unsafe and trivial features', () => {
    expect(exclusionReason({ access: 'private' })).toBeTruthy();
    expect(exclusionReason({ natural: 'cliff' })).toBeTruthy();
    expect(exclusionReason({ historic: 'boundary_stone' })).toBeTruthy();
    expect(exclusionReason({ historic: 'castle' })).toBeNull();
    expect(
      toPlace(el(1, { name: 'Private villa', historic: 'manor', access: 'private' })),
    ).toBeNull();
  });

  it('uses way centres and prefers English names', () => {
    const p = toPlace({
      type: 'way',
      id: 7,
      center: { lat: 38.8, lon: -9.4 },
      tags: { name: 'Palácio', 'name:en': 'Palace', historic: 'castle' },
    });
    expect(p).toMatchObject({
      source_id: 'way/7',
      name: 'Palace',
      lat: 38.8,
      lng: -9.4,
      category: 'heritage',
      base_points: 120,
    });
  });

  it('skips unnamed elements', () => {
    expect(toPlace(el(2, { tourism: 'viewpoint' }))).toBeNull();
  });

  it('dedupes by wikidata id and by name + proximity, keeping the richer entry', () => {
    const a = toPlace(el(1, { name: 'Castelo dos Mouros', historic: 'castle' }))!;
    const b = toPlace(
      el(2, { name: 'Castelo dos Mouros', historic: 'castle', wikidata: 'Q1' }, 38.7901, -9.3901),
    )!;
    const c = toPlace(
      el(3, { name: 'Moorish Castle', historic: 'castle', wikidata: 'Q1' }, 38.7, -9.3),
    )!;
    const d = toPlace(el(4, { name: 'Castelo dos Mouros', historic: 'castle' }, 38.75, -9.45))!; // far away: distinct
    const out = dedupe([a, b, c, d]);
    expect(out.map((p) => p.source_id)).toEqual(['node/2', 'node/4']);
  });

  it('is deterministic (idempotent re-runs)', () => {
    const items = [
      el(5, { name: 'B', tourism: 'museum' }),
      el(3, { name: 'A', tourism: 'museum' }, 38.7, -9.3),
    ].map(toPlace);
    const once = dedupe(items.filter((p) => p !== null));
    expect(dedupe(once)).toEqual(once);
  });
});

describe('regionFromArgs', () => {
  it('defaults to Sintra and reads --region', () => {
    expect(regionFromArgs(['node', 'main.ts']).slug).toBe('sintra');
    expect(regionFromArgs(['node', 'main.ts', '--region', 'paris']).bbox).toEqual([
      48.757, 2.202, 48.957, 2.502,
    ]);
  });

  it('lists the valid slugs for an unknown region', () => {
    expect(() => regionFromArgs(['--region', 'atlantis'])).toThrow(/lisbon/);
  });
});
