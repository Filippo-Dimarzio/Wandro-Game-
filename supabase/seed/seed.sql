-- Development seed: the Sintra region, a handful of curated places, and daily
-- challenges. Real place data comes from scripts/importer (OSM + Wikidata).
-- Coordinates are approximate.

insert into public.regions (slug, name, bbox, is_active)
values ('sintra', 'Sintra', extensions.st_makeenvelope(-9.52, 38.73, -9.30, 38.85, 4326), true)
on conflict (slug) do nothing;

with r as (select id from public.regions where slug = 'sintra')
insert into public.places (name, description, location, category, base_points, source, source_id, status, region_id)
select v.name, v.description,
       extensions.st_setsrid(extensions.st_makepoint(v.lng, v.lat), 4326)::extensions.geography,
       v.category::public.place_category, v.base_points, 'seed', v.source_id, 'active', r.id
from r, (values
  ('pena', 'Pena Palace', 'Colourful Romanticist palace on a hilltop above Sintra.', 'heritage', 120, 38.7876, -9.3906),
  ('regaleira', 'Quinta da Regaleira', 'Estate with gardens, grottoes and the famous initiation well.', 'heritage', 120, 38.7967, -9.3958),
  ('mouros', 'Castle of the Moors', 'Medieval hilltop castle with walls that climb the ridge.', 'heritage', 120, 38.7917, -9.3880),
  ('monserrate', 'Monserrate Palace', 'Exotic palace surrounded by botanical gardens.', 'culture', 100, 38.7919, -9.4191),
  ('capuchos', 'Convent of the Capuchos', 'Tiny cork-lined convent hidden in the forest.', 'heritage', 120, 38.7777, -9.4469),
  ('cabo-da-roca', 'Cabo da Roca Viewpoint', 'The westernmost point of mainland Europe.', 'coast', 80, 38.7804, -9.4989),
  ('adraga', 'Adraga Beach', 'Wild cove with rock arches and dramatic sunsets.', 'coast', 80, 38.8236, -9.4731),
  ('praia-grande', 'Praia Grande', 'Surf beach where dinosaur footprints climb the cliff at the southern end.', 'coast', 80, 38.8160, -9.4785),
  ('azenhas', 'Azenhas do Mar', 'White village tumbling down a cliff to a tide pool.', 'coast', 80, 38.8406, -9.4618),
  ('music-corner', 'Sintra Live Music Corner', 'Small local venue with traditional fado nights.', 'music_events', 100, 38.7985, -9.3875),
  ('cruz-alta', 'Cruz Alta Viewpoint', 'The highest point of the Sintra hills.', 'nature', 80, 38.7861, -9.3897)
) as v(source_id, name, description, category, base_points, lat, lng)
on conflict (source, source_id) do nothing;

-- Venues with set times (Thu–Sat, 21:30 to 00:30).
update public.places
set opening_hours = '[{"days": [4, 5, 6], "open": "21:30", "close": "00:30"}]'
where source = 'seed' and source_id = 'music-corner';

insert into public.place_stats (place_id)
select id from public.places
on conflict (place_id) do nothing;

-- 30 days of daily challenges starting today (Lisbon), rotating themes.
insert into public.daily_challenges (challenge_date, title, description, category, bonus_points)
select d::date,
       (array['Find a hidden viewpoint', 'Step into history', 'Culture hunt', 'Follow the coastline', 'Wander anywhere new'])[1 + (i % 5)],
       (array['Discover any nature spot today.', 'Discover any heritage site today.',
              'Discover a museum or cultural place today.', 'Discover any beach or coastal spot today.',
              'Discover any place you have never visited.'])[1 + (i % 5)],
       (array['nature', 'heritage', 'culture', 'coast', null])[1 + (i % 5)]::public.place_category,
       75
from generate_series(0, 29) as i,
     lateral (select (now() at time zone 'Europe/Lisbon')::date + i as d) x
on conflict (challenge_date) do nothing;

-- Curated collections (Phase 4).
with r as (select id from public.regions where slug = 'sintra')
insert into public.collections (slug, title, description, region_id, completion_bonus)
select v.slug, v.title, v.description, r.id, 200
from r, (values
  ('sintra-palaces', 'Sintra''s palaces', 'Romantic palaces, castles and estates in the hills.'),
  ('wild-coast', 'The wild coast', 'Cliffs, coves and the westernmost point of Europe.'),
  ('forest-secrets', 'Forest secrets', 'Quiet corners of the Sintra hills.')
) as v(slug, title, description)
on conflict (slug) do nothing;

insert into public.collection_places (collection_id, place_id, position)
select c.id, p.id, v.pos
from (values
  ('sintra-palaces', 'pena', 1), ('sintra-palaces', 'regaleira', 2), ('sintra-palaces', 'mouros', 3),
  ('sintra-palaces', 'monserrate', 4),
  ('wild-coast', 'cabo-da-roca', 1), ('wild-coast', 'adraga', 2),
  ('forest-secrets', 'capuchos', 1), ('forest-secrets', 'cruz-alta', 2)
) as v(slug, source_id, pos)
join public.collections c on c.slug = v.slug
join public.places p on p.source = 'seed' and p.source_id = v.source_id
on conflict do nothing;
