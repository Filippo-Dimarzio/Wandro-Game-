import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DEMO_PLACES } from '../seed-places';
import { detailsSql, PLACE_DETAILS, seedSourceId } from './index';

const migrations = join(__dirname, '..', '..', '..', '..', 'supabase', 'migrations');
const sql = readdirSync(migrations)
  .filter((f) => f.endsWith('.sql'))
  .map((f) => readFileSync(join(migrations, f), 'utf8'))
  .join('\n');

describe('place details', () => {
  it('every Sintra place has details (the pilot city)', () => {
    const missing = DEMO_PLACES.filter((p) => p.region === 'sintra' && !p.details).map((p) => p.id);
    expect(missing).toEqual([]);
  });

  it('every entry belongs to a real place', () => {
    const ids = new Set(DEMO_PLACES.map((p) => p.id));
    expect(Object.keys(PLACE_DETAILS).filter((id) => !ids.has(id))).toEqual([]);
  });

  it('keeps the copy short enough for a phone sheet', () => {
    for (const [id, d] of Object.entries(PLACE_DETAILS)) {
      expect([id, d.teaser.length <= 120]).toEqual([id, true]);
      expect([id, d.facts.length >= 1 && d.facts.length <= 3]).toEqual([id, true]);
      for (const f of d.facts) expect([id, f.length <= 140]).toEqual([id, true]);
      if (d.durationMin !== undefined) expect(d.durationMin).toBeGreaterThan(0);
    }
  });

  it('the database gets the same details (migration)', () => {
    expect(sql).toContain(detailsSql());
  });

  it('maps demo ids to seed source ids', () => {
    expect(seedSourceId('demo-pena')).toBe('pena');
    expect(seedSourceId('demo-sintra-piriquita')).toBe('sintra-piriquita');
    expect(seedSourceId('demo-music')).toBe('music-corner');
  });
});
