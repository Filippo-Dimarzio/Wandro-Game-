-- Daily challenge calendar (Step 2). Mirrors packages/shared/src/challenges.ts; the rotation
-- values and the dated schedule below are generated from it (catalog-sync.test.ts checks).
--
-- A dated challenge covers one date or a date range. Ranges are stored as one row per day, so
-- each day keeps its own rolling 24 h window and the reward is still paid at most once a day.
-- Days nobody has a row for yet get the rotation on first open, so the server never runs dry.

-- Slug of the dated challenge a day belongs to; null for the everyday rotation.
alter table public.daily_challenges add column campaign text
  check (campaign is null or campaign ~ '^[a-z0-9-]{2,60}$');

-- The rotation: every category appears, repeating every 9 days from 1970-01-01.
create or replace function public.challenge_rotation(d date)
returns table (title text, description text, category public.place_category)
language sql
immutable
set search_path = public, pg_temp
as $$
  select r.title, r.description, r.category
  from (values
    (0, 'Find a hidden viewpoint', 'Discover any nature spot today.', 'nature'::public.place_category),
    (1, 'Step into history', 'Discover any heritage site today.', 'heritage'::public.place_category),
    (2, 'Catch the music', 'Discover a concert hall, music club or event venue today.', 'music_events'::public.place_category),
    (3, 'Culture hunt', 'Discover a market, café, festival spot or old neighbourhood today.', 'culture'::public.place_category),
    (4, 'Follow the coastline', 'Discover any beach or coastal spot today.', 'coast'::public.place_category),
    (5, 'Oddity of the day', 'Discover any curiosity today.', 'other'::public.place_category),
    (6, 'Art attack', 'Discover a gallery, museum, mural or piece of street art today.', 'art'::public.place_category),
    (7, 'Sound check', 'Discover any music venue or event spot today.', 'music_events'::public.place_category),
    (8, 'Wander anywhere new', 'Discover any place you have never visited.', null)
  ) as r (i, title, description, category)
  where r.i = (d - date '1970-01-01') % 9;
$$;

-- Today's row, created from the rotation when nothing is scheduled.
create or replace function public.ensure_daily_challenge(d date)
returns public.daily_challenges
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  ch public.daily_challenges;
begin
  insert into public.daily_challenges (challenge_date, title, description, category, bonus_points)
  select d, r.title, r.description, r.category, 75 from public.challenge_rotation(d) r
  on conflict (challenge_date) do nothing;
  select * into ch from public.daily_challenges where challenge_date = d;
  return ch;
end;
$$;

-- Server-only: schedules a challenge for a date or an inclusive date range. Idempotent. A day
-- somebody has already opened is never rewritten, so nobody's open challenge changes under them.
create or replace function public.schedule_daily_challenge(
  p_campaign text,
  p_title text,
  p_description text,
  p_category public.place_category,
  p_starts_on date,
  p_ends_on date
)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  n integer;
begin
  if p_starts_on is null or p_ends_on is null or p_ends_on < p_starts_on then
    raise exception 'invalid_date_range' using errcode = '22023';
  end if;
  if p_ends_on - p_starts_on > 92 then
    raise exception 'date_range_too_long' using errcode = '22023';
  end if;
  if coalesce(btrim(p_title), '') = '' or coalesce(btrim(p_description), '') = '' then
    raise exception 'invalid_challenge' using errcode = '22023';
  end if;

  insert into public.daily_challenges (challenge_date, title, description, category, bonus_points, campaign)
  select d::date, p_title, p_description, p_category, 75, p_campaign
  from generate_series(p_starts_on, p_ends_on, interval '1 day') as d
  on conflict (challenge_date) do update
    set title = excluded.title, description = excluded.description, category = excluded.category,
        place_id = null, campaign = excluded.campaign
    where not exists (
      select 1 from public.user_daily_challenges u where u.challenge_id = daily_challenges.id
    );
  get diagnostics n = row_count;
  return n;
end;
$$;

revoke execute on function public.challenge_rotation(date) from public, anon, authenticated;
revoke execute on function public.ensure_daily_challenge(date) from public, anon, authenticated;
revoke execute on function public.schedule_daily_challenge(text, text, text, public.place_category, date, date)
  from public, anon, authenticated;

-- Same as before, but today's challenge always exists.
create or replace function public.open_daily_challenge()
returns table (
  challenge_id uuid,
  title text,
  description text,
  place_id uuid,
  category public.place_category,
  bonus_points integer,
  started_at timestamptz,
  expires_at timestamptz,
  completed_at timestamptz,
  is_ready boolean
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  uid uuid := auth.uid();
  ch public.daily_challenges;
  udc public.user_daily_challenges;
begin
  if uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  ch := public.ensure_daily_challenge((now() at time zone 'Europe/Lisbon')::date);

  insert into public.user_daily_challenges (user_id, challenge_id, expires_at)
  values (uid, ch.id, now() + interval '24 hours')
  on conflict on constraint user_daily_challenges_pkey do nothing;

  select * into udc from public.user_daily_challenges u
  where u.user_id = uid and u.challenge_id = ch.id;

  return query select
    ch.id, ch.title, ch.description, ch.place_id, ch.category, ch.bonus_points,
    udc.started_at, udc.expires_at, udc.completed_at,
    public.challenge_satisfied(uid, ch, udc.started_at, udc.expires_at);
end;
$$;

-- Days already seeded with the old 7-day rotation move to the new one (unless someone opened them).
update public.daily_challenges c
set (title, description, category) = (
  select r.title, r.description, r.category from public.challenge_rotation(c.challenge_date) r
)
where c.campaign is null
  and c.place_id is null
  and c.challenge_date >= (now() at time zone 'Europe/Lisbon')::date
  and not exists (select 1 from public.user_daily_challenges u where u.challenge_id = c.id);

-- The next 12 months of dated challenges.
select public.schedule_daily_challenge('santos-populares', 'Santos Populares', 'June’s saints’ festivals: discover a festival spot, market or old neighbourhood.', 'culture'::public.place_category, date '2027-06-01', date '2027-06-30');
select public.schedule_daily_challenge('winter-lights', 'Winter lights', 'Winter campaign: discover a heritage site or old town square while the festive lights are up.', 'heritage'::public.place_category, date '2026-12-12', date '2027-01-06');
select public.schedule_daily_challenge('warm-up-indoors', 'Warm up indoors', 'Winter campaign: discover a museum or gallery on a cold day.', 'art'::public.place_category, date '2027-01-18', date '2027-01-31');
select public.schedule_daily_challenge('autumn-hills', 'Autumn in the hills', 'Autumn campaign: discover any nature spot while the leaves turn.', 'nature'::public.place_category, date '2026-10-17', date '2026-10-25');
select public.schedule_daily_challenge('summer-coast', 'Summer by the sea', 'Summer campaign: discover any beach or coastal spot.', 'coast'::public.place_category, date '2027-07-24', date '2027-08-01');
select public.schedule_daily_challenge('carnaval', 'Carnaval', 'Carnival weekend: discover a festival spot, market or local tradition.', 'culture'::public.place_category, date '2027-02-06', date '2027-02-09');
select public.schedule_daily_challenge('heritage-days', 'European Heritage Days', 'Discover any heritage site this weekend.', 'heritage'::public.place_category, date '2027-09-24', date '2027-09-26');
select public.schedule_daily_challenge('sao-martinho', 'São Martinho', 'Chestnuts and new wine: discover a market, café or local tradition today.', 'culture'::public.place_category, date '2026-11-11', date '2026-11-11');
select public.schedule_daily_challenge('monuments-day', 'International Day for Monuments and Sites', 'Discover any heritage site today.', 'heritage'::public.place_category, date '2027-04-18', date '2027-04-18');
select public.schedule_daily_challenge('freedom-day', 'Freedom Day', '25 de Abril: discover a square, market or neighbourhood where the city gathers.', 'culture'::public.place_category, date '2027-04-25', date '2027-04-25');
select public.schedule_daily_challenge('museum-day', 'International Museum Day', 'Discover a museum or gallery today.', 'art'::public.place_category, date '2027-05-18', date '2027-05-18');
select public.schedule_daily_challenge('world-music-day', 'World Music Day', 'Discover any music venue or event spot today.', 'music_events'::public.place_category, date '2027-06-21', date '2027-06-21');
select public.schedule_daily_challenge('car-free-day', 'World Car-Free Day', 'Leave the car at home: walk to any place you have never discovered.', null, date '2027-09-22', date '2027-09-22');
