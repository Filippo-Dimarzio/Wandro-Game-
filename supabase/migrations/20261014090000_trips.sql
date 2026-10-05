-- Every move between two live launch cities is now an arrival: by plane when both cities have
-- their own airport (Lisbon ↔ Porto), otherwise by train or coach, whichever is quicker.
-- The app picks the mode (tripMode() in packages/shared); the server only says you arrived.
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
  if not coalesce(prev.is_active, false) then
    return jsonb_build_object('arrived', false, 'from', prev_slug, 'to', here_slug);
  end if;

  return jsonb_build_object(
    'arrived', true, 'from', prev_slug, 'to', here_slug,
    'km', round((extensions.st_distance(
      extensions.st_centroid(prev.bbox)::extensions.geography,
      extensions.st_centroid(here.bbox)::extensions.geography) / 1000)::numeric));
end;
$$;
revoke execute on function public.check_arrival(double precision, double precision) from public, anon;
grant execute on function public.check_arrival(double precision, double precision) to authenticated;
