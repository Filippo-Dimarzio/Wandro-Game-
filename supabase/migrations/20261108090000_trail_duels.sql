-- Trail duels (Phase 17.2): challenge a friend to a trail you've unlocked. You each play it on your
-- own (your friend unlocks it by the usual rules: 5 discoveries in the city and 300 coins). When
-- you've both finished, each of you gets 25 coins, and whoever lost fewest coins to hints and
-- wrong answers (the higher score: the sum of the stop coins) gets 25 more. A tie: both win.
-- Mirrors trailDuelReward() in packages/shared and apps/mobile/src/demo/trailDuels.ts.

alter type public.ledger_kind add value if not exists 'trail_duel';

create type public.trail_duel_status as enum ('pending', 'accepted', 'declined', 'done');

create table public.trail_duels (
  id uuid primary key default gen_random_uuid(),
  trail_id uuid not null references public.trails (id) on delete cascade,
  from_user uuid not null references public.profiles (id) on delete cascade,
  to_user uuid not null references public.profiles (id) on delete cascade,
  status public.trail_duel_status not null default 'pending',
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  resolved_at timestamptz,
  from_score integer,
  to_score integer,
  check (from_user <> to_user)
);
-- One open duel per pair and trail, whoever sent it.
create unique index trail_duels_open_pair on public.trail_duels
  (trail_id, least(from_user, to_user), greatest(from_user, to_user))
  where status in ('pending', 'accepted');
create index trail_duels_to_idx on public.trail_duels (to_user, status);
create index trail_duels_from_idx on public.trail_duels (from_user, created_at);

alter table public.trail_duels enable row level security;
create policy trail_duels_select_own on public.trail_duels for select to authenticated
  using (auth.uid() in (from_user, to_user));
revoke insert, update, delete on public.trail_duels from anon, authenticated;

-- A finished run's score: the coins its stops paid (20 each, less 5 per hint or wrong answer).
-- Null until the trail is finished.
create or replace function public.trail_score(uid uuid, p_trail uuid)
returns integer language sql stable security definer set search_path = public, pg_temp as $$
  select case when exists (select 1 from public.trail_progress
                           where user_id = uid and trail_id = p_trail and completed_at is not null)
              then (select coalesce(sum(coins), 0)::integer from public.trail_stop_progress
                    where user_id = uid and trail_id = p_trail)
         end
$$;
revoke execute on function public.trail_score(uuid, uuid) from public, anon, authenticated;

-- Settles an accepted duel once both players have finished. Idempotent: a settled duel is 'done'.
create or replace function public.resolve_trail_duel(p_duel uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare
  d public.trail_duels;
  a integer;
  b integer;
begin
  select * into d from public.trail_duels where id = p_duel and status = 'accepted' for update;
  if not found then return; end if;
  a := public.trail_score(d.from_user, d.trail_id);
  b := public.trail_score(d.to_user, d.trail_id);
  if a is null or b is null then return; end if;
  update public.trail_duels set status = 'done', resolved_at = now(), from_score = a, to_score = b
    where id = d.id;
  insert into public.points_ledger (user_id, kind, points, ref_id, breakdown) values
    (d.from_user, 'trail_duel', 25 + case when a >= b then 25 else 0 end, d.id,
     jsonb_build_object('duel', d.id, 'won', a >= b)),
    (d.to_user, 'trail_duel', 25 + case when b >= a then 25 else 0 end, d.id,
     jsonb_build_object('duel', d.id, 'won', b >= a));
end;
$$;
revoke execute on function public.resolve_trail_duel(uuid) from public, anon, authenticated;

-- Finishing a trail settles any accepted duels on it.
create or replace function public.trail_progress_resolve_duels()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare
  d uuid;
begin
  for d in
    select id from public.trail_duels
    where trail_id = new.trail_id and status = 'accepted' and new.user_id in (from_user, to_user)
  loop
    perform public.resolve_trail_duel(d);
  end loop;
  return new;
end;
$$;
create trigger trail_progress_resolve_duels after update of completed_at on public.trail_progress
  for each row when (old.completed_at is null and new.completed_at is not null)
  execute function public.trail_progress_resolve_duels();

-- Challenge a friend to a trail you've unlocked. Idempotent: an open duel between you two on this
-- trail is returned instead of a new one. Raises not_friends, unknown_trail, not_started or
-- rate_limited (10 a day).
create or replace function public.challenge_trail_duel(p_friend uuid, p_trail text)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare
  uid uuid := auth.uid();
  tid uuid;
  existing uuid;
  new_id uuid;
begin
  if uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  if p_friend is null or not public.are_friends(uid, p_friend) or public.is_blocked_between(uid, p_friend) then
    raise exception 'not_friends' using errcode = 'P0001';
  end if;
  select id into tid from public.trails where slug = p_trail and is_active;
  if tid is null then raise exception 'unknown_trail' using errcode = 'P0001'; end if;
  if not exists (select 1 from public.trail_progress where user_id = uid and trail_id = tid) then
    raise exception 'not_started' using errcode = 'P0001';
  end if;
  select id into existing from public.trail_duels
  where trail_id = tid and status in ('pending', 'accepted')
    and least(from_user, to_user) = least(uid, p_friend)
    and greatest(from_user, to_user) = greatest(uid, p_friend);
  if existing is not null then return existing; end if;
  if (select count(*) from public.trail_duels
      where from_user = uid and created_at > now() - interval '24 hours') >= 10 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  insert into public.trail_duels (trail_id, from_user, to_user) values (tid, uid, p_friend)
  returning id into new_id;
  return new_id;
end;
$$;

-- Accept or decline a duel sent to you. Accepting when you've both already finished settles it.
create or replace function public.respond_trail_duel(p_id uuid, p_accept boolean)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if auth.uid() is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  update public.trail_duels
  set status = case when p_accept then 'accepted'::public.trail_duel_status
                    else 'declined'::public.trail_duel_status end,
      responded_at = now()
  where id = p_id and to_user = auth.uid() and status = 'pending';
  if not found then raise exception 'duel_not_found' using errcode = 'P0001'; end if;
  if p_accept then perform public.resolve_trail_duel(p_id); end if;
end;
$$;

-- Your duels, newest first. While a duel is open you see how many stops your friend has solved,
-- not their score; scores show once it's settled.
create or replace function public.my_trail_duels()
returns jsonb language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce(jsonb_agg(x order by x.created_at desc), '[]'::jsonb) from (
    select d.id, d.created_at, d.status::text as status,
           t.slug as trail_slug, t.title as trail_title,
           case when d.to_user = auth.uid() then 'incoming' else 'outgoing' end as direction,
           f.id as friend_id, f.username as friend_username,
           case when d.to_user = auth.uid() then d.to_score else d.from_score end as my_score,
           case when d.to_user = auth.uid() then d.from_score else d.to_score end as friend_score,
           (select count(*) from public.trail_stop_progress sp
            where sp.user_id = f.id and sp.trail_id = d.trail_id and sp.solved_at is not null)::integer
             as friend_solved,
           (select count(*) from public.trail_stops s where s.trail_id = d.trail_id)::integer as stops
    from public.trail_duels d
    join public.trails t on t.id = d.trail_id
    join public.profiles f on f.id = case when d.to_user = auth.uid() then d.from_user else d.to_user end
    where auth.uid() in (d.from_user, d.to_user)
      and not public.is_blocked_between(d.from_user, d.to_user)
  ) x
$$;

revoke execute on function public.challenge_trail_duel(uuid, text), public.respond_trail_duel(uuid, boolean),
  public.my_trail_duels() from public, anon;
grant execute on function public.challenge_trail_duel(uuid, text), public.respond_trail_duel(uuid, boolean),
  public.my_trail_duels() to authenticated;

-- Data export now includes trail duels.
create or replace function public.export_my_data()
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  return public.export_my_core_data() || public.export_my_friends_data()
    || jsonb_build_object('last_city', (select jsonb_build_object('region', region_slug, 'seen_at', seen_at)
                                        from public.player_regions where user_id = auth.uid()))
    || jsonb_build_object('city_stamps', coalesce((select jsonb_agg(jsonb_build_object(
          'region', region_slug, 'gold', gold, 'collected_at', collected_at) order by collected_at)
        from public.city_stamps where user_id = auth.uid()), '[]'))
    -- Posts again, now with the live photo's selfie.
    || jsonb_build_object('posts', coalesce((select jsonb_agg(jsonb_build_object(
          'caption', p.caption, 'photo_path', p.photo_path, 'selfie_path', p.selfie_path,
          'status', p.status, 'created_at', p.created_at))
        from public.posts p where p.user_id = auth.uid()), '[]'))
    || jsonb_build_object('trails', coalesce((select jsonb_agg(jsonb_build_object(
          'trail', t.slug, 'started_at', tp.started_at, 'completed_at', tp.completed_at,
          'stops', coalesce((select jsonb_agg(jsonb_build_object(
              'position', sp.position, 'hints_used', sp.hints_used, 'wrong', sp.wrong,
              'solved_at', sp.solved_at, 'coins', sp.coins) order by sp.position)
            from public.trail_stop_progress sp where sp.user_id = tp.user_id and sp.trail_id = tp.trail_id), '[]'))
          order by tp.started_at)
        from public.trail_progress tp join public.trails t on t.id = tp.trail_id
        where tp.user_id = auth.uid()), '[]'))
    || jsonb_build_object('trail_duels', coalesce((select jsonb_agg(jsonb_build_object(
          'trail', t.slug, 'direction', case when d.to_user = auth.uid() then 'incoming' else 'outgoing' end,
          'status', d.status, 'created_at', d.created_at, 'resolved_at', d.resolved_at,
          'my_score', case when d.to_user = auth.uid() then d.to_score else d.from_score end)
          order by d.created_at)
        from public.trail_duels d join public.trails t on t.id = d.trail_id
        where auth.uid() in (d.from_user, d.to_user)), '[]'));
end;
$$;
