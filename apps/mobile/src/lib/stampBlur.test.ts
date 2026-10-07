import { STAMP_MAX_BLUR, stampBlur } from './stampBlur';

describe('stampBlur', () => {
  it('starts fully blurred and is sharp once the city is complete', () => {
    expect(stampBlur(0, 10)).toBe(STAMP_MAX_BLUR);
    expect(stampBlur(10, 10)).toBe(0);
    expect(stampBlur(12, 10)).toBe(0);
  });

  it('clears a little with every completed challenge', () => {
    const steps = [0, 1, 2, 5, 9].map((d) => stampBlur(d, 10));
    for (let i = 1; i < steps.length; i++) expect(steps[i]!).toBeLessThan(steps[i - 1]!);
    expect(stampBlur(5, 10)).toBe(STAMP_MAX_BLUR / 2);
  });

  it('stays blurred for a city with nothing to do yet', () => {
    expect(stampBlur(0, 0)).toBe(STAMP_MAX_BLUR);
  });
});
