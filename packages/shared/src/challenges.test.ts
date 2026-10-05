import {
  CHALLENGE_ROTATION,
  ODDITIES,
  DATED_CHALLENGES,
  challengeForDate,
  epochDay,
  rotationFor,
} from './challenges';
import { CATEGORIES } from './constants';

describe('daily challenge calendar', () => {
  it('the rotation includes every category and an "any place" day', () => {
    const cats = new Set(CHALLENGE_ROTATION.map((c) => c.category));
    for (const c of CATEGORIES) expect(cats).toContain(c);
    expect(cats).toContain(null);
    expect(CHALLENGE_ROTATION.map((c) => c.title)).toEqual(
      expect.arrayContaining(['Sound check', 'Oddity of the day']),
    );
  });

  it('counts days like the server (date - 1970-01-01)', () => {
    expect(epochDay('1970-01-01')).toBe(0);
    expect(epochDay('2024-10-11')).toBe(20007);
    expect(rotationFor('2024-10-11')).toBe(CHALLENGE_ROTATION[0]);
    expect(rotationFor('2024-10-20')).toBe(CHALLENGE_ROTATION[0]);
  });

  it('dated challenges win over the rotation, the shortest range first', () => {
    expect(challengeForDate('2027-04-18').title).toBe('International Day for Monuments and Sites');
    expect(challengeForDate('2027-09-22')).toMatchObject({
      campaign: 'car-free-day',
      category: null,
    });
    expect(challengeForDate('2027-06-01').campaign).toBe('santos-populares');
    expect(challengeForDate('2027-06-21').campaign).toBe('world-music-day');
    expect(challengeForDate('2027-06-30').campaign).toBe('santos-populares');
    expect(challengeForDate('2027-07-01')).toEqual({
      ...rotationFor('2027-07-01'),
      campaign: null,
    });
  });

  it('dated challenges are valid, unique and cover the next 12 months', () => {
    const campaigns = DATED_CHALLENGES.map((c) => c.campaign);
    expect(new Set(campaigns).size).toBe(campaigns.length);
    for (const c of DATED_CHALLENGES) {
      expect(c.campaign).toMatch(/^[a-z0-9-]{2,60}$/);
      expect(Number.isNaN(Date.parse(c.startsOn))).toBe(false);
      expect(c.startsOn <= c.endsOn).toBe(true);
      expect(epochDay(c.endsOn) - epochDay(c.startsOn)).toBeLessThanOrEqual(92);
      expect(c.startsOn >= '2026-10-01' && c.endsOn <= '2027-09-30').toBe(true);
    }
    for (const c of ['autumn-hills', 'winter-lights', 'monuments-day', 'museum-day'])
      expect(campaigns).toContain(c);
  });

  it('each Oddity of the day has its own quest, cycling through ODDITIES', () => {
    // 2024-10-16 is day 20012: rotation slot 5 (Curiosities) of cycle 2223.
    const first = rotationFor('2024-10-16');
    expect(first.category).toBe('other');
    expect(first.title).toBe(`Oddity of the day: ${ODDITIES[2223 % ODDITIES.length]!.title}`);
    expect(first.description).toMatch(/^Discover any curiosity today\. /);
    expect(rotationFor('2024-10-25').title).toBe(
      `Oddity of the day: ${ODDITIES[2224 % ODDITIES.length]!.title}`,
    );
    const titles = new Set(ODDITIES.map((o) => o.title));
    expect(titles.size).toBe(ODDITIES.length);
    expect(ODDITIES.length).toBeGreaterThanOrEqual(20);
  });
});
