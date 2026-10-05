// The database seeds and these TypeScript catalogues must agree (demo mode and the server
// use the same codes and prices). Parses the migration SQL to compare.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  CHALLENGE_ROTATION,
  datedChallengesSql,
  ODDITIES,
  ODDITY_SLOT,
  oddityValuesSql,
  rotationValuesSql,
} from './challenges';
import { BADGES } from './progression';
import { SHOP_ITEMS } from './shop';

const migrations = join(__dirname, '..', '..', '..', 'supabase', 'migrations');
const sql = readdirSync(migrations)
  .filter((f) => f.endsWith('.sql'))
  .map((f) => readFileSync(join(migrations, f), 'utf8'))
  .join('\n');

describe('catalogues match the database seeds', () => {
  it('shop items: same codes, kinds, prices and durations', () => {
    const rows = [
      ...sql.matchAll(
        /\('([a-z_0-9]+)', '[^']*(?:''[^']*)*', '[^']*(?:''[^']*)*', '(boost|skin|hat)', (\d+), (null|\d+),/g,
      ),
    ];
    const db = rows.map(([, code, kind, price, mins]) => ({
      code,
      kind,
      price: Number(price),
      mins: mins === 'null' ? undefined : Number(mins),
    }));
    const ts = SHOP_ITEMS.map((i) => ({
      code: i.code,
      kind: i.kind,
      price: i.price,
      mins: i.durationMinutes,
    }));
    expect(db).toEqual(ts);
  });

  it('badges: same codes', () => {
    const block = sql.slice(
      sql.indexOf('insert into public.badges'),
      sql.indexOf('on conflict (code) do nothing', sql.indexOf('insert into public.badges')),
    );
    const codes = [...block.matchAll(/\('([a-z_0-9]+)', '/g)].map((m) => m[1]);
    expect(codes).toEqual(BADGES.map((b) => b.code));
  });

  it('daily challenges: the server rotation and dated schedule come from challenges.ts', () => {
    expect(sql).toContain(rotationValuesSql());
    expect(sql).toContain(`where r.i = (d - date '1970-01-01') % ${CHALLENGE_ROTATION.length};`);
    expect(sql).toContain(datedChallengesSql());
    expect(sql).toContain(oddityValuesSql());
    expect(sql).toContain(`case when r.i = ${ODDITY_SLOT} then o.title`);
    expect(sql).toContain(
      `on o.j = ((d - date '1970-01-01') / ${CHALLENGE_ROTATION.length}) % ${ODDITIES.length}`,
    );
  });
});
