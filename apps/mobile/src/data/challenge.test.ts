import { DEMO_PLACES } from '@wandro/shared';
import { demoChallenge, todayKey } from './challenge';

const heritage = DEMO_PLACES.find((p) => p.category === 'heritage')!;
const nature = DEMO_PLACES.find((p) => p.category === 'nature')!;
const DAY = 86_400_000;
// Day 20007 (2024-10-11) is a multiple of 9, the length of the rotation, and has no dated
// challenges nearby, so dateFor(n) is rotation entry n.
const dateFor = (rotation: number) => new Date((20007 + rotation) * DAY + 10 * 3_600_000);

describe('demoChallenge', () => {
  it('starts a rolling 24 h window when first opened', () => {
    const now = dateFor(1);
    const c = demoChallenge(now, null, {}, DEMO_PLACES);
    expect(c.startedAt).toBe(now.toISOString());
    expect(new Date(c.expiresAt).getTime() - now.getTime()).toBe(DAY);
    expect(c.isReady).toBe(false);
    expect(c.completedAt).toBeNull();
  });

  it('is ready only after a matching discovery inside the window', () => {
    const now = dateFor(1); // heritage day
    const state = {
      date: todayKey(now),
      startedAt: new Date(now.getTime() - 60_000).toISOString(),
    };
    const at = now.toISOString();
    expect(demoChallenge(now, state, { [nature.id]: { at } }, DEMO_PLACES).isReady).toBe(false);
    expect(demoChallenge(now, state, { [heritage.id]: { at } }, DEMO_PLACES).isReady).toBe(true);
  });

  it('ignores discoveries made before the window opened', () => {
    const now = dateFor(1);
    const state = { date: todayKey(now), startedAt: now.toISOString() };
    const before = new Date(now.getTime() - 3_600_000).toISOString();
    expect(demoChallenge(now, state, { [heritage.id]: { at: before } }, DEMO_PLACES).isReady).toBe(
      false,
    );
  });

  it('coast days need a beach or coastal spot', () => {
    const now = dateFor(4);
    const state = { date: todayKey(now), startedAt: new Date(now.getTime() - 1000).toISOString() };
    const coast = DEMO_PLACES.find((p) => p.category === 'coast')!;
    const at = now.toISOString();
    expect(demoChallenge(now, state, {}, DEMO_PLACES).category).toBe('coast');
    expect(demoChallenge(now, state, { [nature.id]: { at } }, DEMO_PLACES).isReady).toBe(false);
    expect(demoChallenge(now, state, { [coast.id]: { at } }, DEMO_PLACES).isReady).toBe(true);
  });

  it('art, music and curiosity days need a place of that category', () => {
    for (const [rotation, category] of [
      [6, 'art'],
      [2, 'music_events'],
      [7, 'music_events'],
      [5, 'other'],
    ] as const) {
      const now = dateFor(rotation);
      const state = {
        date: todayKey(now),
        startedAt: new Date(now.getTime() - 1000).toISOString(),
      };
      const match = DEMO_PLACES.find((p) => p.category === category)!;
      const at = now.toISOString();
      expect(demoChallenge(now, state, {}, DEMO_PLACES).category).toBe(category);
      expect(demoChallenge(now, state, { [heritage.id]: { at } }, DEMO_PLACES).isReady).toBe(false);
      expect(demoChallenge(now, state, { [match.id]: { at } }, DEMO_PLACES).isReady).toBe(true);
    }
  });

  it('"any place" days accept every category', () => {
    const now = dateFor(8);
    const state = { date: todayKey(now), startedAt: new Date(now.getTime() - 1000).toISOString() };
    const c = demoChallenge(now, state, { [nature.id]: { at: now.toISOString() } }, DEMO_PLACES);
    expect(c.category).toBeNull();
    expect(c.isReady).toBe(true);
  });

  it('dated challenges replace the rotation on their days', () => {
    const on = (iso: string) => new Date(`${iso}T10:00:00Z`);
    expect(demoChallenge(on('2027-05-18'), null, {}, DEMO_PLACES).title).toBe(
      'International Museum Day',
    );
    expect(demoChallenge(on('2027-06-10'), null, {}, DEMO_PLACES).title).toBe('Santos Populares');
    expect(demoChallenge(on('2027-06-21'), null, {}, DEMO_PLACES).title).toBe('World Music Day');
  });

  it('keeps completion for the same day only', () => {
    const now = dateFor(1);
    const done = {
      date: todayKey(now),
      startedAt: now.toISOString(),
      completedAt: now.toISOString(),
    };
    expect(demoChallenge(now, done, {}, DEMO_PLACES).completedAt).toBe(now.toISOString());
    expect(
      demoChallenge(new Date(now.getTime() + DAY), done, {}, DEMO_PLACES).completedAt,
    ).toBeNull();
  });
});
