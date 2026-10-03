-- Europe launch cities, and hidden gems: places that stay secret until a player is within 200 m.
-- Region list mirrors REGIONS in packages/shared/src/regions.ts.

insert into public.regions (slug, name, bbox, is_active) values
  ('sintra', 'Sintra', extensions.st_makeenvelope(-9.52, 38.73, -9.3, 38.85, 4326), true),
  ('lisbon', 'Lisbon', extensions.st_makeenvelope(-9.289, 38.614, -8.989, 38.814, 4326), true),
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
  ('edinburgh', 'Edinburgh', extensions.st_makeenvelope(-3.338, 55.853, -3.038, 56.053, 4326), true)
on conflict (slug) do update set name = excluded.name, bbox = excluded.bbox, is_active = true;

-- ---------------------------------------------------------------------------
-- Hidden gems
-- ---------------------------------------------------------------------------
alter table public.places add column is_hidden boolean not null default false;

create table public.hidden_reveals (
  user_id uuid not null references public.profiles (id) on delete cascade,
  place_id uuid not null references public.places (id) on delete cascade,
  revealed_at timestamptz not null default now(),
  primary key (user_id, place_id)
);
create index hidden_reveals_recent_idx on public.hidden_reveals (user_id, revealed_at);

alter table public.hidden_reveals enable row level security;
create policy hidden_reveals_select_own on public.hidden_reveals for select to authenticated
  using (user_id = auth.uid());
revoke insert, update, delete on public.hidden_reveals from anon, authenticated;

-- Has the caller revealed or discovered this hidden place?
create or replace function public.knows_place(p_place uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.hidden_reveals where user_id = auth.uid() and place_id = p_place)
      or exists (select 1 from public.visits where user_id = auth.uid() and place_id = p_place)
$$;

-- Hidden places drop out of `places`, and so out of places_public and nearby_places, which run
-- as the caller. Their location never reaches the app before the reveal.
drop policy places_select on public.places;
create policy places_select on public.places for select to anon, authenticated
  using ((status = 'active' and (not is_hidden or public.knows_place(id))) or public.is_moderator());

-- Same view as before plus is_hidden, so a revealed gem can be drawn as one.
create or replace view public.places_public
with (security_invoker = true) as
select
  p.id,
  p.name,
  p.description,
  p.category,
  extensions.st_y(p.location::extensions.geometry) as lat,
  extensions.st_x(p.location::extensions.geometry) as lng,
  p.geofence_radius_m,
  p.dwell_seconds,
  p.base_points,
  coalesce(s.unique_visitors, 0) as unique_visitors,
  ph.external_url as photo_url,
  ph.author as photo_author,
  ph.license as photo_license,
  p.region_id,
  p.opening_hours,
  p.is_hidden
from public.places p
left join public.place_stats s on s.place_id = p.id
left join public.place_photos ph on ph.place_id = p.id and ph.is_primary and ph.status = 'approved'
where p.status = 'active';

-- start_checkin reads places as definer, so guard hidden ones at the session insert.
create or replace function public.checkin_sessions_hidden_guard()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if exists (
    select 1 from public.places p
    where p.id = new.place_id and p.is_hidden
      and not exists (select 1 from public.hidden_reveals r where r.user_id = new.user_id and r.place_id = p.id)
  ) then
    raise exception 'place_not_active' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
create trigger checkin_sessions_hidden_guard before insert on public.checkin_sessions
  for each row execute function public.checkin_sessions_hidden_guard();

-- Reveals the closest still-secret gem within 200 m (HIDDEN_REVEAL_RADIUS_M). Positions are used
-- for the lookup only, never stored. Capped per day so a spoofed position can't sweep a city.
create or replace function public.reveal_hidden_gem(p_lat double precision, p_lng double precision)
returns setof public.places_public
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  uid uuid := auth.uid();
  here extensions.geography := extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326)::extensions.geography;
  gem uuid;
begin
  if uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if p_lat is null or p_lng is null or p_lat not between -90 and 90 or p_lng not between -180 and 180 then
    raise exception 'invalid_position' using errcode = '22023';
  end if;
  if (select count(*) from public.hidden_reveals
      where user_id = uid and revealed_at > now() - interval '24 hours') >= 10 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;

  select p.id into gem
  from public.places p
  where p.is_hidden and p.status = 'active'
    and extensions.st_dwithin(p.location, here, 200)
    and not exists (select 1 from public.hidden_reveals r where r.user_id = uid and r.place_id = p.id)
    and not exists (select 1 from public.visits v where v.user_id = uid and v.place_id = p.id)
  order by p.location operator(extensions.<->) here
  limit 1;

  if gem is null then
    return;
  end if;
  insert into public.hidden_reveals (user_id, place_id) values (uid, gem) on conflict do nothing;
  return query select * from public.places_public where id = gem;
end;
$$;

-- How many secret gems are within 30 km and a coarse band for the nearest (mirrors hintFor()).
create or replace function public.hidden_gem_hint(p_lat double precision, p_lng double precision)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  uid uuid := auth.uid();
  here extensions.geography := extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326)::extensions.geography;
  n integer;
  nearest double precision;
begin
  if uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  select count(*), min(extensions.st_distance(p.location, here)) into n, nearest
  from public.places p
  where p.is_hidden and p.status = 'active'
    and extensions.st_dwithin(p.location, here, 30000)
    and not exists (select 1 from public.hidden_reveals r where r.user_id = uid and r.place_id = p.id)
    and not exists (select 1 from public.visits v where v.user_id = uid and v.place_id = p.id);
  return jsonb_build_object(
    'count', n,
    'hint', case when n = 0 then null
                 when nearest <= 500 then 'very_close'
                 when nearest <= 1000 then 'close'
                 when nearest <= 3000 then 'walk'
                 else 'area' end);
end;
$$;

-- The region a point is in, so the app can show the right city board.
create or replace function public.region_at(p_lat double precision, p_lng double precision)
returns text language sql stable set search_path = public, extensions, pg_temp as $$
  select slug from public.regions
  where is_active and extensions.st_contains(bbox, extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326))
  limit 1
$$;

revoke execute on function public.reveal_hidden_gem(double precision, double precision) from public, anon;
revoke execute on function public.hidden_gem_hint(double precision, double precision) from public, anon;
grant execute on function public.reveal_hidden_gem(double precision, double precision) to authenticated;
grant execute on function public.hidden_gem_hint(double precision, double precision) to authenticated;
grant execute on function public.region_at(double precision, double precision) to anon, authenticated;
