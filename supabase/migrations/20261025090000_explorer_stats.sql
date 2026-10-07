-- The profile page's exploring record: discoveries by category and city, first discoveries and
-- the rarest place found. Read-only, and only ever about the caller (auth.uid()); never shows
-- anyone's locations. Demo mode mirrors it with explorerStats() in packages/shared.
create or replace function public.my_explorer_stats()
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with mine as (
    select p.name, p.category, r.slug as region, coalesce(s.unique_visitors, 0) as visitors
    from public.visits v
    join public.places p on p.id = v.place_id
    left join public.regions r on r.id = p.region_id
    left join public.place_stats s on s.place_id = p.id
    where v.user_id = auth.uid()
  )
  select jsonb_build_object(
    'total', (select count(*) from mine),
    'by_category', coalesce(
      (select jsonb_object_agg(category, n) from (select category, count(*) as n from mine group by category) c),
      '{}'::jsonb),
    'cities', coalesce(
      (select jsonb_agg(jsonb_build_object(
         'region', r.slug,
         'found', (select count(*) from mine m where m.region = r.slug),
         'total', (select count(*) from public.places p where p.region_id = r.id and p.status = 'active')))
       from public.regions r where r.is_active),
      '[]'::jsonb),
    'first_discoveries',
      (select count(*) from public.points_ledger where user_id = auth.uid() and kind = 'first_discoverer'),
    'rarest',
      (select jsonb_build_object('name', name, 'visitors', visitors) from mine order by visitors, name limit 1)
  );
$$;

revoke execute on function public.my_explorer_stats() from public, anon;
grant execute on function public.my_explorer_stats() to authenticated;
