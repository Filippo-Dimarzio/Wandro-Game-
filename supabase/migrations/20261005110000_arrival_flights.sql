-- Arrival flights: when a player opens the app in another launch city, the app plays a flight
-- from the old city's airport to the new one. Only the city is remembered, never coordinates.
-- Mirrors arrivalFlight() / MIN_FLIGHT_KM in packages/shared/src/regions.ts.

create table public.player_regions (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  region_slug text not null references public.regions (slug) on delete cascade,
  seen_at timestamptz not null default now()
);

alter table public.player_regions enable row level security;
create policy player_regions_select_own on public.player_regions for select to authenticated
  using (user_id = auth.uid());
revoke insert, update, delete on public.player_regions from anon, authenticated;

-- Returns { arrived, from, to, km }. `arrived` is true only for a new city at least 300 km
-- away; a first visit, the same city or a short hop (Sintra to Lisbon) just updates the city.
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

  return jsonb_build_object('arrived', km >= 300, 'from', prev_slug, 'to', here_slug, 'km', round(km));
end;
$$;

-- The data export includes the remembered city.
create or replace function public.export_my_data()
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  return public.export_my_core_data() || public.export_my_friends_data()
    || jsonb_build_object('last_city', (select jsonb_build_object('region', region_slug, 'seen_at', seen_at)
                                        from public.player_regions where user_id = auth.uid()));
end;
$$;

revoke execute on function public.check_arrival(double precision, double precision) from public, anon;
grant execute on function public.check_arrival(double precision, double precision) to authenticated;
