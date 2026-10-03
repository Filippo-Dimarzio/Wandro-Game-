-- Friends: mutual friend requests, and challenging a friend to a place with a short idea.
-- Follows stay as they are (one-way, for the feed). Demo mirror: apps/mobile/src/demo/friends.ts.

create type public.friend_status as enum ('pending', 'accepted');

-- One row per pair, stored with the smaller id first so a pair can't exist twice.
create table public.friendships (
  user_a uuid not null references public.profiles (id) on delete cascade,
  user_b uuid not null references public.profiles (id) on delete cascade,
  requested_by uuid not null references public.profiles (id) on delete cascade,
  status public.friend_status not null default 'pending',
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  primary key (user_a, user_b),
  check (user_a < user_b),
  check (requested_by in (user_a, user_b))
);
create index friendships_user_b_idx on public.friendships (user_b);

create type public.friend_challenge_status as enum ('pending', 'accepted', 'declined', 'completed');

create table public.friend_challenges (
  id uuid primary key default gen_random_uuid(),
  from_user uuid not null references public.profiles (id) on delete cascade,
  to_user uuid not null references public.profiles (id) on delete cascade,
  place_id uuid not null references public.places (id) on delete cascade,
  -- FRIEND_NOTE_MAX in packages/shared.
  note text check (char_length(note) <= 280),
  status public.friend_challenge_status not null default 'pending',
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  completed_at timestamptz,
  check (from_user <> to_user)
);
create index friend_challenges_to_idx on public.friend_challenges (to_user, status);
create index friend_challenges_from_idx on public.friend_challenges (from_user, created_at);

alter table public.friendships enable row level security;
alter table public.friend_challenges enable row level security;
create policy friendships_select_own on public.friendships for select to authenticated
  using (auth.uid() in (user_a, user_b));
create policy friend_challenges_select_own on public.friend_challenges for select to authenticated
  using (auth.uid() in (from_user, to_user));
-- Every write goes through the functions below.
revoke insert, update, delete on public.friendships, public.friend_challenges from anon, authenticated;

create or replace function public.are_friends(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.friendships
                 where user_a = least(a, b) and user_b = greatest(a, b) and status = 'accepted')
$$;

-- Friends see each other's activity, private profile or not.
create or replace function public.can_see_user(viewer uuid, owner uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select viewer = owner
    or (not public.is_blocked_between(viewer, owner)
        and (not coalesce((select is_private from public.profiles where id = owner), true)
             or exists (select 1 from public.follows
                        where follower_id = viewer and followee_id = owner and status = 'accepted')
             or public.are_friends(viewer, owner)))
$$;

-- ---------------------------------------------------------------------------
-- Friend requests
-- ---------------------------------------------------------------------------

-- Returns 'pending', or 'accepted' when they had already asked you (or you were friends).
create or replace function public.send_friend_request(p_user uuid)
returns text language plpgsql security definer set search_path = public, pg_temp as $$
declare
  uid uuid := auth.uid();
  f public.friendships;
begin
  if uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if p_user is null or p_user = uid then
    raise exception 'cannot_friend_self' using errcode = 'P0001';
  end if;
  if not exists (select 1 from public.profiles where id = p_user) then
    raise exception 'user_not_found' using errcode = 'P0002';
  end if;
  if public.is_blocked_between(uid, p_user) then
    raise exception 'blocked' using errcode = '42501';
  end if;

  select * into f from public.friendships
  where user_a = least(uid, p_user) and user_b = greatest(uid, p_user) for update;
  if found then
    if f.status = 'accepted' then
      return 'accepted';
    end if;
    if f.requested_by = p_user then
      update public.friendships set status = 'accepted', accepted_at = now()
      where user_a = f.user_a and user_b = f.user_b;
      return 'accepted';
    end if;
    return 'pending';
  end if;

  if (select count(*) from public.friendships
      where requested_by = uid and created_at > now() - interval '24 hours') >= 50 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  insert into public.friendships (user_a, user_b, requested_by)
  values (least(uid, p_user), greatest(uid, p_user), uid);
  return 'pending';
end;
$$;

create or replace function public.respond_friend_request(p_user uuid, p_accept boolean)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if not exists (select 1 from public.friendships
                 where user_a = least(uid, p_user) and user_b = greatest(uid, p_user)
                   and status = 'pending' and requested_by = p_user) then
    raise exception 'request_not_found' using errcode = 'P0002';
  end if;
  if p_accept then
    update public.friendships set status = 'accepted', accepted_at = now()
    where user_a = least(uid, p_user) and user_b = greatest(uid, p_user);
  else
    delete from public.friendships where user_a = least(uid, p_user) and user_b = greatest(uid, p_user);
  end if;
end;
$$;

-- Unfriend, or cancel a request you sent. Open challenges between the two are declined.
create or replace function public.remove_friend(p_user uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  delete from public.friendships where user_a = least(uid, p_user) and user_b = greatest(uid, p_user);
  update public.friend_challenges set status = 'declined', responded_at = now()
  where status = 'pending'
    and ((from_user = uid and to_user = p_user) or (from_user = p_user and to_user = uid));
end;
$$;

create or replace function public.my_friends()
returns jsonb language sql stable security definer set search_path = public, pg_temp as $$
  with mine as (
    select case when f.user_a = auth.uid() then f.user_b else f.user_a end as other, f.*
    from public.friendships f
    where auth.uid() in (f.user_a, f.user_b)
  ), rows as (
    select m.*, p.username::text as username, p.level, p.home_city, p.equipped_skin, p.equipped_hat
    from mine m join public.profiles p on p.id = m.other
    where not public.is_blocked_between(auth.uid(), m.other)
  )
  select jsonb_build_object(
    'friends', coalesce((select jsonb_agg(jsonb_build_object(
        'id', other, 'username', username, 'level', level, 'home_city', home_city,
        'skin', equipped_skin, 'hat', equipped_hat, 'since', accepted_at) order by username)
      from rows where status = 'accepted'), '[]'),
    'incoming', coalesce((select jsonb_agg(jsonb_build_object(
        'id', other, 'username', username, 'level', level, 'home_city', home_city, 'at', created_at)
        order by created_at desc)
      from rows where status = 'pending' and requested_by <> auth.uid()), '[]'),
    'outgoing', coalesce((select jsonb_agg(jsonb_build_object(
        'id', other, 'username', username, 'level', level, 'home_city', home_city, 'at', created_at)
        order by created_at desc)
      from rows where status = 'pending' and requested_by = auth.uid()), '[]'))
$$;

-- Your relation to one player, for their profile page.
create or replace function public.friendship_with(p_user uuid)
returns text language sql stable security definer set search_path = public, pg_temp as $$
  select case
    when f.status = 'accepted' then 'friends'
    when f.requested_by = auth.uid() then 'outgoing'
    when f.status = 'pending' then 'incoming'
  end
  from public.friendships f
  where f.user_a = least(auth.uid(), p_user) and f.user_b = greatest(auth.uid(), p_user)
$$;

-- ---------------------------------------------------------------------------
-- Friend challenges: "go and find this place" with a short note
-- ---------------------------------------------------------------------------
create or replace function public.challenge_friend(p_friend uuid, p_place uuid, p_note text default null)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare
  uid uuid := auth.uid();
  note text := nullif(btrim(p_note), '');
  existing uuid;
  new_id uuid;
begin
  if uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if not public.are_friends(uid, p_friend) or public.is_blocked_between(uid, p_friend) then
    raise exception 'not_friends' using errcode = '42501';
  end if;
  -- Hidden gems can't be shared: that would hand over their location.
  if not exists (select 1 from public.places where id = p_place and status = 'active' and not is_hidden) then
    raise exception 'place_not_active' using errcode = 'P0001';
  end if;
  if char_length(note) > 280 then
    raise exception 'note_too_long' using errcode = '22001';
  end if;
  if exists (select 1 from public.visits where user_id = p_friend and place_id = p_place) then
    raise exception 'already_discovered' using errcode = 'P0001';
  end if;

  -- Idempotent: the same open challenge isn't sent twice.
  select id into existing from public.friend_challenges
  where from_user = uid and to_user = p_friend and place_id = p_place and status in ('pending', 'accepted');
  if existing is not null then
    return existing;
  end if;
  if (select count(*) from public.friend_challenges
      where from_user = uid and created_at > now() - interval '24 hours') >= 20 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;

  insert into public.friend_challenges (from_user, to_user, place_id, note)
  values (uid, p_friend, p_place, note)
  returning id into new_id;
  return new_id;
end;
$$;

create or replace function public.respond_friend_challenge(p_id uuid, p_accept boolean)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  update public.friend_challenges
  set status = case when p_accept then 'accepted'::public.friend_challenge_status
                    else 'declined'::public.friend_challenge_status end,
      responded_at = now()
  where id = p_id and to_user = auth.uid() and status = 'pending';
  if not found then
    raise exception 'challenge_not_found' using errcode = 'P0002';
  end if;
end;
$$;

create or replace function public.my_friend_challenges()
returns jsonb language sql stable security definer set search_path = public, extensions, pg_temp as $$
  select coalesce(jsonb_agg(jsonb_build_object(
      'id', c.id,
      'direction', case when c.to_user = auth.uid() then 'incoming' else 'outgoing' end,
      'friend_id', case when c.to_user = auth.uid() then c.from_user else c.to_user end,
      'friend_username', pr.username,
      'place_id', c.place_id, 'place_name', pl.name, 'category', pl.category,
      'lat', extensions.st_y(pl.location::extensions.geometry),
      'lng', extensions.st_x(pl.location::extensions.geometry),
      'note', c.note, 'status', c.status, 'created_at', c.created_at) order by c.created_at desc), '[]')
  from public.friend_challenges c
  join public.places pl on pl.id = c.place_id
  join public.profiles pr on pr.id = case when c.to_user = auth.uid() then c.from_user else c.to_user end
  where auth.uid() in (c.from_user, c.to_user)
    and not public.is_blocked_between(c.from_user, c.to_user)
    and c.created_at > now() - interval '90 days'
$$;

-- A challenge is done when its recipient discovers the place (visits are server-written).
create or replace function public.complete_friend_challenges()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  update public.friend_challenges
  set status = 'completed', completed_at = now()
  where to_user = new.user_id and place_id = new.place_id and status in ('pending', 'accepted');
  return new;
end;
$$;
create trigger visits_complete_friend_challenges after insert on public.visits
  for each row execute function public.complete_friend_challenges();

-- ---------------------------------------------------------------------------
-- Blocking, reporting, the friends leaderboard and data export
-- ---------------------------------------------------------------------------
create or replace function public.blocks_cleanup()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  delete from public.follows
  where (follower_id = new.blocker_id and followee_id = new.blocked_id)
     or (follower_id = new.blocked_id and followee_id = new.blocker_id);
  delete from public.friendships
  where user_a = least(new.blocker_id, new.blocked_id) and user_b = greatest(new.blocker_id, new.blocked_id);
  update public.friend_challenges set status = 'declined', responded_at = now()
  where status = 'pending'
    and ((from_user = new.blocker_id and to_user = new.blocked_id)
      or (from_user = new.blocked_id and to_user = new.blocker_id));
  return new;
end;
$$;

-- Challenge notes are user-written, so they can be reported and removed.
alter type public.report_target add value if not exists 'friend_challenge';

create or replace function public.resolve_report(p_report_id uuid, p_remove_content boolean)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare
  r public.reports;
begin
  if not public.is_moderator() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  select * into r from public.reports where id = p_report_id for update;
  if not found then
    raise exception 'report_not_found' using errcode = 'P0002';
  end if;
  if p_remove_content and r.target_type = 'post' then
    update public.posts set status = 'removed' where id = r.target_id;
  end if;
  if p_remove_content and r.target_type::text = 'friend_challenge' then
    update public.friend_challenges set note = null where id = r.target_id;
  end if;
  -- Close every open report about the same target.
  update public.reports
  set status = case when p_remove_content then 'resolved'::public.report_status else 'dismissed'::public.report_status end,
      reviewer_id = auth.uid(), resolved_at = now()
  where target_type = r.target_type and target_id = r.target_id and status = 'open';
end;
$$;

-- Same as before; the friends board now also includes accepted friends.
create or replace function public.leaderboard(p_scope text default 'global', p_region text default 'sintra')
returns table (rank bigint, user_id uuid, username text, level integer, coins bigint, is_me boolean)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with scored as (
    select l.user_id, sum(l.points)::bigint as coins
    from public.points_ledger l
    left join public.visits v on v.id = l.visit_id
    left join public.places pl on pl.id = v.place_id
    left join public.regions rg on rg.id = pl.region_id
    where l.points > 0
      and (p_scope <> 'weekly' or l.created_at > now() - interval '7 days')
      and (p_scope <> 'region' or rg.slug = p_region)
    group by l.user_id
  ), visible as (
    select s.*, p.username::text as username, p.level
    from scored s join public.profiles p on p.id = s.user_id
    where not public.is_blocked_between(auth.uid(), s.user_id)
      and (s.user_id = auth.uid()
           or (p_scope = 'friends' and (public.are_friends(auth.uid(), s.user_id)
               or exists (select 1 from public.follows f
                          where f.follower_id = auth.uid() and f.followee_id = s.user_id and f.status = 'accepted')))
           or (p_scope <> 'friends' and not p.is_private))
  )
  select rank() over (order by coins desc), user_id, username, level, coins, user_id = auth.uid()
  from visible
  order by coins desc, username
  limit 100;
$$;

-- GDPR export: everything before, plus friends and friend challenges.
create or replace function public.export_my_friends_data()
returns jsonb language sql stable security definer set search_path = public, pg_temp as $$
  select jsonb_build_object(
    'friends', coalesce((select jsonb_agg(jsonb_build_object(
        'username', p.username, 'status', f.status,
        'requested_by_me', f.requested_by = auth.uid(), 'since', coalesce(f.accepted_at, f.created_at)))
      from public.friendships f
      join public.profiles p on p.id = case when f.user_a = auth.uid() then f.user_b else f.user_a end
      where auth.uid() in (f.user_a, f.user_b)), '[]'),
    'friend_challenges', coalesce((select jsonb_agg(jsonb_build_object(
        'direction', case when c.to_user = auth.uid() then 'incoming' else 'outgoing' end,
        'place', pl.name, 'note', c.note, 'status', c.status, 'created_at', c.created_at))
      from public.friend_challenges c join public.places pl on pl.id = c.place_id
      where auth.uid() in (c.from_user, c.to_user)), '[]'),
    'hidden_gems_revealed', coalesce((select jsonb_agg(jsonb_build_object(
        'place', pl.name, 'revealed_at', r.revealed_at))
      from public.hidden_reveals r join public.places pl on pl.id = r.place_id
      where r.user_id = auth.uid()), '[]'))
$$;

alter function public.export_my_data() rename to export_my_core_data;
create or replace function public.export_my_data()
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  return public.export_my_core_data() || public.export_my_friends_data();
end;
$$;

revoke execute on function public.export_my_core_data() from public, anon, authenticated;
revoke execute on function public.export_my_friends_data() from public, anon, authenticated;
revoke execute on function public.export_my_data() from public, anon;
grant execute on function public.export_my_data() to authenticated;

revoke execute on function public.send_friend_request(uuid) from public, anon;
revoke execute on function public.respond_friend_request(uuid, boolean) from public, anon;
revoke execute on function public.remove_friend(uuid) from public, anon;
revoke execute on function public.my_friends() from public, anon;
revoke execute on function public.friendship_with(uuid) from public, anon;
revoke execute on function public.challenge_friend(uuid, uuid, text) from public, anon;
revoke execute on function public.respond_friend_challenge(uuid, boolean) from public, anon;
revoke execute on function public.my_friend_challenges() from public, anon;
grant execute on function public.send_friend_request(uuid) to authenticated;
grant execute on function public.respond_friend_request(uuid, boolean) to authenticated;
grant execute on function public.remove_friend(uuid) to authenticated;
grant execute on function public.my_friends() to authenticated;
grant execute on function public.friendship_with(uuid) to authenticated;
grant execute on function public.challenge_friend(uuid, uuid, text) to authenticated;
grant execute on function public.respond_friend_challenge(uuid, boolean) to authenticated;
grant execute on function public.my_friend_challenges() to authenticated;
