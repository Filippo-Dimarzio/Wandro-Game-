-- Daily challenges ("tap to confirm") and place submissions ("approved missions").

-- ---------------------------------------------------------------------------
-- Daily challenges: one challenge per calendar day (Lisbon time). Each user's
-- 24-hour window starts when they first open it (rolling 24 h, see PLAN.md).
-- A challenge targets a specific place, a category, or any place.
-- ---------------------------------------------------------------------------
create table public.daily_challenges (
  id uuid primary key default gen_random_uuid(),
  challenge_date date not null unique,
  title text not null,
  description text not null,
  place_id uuid references public.places (id) on delete set null,
  category public.place_category,
  bonus_points integer not null default 75 check (bonus_points > 0),
  created_at timestamptz not null default now()
);

create table public.user_daily_challenges (
  user_id uuid not null references public.profiles (id) on delete cascade,
  challenge_id uuid not null references public.daily_challenges (id) on delete cascade,
  started_at timestamptz not null default now(),
  expires_at timestamptz not null,
  completed_at timestamptz,
  primary key (user_id, challenge_id)
);

alter table public.daily_challenges enable row level security;
alter table public.user_daily_challenges enable row level security;

create policy daily_challenges_select on public.daily_challenges for select to authenticated using (true);
create policy user_daily_challenges_select_own on public.user_daily_challenges for select to authenticated
  using (user_id = auth.uid());

revoke insert, update, delete on public.daily_challenges, public.user_daily_challenges from anon, authenticated;

-- Opens today's challenge for the caller (idempotent) and returns its state.
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

  select * into ch from public.daily_challenges
  where challenge_date = (now() at time zone 'Europe/Lisbon')::date;
  if not found then
    return;
  end if;

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

-- True when the user has a verified visit inside the window that matches the challenge.
create or replace function public.challenge_satisfied(
  uid uuid, ch public.daily_challenges, win_start timestamptz, win_end timestamptz
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.visits v
    join public.places p on p.id = v.place_id
    where v.user_id = uid
      and v.verified_at between win_start and win_end
      and (ch.place_id is null or v.place_id = ch.place_id)
      and (ch.category is null or p.category = ch.category)
  );
$$;

revoke execute on function public.challenge_satisfied(uuid, public.daily_challenges, timestamptz, timestamptz)
  from public, anon, authenticated;

-- "Tap to confirm": the server re-checks everything; the tap only claims the bonus.
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
begin
  if uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  select * into ch from public.daily_challenges where id = p_challenge_id;
  if not found then
    raise exception 'challenge_not_found' using errcode = 'P0002';
  end if;

  select * into udc from public.user_daily_challenges
  where user_id = uid and challenge_id = p_challenge_id
  for update;
  if not found then
    raise exception 'challenge_not_opened' using errcode = 'P0001';
  end if;

  -- Idempotent: confirming twice returns the original result.
  if udc.completed_at is not null then
    return jsonb_build_object('status', 'already_completed', 'bonus_points', 0, 'completed_at', udc.completed_at);
  end if;

  if now() > udc.expires_at then
    raise exception 'challenge_expired' using errcode = 'P0001';
  end if;

  if not public.challenge_satisfied(uid, ch, udc.started_at, udc.expires_at) then
    raise exception 'challenge_not_satisfied' using errcode = 'P0001';
  end if;

  update public.user_daily_challenges set completed_at = now()
  where user_id = uid and challenge_id = p_challenge_id;

  insert into public.points_ledger (user_id, kind, points, xp, ref_id, breakdown)
  values (uid, 'daily_challenge', ch.bonus_points, ch.bonus_points, ch.id,
          jsonb_build_object('challenge_date', ch.challenge_date));

  update public.profiles
  set xp = xp + ch.bonus_points,
      level = floor(sqrt((xp + ch.bonus_points) / 100.0))::integer + 1
  where id = uid;

  return jsonb_build_object('status', 'completed', 'bonus_points', ch.bonus_points, 'completed_at', now());
end;
$$;

-- ---------------------------------------------------------------------------
-- Place submissions -> moderated -> approved mission (an active place)
-- ---------------------------------------------------------------------------
create type public.submission_status as enum ('pending', 'approved', 'rejected');

create table public.place_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (char_length(name) between 2 and 120),
  description text check (char_length(description) <= 1000),
  location extensions.geography (Point, 4326) not null,
  category public.place_category not null,
  photo_path text,
  -- Safety checklist confirmed by the submitter.
  is_public_access boolean not null,
  is_safe boolean not null,
  status public.submission_status not null default 'pending',
  reviewer_id uuid references public.profiles (id) on delete set null,
  reject_reason text,
  place_id uuid references public.places (id) on delete set null,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  check (is_public_access and is_safe)
);

alter table public.place_submissions enable row level security;

create policy submissions_insert_own on public.place_submissions for insert to authenticated
  with check (user_id = auth.uid() and status = 'pending' and reviewer_id is null and place_id is null);
create policy submissions_select on public.place_submissions for select to authenticated
  using (user_id = auth.uid() or public.is_moderator());

revoke update, delete on public.place_submissions from anon, authenticated;

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
      when 'culture' then 100 when 'heritage' then 120 when 'nature' then 80
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

create or replace function public.reject_place_submission(p_submission_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_moderator() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  update public.place_submissions
  set status = 'rejected', reviewer_id = auth.uid(), reviewed_at = now(), reject_reason = p_reason
  where id = p_submission_id and status = 'pending';
  if not found then
    raise exception 'submission_not_pending' using errcode = 'P0001';
  end if;
end;
$$;

revoke execute on function public.approve_place_submission(uuid, integer) from public, anon;
revoke execute on function public.reject_place_submission(uuid, text) from public, anon;
revoke execute on function public.open_daily_challenge() from public, anon;
revoke execute on function public.complete_daily_challenge(uuid) from public, anon;
grant execute on function public.approve_place_submission(uuid, integer) to authenticated;
grant execute on function public.reject_place_submission(uuid, text) to authenticated;
grant execute on function public.open_daily_challenge() to authenticated;
grant execute on function public.complete_daily_challenge(uuid) to authenticated;
