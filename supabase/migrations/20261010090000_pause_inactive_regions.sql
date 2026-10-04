-- Phase 10: Portugal focus, follow-up to 20261009100000_portugal_cities_and_gem_unlocks and
-- 20261009110000_flights_by_airport. Sintra, Lisbon, Porto, Évora and Aveiro are live; every
-- other city is paused.
--
-- Nothing is deleted. Deleting a place cascades to its visits, posts, check-in sessions, reveals
-- and friend challenges, so paused cities' regions, places and sets are switched off with the
-- flags the schema already has (regions.is_active, places.status = 'closed', collections.is_active).
-- Player history (visits, the coin ledger, posts, the passport, badges) stays intact, and turning
-- a city back on is a data change. Mirrors REGIONS in packages/shared/src/regions.ts.

-- Pausing a city: its places are closed and leave the map, search and Discover (places_public
-- and the places RLS policy only show active ones), its sets close, and open friend challenges
-- to its places are declined because they can no longer be completed. Visits, posts, the ledger
-- and set progress are left untouched. It only ever pauses: reactivating a city is a deliberate migration, so a
-- place a moderator hid for safety is never switched back on by accident. Server-only.
create or replace function public.pause_inactive_regions()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.places p
  set status = 'closed'
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
