// Rewrites the generated Europe block in supabase/seed/seed.sql from packages/shared.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { withEuropeSeed } from '../src/seed-sql';

const file = join(__dirname, '..', '..', '..', 'supabase', 'seed', 'seed.sql');
writeFileSync(file, withEuropeSeed(readFileSync(file, 'utf8')));
console.log('Updated', file);
