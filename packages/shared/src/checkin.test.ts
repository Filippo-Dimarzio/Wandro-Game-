import { evaluateCheckin, type Ping } from './checkin';
import { BADGES, newlyEarnedBadges, nextStreak } from './progression';

const place = { lat: 38.8236, lng: -9.4731, radiusM: 75 };
const t0 = 1_700_000_000_000;
const ping = (sec: number, eastM = 5, extra: Partial<Ping> = {}): Ping => ({
  lat: place.lat,
  lng: place.lng + eastM / (111_320 * Math.cos((place.lat * Math.PI) / 180)),
  accuracyM: 8,
  isMocked: false,
  at: t0 + sec * 1000,
  ...extra,
});
const track = (secs: number, eastM = 5) =>
  Array.from({ length: secs / 20 + 1 }, (_, i) => ping(i * 20, eastM));

describe('evaluateCheckin (mirrors complete_checkin)', () => {
  it('verifies straight away when you are there: no waiting', () => {
    expect(evaluateCheckin([ping(0)], place)).toEqual({ status: 'verified' });
  });
  it('rejects a check-in from outside the geofence', () => {
    expect(evaluateCheckin([ping(0, 400)], place)).toMatchObject({ reason: 'left_geofence' });
  });
  it('rejects walking away before checking in', () => {
    expect(evaluateCheckin([ping(0), ping(20, 400)], place)).toMatchObject({
      reason: 'left_geofence',
    });
  });
  it('rejects a poor GPS fix', () => {
    expect(evaluateCheckin([ping(0, 5, { accuracyM: 200 })], place).status).toBe('rejected');
  });
  it('rejects having no location at all', () => {
    expect(evaluateCheckin([], place).status).toBe('rejected');
  });
  it('flags mock locations', () => {
    expect(evaluateCheckin([ping(0, 5, { isMocked: true })], place)).toMatchObject({
      status: 'flagged',
      reason: 'mock_location',
    });
  });
  it('flags teleport jumps', () => {
    const p = track(40);
    p[1] = { ...p[1]!, lat: p[1]!.lat + 0.02 };
    expect(evaluateCheckin(p, place)).toMatchObject({ reason: 'impossible_speed' });
  });
});

describe('progression', () => {
  it('counts streaks by calendar day', () => {
    expect(nextStreak(null, '2026-10-04', 0)).toBe(1);
    expect(nextStreak('2026-10-03', '2026-10-04', 3)).toBe(4);
    expect(nextStreak('2026-10-04', '2026-10-04', 4)).toBe(4);
    expect(nextStreak('2026-10-01', '2026-10-04', 4)).toBe(1);
  });
  it('awards badges once', () => {
    const stats = {
      visits: [
        { category: 'nature' as const, visitorsBefore: 0, firstDiscoverer: true, region: 'sintra' },
      ],
      regionPlaceCounts: { sintra: 2 },
      streak: 1,
      dailyChallenges: 0,
    };
    const first = newlyEarnedBadges(stats, new Set()).map((b) => b.code);
    expect(first).toEqual(['first_step', 'hidden_gem', 'first_discoverer']);
    expect(newlyEarnedBadges(stats, new Set(first))).toHaveLength(0);
  });
  it('uses the same badge codes as the database seed', () => {
    expect(BADGES.map((b) => b.code)).toContain('sintra_complete');
  });
});
