-- Eight more launch cities (Budapest, Dublin, Cork, Stockholm, Copenhagen, Warsaw, Gdańsk and
-- the Basque Country), and wider boxes for Lisbon (the palaces and beaches west to Carcavelos),
-- Dublin (the bay to Howth) and Cork (the harbour). Mirrors REGIONS in packages/shared.
insert into public.regions (slug, name, bbox, is_active) values
  ('sintra', 'Sintra', extensions.st_makeenvelope(-9.52, 38.73, -9.3, 38.85, 4326), true),
  ('lisbon', 'Lisbon', extensions.st_makeenvelope(-9.34, 38.614, -8.989, 38.814, 4326), true),
  ('porto', 'Porto', extensions.st_makeenvelope(-8.761, 41.05, -8.461, 41.25, 4326), true),
  ('madrid', 'Madrid', extensions.st_makeenvelope(-3.854, 40.317, -3.554, 40.517, 4326), true),
  ('barcelona', 'Barcelona', extensions.st_makeenvelope(2.019, 41.287, 2.319, 41.487, 4326), true),
  ('paris', 'Paris', extensions.st_makeenvelope(2.202, 48.757, 2.502, 48.957, 4326), true),
  ('rome', 'Rome', extensions.st_makeenvelope(12.332, 41.797, 12.632, 41.997, 4326), true),
  ('florence', 'Florence', extensions.st_makeenvelope(11.106, 43.67, 11.406, 43.87, 4326), true),
  ('amsterdam', 'Amsterdam', extensions.st_makeenvelope(4.754, 52.268, 5.054, 52.468, 4326), true),
  ('berlin', 'Berlin', extensions.st_makeenvelope(13.255, 52.42, 13.555, 52.62, 4326), true),
  ('prague', 'Prague', extensions.st_makeenvelope(14.288, 49.976, 14.588, 50.176, 4326), true),
  ('vienna', 'Vienna', extensions.st_makeenvelope(16.224, 48.108, 16.524, 48.308, 4326), true),
  ('edinburgh', 'Edinburgh', extensions.st_makeenvelope(-3.338, 55.853, -3.038, 56.053, 4326), true),
  ('budapest', 'Budapest', extensions.st_makeenvelope(18.89, 47.398, 19.19, 47.598, 4326), true),
  ('dublin', 'Dublin', extensions.st_makeenvelope(-6.41, 53.25, -6, 53.45, 4326), true),
  ('cork', 'Cork', extensions.st_makeenvelope(-8.63, 51.77, -8.2, 52, 4326), true),
  ('stockholm', 'Stockholm', extensions.st_makeenvelope(17.849, 59.229, 18.289, 59.429, 4326), true),
  ('copenhagen', 'Copenhagen', extensions.st_makeenvelope(12.418, 55.576, 12.718, 55.776, 4326), true),
  ('warsaw', 'Warsaw', extensions.st_makeenvelope(20.862, 52.13, 21.162, 52.33, 4326), true),
  ('gdansk', 'Gdańsk', extensions.st_makeenvelope(18.497, 54.252, 18.797, 54.452, 4326), true),
  ('basque', 'Basque Country', extensions.st_makeenvelope(-3.1, 43.15, -1.75, 43.47, 4326), true)
on conflict (slug) do update set name = excluded.name, bbox = excluded.bbox, is_active = true;

-- Lisbon's box now overlaps Sintra's edge; the smaller (more specific) box wins, as in the app.
create or replace function public.region_at(p_lat double precision, p_lng double precision)
returns text language sql stable set search_path = public, extensions, pg_temp as $$
  select slug from public.regions
  where is_active and extensions.st_contains(bbox, extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326))
  order by extensions.st_area(bbox), slug
  limit 1
$$;
