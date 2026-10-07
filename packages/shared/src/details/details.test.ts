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
      for (const f of d.facts) expect([id, f.text.length <= 200]).toEqual([id, true]);
      if (d.durationMin !== undefined) expect(d.durationMin).toBeGreaterThan(0);
    }
  });

  it('stores each checked fact with an https source next to it', () => {
    for (const [id, d] of Object.entries(PLACE_DETAILS))
      for (const f of d.facts)
        if (f.source !== undefined)
          expect([id, f.source]).toEqual([id, expect.stringMatching(/^https:\/\//)]);
    const sourced = (id: string) => PLACE_DETAILS[id]!.facts.every((f) => f.source);
    for (const id of [
      'demo-sintra-lagoa-azul',
      'demo-sintra-chalet-biester',
      'demo-sintra-portela-station',
      'demo-sintra-casa-teatro',
      'demo-sintra-almocageme',
      'demo-sintra-natural-history',
      'demo-sintra-tram-banzao',
      'demo-sintra-tram-galamares',
    ])
      expect([id, sourced(id)]).toEqual([id, true]);
  });

  it('flags facts from local sources for curator review (Almoçageme)', () => {
    expect(PLACE_DETAILS['demo-sintra-almocageme']!.facts.every((f) => f.needsReview)).toBe(true);
  });

  it('keeps Lagoa Azul to its two checked facts, with no natural-lake or reservoir claim', () => {
    const facts = PLACE_DETAILS['demo-sintra-lagoa-azul']!.facts.map((f) => f.text).join(' ');
    expect(PLACE_DETAILS['demo-sintra-lagoa-azul']!.facts).toHaveLength(2);
    expect(facts).not.toMatch(/natural lake|reservoir|man-made/i);
  });

  it('the closed Toy Museum is not a place to visit', () => {
    expect(DEMO_PLACES.find((p) => p.id === 'demo-brinquedo')).toBeUndefined();
    expect(PLACE_DETAILS['demo-brinquedo']).toBeUndefined();
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
