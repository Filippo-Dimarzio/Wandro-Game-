-- A completed activity pays at most 50 coins (ACTIVITY_COIN_CAP in packages/shared).
--
-- One rule on the ledger enforces it, whichever function pays: what one discovered place earns
-- (the visit with its rarity, the first-discoverer bonus, set steps) shares one 50-coin cap, and
-- any other reward row (a daily challenge, a finished set) is capped at 50 on its own. Boosts the
-- player bought (the time-of-day key, friend beacons) still pay on top, and purchases and
-- moderator corrections aren't rewards, so all of those pass through. Coins already earned stay.

create or replace function public.points_ledger_coin_cap()
returns trigger language plpgsql as $$
declare
  paid integer;
begin
  if new.points <= 0 or new.kind in ('purchase', 'moderation', 'time_quest', 'friend_beacon') then
    return new;
  end if;
  if new.visit_id is not null then
    select coalesce(sum(points), 0) into paid
    from public.points_ledger
    where visit_id = new.visit_id and points > 0
      and kind not in ('purchase', 'moderation', 'time_quest', 'friend_beacon');
    new.points := greatest(0, least(new.points, 50 - paid));
  else
    new.points := least(new.points, 50);
  end if;
  return new;
end;
$$;
drop trigger if exists points_ledger_coin_cap on public.points_ledger;
create trigger points_ledger_coin_cap before insert on public.points_ledger
  for each row execute function public.points_ledger_coin_cap();

-- The check-in result reports what was actually paid, after the cap.
alter function public.award_visit(uuid, uuid, double precision, double precision, real, integer, text[])
  rename to award_visit_uncapped;

create function public.award_visit(
  uid uuid, p_place_id uuid, p_lat double precision, p_lng double precision,
  p_accuracy real, p_dwell integer, p_flags text[] default '{}'
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  r jsonb;
  v uuid;
  paid jsonb;
begin
  r := public.award_visit_uncapped(uid, p_place_id, p_lat, p_lng, p_accuracy, p_dwell, p_flags);
  v := (r->>'visit_id')::uuid;
  -- This visit's rows, plus sets finished by it (paid in this same transaction).
  select jsonb_build_object(
           'coins', coalesce(sum(points), 0),
           'first_discoverer', coalesce(sum(points) filter (where kind = 'first_discoverer'), 0),
           'sets', coalesce(sum(points) filter (where kind = 'collection'), 0),
           'time_quest', coalesce(sum(points) filter (where kind = 'time_quest'), 0),
           'beacon', coalesce(sum(points) filter (where kind = 'friend_beacon'), 0))
  into paid
  from public.points_ledger
  where user_id = uid
    and (visit_id = v or (kind = 'collection' and visit_id is null and created_at = now()));
  return r || jsonb_build_object(
    'coins', (paid->>'coins')::integer,
    'breakdown', (r->'breakdown') || (paid - 'coins'));
end;
$$;
revoke execute on function public.award_visit(uuid, uuid, double precision, double precision, real, integer, text[]) from public, anon, authenticated;
revoke execute on function public.award_visit_uncapped(uuid, uuid, double precision, double precision, real, integer, text[]) from public, anon, authenticated;

-- Same for the daily challenge: report the capped bonus.
alter function public.complete_daily_challenge(uuid) rename to complete_daily_challenge_uncapped;

create function public.complete_daily_challenge(p_challenge_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  r jsonb;
begin
  r := public.complete_daily_challenge_uncapped(p_challenge_id);
  if r->>'status' = 'completed' then
    r := r || jsonb_build_object('bonus_points', (
      select coalesce(sum(points), 0) from public.points_ledger
      where user_id = auth.uid() and kind = 'daily_challenge' and ref_id = p_challenge_id));
  end if;
  return r;
end;
$$;
revoke execute on function public.complete_daily_challenge_uncapped(uuid) from public, anon, authenticated;
revoke execute on function public.complete_daily_challenge(uuid) from public, anon;
grant execute on function public.complete_daily_challenge(uuid) to authenticated;
