-- The Algarve joins the launch cities: Portugal's whole south coast, Sagres to Tavira and up to
-- Monchique, as one region served by Faro airport (so Lisbon or Porto ↔ Algarve is a flight).
-- Its places and two city sets come with the dev seed, like every launch city's
-- (pnpm --filter @wandro/shared seed). Mirrors REGIONS in packages/shared/src/regions.ts.
insert into public.regions (slug, name, bbox, is_active, airport) values
  ('algarve', 'Algarve', extensions.st_makeenvelope(-9.05, 36.9, -7.38, 37.4, 4326), true, 'FAO')
on conflict (slug) do update
  set name = excluded.name, bbox = excluded.bbox, is_active = true, airport = excluded.airport;
