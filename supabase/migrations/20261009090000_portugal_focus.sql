-- Phase 10: Portugal focus. Sintra, Lisbon and Porto stay live; every other city is paused.
--
-- Nothing is deleted. Deleting a place cascades to its visits, posts, check-in sessions, reveals
-- and friend challenges, so instead other cities' regions, places and sets are switched off with
-- the flags the schema already has (regions.is_active, places.status, collections.is_active).
-- Player history (visits, the coin ledger, posts, the passport, badges) stays intact, and turning
-- a city back on is a data change. Mirrors REGIONS in packages/shared/src/regions.ts.

-- Arrival flights compare airports, so a flight is Lisbon ↔ Porto but not Sintra ↔ Lisbon.
-- Every region keeps its code, so a paused city flies again once reactivated.
alter table public.regions add column airport text check (airport ~ '^[A-Z]{3}$');

update public.regions r
set airport = v.airport
from (values
  ('sintra', 'LIS'), ('lisbon', 'LIS'), ('porto', 'OPO'),
  ('madrid', 'MAD'), ('barcelona', 'BCN'), ('paris', 'CDG'), ('rome', 'FCO'),
  ('florence', 'FLR'), ('amsterdam', 'AMS'), ('berlin', 'BER'), ('prague', 'PRG'),
  ('vienna', 'VIE'), ('edinburgh', 'EDI'), ('budapest', 'BUD'), ('dublin', 'DUB'),
  ('cork', 'ORK'), ('stockholm', 'ARN'), ('copenhagen', 'CPH'), ('warsaw', 'WAW'),
  ('gdansk', 'GDN'), ('basque', 'BIO')
) as v(slug, airport)
where r.slug = v.slug;

update public.regions set is_active = (slug in ('sintra', 'lisbon', 'porto'));

-- Pausing a city: its places leave the map, search and Discover (places_public and the places RLS
-- policy only show active ones), its sets close, and open friend challenges to its places are
-- declined because they can no longer be completed. Visits, posts, the ledger and set progress
-- are left untouched. It only ever pauses: reactivating a city is a deliberate migration, so a
-- place a moderator hid for safety is never switched back on by accident. Server-only.
create or replace function public.pause_inactive_regions()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.places p
  set status = 'hidden'
  from public.regions r
  where p.region_id = r.id and not r.is_active and p.status = 'active';

  update public.collections c
  set is_active = false
  from public.regions r
  where c.region_id = r.id and not r.is_active and c.is_active;

  update public.friend_challenges fc
  set status = 'declined', responded_at = coalesce(fc.responded_at, now())
  from public.places p
  where fc.place_id = p.id and p.status <> 'active' and fc.status in ('pending', 'accepted');
end;
$$;
revoke execute on function public.pause_inactive_regions() from public, anon, authenticated;

select public.pause_inactive_regions();

-- A flight needs both cities to be live launch cities and a change of airport.
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
  prev public.regions;
  here public.regions;
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

  select * into prev from public.regions where slug = prev_slug;
  select * into here from public.regions where slug = here_slug;
  if not prev.is_active or prev.airport is not distinct from here.airport then
    return jsonb_build_object('arrived', false, 'from', prev_slug, 'to', here_slug);
  end if;

  return jsonb_build_object(
    'arrived', true, 'from', prev_slug, 'to', here_slug,
    'km', round((extensions.st_distance(
      extensions.st_centroid(prev.bbox)::extensions.geography,
      extensions.st_centroid(here.bbox)::extensions.geography) / 1000)::numeric));
end;
$$;
