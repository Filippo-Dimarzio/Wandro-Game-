import { BADGES } from './progression';
import { BADGE_TIER, emptyByCategory, explorerClass, explorerStats } from './profile-stats';
import { DEMO_PLACES } from './seed-places';

const byId = (id: string) => DEMO_PLACES.find((p) => p.id === id)!;

describe('explorer stats', () => {
  it('counts discoveries by category and city, and finds the rarest place', () => {
    const found = [byId('demo-pena'), byId('demo-mouros'), byId('demo-cruz-alta')];
    const s = explorerStats(found, DEMO_PLACES, 1, ['sintra', 'lisbon']);
    expect(s.total).toBe(3);
    expect(s.byCategory.heritage).toBe(2);
    expect(s.byCategory.nature).toBe(1);
    expect(s.cities[0]).toEqual({
      region: 'sintra',
      found: 3,
      total: DEMO_PLACES.filter((p) => p.region === 'sintra').length,
    });
    expect(s.cities[1]!.found).toBe(0);
    expect(s.rarest).toEqual({ name: 'Cruz Alta Viewpoint', visitors: 8 });
    expect(s.firstDiscoveries).toBe(1);
  });

  it('has no rarest find before the first discovery', () => {
    expect(explorerStats([], DEMO_PLACES, 0, ['sintra']).rarest).toBeNull();
  });

  it('names the class after the most-discovered category', () => {
    const counts = { ...emptyByCategory(), coast: 2, heritage: 3 };
    expect(explorerClass(counts)).toBe('heritage');
    expect(explorerClass({ ...emptyByCategory(), coast: 2, heritage: 2 })).toBe('coast');
    expect(explorerClass(emptyByCategory())).toBeNull();
  });

  it('gives every badge a tier', () => {
    expect(BADGES.filter((b) => !BADGE_TIER[b.code]).map((b) => b.code)).toEqual([]);
  });
});
