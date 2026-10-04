import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  clockLabel,
  SUNSET_MINUTES,
  TIME_QUESTS,
  timeQuestFor,
  timeQuestOpen,
  timeQuestWindow,
} from './boosts';
import { DEMO_PLACES } from './seed-places';
import { SHOP_ITEMS, TRAIL_ITEM_CODES } from './shop';

const root = join(__dirname, '..', '..', '..', 'supabase');
const migration = readFileSync(join(root, 'migrations', '20261012090000_boosts.sql'), 'utf8');
const seed = readFileSync(join(root, 'seed', 'seed.sql'), 'utf8');

/** Lisbon is UTC+1 in summer and UTC+0 in winter. */
const lisbon = (iso: string) => new Date(iso);

describe('time-of-day quests', () => {
  it('golden hour runs from an hour before sunset to 20 minutes after', () => {
    // July sunset ≈ 21:05 Lisbon (20:05 UTC).
    expect(timeQuestOpen('golden', lisbon('2026-07-15T19:10:00Z'))).toBe(true);
    expect(timeQuestOpen('golden', lisbon('2026-07-15T18:59:00Z'))).toBe(false);
    expect(timeQuestOpen('golden', lisbon('2026-07-15T20:30:00Z'))).toBe(false);
    // December sunset ≈ 17:15 Lisbon (UTC).
    expect(timeQuestOpen('golden', lisbon('2026-12-10T16:30:00Z'))).toBe(true);
    expect(timeQuestOpen('golden', lisbon('2026-12-10T19:00:00Z'))).toBe(false);
  });

  it('night runs from an hour after sunset until 05:00', () => {
    expect(timeQuestOpen('night', lisbon('2026-12-10T19:00:00Z'))).toBe(true);
    expect(timeQuestOpen('night', lisbon('2026-07-15T21:30:00Z'))).toBe(true);
    expect(timeQuestOpen('night', lisbon('2026-07-16T03:30:00Z'))).toBe(true);
    expect(timeQuestOpen('night', lisbon('2026-07-16T05:30:00Z'))).toBe(false);
    expect(timeQuestOpen('night', lisbon('2026-07-15T12:00:00Z'))).toBe(false);
  });

  it('labels the window in Lisbon time', () => {
    const w = timeQuestWindow('golden', lisbon('2026-07-15T12:00:00Z'));
    expect([clockLabel(w.start), clockLabel(w.end)]).toEqual(['20:05', '21:25']);
    const n = timeQuestWindow('night', lisbon('2026-07-15T12:00:00Z'));
    expect([clockLabel(n.start), clockLabel(n.end)]).toEqual(['22:05', '05:00']);
  });

  it('only puts quests on real, visible places', () => {
    for (const id of Object.keys(TIME_QUESTS)) {
      const place = DEMO_PLACES.find((p) => p.id === `demo-${id}`);
      expect(place).toBeDefined();
      expect(place!.hidden).toBeFalsy();
      expect(timeQuestFor(place!.id)).toBe(TIME_QUESTS[id]);
    }
  });

  it('the migration and the dev seed mark the same places', () => {
    const pairs = (sql: string) => {
      const block = sql.slice(sql.indexOf('update public.places p set time_quest'));
      const values = block.slice(0, block.indexOf(') as v(source_id, kind)'));
      return Object.fromEntries(
        [...values.matchAll(/\('([a-z0-9-]+)', '(golden|night)'\)/g)].map((m) => [m[1], m[2]]),
      );
    };
    expect(pairs(migration)).toEqual(TIME_QUESTS);
    expect(pairs(seed)).toEqual(TIME_QUESTS);
  });

  it('time_quest_open() uses the same sunset table', () => {
    const arr = migration
      .match(/array\[([\d, ]+)\]/)![1]
      .split(',')
      .map(Number);
    expect(arr).toEqual(SUNSET_MINUTES);
  });
});

describe('boost catalogue', () => {
  it('the incense trail is still the only trail', () => {
    expect(TRAIL_ITEM_CODES).toEqual(['incense_30', 'incense_120']);
  });

  it('every boost is either timed or one-use', () => {
    for (const i of SHOP_ITEMS.filter((x) => x.kind === 'boost'))
      expect(!!i.durationMinutes !== !!i.consumable).toBe(true);
  });
});
