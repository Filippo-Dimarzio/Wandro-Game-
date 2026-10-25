import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PLACE_DETAILS } from './details';
import { haversineMeters } from './geo';
import { DEMO_PLACES } from './seed-places';
import {
  isRightAnswer,
  normalizeAnswer,
  TRAIL_HINTS,
  TRAIL_MIN_STOP_COINS,
  TRAIL_COMPLETE_COINS,
  TRAIL_STOP_COINS,
  TRAIL_UNLOCK_AFTER,
  TRAIL_UNLOCK_COINS,
  trailStopCoins,
  trailWalk,
  TRAILS,
  trailsSql,
} from './trails';

const root = join(__dirname, '..', '..', '..', 'supabase');
const migrations = readdirSync(join(root, 'migrations'))
  .filter((f) => f.endsWith('.sql'))
  .map((f) => readFileSync(join(root, 'migrations', f), 'utf8'))
  .join('\n');
const seed = readFileSync(join(root, 'seed', 'seed.sql'), 'utf8');

describe('trails', () => {
  it('a stop pays 20 coins, 5 less per hint or wrong answer, never under 5', () => {
    expect(trailStopCoins(0, 0)).toBe(TRAIL_STOP_COINS);
    expect(trailStopCoins(1, 0)).toBe(15);
    expect(trailStopCoins(1, 1)).toBe(10);
    expect(trailStopCoins(3, 4)).toBe(TRAIL_MIN_STOP_COINS);
  });

  it('a trail is a treat to save up for: unlocking costs more than a perfect run pays back', () => {
    expect(TRAIL_UNLOCK_AFTER).toBe(5);
    for (const t of TRAILS) {
      const back = TRAIL_STOP_COINS * t.stops.length + TRAIL_COMPLETE_COINS;
      expect(TRAIL_UNLOCK_COINS).toBeGreaterThan(back);
    }
  });

  it('answers ignore case and extra spaces', () => {
    expect(normalizeAnswer('  Por   Bem ')).toBe('por bem');
    const clue = TRAILS[1]!.stops[1]!.clue;
    expect(isRightAnswer(clue, 'por bem')).toBe(true);
    expect(isRightAnswer(clue, 'Por Portugal')).toBe(false);
  });

  it('every trail is 4–5 visible places in its city, a short walk apart', () => {
    for (const t of TRAILS) {
      expect(t.stops.length).toBeGreaterThanOrEqual(4);
      expect(t.stops.length).toBeLessThanOrEqual(5);
      const places = t.stops.map((s) => DEMO_PLACES.find((p) => p.id === s.placeId));
      for (const p of places) {
        expect(p).toBeDefined();
        // Hidden gems' locations are only sent once revealed, so they can't be trail stops.
        expect(p!.hidden).toBeFalsy();
        expect(p!.region ?? 'sintra').toBe(t.region);
      }
      for (let i = 1; i < places.length; i++) {
        expect(haversineMeters(places[i - 1]!, places[i]!)).toBeLessThan(1200);
      }
      expect(new Set(t.stops.map((s) => s.placeId)).size).toBe(t.stops.length);
    }
  });

  it('every clue has an answer that is one of its choices (or a number), and three hints', () => {
    for (const t of TRAILS) {
      for (const s of t.stops) {
        expect(s.hints).toHaveLength(TRAIL_HINTS);
        if (s.clue.kind === 'choice') {
          expect(s.clue.choices).toContain(s.clue.answer);
          expect(new Set(s.clue.choices).size).toBe(s.clue.choices.length);
        } else {
          expect(s.clue.answer).toMatch(/^\d+$/);
        }
        // Stories are built on the stop's checked Learn facts.
        expect(PLACE_DETAILS[s.placeId]).toBeDefined();
      }
    }
  });

  it('estimates the walk', () => {
    const w = trailWalk([
      { lat: 38.7976, lng: -9.3906 },
      { lat: 38.7967, lng: -9.3958 },
    ]);
    expect(w.meters).toBeGreaterThan(400);
    expect(w.minutes).toBeGreaterThanOrEqual(5);
  });

  it('the migration and the dev seed carry the same trails', () => {
    expect(migrations).toContain(trailsSql());
    expect(seed).toContain(trailsSql());
  });
});
