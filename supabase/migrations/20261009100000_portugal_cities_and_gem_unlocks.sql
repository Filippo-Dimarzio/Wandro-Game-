-- Wandro focuses on Portugal: Sintra, Lisbon, Porto, Évora and Aveiro. The other cities are
-- switched off (rows kept, places closed) rather than deleted, so past visits and coins stay.
-- Mirrors REGIONS in packages/shared.

insert into public.regions (slug, name, bbox, is_active) values
  ('evora', 'Évora', extensions.st_makeenvelope(-8.063, 38.471, -7.763, 38.671, 4326), true),
  ('aveiro', 'Aveiro', extensions.st_makeenvelope(-8.804, 40.541, -8.504, 40.741, 4326), true)
on conflict (slug) do update set name = excluded.name, bbox = excluded.bbox, is_active = true;

update public.regions set is_active = false
where slug not in ('sintra', 'lisbon', 'porto', 'evora', 'aveiro');

update public.places p set status = 'closed'
from public.regions r
where p.region_id = r.id and not r.is_active and p.status = 'active';

update public.collections c set is_active = false
from public.regions r
where c.region_id = r.id and not r.is_active;

-- ---------------------------------------------------------------------------
-- Hidden gems: a city's gems all appear once you've discovered 5 places there
-- (GEMS_UNLOCK_AFTER), as well as one by one when you walk within 200 m.
-- ---------------------------------------------------------------------------
create or replace function public.knows_place(p_place uuid, p_region uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.hidden_reveals where user_id = auth.uid() and place_id = p_place)
      or exists (select 1 from public.visits where user_id = auth.uid() and place_id = p_place)
      or (p_region is not null and (
            select count(*) from public.visits v join public.places pl on pl.id = v.place_id
            where v.user_id = auth.uid() and pl.region_id = p_region) >= 5)
$$;
-- Anyone browsing places needs it (the places policy calls it); it only answers for auth.uid().
grant execute on function public.knows_place(uuid, uuid) to anon, authenticated;

drop policy places_select on public.places;
create policy places_select on public.places for select to anon, authenticated
  using ((status = 'active' and (not is_hidden or public.knows_place(id, region_id))) or public.is_moderator());

-- ---------------------------------------------------------------------------
-- Arrival flights: Portuguese cities are closer together, so a flight is 200 km+
-- (Lisbon ↔ Porto), not 300 km. Mirrors MIN_FLIGHT_KM.
-- ---------------------------------------------------------------------------
create or replace function public.check_arrival(p_lat double precision, p_lng double precision)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  uid uuid := auth.uid();
  here_slug text;
  prev_slug text;
  km double precision;
begin
  if uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if p_lat is null or p_lng is null or p_lat not between -90 and 90 or p_lng not between -180 and 180 then
    raise exception 'invalid_position' using errcode = '22023';
  end if;

  here_slug := public.region_at(p_lat, p_lng);
  if here_slug is null then
    return jsonb_build_object('arrived', false, 'from', null, 'to', null);
  end if;

  select region_slug into prev_slug from public.player_regions where user_id = uid for update;
  insert into public.player_regions (user_id, region_slug, seen_at) values (uid, here_slug, now())
  on conflict (user_id) do update set region_slug = excluded.region_slug, seen_at = now();

  if prev_slug is null or prev_slug = here_slug then
    return jsonb_build_object('arrived', false, 'from', prev_slug, 'to', here_slug);
  end if;

  select extensions.st_distance(
           extensions.st_centroid(a.bbox)::extensions.geography,
           extensions.st_centroid(b.bbox)::extensions.geography) / 1000
  into km
  from public.regions a, public.regions b
  where a.slug = prev_slug and b.slug = here_slug;

  return jsonb_build_object('arrived', km >= 200, 'from', prev_slug, 'to', here_slug, 'km', round(km));
end;
$$;
revoke execute on function public.check_arrival(double precision, double precision) from public, anon;
grant execute on function public.check_arrival(double precision, double precision) to authenticated;
