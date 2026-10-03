-- Art (galleries, murals, street art, sculpture) and Travel (stations, trams, funiculars,
-- cable cars, ports) categories. Mirrors CATEGORIES / BASE_POINTS in packages/shared.
alter type public.place_category add value if not exists 'art';
alter type public.place_category add value if not exists 'travel';

-- Same as before, with base points for the new categories.
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
      when 'music_events' then 100 when 'art' then 100 when 'travel' then 80 else 60 end),
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
