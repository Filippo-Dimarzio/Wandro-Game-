-- Phase 4: follows, blocks, photo posts, likes, reports, leaderboards, collections and moderation.

-- ---------------------------------------------------------------------------
-- Follows and blocks
-- ---------------------------------------------------------------------------
create type public.follow_status as enum ('pending', 'accepted');

create table public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  followee_id uuid not null references public.profiles (id) on delete cascade,
  status public.follow_status not null default 'accepted',
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);
create index follows_followee_idx on public.follows (followee_id, status);

create table public.blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create or replace function public.is_blocked_between(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.blocks
                 where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a))
$$;

-- Can `viewer` see `owner`'s activity? Self always; never when blocked; private needs an accepted follow.
create or replace function public.can_see_user(viewer uuid, owner uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select viewer = owner
    or (not public.is_blocked_between(viewer, owner)
        and (not coalesce((select is_private from public.profiles where id = owner), true)
             or exists (select 1 from public.follows
                        where follower_id = viewer and followee_id = owner and status = 'accepted')))
$$;

-- Private profiles get follow requests; public ones are followed straight away.
create or replace function public.follows_set_status()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if public.is_blocked_between(new.follower_id, new.followee_id) then
    raise exception 'blocked' using errcode = '42501';
  end if;
  new.status := case when (select is_private from public.profiles where id = new.followee_id)
                     then 'pending'::public.follow_status else 'accepted'::public.follow_status end;
  return new;
end;
$$;
create trigger follows_status before insert on public.follows
  for each row execute function public.follows_set_status();

-- Blocking removes follows in both directions.
create or replace function public.blocks_cleanup()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  delete from public.follows
  where (follower_id = new.blocker_id and followee_id = new.blocked_id)
     or (follower_id = new.blocked_id and followee_id = new.blocker_id);
  return new;
end;
$$;
create trigger blocks_cleanup after insert on public.blocks
  for each row execute function public.blocks_cleanup();

alter table public.follows enable row level security;
alter table public.blocks enable row level security;

create policy follows_select on public.follows for select to authenticated
  using (follower_id = auth.uid() or followee_id = auth.uid()
         or (status = 'accepted' and not public.is_blocked_between(auth.uid(), followee_id)
             and not public.is_blocked_between(auth.uid(), follower_id)));
create policy follows_insert on public.follows for insert to authenticated
  with check (follower_id = auth.uid());
create policy follows_delete on public.follows for delete to authenticated
  using (follower_id = auth.uid() or followee_id = auth.uid());
revoke update on public.follows from anon, authenticated;

create policy blocks_select_own on public.blocks for select to authenticated using (blocker_id = auth.uid());
create policy blocks_insert_own on public.blocks for insert to authenticated with check (blocker_id = auth.uid());
create policy blocks_delete_own on public.blocks for delete to authenticated using (blocker_id = auth.uid());

create or replace function public.respond_follow_request(p_follower uuid, p_accept boolean)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if p_accept then
    update public.follows set status = 'accepted'
    where follower_id = p_follower and followee_id = auth.uid() and status = 'pending';
  else
    delete from public.follows where follower_id = p_follower and followee_id = auth.uid();
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Posts and likes
-- ---------------------------------------------------------------------------
create type public.content_status as enum ('visible', 'hidden', 'removed');

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  visit_id uuid not null unique references public.visits (id) on delete cascade,
  place_id uuid not null references public.places (id) on delete cascade,
  caption text check (char_length(caption) <= 500),
  -- Storage path in the post-photos bucket; EXIF/GPS is stripped by the app before upload.
  photo_path text,
  status public.content_status not null default 'visible',
  created_at timestamptz not null default now()
);
create index posts_user_idx on public.posts (user_id, created_at desc);
create index posts_created_idx on public.posts (created_at desc);

create table public.likes (
  user_id uuid not null references public.profiles (id) on delete cascade,
  post_id uuid not null references public.posts (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

alter table public.posts enable row level security;
alter table public.likes enable row level security;

create policy posts_select on public.posts for select to authenticated
  using (user_id = auth.uid() or public.is_moderator()
         or (status = 'visible' and public.can_see_user(auth.uid(), user_id)));
-- A post can only exist for your own verified visit to that place.
create policy posts_insert on public.posts for insert to authenticated
  with check (user_id = auth.uid() and status = 'visible'
              and exists (select 1 from public.visits v
                          where v.id = visit_id and v.user_id = auth.uid() and v.place_id = posts.place_id));
create policy posts_delete_own on public.posts for delete to authenticated using (user_id = auth.uid());
revoke update on public.posts from anon, authenticated;
grant update (caption) on public.posts to authenticated;
create policy posts_update_own on public.posts for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy likes_select on public.likes for select to authenticated
  using (exists (select 1 from public.posts p where p.id = post_id));
create policy likes_insert on public.likes for insert to authenticated
  with check (user_id = auth.uid() and exists (select 1 from public.posts p where p.id = post_id));
create policy likes_delete_own on public.likes for delete to authenticated using (user_id = auth.uid());

-- Feed: my posts and posts from people I follow, newest first (RLS still applies).
create or replace function public.feed(p_before timestamptz default null, p_limit integer default 20)
returns table (
  post_id uuid, user_id uuid, username text, place_id uuid, place_name text,
  category public.place_category, caption text, photo_path text, created_at timestamptz,
  like_count bigint, liked_by_me boolean
)
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select p.id, p.user_id, pr.username::text, p.place_id, pl.name, pl.category, p.caption, p.photo_path, p.created_at,
         (select count(*) from public.likes l where l.post_id = p.id),
         exists (select 1 from public.likes l where l.post_id = p.id and l.user_id = auth.uid())
  from public.posts p
  join public.profiles pr on pr.id = p.user_id
  join public.places pl on pl.id = p.place_id
  where p.status = 'visible'
    and (p.user_id = auth.uid()
         or exists (select 1 from public.follows f
                    where f.follower_id = auth.uid() and f.followee_id = p.user_id and f.status = 'accepted'))
    and (p_before is null or p.created_at < p_before)
  order by p.created_at desc
  limit least(greatest(p_limit, 1), 50);
$$;

create or replace function public.search_profiles(q text)
returns table (id uuid, username text, display_name text, avatar_url text, is_private boolean)
language sql stable security definer set search_path = public, pg_temp as $$
  select p.id, p.username::text, p.display_name, p.avatar_url, p.is_private
  from public.profiles p
  where p.username ilike '%' || replace(replace(q, '%', ''), '_', '\_') || '%'
    and p.id <> auth.uid()
    and not public.is_blocked_between(auth.uid(), p.id)
  order by length(p.username), p.username
  limit 20;
$$;

-- Public profile card with counts the viewer is allowed to see.
create or replace function public.profile_card(p_user uuid)
returns jsonb language sql stable security definer set search_path = public, pg_temp as $$
  select jsonb_build_object(
    'id', p.id, 'username', p.username, 'display_name', p.display_name, 'avatar_url', p.avatar_url,
    'home_city', p.home_city, 'is_private', p.is_private, 'level', p.level,
    'followers', (select count(*) from public.follows where followee_id = p.id and status = 'accepted'),
    'following', (select count(*) from public.follows where follower_id = p.id and status = 'accepted'),
    'follow_status', (select status from public.follows where follower_id = auth.uid() and followee_id = p.id),
    'can_see', public.can_see_user(auth.uid(), p.id),
    'discoveries', case when public.can_see_user(auth.uid(), p.id)
                        then (select count(*) from public.visits where user_id = p.id) end
  )
  from public.profiles p
  where p.id = p_user and not public.is_blocked_between(auth.uid(), p_user);
$$;

-- ---------------------------------------------------------------------------
-- Reports and moderation
-- ---------------------------------------------------------------------------
create type public.report_target as enum ('post', 'profile', 'submission');
create type public.report_status as enum ('open', 'resolved', 'dismissed');

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  target_type public.report_target not null,
  target_id uuid not null,
  reason text not null check (char_length(reason) between 2 and 500),
  status public.report_status not null default 'open',
  reviewer_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  unique (reporter_id, target_type, target_id)
);

alter table public.reports enable row level security;
create policy reports_insert_own on public.reports for insert to authenticated
  with check (reporter_id = auth.uid() and status = 'open' and reviewer_id is null);
create policy reports_select on public.reports for select to authenticated
  using (reporter_id = auth.uid() or public.is_moderator());
revoke update, delete on public.reports from anon, authenticated;

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
  -- Close every open report about the same target.
  update public.reports
  set status = case when p_remove_content then 'resolved'::public.report_status else 'dismissed'::public.report_status end,
      reviewer_id = auth.uid(), resolved_at = now()
  where target_type = r.target_type and target_id = r.target_id and status = 'open';
end;
$$;

create or replace function public.moderation_queue()
returns jsonb language plpgsql stable security definer set search_path = public, extensions, pg_temp as $$
begin
  if not public.is_moderator() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'submissions', coalesce((select jsonb_agg(jsonb_build_object(
        'id', s.id, 'name', s.name, 'description', s.description, 'category', s.category,
        'lat', extensions.st_y(s.location::extensions.geometry), 'lng', extensions.st_x(s.location::extensions.geometry),
        'username', p.username, 'created_at', s.created_at) order by s.created_at)
      from public.place_submissions s join public.profiles p on p.id = s.user_id where s.status = 'pending'), '[]'),
    'reports', coalesce((select jsonb_agg(jsonb_build_object(
        'id', r.id, 'target_type', r.target_type, 'target_id', r.target_id, 'reason', r.reason,
        'created_at', r.created_at) order by r.created_at)
      from public.reports r where r.status = 'open'), '[]'),
    'flagged_checkins', coalesce((select jsonb_agg(jsonb_build_object(
        'id', c.id, 'username', p.username, 'place', pl.name, 'reason', c.reason, 'completed_at', c.completed_at)
        order by c.completed_at)
      from public.checkin_sessions c join public.profiles p on p.id = c.user_id
      join public.places pl on pl.id = c.place_id where c.status = 'flagged'), '[]')
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Leaderboards: ranked by coins earned (spending never lowers your rank)
-- ---------------------------------------------------------------------------
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
           or (p_scope = 'friends' and exists (select 1 from public.follows f
               where f.follower_id = auth.uid() and f.followee_id = s.user_id and f.status = 'accepted'))
           or (p_scope <> 'friends' and not p.is_private))
  )
  select rank() over (order by coins desc), user_id, username, level, coins, user_id = auth.uid()
  from visible
  order by coins desc, username
  limit 100;
$$;

-- ---------------------------------------------------------------------------
-- Collections
-- ---------------------------------------------------------------------------
create table public.collections (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null default '',
  cover_url text,
  region_id uuid references public.regions (id),
  completion_bonus integer not null default 200 check (completion_bonus >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.collection_places (
  collection_id uuid not null references public.collections (id) on delete cascade,
  place_id uuid not null references public.places (id) on delete cascade,
  position integer not null default 0,
  primary key (collection_id, place_id)
);

create table public.user_collection_rewards (
  user_id uuid not null references public.profiles (id) on delete cascade,
  collection_id uuid not null references public.collections (id) on delete cascade,
  awarded_at timestamptz not null default now(),
  primary key (user_id, collection_id)
);

alter table public.collections enable row level security;
alter table public.collection_places enable row level security;
alter table public.user_collection_rewards enable row level security;
create policy collections_select on public.collections for select to anon, authenticated using (is_active);
create policy collection_places_select on public.collection_places for select to anon, authenticated using (true);
create policy collection_rewards_select_own on public.user_collection_rewards for select to authenticated
  using (user_id = auth.uid());
revoke insert, update, delete on public.collections, public.collection_places, public.user_collection_rewards
  from anon, authenticated;

create or replace function public.award_collection_bonuses(uid uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare
  c public.collections;
begin
  for c in
    select col.* from public.collections col
    where col.is_active
      and not exists (select 1 from public.user_collection_rewards r where r.user_id = uid and r.collection_id = col.id)
      and exists (select 1 from public.collection_places cp where cp.collection_id = col.id)
      and not exists (
        select 1 from public.collection_places cp
        where cp.collection_id = col.id
          and not exists (select 1 from public.visits v where v.user_id = uid and v.place_id = cp.place_id))
  loop
    insert into public.user_collection_rewards (user_id, collection_id) values (uid, c.id);
    insert into public.points_ledger (user_id, kind, points, xp, ref_id, breakdown)
    values (uid, 'collection', c.completion_bonus, c.completion_bonus, c.id, jsonb_build_object('collection', c.slug));
  end loop;
end;
$$;
revoke execute on function public.award_collection_bonuses(uuid) from public, anon, authenticated;

create or replace function public.my_collections()
returns table (id uuid, slug text, title text, description text, cover_url text, completion_bonus integer,
               total bigint, done bigint, completed boolean, place_ids uuid[])
language sql stable security definer set search_path = public, pg_temp as $$
  select c.id, c.slug, c.title, c.description, c.cover_url, c.completion_bonus,
         count(cp.place_id),
         count(v.id),
         exists (select 1 from public.user_collection_rewards r where r.user_id = auth.uid() and r.collection_id = c.id),
         array_agg(cp.place_id order by cp.position)
  from public.collections c
  join public.collection_places cp on cp.collection_id = c.id
  left join public.visits v on v.place_id = cp.place_id and v.user_id = auth.uid()
  where c.is_active
  group by c.id
  order by c.title;
$$;

-- ---------------------------------------------------------------------------
-- Photo storage (Supabase only; skipped where the storage schema doesn't exist)
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'storage') then
    insert into storage.buckets (id, name, public) values ('post-photos', 'post-photos', false)
    on conflict (id) do nothing;
    execute $p$create policy "post photos: upload to own folder" on storage.objects for insert to authenticated
      with check (bucket_id = 'post-photos' and (storage.foldername(name))[1] = auth.uid()::text)$p$;
    execute $p$create policy "post photos: delete own" on storage.objects for delete to authenticated
      using (bucket_id = 'post-photos' and (storage.foldername(name))[1] = auth.uid()::text)$p$;
    execute $p$create policy "post photos: read if you can see the author" on storage.objects for select to authenticated
      using (bucket_id = 'post-photos' and public.can_see_user(auth.uid(), ((storage.foldername(name))[1])::uuid))$p$;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
revoke execute on function public.respond_follow_request(uuid, boolean) from public, anon;
revoke execute on function public.feed(timestamptz, integer) from public, anon;
revoke execute on function public.search_profiles(text) from public, anon;
revoke execute on function public.profile_card(uuid) from public, anon;
revoke execute on function public.resolve_report(uuid, boolean) from public, anon;
revoke execute on function public.moderation_queue() from public, anon;
revoke execute on function public.leaderboard(text, text) from public, anon;
revoke execute on function public.my_collections() from public, anon;
grant execute on function public.respond_follow_request(uuid, boolean) to authenticated;
grant execute on function public.feed(timestamptz, integer) to authenticated;
grant execute on function public.search_profiles(text) to authenticated;
grant execute on function public.profile_card(uuid) to authenticated;
grant execute on function public.resolve_report(uuid, boolean) to authenticated;
grant execute on function public.moderation_queue() to authenticated;
grant execute on function public.leaderboard(text, text) to authenticated;
grant execute on function public.my_collections() to authenticated;
