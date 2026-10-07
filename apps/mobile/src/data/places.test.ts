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
    const p = rowToPlace({
      ...row,
      details: { teaser: 'A palace', facts: ['One'], cost: 'ticket' },
    });
    expect(p.details).toEqual({ teaser: 'A palace', facts: ['One'], cost: 'ticket' });
  });

  it('leaves details out when the place has none yet (empty object)', () => {
    expect(rowToPlace({ ...row, details: {} }).details).toBeUndefined();
    expect(rowToPlace(row).details).toBeUndefined();
  });
});
