import { EUROPE_PLACES } from './europe-places';
import { CITY_SETS } from './sets';

export const SEED_BEGIN =
  '-- BEGIN generated Europe places and city sets (pnpm --filter @wandro/shared seed)';
export const SEED_END = '-- END generated Europe places and city sets';

const q = (s: string) => `'${s.replace(/'/g, "''")}'`;
const sourceId = (id: string) => id.replace(/^demo-/, '');

/**
 * The dev seed's Europe block, generated from EUROPE_PLACES and CITY_SETS so demo mode and the
 * database never drift (seed-sql.test.ts checks the committed seed matches).
 */
export function europeSeedSql(): string {
  const places = EUROPE_PLACES.map((p) => {
    const hours = p.hours ? `${q(JSON.stringify(p.hours))}::jsonb` : 'null';
    return `  (${[q(p.region!), q(sourceId(p.id)), q(p.name), q(p.description ?? ''), q(p.category)].join(', ')}, ${p.basePoints}, ${p.lat}, ${p.lng}, ${!!p.hidden}, ${hours})`;
  });
  const sets = CITY_SETS.map(
    (s) => `  (${[s.slug, s.region, s.title, s.description].map(q).join(', ')})`,
  );
  const setPlaces = CITY_SETS.flatMap((s) =>
    s.placeIds.map((id, i) => `  (${q(s.slug)}, ${q(sourceId(id))}, ${i + 1})`),
  );
  return `${SEED_BEGIN}
-- Hidden gems stay off the map until a player is within 200 m.
insert into public.places (name, description, location, category, base_points, source, source_id, status, region_id, is_hidden, opening_hours)
select v.name, v.description,
       extensions.st_setsrid(extensions.st_makepoint(v.lng, v.lat), 4326)::extensions.geography,
       v.category::public.place_category, v.base_points, 'seed', v.source_id, 'active', r.id, v.hidden, v.hours
from (values
${places.join(',\n')}
) as v(region, source_id, name, description, category, base_points, lat, lng, hidden, hours)
join public.regions r on r.slug = v.region
on conflict (source, source_id) do nothing;

-- City sets: 5 places each (CITY_SETS).
insert into public.collections (slug, title, description, region_id, completion_bonus)
select v.slug, v.title, v.description, r.id, 50
from (values
${sets.join(',\n')}
) as v(slug, region, title, description)
join public.regions r on r.slug = v.region
on conflict (slug) do nothing;

insert into public.collection_places (collection_id, place_id, position)
select c.id, p.id, v.pos
from (values
${setPlaces.join(',\n')}
) as v(slug, source_id, pos)
join public.collections c on c.slug = v.slug
join public.places p on p.source = 'seed' and p.source_id = v.source_id
on conflict do nothing;
${SEED_END}`;
}

/** Replaces the generated block in the seed file's text. */
export function withEuropeSeed(seed: string): string {
  const start = seed.indexOf(SEED_BEGIN);
  const end = seed.indexOf(SEED_END) + SEED_END.length;
  if (start === -1 || end < start) throw new Error('seed markers not found');
  return seed.slice(0, start) + europeSeedSql() + seed.slice(end);
}
