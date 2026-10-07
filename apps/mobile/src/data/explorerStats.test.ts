import { rowToStats } from './explorerStats';

describe('rowToStats', () => {
  it('fills missing categories with 0 and orders cities like REGIONS', () => {
    const s = rowToStats({
      total: 2,
      by_category: { heritage: 2 },
      cities: [
        { region: 'lisbon', found: 0, total: 54 },
        { region: 'sintra', found: 2, total: 45 },
      ],
      first_discoveries: 0,
      rarest: { name: 'Pena Palace', visitors: 5000 },
    });
    expect(s.byCategory.heritage).toBe(2);
    expect(s.byCategory.coast).toBe(0);
    expect(s.cities.map((c) => c.region).slice(0, 2)).toEqual(['sintra', 'lisbon']);
    expect(s.cities.find((c) => c.region === 'porto')).toEqual({
      region: 'porto',
      found: 0,
      total: 0,
    });
  });
});
