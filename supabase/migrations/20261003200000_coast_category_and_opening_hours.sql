-- Beaches & coast category, and set opening times for places that need them
-- (venues, events, markets). No new tables, so RLS is unchanged.

alter type public.place_category add value if not exists 'coast';

-- Array of { "days": [0-6], "open": "HH:MM", "close": "HH:MM" } in Europe/Lisbon time.
-- A close at or before the open time runs past midnight. Null = always accessible.
alter table public.places add column opening_hours jsonb
  check (opening_hours is null or jsonb_typeof(opening_hours) = 'array');

-- New columns go at the end so dependants (nearby_places) keep working.
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
  p.opening_hours
from public.places p
left join public.place_stats s on s.place_id = p.id
left join public.place_photos ph on ph.place_id = p.id and ph.is_primary and ph.status = 'approved'
where p.status = 'active';

-- Same as before, with base points for the new category (mirrors BASE_POINTS in packages/shared).
create or replace function public.approve_place_submission(p_submission_id uuid, p_base_points integer default null)
returns uuid
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  sub public.place_submissions;
  new_place uuid;
begin
  if not public.is_moderator() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select * into sub from public.place_submissions where id = p_submission_id for update;
  if not found then
    raise exception 'submission_not_found' using errcode = 'P0002';
  end if;
  if sub.status <> 'pending' then
    raise exception 'submission_already_reviewed' using errcode = 'P0001';
  end if;

  insert into public.places (name, description, location, category, base_points, source, source_id, status)
  values (
    sub.name, sub.description, sub.location, sub.category,
    coalesce(p_base_points, case sub.category
      when 'culture' then 100 when 'heritage' then 120 when 'nature' then 80 when 'coast' then 80
      when 'music_events' then 100 else 60 end),
    'submission', sub.id::text, 'active'
  )
  returning id into new_place;

  insert into public.place_stats (place_id) values (new_place);

  update public.place_submissions
  set status = 'approved', reviewer_id = auth.uid(), reviewed_at = now(), place_id = new_place
  where id = sub.id;

  return new_place;
end;
$$;
