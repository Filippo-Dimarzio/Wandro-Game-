-- Phase 3: server-verified check-ins, coins (ledger.points), XP, levels, streaks and badges.
-- Validation runs in SECURITY DEFINER functions so the client can never award itself anything.
-- Coins are stored in points_ledger.points; constants mirror packages/shared.

alter type public.ledger_kind add value if not exists 'purchase';
alter type public.ledger_kind add value if not exists 'moderation';

-- ---------------------------------------------------------------------------
-- Constants (keep in sync with packages/shared/src/constants.ts + scoring.ts)
-- ---------------------------------------------------------------------------
create or replace function public.rarity_multiplier(n integer)
returns numeric language sql immutable as $$
  select 1 + 4.0 / (1 + greatest(n, 0) / 10.0)
$$;

create or replace function public.level_for_xp(xp integer)
returns integer language sql immutable as $$
  select floor(sqrt(greatest(xp, 0) / 100.0))::integer + 1
$$;

create or replace function public.lisbon_today()
returns date language sql stable as $$
  select (now() at time zone 'Europe/Lisbon')::date
$$;

-- ---------------------------------------------------------------------------
-- Check-in sessions and ephemeral pings
-- ---------------------------------------------------------------------------
create type public.checkin_status as enum ('open', 'verified', 'rejected', 'flagged', 'abandoned', 'approved');

create table public.checkin_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  place_id uuid not null references public.places (id) on delete cascade,
  started_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '30 minutes',
  status public.checkin_status not null default 'open',
  reason text,
  result jsonb,
  -- Summary kept for moderation of flagged sessions (raw pings are deleted).
  best_accuracy_m real,
  ping_count integer not null default 0,
  last_lat double precision,
  last_lng double precision,
  completed_at timestamptz
);

create index checkin_sessions_user_idx on public.checkin_sessions (user_id, started_at desc);
create index checkin_sessions_status_idx on public.checkin_sessions (status) where status in ('open', 'flagged');

create table public.checkin_pings (
  id bigint generated always as identity primary key,
  session_id uuid not null references public.checkin_sessions (id) on delete cascade,
  lat double precision not null,
  lng double precision not null,
  accuracy_m real not null,
  is_mocked boolean not null default false,
  recorded_at timestamptz not null default clock_timestamp()
);

create index checkin_pings_session_idx on public.checkin_pings (session_id, recorded_at);

alter table public.visits add column visitors_before integer not null default 0;

alter table public.checkin_sessions enable row level security;
alter table public.checkin_pings enable row level security;

create policy checkin_sessions_select_own on public.checkin_sessions for select to authenticated
  using (user_id = auth.uid() or public.is_moderator());
-- Pings are never readable by clients (raw location).
revoke all on public.checkin_sessions, public.checkin_pings from anon, authenticated;
grant select on public.checkin_sessions to authenticated;

-- ---------------------------------------------------------------------------
-- Badges
-- ---------------------------------------------------------------------------
create table public.badges (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text not null,
  emoji text not null default '🏅',
  -- {"type": "total_visits"|"category_count"|"rare_visit"|"first_discoverer"|"region_complete"|"streak"|"daily_challenges", ...}
  criteria jsonb not null,
  xp_reward integer not null default 50
);

create table public.user_badges (
  user_id uuid not null references public.profiles (id) on delete cascade,
  badge_id uuid not null references public.badges (id) on delete cascade,
  awarded_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);

alter table public.badges enable row level security;
alter table public.user_badges enable row level security;
create policy badges_select on public.badges for select to anon, authenticated using (true);
create policy user_badges_select on public.user_badges for select to authenticated using (true);
revoke insert, update, delete on public.badges, public.user_badges from anon, authenticated;

insert into public.badges (code, name, description, emoji, criteria) values
  ('first_step', 'First step', 'Discover your first place.', '👣', '{"type":"total_visits","count":1}'),
  ('explorer_10', 'Explorer', 'Discover 10 places.', '🧭', '{"type":"total_visits","count":10}'),
  ('heritage_3', '3 heritage sites', 'Discover 3 heritage sites.', '🏰', '{"type":"category_count","category":"heritage","count":3}'),
  ('castle_keeper', 'Castle keeper', 'Discover 5 heritage sites.', '👑', '{"type":"category_count","category":"heritage","count":5}'),
  ('nature_5', 'Wild at heart', 'Discover 5 nature spots.', '🌿', '{"type":"category_count","category":"nature","count":5}'),
  ('culture_5', 'Culture vulture', 'Discover 5 museums or cultural places.', '🎨', '{"type":"category_count","category":"culture","count":5}'),
  ('hidden_gem', 'Hidden gem hunter', 'Discover a place fewer than 10 explorers have found.', '💎', '{"type":"rare_visit","max_visitors":10}'),
  ('first_discoverer', 'Pioneer', 'Be the very first to discover a place.', '🚩', '{"type":"first_discoverer","count":1}'),
  ('sintra_complete', 'Sintra complete', 'Discover every place in Sintra.', '🐙', '{"type":"region_complete","region":"sintra"}'),
  ('streak_7', 'On a roll', 'Explore 7 days in a row.', '🔥', '{"type":"streak","days":7}'),
  ('challenger', 'Challenge accepted', 'Complete a daily challenge.', '⚡', '{"type":"daily_challenges","count":1}'),
  ('challenger_7', 'Daily devotee', 'Complete 7 daily challenges.', '🌟', '{"type":"daily_challenges","count":7}')
on conflict (code) do nothing;

-- Awards any badges the user now qualifies for; returns the codes of new badges.
create or replace function public.award_badges(uid uuid)
returns text[]
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  b public.badges;
  ok boolean;
  awarded text[] := '{}';
begin
  for b in select * from public.badges
           where id not in (select badge_id from public.user_badges where user_id = uid)
  loop
    ok := case b.criteria ->> 'type'
      when 'total_visits' then
        (select count(*) from public.visits where user_id = uid) >= (b.criteria ->> 'count')::int
      when 'category_count' then
        (select count(*) from public.visits v join public.places p on p.id = v.place_id
         where v.user_id = uid and p.category::text = b.criteria ->> 'category') >= (b.criteria ->> 'count')::int
      when 'rare_visit' then
        exists (select 1 from public.visits where user_id = uid and visitors_before < (b.criteria ->> 'max_visitors')::int)
      when 'first_discoverer' then
        (select count(*) from public.place_stats where first_discoverer_id = uid) >= (b.criteria ->> 'count')::int
      when 'region_complete' then
        exists (
          select 1 from public.regions r
          where r.slug = b.criteria ->> 'region'
            and exists (select 1 from public.places p where p.region_id = r.id and p.status = 'active')
            and not exists (
              select 1 from public.places p
              where p.region_id = r.id and p.status = 'active'
                and not exists (select 1 from public.visits v where v.place_id = p.id and v.user_id = uid)))
      when 'streak' then
        (select streak_days from public.profiles where id = uid) >= (b.criteria ->> 'days')::int
      when 'daily_challenges' then
        (select count(*) from public.user_daily_challenges where user_id = uid and completed_at is not null)
          >= (b.criteria ->> 'count')::int
      else false
    end;
    if ok then
      insert into public.user_badges (user_id, badge_id) values (uid, b.id) on conflict do nothing;
      insert into public.points_ledger (user_id, kind, points, xp, ref_id, breakdown)
      values (uid, 'badge', 0, b.xp_reward, b.id, jsonb_build_object('badge', b.code));
      awarded := awarded || b.code;
    end if;
  end loop;
  perform public.sync_profile_progress(uid);
  return awarded;
end;
$$;

-- Recomputes cached xp/level on the profile from the ledger (the ledger is the source of truth).
create or replace function public.sync_profile_progress(uid uuid)
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  update public.profiles p
  set xp = s.xp, level = public.level_for_xp(s.xp)
  from (select coalesce(sum(xp), 0)::integer as xp from public.points_ledger where user_id = uid) s
  where p.id = uid;
$$;

-- ---------------------------------------------------------------------------
-- Awarding a verified visit (shared by check-in completion and moderator approval)
-- ---------------------------------------------------------------------------
create or replace function public.award_visit(
  uid uuid, p_place_id uuid, p_lat double precision, p_lng double precision,
  p_accuracy real, p_dwell integer, p_flags text[] default '{}'
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  pl public.places;
  n integer;
  mult numeric;
  coins integer;
  first_bonus integer := 0;
  v_id uuid;
  today date := public.lisbon_today();
  last_day date;
  new_streak integer;
  streak_xp integer;
  new_badges text[];
  prof public.profiles;
begin
  select * into pl from public.places where id = p_place_id and status = 'active';
  if not found then
    raise exception 'place_not_active' using errcode = 'P0001';
  end if;

  -- Row lock so two simultaneous check-ins can't both be "first".
  insert into public.place_stats (place_id) values (p_place_id) on conflict do nothing;
  select unique_visitors into n from public.place_stats where place_id = p_place_id for update;

  mult := public.rarity_multiplier(n);
  coins := round(pl.base_points * mult);
  if n = 0 then
    first_bonus := 50;
  end if;

  insert into public.visits (user_id, place_id, lat, lng, accuracy_m, dwell_seconds, flags, visitors_before)
  values (uid, p_place_id, p_lat, p_lng, p_accuracy, p_dwell, p_flags, n)
  returning id into v_id;

  update public.place_stats
  set unique_visitors = unique_visitors + 1,
      first_discoverer_id = coalesce(first_discoverer_id, case when n = 0 then uid end)
  where place_id = p_place_id;

  insert into public.points_ledger (user_id, kind, points, xp, visit_id, breakdown)
  values (uid, 'visit', coins, coins, v_id,
          jsonb_build_object('base', pl.base_points, 'multiplier', round(mult, 3), 'visitors_before', n));
  if first_bonus > 0 then
    insert into public.points_ledger (user_id, kind, points, xp, visit_id)
    values (uid, 'first_discoverer', first_bonus, first_bonus, v_id);
  end if;

  -- Daily streak (Lisbon calendar days); streaks give XP only, never coins.
  select last_active_date into last_day from public.profiles where id = uid for update;
  new_streak := case
    when last_day = today then (select streak_days from public.profiles where id = uid)
    when last_day = today - 1 then (select streak_days from public.profiles where id = uid) + 1
    else 1 end;
  update public.profiles set streak_days = new_streak, last_active_date = today where id = uid;
  if last_day is distinct from today then
    streak_xp := 10 * least(new_streak, 7);
    insert into public.points_ledger (user_id, kind, points, xp, breakdown)
    values (uid, 'streak', 0, streak_xp, jsonb_build_object('days', new_streak));
  end if;

  perform public.award_collection_bonuses(uid);
  new_badges := public.award_badges(uid);
  select * into prof from public.profiles where id = uid;

  return jsonb_build_object(
    'status', 'verified',
    'visit_id', v_id,
    'coins', coins + first_bonus,
    'breakdown', jsonb_build_object('base', pl.base_points, 'multiplier', round(mult, 3), 'first_discoverer', first_bonus),
    'xp', prof.xp,
    'level', prof.level,
    'streak', prof.streak_days,
    'new_badges', to_jsonb(new_badges)
  );
end;
$$;

-- Collections arrive in Phase 4; defined here as a no-op so award_visit can call it.
create or replace function public.award_collection_bonuses(uid uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  return;
end;
$$;

-- ---------------------------------------------------------------------------
-- Client-facing check-in RPCs
-- ---------------------------------------------------------------------------
create or replace function public.start_checkin(
  p_place_id uuid, p_lat double precision, p_lng double precision,
  p_accuracy real, p_is_mocked boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  uid uuid := auth.uid();
  pl public.places;
  dist double precision;
  sid uuid;
begin
  if uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  select * into pl from public.places where id = p_place_id and status = 'active';
  if not found then
    raise exception 'place_not_active' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.visits where user_id = uid and place_id = p_place_id) then
    raise exception 'already_discovered' using errcode = 'P0001';
  end if;
  if (select count(*) from public.checkin_sessions
      where user_id = uid and started_at > now() - interval '1 hour') >= 30 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  if p_accuracy is null or p_accuracy > 50 then
    raise exception 'low_accuracy' using errcode = 'P0001';
  end if;

  dist := extensions.st_distance(pl.location,
    extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326)::extensions.geography);
  if dist > pl.geofence_radius_m + least(p_accuracy, 25) then
    raise exception 'too_far' using errcode = 'P0001';
  end if;

  -- One open session at a time.
  update public.checkin_sessions set status = 'abandoned', completed_at = now()
  where user_id = uid and status = 'open';
  delete from public.checkin_pings where session_id in (
    select id from public.checkin_sessions where user_id = uid and status = 'abandoned');

  insert into public.checkin_sessions (user_id, place_id) values (uid, p_place_id) returning id into sid;
  insert into public.checkin_pings (session_id, lat, lng, accuracy_m, is_mocked)
  values (sid, p_lat, p_lng, p_accuracy, coalesce(p_is_mocked, false));

  return jsonb_build_object('session_id', sid, 'dwell_seconds', pl.dwell_seconds,
                            'radius_m', pl.geofence_radius_m, 'distance_m', round(dist::numeric, 1));
end;
$$;

create or replace function public.add_checkin_ping(
  p_session_id uuid, p_lat double precision, p_lng double precision,
  p_accuracy real, p_is_mocked boolean default false
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  s public.checkin_sessions;
  last_at timestamptz;
begin
  select * into s from public.checkin_sessions where id = p_session_id and user_id = auth.uid();
  if not found or s.status <> 'open' or now() > s.expires_at then
    raise exception 'session_not_open' using errcode = 'P0001';
  end if;
  select max(recorded_at) into last_at from public.checkin_pings where session_id = s.id;
  -- Ignore floods: at most one ping every 2 seconds, 600 per session.
  if last_at is not null and clock_timestamp() - last_at < interval '2 seconds' then
    return;
  end if;
  if (select count(*) from public.checkin_pings where session_id = s.id) >= 600 then
    return;
  end if;
  insert into public.checkin_pings (session_id, lat, lng, accuracy_m, is_mocked)
  values (s.id, p_lat, p_lng, p_accuracy, coalesce(p_is_mocked, false));
end;
$$;

create or replace function public.complete_checkin(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  uid uuid := auth.uid();
  s public.checkin_sessions;
  pl public.places;
  elapsed integer;
  total integer;
  inside integer;
  last_inside timestamptz;
  mocked boolean;
  max_speed double precision;
  best_acc real;
  last_ping record;
  prev_visit record;
  travel_speed double precision;
  v_reason text;
  v_result jsonb;
begin
  if uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  select * into s from public.checkin_sessions where id = p_session_id and user_id = uid for update;
  if not found then
    raise exception 'session_not_found' using errcode = 'P0002';
  end if;
  -- Idempotent: replaying a finished session returns its stored result.
  if s.status <> 'open' then
    return coalesce(s.result, jsonb_build_object('status', s.status::text, 'reason', s.reason));
  end if;
  if now() > s.expires_at then
    update public.checkin_sessions set status = 'abandoned', reason = 'expired', completed_at = now() where id = s.id;
    delete from public.checkin_pings where session_id = s.id;
    return jsonb_build_object('status', 'rejected', 'reason', 'expired');
  end if;

  select * into pl from public.places where id = s.place_id;
  elapsed := extract(epoch from (now() - s.started_at))::integer;
  if elapsed < pl.dwell_seconds then
    -- Not a failure: the client keeps pinging and tries again.
    return jsonb_build_object('status', 'pending', 'seconds_left', pl.dwell_seconds - elapsed);
  end if;

  with pings as (
    select cp.*, extensions.st_distance(pl.location,
             extensions.st_setsrid(extensions.st_makepoint(cp.lng, cp.lat), 4326)::extensions.geography) as dist
    from public.checkin_pings cp where cp.session_id = s.id
  ), ordered as (
    select *, lag(lat) over w as plat, lag(lng) over w as plng, lag(recorded_at) over w as pat
    from pings window w as (order by recorded_at)
  )
  select count(*),
         count(*) filter (where dist <= pl.geofence_radius_m + least(accuracy_m, 25) and accuracy_m <= 50),
         max(recorded_at) filter (where dist <= pl.geofence_radius_m + least(accuracy_m, 25) and accuracy_m <= 50),
         bool_or(is_mocked),
         min(accuracy_m),
         max(case when pat is not null and recorded_at > pat then
           extensions.st_distance(
             extensions.st_setsrid(extensions.st_makepoint(lng, lat), 4326)::extensions.geography,
             extensions.st_setsrid(extensions.st_makepoint(plng, plat), 4326)::extensions.geography)
           / extract(epoch from (recorded_at - pat)) end)
  into total, inside, last_inside, mocked, best_acc, max_speed
  from ordered;

  select lat, lng, accuracy_m into last_ping from public.checkin_pings
  where session_id = s.id order by recorded_at desc limit 1;

  -- Travel plausibility against the previous verified visit (>300 km/h is impossible on foot).
  select v.lat, v.lng, v.verified_at into prev_visit from public.visits v
  where v.user_id = uid order by v.verified_at desc limit 1;
  if prev_visit.verified_at is not null and s.started_at > prev_visit.verified_at then
    travel_speed := extensions.st_distance(
      extensions.st_setsrid(extensions.st_makepoint(prev_visit.lng, prev_visit.lat), 4326)::extensions.geography,
      extensions.st_setsrid(extensions.st_makepoint(last_ping.lng, last_ping.lat), 4326)::extensions.geography)
      / greatest(extract(epoch from (s.started_at - prev_visit.verified_at)), 1);
  end if;

  if total < 3 or inside < 3 or inside::numeric / total < 0.8 then
    v_reason := 'left_geofence';
  elsif last_inside < s.started_at + make_interval(secs => pl.dwell_seconds * 0.8) then
    v_reason := 'left_geofence';
  end if;

  if v_reason is not null then
    v_result := jsonb_build_object('status', 'rejected', 'reason', v_reason);
    update public.checkin_sessions
    set status = 'rejected', reason = v_reason, result = v_result, completed_at = now(),
        ping_count = total, best_accuracy_m = best_acc
    where id = s.id;
    delete from public.checkin_pings where session_id = s.id;
    return v_result;
  end if;

  if mocked then
    v_reason := 'mock_location';
  elsif max_speed > 50 then
    v_reason := 'impossible_speed';
  elsif travel_speed > 83 then
    v_reason := 'impossible_travel';
  end if;

  if v_reason is not null then
    -- Held for a moderator; no coins until approved. Keep only a summary, never the raw track.
    v_result := jsonb_build_object('status', 'flagged', 'reason', v_reason);
    update public.checkin_sessions
    set status = 'flagged', reason = v_reason, result = v_result, completed_at = now(),
        ping_count = total, best_accuracy_m = best_acc, last_lat = last_ping.lat, last_lng = last_ping.lng
    where id = s.id;
    delete from public.checkin_pings where session_id = s.id;
    return v_result;
  end if;

  v_result := public.award_visit(uid, s.place_id, last_ping.lat, last_ping.lng, best_acc, elapsed);
  update public.checkin_sessions
  set status = 'verified', result = v_result, completed_at = now(), ping_count = total, best_accuracy_m = best_acc
  where id = s.id;
  delete from public.checkin_pings where session_id = s.id;
  return v_result;
end;
$$;

-- Moderators approve or reject flagged check-ins.
create or replace function public.review_flagged_checkin(p_session_id uuid, p_approve boolean)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  s public.checkin_sessions;
  v_result jsonb;
begin
  if not public.is_moderator() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  select * into s from public.checkin_sessions where id = p_session_id and status = 'flagged' for update;
  if not found then
    raise exception 'session_not_flagged' using errcode = 'P0001';
  end if;
  if not p_approve then
    update public.checkin_sessions set status = 'rejected', result = jsonb_build_object('status', 'rejected', 'reason', s.reason)
    where id = s.id;
    return jsonb_build_object('status', 'rejected');
  end if;
  v_result := public.award_visit(s.user_id, s.place_id, s.last_lat, s.last_lng, s.best_accuracy_m,
                               extract(epoch from (s.completed_at - s.started_at))::integer, array[s.reason]);
  update public.checkin_sessions set status = 'approved', result = v_result where id = s.id;
  return v_result;
end;
$$;

-- Privacy: raw pings never live longer than 24 hours (schedule hourly with pg_cron on Supabase).
create or replace function public.purge_stale_checkins()
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  n integer;
begin
  update public.checkin_sessions set status = 'abandoned', reason = 'expired', completed_at = now()
  where status = 'open' and expires_at < now();
  delete from public.checkin_pings p using public.checkin_sessions s
  where p.session_id = s.id and (s.status <> 'open' or p.recorded_at < now() - interval '24 hours');
  get diagnostics n = row_count;
  return n;
end;
$$;

-- Wallet summary for the signed-in user.
create or replace function public.my_wallet()
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'coins', coalesce((select sum(points) from public.points_ledger where user_id = auth.uid()), 0),
    'coins_earned', coalesce((select sum(points) from public.points_ledger where user_id = auth.uid() and points > 0), 0),
    'xp', p.xp,
    'level', p.level,
    'streak', p.streak_days,
    'discoveries', (select count(*) from public.visits where user_id = auth.uid())
  )
  from public.profiles p where p.id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- Daily challenge pays double: the bonus equals the coins of the qualifying discovery.
-- ---------------------------------------------------------------------------
create or replace function public.complete_daily_challenge(p_challenge_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  uid uuid := auth.uid();
  ch public.daily_challenges;
  udc public.user_daily_challenges;
  bonus integer;
begin
  if uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  select * into ch from public.daily_challenges where id = p_challenge_id;
  if not found then
    raise exception 'challenge_not_found' using errcode = 'P0002';
  end if;
  select * into udc from public.user_daily_challenges
  where user_id = uid and challenge_id = p_challenge_id for update;
  if not found then
    raise exception 'challenge_not_opened' using errcode = 'P0001';
  end if;
  if udc.completed_at is not null then
    return jsonb_build_object('status', 'already_completed', 'bonus_points', 0, 'completed_at', udc.completed_at);
  end if;
  if now() > udc.expires_at then
    raise exception 'challenge_expired' using errcode = 'P0001';
  end if;
  if not public.challenge_satisfied(uid, ch, udc.started_at, udc.expires_at) then
    raise exception 'challenge_not_satisfied' using errcode = 'P0001';
  end if;

  select l.points into bonus
  from public.visits v
  join public.places p on p.id = v.place_id
  join public.points_ledger l on l.visit_id = v.id and l.kind = 'visit'
  where v.user_id = uid
    and v.verified_at between udc.started_at and udc.expires_at
    and (ch.place_id is null or v.place_id = ch.place_id)
    and (ch.category is null or p.category = ch.category)
  order by l.points desc
  limit 1;
  bonus := greatest(coalesce(bonus, 0), ch.bonus_points);

  update public.user_daily_challenges set completed_at = now()
  where user_id = uid and challenge_id = p_challenge_id;
  insert into public.points_ledger (user_id, kind, points, xp, ref_id, breakdown)
  values (uid, 'daily_challenge', bonus, bonus, ch.id,
          jsonb_build_object('challenge_date', ch.challenge_date, 'rule', 'double_coins'));
  perform public.award_badges(uid);

  return jsonb_build_object('status', 'completed', 'bonus_points', bonus, 'completed_at', now());
end;
$$;

-- ---------------------------------------------------------------------------
-- Grants: internal helpers are not callable by clients.
-- ---------------------------------------------------------------------------
revoke execute on function public.award_visit(uuid, uuid, double precision, double precision, real, integer, text[]) from public, anon, authenticated;
revoke execute on function public.award_badges(uuid) from public, anon, authenticated;
revoke execute on function public.award_collection_bonuses(uuid) from public, anon, authenticated;
revoke execute on function public.sync_profile_progress(uuid) from public, anon, authenticated;
revoke execute on function public.purge_stale_checkins() from public, anon, authenticated;
revoke execute on function public.start_checkin(uuid, double precision, double precision, real, boolean) from public, anon;
revoke execute on function public.add_checkin_ping(uuid, double precision, double precision, real, boolean) from public, anon;
revoke execute on function public.complete_checkin(uuid) from public, anon;
revoke execute on function public.review_flagged_checkin(uuid, boolean) from public, anon;
revoke execute on function public.my_wallet() from public, anon;
grant execute on function public.start_checkin(uuid, double precision, double precision, real, boolean) to authenticated;
grant execute on function public.add_checkin_ping(uuid, double precision, double precision, real, boolean) to authenticated;
grant execute on function public.complete_checkin(uuid) to authenticated;
grant execute on function public.review_flagged_checkin(uuid, boolean) to authenticated;
grant execute on function public.my_wallet() to authenticated;
