import {
  pointsForVisit,
  capActivityCoins,
  rarityMultiplier,
  ledgerXp,
  levelFromXp,
  levelProgress,
  xpForLevel,
  explorerKit,
  explorerStage,
} from './scoring';
import { haversineMeters, isWithinGeofence, formatDistance } from './geo';
import { ACTIVITY_COIN_CAP, CHALLENGE_XP } from './constants';

describe('rarityMultiplier', () => {
  it('is 5x for undiscovered and falls with visitors', () => {
    expect(rarityMultiplier(0)).toBe(5);
    expect(rarityMultiplier(10)).toBe(3);
    expect(rarityMultiplier(100)).toBeCloseTo(1.364, 2);
    expect(rarityMultiplier(1000)).toBeCloseTo(1.04, 2);
  });
  it('is monotonic non-increasing and never below 1', () => {
    let prev = Infinity;
    for (const n of [0, 1, 5, 20, 100, 5000, 1e6]) {
      const m = rarityMultiplier(n);
      expect(m).toBeLessThanOrEqual(prev);
      expect(m).toBeGreaterThan(1);
      prev = m;
    }
  });
  it('clamps negative visitor counts', () => {
    expect(rarityMultiplier(-5)).toBe(5);
  });
});

describe('pointsForVisit', () => {
  it('rarer places carry a bigger multiplier', () => {
    expect(pointsForVisit('heritage', 3).multiplier).toBeGreaterThan(
      pointsForVisit('heritage', 5000).multiplier,
    );
  });
  it('caps a completed activity at 50 coins, pioneer bonus included', () => {
    const first = pointsForVisit('nature', 0);
    expect(first.total).toBe(ACTIVITY_COIN_CAP);
    expect(first.firstDiscovererBonus).toBe(0);
    expect(pointsForVisit('heritage', 5000).total).toBe(ACTIVITY_COIN_CAP);
    expect(pointsForVisit('other', 10, 200).total).toBe(ACTIVITY_COIN_CAP);
  });
  it('pays a small place in full and tops it up with the pioneer bonus up to the cap', () => {
    expect(pointsForVisit('other', 1000, 30).total).toBe(31);
    const first = pointsForVisit('other', 0, 5);
    expect(first.total - first.firstDiscovererBonus).toBe(25);
    expect(first.firstDiscovererBonus).toBe(25);
  });
});

describe('capActivityCoins', () => {
  it('pays what is left under the cap, never less than nothing', () => {
    expect(capActivityCoins(0, 40)).toBe(40);
    expect(capActivityCoins(30, 40)).toBe(20);
    expect(capActivityCoins(50, 40)).toBe(0);
    expect(capActivityCoins(0, 75)).toBe(50);
  });
});

describe('levels', () => {
  it('5 challenges (250 XP) reach level 2, and each level-up then costs twice as much', () => {
    expect(levelFromXp(0)).toBe(1);
    expect(levelFromXp(5 * CHALLENGE_XP)).toBe(2);
    expect(levelFromXp(249)).toBe(1);
    expect(levelFromXp(749)).toBe(2);
    expect(levelFromXp(750)).toBe(3);
    expect(levelFromXp(1750)).toBe(4);
    expect([2, 3, 4, 5].map((l) => xpForLevel(l + 1) - xpForLevel(l))).toEqual([
      500, 1000, 2000, 4000,
    ]);
  });
  it('only completed challenges earn XP', () => {
    expect(ledgerXp('visit')).toBe(CHALLENGE_XP);
    expect(ledgerXp('daily_challenge')).toBe(CHALLENGE_XP);
    for (const k of ['first_discoverer', 'collection', 'badge', 'streak', 'purchase', 'time_quest'])
      expect(ledgerXp(k)).toBe(0);
  });
  it('xpForLevel inverts levelFromXp', () => {
    for (const l of [1, 2, 5, 10]) expect(levelFromXp(xpForLevel(l))).toBe(l);
  });
  it('reports progress inside a level', () => {
    const p = levelProgress(500);
    expect(p.level).toBe(2);
    expect(p.xpIntoLevel).toBe(250);
    expect(p.xpForNext).toBe(500);
    expect(p.fraction).toBeCloseTo(0.5);
  });
  it('maps level to explorer rank', () => {
    expect(explorerStage(1)).toBe('Wanderer');
    expect(explorerStage(3)).toBe('Explorer');
    expect(explorerStage(12)).toBe('Cartographer');
  });
  it('grows the explorer kit with rank: map, backpack, then camera', () => {
    expect(explorerKit(1)).toBeNull();
    expect(explorerKit(3)).toBe('map');
    expect(explorerKit(7)).toBe('backpack');
    expect(explorerKit(10)).toBe('camera');
  });
});

describe('geo', () => {
  const pena = { lat: 38.7876, lng: -9.3906 };
  it('computes distances', () => {
    expect(haversineMeters(pena, pena)).toBe(0);
    const d = haversineMeters(pena, { lat: 38.7876, lng: -9.3906 + 0.001 });
    expect(d).toBeGreaterThan(80);
    expect(d).toBeLessThan(95);
  });
  it('applies the geofence radius', () => {
    const near = { lat: 38.7876, lng: -9.3906 + 0.0005 };
    const far = { lat: 38.7876, lng: -9.3906 + 0.002 };
    expect(isWithinGeofence(near, pena, 75)).toBe(true);
    expect(isWithinGeofence(far, pena, 75)).toBe(false);
  });
  it('formats distances', () => {
    expect(formatDistance(42)).toBe('40 m');
    expect(formatDistance(1500)).toBe('1.5 km');
    expect(formatDistance(25000)).toBe('25 km');
  });
});
