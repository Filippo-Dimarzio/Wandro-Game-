-- Daily moments: a post is visible to other people for 24 hours, and you only see theirs once you
-- have posted a discovery yourself in the last 24 hours. Your own posts never expire for you:
-- they stay in your passport (my_passport). Mirrors MOMENT_VISIBLE_HOURS in packages/shared.
--
-- Sets: each place discovered from a collection pays 20 coins, finishing the set pays 50
-- (COLLECTION_STEP_BONUS / COLLECTION_COMPLETION_BONUS).

-- ---------------------------------------------------------------------------
-- Daily moments
-- ---------------------------------------------------------------------------
create index if not exists posts_user_recent_idx on public.posts (user_id, created_at desc) where status = 'visible';

-- Security definer so the posts policy can ask without recursing into itself.
create or replace function public.posted_recently(uid uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.posts
                 where user_id = uid and status = 'visible' and created_at > now() - interval '24 hours')
$$;
revoke execute on function public.posted_recently(uuid) from public, anon;
grant execute on function public.posted_recently(uuid) to authenticated;

drop policy posts_select on public.posts;
create policy posts_select on public.posts for select to authenticated
  using (user_id = auth.uid() or public.is_moderator()
         or (status = 'visible'
             and created_at > now() - interval '24 hours'
             and public.can_see_user(auth.uid(), user_id)
             and public.posted_recently(auth.uid())));

-- Same feed, now only today's moments (RLS above enforces it too).
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
    and p.created_at > now() - interval '24 hours'
    and (p.user_id = auth.uid()
         or (public.posted_recently(auth.uid())
             and (exists (select 1 from public.follows f
                          where f.follower_id = auth.uid() and f.followee_id = p.user_id and f.status = 'accepted')
                  or public.are_friends(auth.uid(), p.user_id))))
    and (p_before is null or p.created_at < p_before)
  order by p.created_at desc
  limit least(greatest(p_limit, 1), 50);
$$;

-- Whether today's moments are unlocked, and when your latest one stops being visible to others.
create or replace function public.moment_status()
returns jsonb language sql stable security definer set search_path = public, pg_temp as $$
  select jsonb_build_object(
    'unlocked', public.posted_recently(auth.uid()),
    'expires_at', (select max(created_at) + interval '24 hours' from public.posts
                   where user_id = auth.uid() and status = 'visible' and created_at > now() - interval '24 hours'))
$$;

-- Your own posts, forever (only to you): the passport of everything you've discovered and shared.
create or replace function public.my_passport()
returns table (
  post_id uuid, place_id uuid, place_name text, category public.place_category, region_slug text,
  caption text, photo_path text, created_at timestamptz
)
language sql stable security definer set search_path = public, pg_temp as $$
  select p.id, p.place_id, pl.name, pl.category, r.slug, p.caption, p.photo_path, p.created_at
  from public.posts p
  join public.places pl on pl.id = p.place_id
  left join public.regions r on r.id = pl.region_id
  where p.user_id = auth.uid() and p.status <> 'removed'
  order by p.created_at desc;
$$;

-- Photos follow the posts policy: the author always, others only while the post is visible to them.
do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'storage') then
    execute 'drop policy if exists "post photos: read if you can see the author" on storage.objects';
    execute $p$create policy "post photos: read own or visible moments" on storage.objects for select to authenticated
      using (bucket_id = 'post-photos'
             and ((storage.foldername(name))[1] = auth.uid()::text
                  or exists (select 1 from public.posts p where p.photo_path = name)))$p$;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Set rewards: 20 coins per place from a set, 50 for finishing it
-- ---------------------------------------------------------------------------
alter table public.collections alter column completion_bonus set default 50;
update public.collections set completion_bonus = 50 where completion_bonus = 200;
alter table public.collections add column step_bonus integer not null default 20 check (step_bonus >= 0);

-- Pays the step bonus for each set this visit's place belongs to, then any completed sets.
-- Returns the coins paid so the check-in result can show them.
drop function public.award_collection_bonuses(uuid);
create function public.award_collection_bonuses(uid uuid, p_visit uuid)
returns integer language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v public.visits;
  c public.collections;
  paid integer := 0;
begin
  select * into v from public.visits where id = p_visit and user_id = uid;
  for c in
    select col.* from public.collections col
    join public.collection_places cp on cp.collection_id = col.id and cp.place_id = v.place_id
    where col.is_active and col.step_bonus > 0
      and not exists (select 1 from public.points_ledger l
                      where l.user_id = uid and l.kind = 'collection' and l.ref_id = col.id and l.visit_id = v.id)
  loop
    insert into public.points_ledger (user_id, kind, points, xp, visit_id, ref_id, breakdown)
    values (uid, 'collection', c.step_bonus, c.step_bonus, v.id, c.id, jsonb_build_object('collection', c.slug, 'step', true));
    paid := paid + c.step_bonus;
  end loop;

  for c in
    select col.* from public.collections col
    where col.is_active
      and not exists (select 1 from public.user_collection_rewards r where r.user_id = uid and r.collection_id = col.id)
      and exists (select 1 from public.collection_places cp where cp.collection_id = col.id)
      and not exists (
        select 1 from public.collection_places cp
        where cp.collection_id = col.id
          and not exists (select 1 from public.visits x where x.user_id = uid and x.place_id = cp.place_id))
  loop
    insert into public.user_collection_rewards (user_id, collection_id) values (uid, c.id);
    insert into public.points_ledger (user_id, kind, points, xp, ref_id, breakdown)
    values (uid, 'collection', c.completion_bonus, c.completion_bonus, c.id, jsonb_build_object('collection', c.slug));
    paid := paid + c.completion_bonus;
  end loop;
  return paid;
end;
$$;
revoke execute on function public.award_collection_bonuses(uuid, uuid) from public, anon, authenticated;

-- Same as before, plus the set coins in the result.
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
  set_coins integer;
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

  set_coins := public.award_collection_bonuses(uid, v_id);
  new_badges := public.award_badges(uid);
  select * into prof from public.profiles where id = uid;

  return jsonb_build_object(
    'status', 'verified',
    'visit_id', v_id,
    'coins', coins + first_bonus + set_coins,
    'breakdown', jsonb_build_object('base', pl.base_points, 'multiplier', round(mult, 3),
                                    'first_discoverer', first_bonus, 'sets', set_coins),
    'xp', prof.xp,
    'level', prof.level,
    'streak', prof.streak_days,
    'new_badges', to_jsonb(new_badges)
  );
end;
$$;
revoke execute on function public.award_visit(uuid, uuid, double precision, double precision, real, integer, text[]) from public, anon, authenticated;

-- Adds the step bonus, the city, and the places' names and categories (sets in other cities
-- aren't loaded on the map, so the app can't look them up).
drop function public.my_collections();
create function public.my_collections()
returns table (id uuid, slug text, title text, description text, cover_url text, completion_bonus integer,
               total bigint, done bigint, completed boolean, place_ids uuid[], step_bonus integer,
               region_slug text, places jsonb)
language sql stable security definer set search_path = public, pg_temp as $$
  select c.id, c.slug, c.title, c.description, c.cover_url, c.completion_bonus,
         count(cp.place_id),
         count(v.id),
         exists (select 1 from public.user_collection_rewards r where r.user_id = auth.uid() and r.collection_id = c.id),
         array_agg(cp.place_id order by cp.position),
         c.step_bonus,
         rg.slug,
         jsonb_agg(jsonb_build_object('id', pl.id, 'name', pl.name, 'category', pl.category, 'found', v.id is not null)
                   order by cp.position)
  from public.collections c
  join public.collection_places cp on cp.collection_id = c.id
  join public.places pl on pl.id = cp.place_id
  left join public.regions rg on rg.id = c.region_id
  left join public.visits v on v.place_id = cp.place_id and v.user_id = auth.uid()
  where c.is_active
  group by c.id, rg.slug
  order by c.title;
$$;

revoke execute on function public.moment_status() from public, anon;
revoke execute on function public.my_passport() from public, anon;
revoke execute on function public.my_collections() from public, anon;
grant execute on function public.moment_status() to authenticated;
grant execute on function public.my_passport() to authenticated;
grant execute on function public.my_collections() to authenticated;
