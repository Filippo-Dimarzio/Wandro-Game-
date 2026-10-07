import { rowToPlace } from './places';

const row = {
  id: 'p1',
  name: 'Pena Palace',
  description: null,
  category: 'heritage' as const,
  lat: 38.7876,
  lng: -9.3906,
  geofence_radius_m: 75,
  base_points: 120,
  unique_visitors: 10,
  photo_url: null,
  photo_author: null,
};

describe('rowToPlace', () => {
  it('maps the details column into place.details', () => {
    const facts = [{ text: 'One', source: 'https://example.org' }];
    const p = rowToPlace({ ...row, details: { teaser: 'A palace', facts, cost: 'ticket' } });
    expect(p.details).toEqual({ teaser: 'A palace', facts, cost: 'ticket' });
  });

  it('leaves details out when the place has none yet (empty object)', () => {
    expect(rowToPlace({ ...row, details: {} }).details).toBeUndefined();
    expect(rowToPlace(row).details).toBeUndefined();
  });

  it('reads older plain-text facts as unsourced facts', () => {
    const details = { teaser: 'A palace', facts: ['Old style'] } as never;
    expect(rowToPlace({ ...row, details }).details?.facts).toEqual([{ text: 'Old style' }]);
  });
});
