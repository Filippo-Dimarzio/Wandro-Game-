import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { europeSeedSql } from './seed-sql';

const seed = readFileSync(
  join(__dirname, '..', '..', '..', 'supabase', 'seed', 'seed.sql'),
  'utf8',
);

it('the dev seed has every Europe place and city set (run `pnpm --filter @wandro/shared seed`)', () => {
  expect(seed).toContain(europeSeedSql());
});
