-- Three more boosts, all rewarded by the server only (packages/shared/src/boosts.ts mirrors these):
--   time_key       24 h: golden-hour and night quests pay +40 coins when discovered in their window
--   stamp_ink      one use: the next new city you collect gets a gold postmark on its stamp
--   friend_beacon  one use: light it on a friend challenge; done today, you both get +50 coins

alter type public.ledger_kind add value if not exists 'time_quest';
alter type public.ledger_kind add value if not exists 'friend_beacon';

-- ---------------------------------------------------------------------------
-- One-use boosts: held (expires_at null) until used, one at a time.
-- ---------------------------------------------------------------------------
alter table public.shop_items add column consumable boolean not null default false;
do $$
declare c text;
begin
  for c in select conname from pg_constraint
           where conrelid = 'public.shop_items'::regclass and contype = 'c'
             and pg_get_constraintdef(oid) like '%duration_minutes%'
  loop
    execute format('alter table public.shop_items drop constraint %I', c);
  end loop;
end $$;
alter table public.shop_items add constraint shop_items_boost_shape check (
  case when kind = 'boost' then (duration_minutes is not null) <> consumable
       else duration_minutes is null and not consumable end
);

-- Keep in sync with packages/shared/src/shop.ts (a unit test compares them).
insert into public.shop_items (code, name, description, kind, price, duration_minutes, color, emoji, consumable) values
  ('time_key', 'Time-of-day key · 24 h', 'Opens golden-hour and night quests: discover those places in their window for +40 coins.', 'boost', 200, 1440, null, '🗝️', false),
  ('stamp_ink', 'Gold stamp ink', 'The next new city you collect gets a rare gold postmark on its stamp.', 'boost', 250, null, null, '🖋️', true),
  ('friend_beacon', 'Friend beacon', 'Light it on a friend challenge: if it’s done today, you both get +50 coins.', 'boost', 150, null, null, '🔥', true)
on conflict (code) do update set
  name = excluded.name, description = excluded.description, kind = excluded.kind, price = excluded.price,
  duration_minutes = excluded.duration_minutes, color = excluded.color, emoji = excluded.emoji,
  consumable = excluded.consumable;

create or replace function public.buy_item(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  uid uuid := auth.uid();
  item public.shop_items;
  balance integer;
  current_expiry timestamptz;
  new_expiry timestamptz;
  timed boolean;
begin
  if uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  select * into item from public.shop_items where code = p_code and is_active;
  if not found then
    raise exception 'item_not_found' using errcode = 'P0002';
  end if;
  timed := item.kind = 'boost' and not item.consumable;
  -- Serialise purchases per user so two taps can't spend the same coins twice.
  perform 1 from public.profiles where id = uid for update;
  if not timed and exists (select 1 from public.user_inventory where user_id = uid and item_code = p_code) then
    raise exception 'already_owned' using errcode = 'P0001';
  end if;
  select coalesce(sum(points), 0) into balance from public.points_ledger where user_id = uid;
  if balance < item.price then
    raise exception 'insufficient_coins' using errcode = 'P0001';
  end if;

  insert into public.points_ledger (user_id, kind, points, xp, breakdown)
  values (uid, 'purchase', -item.price, 0, jsonb_build_object('item', item.code));

  if timed then
    select expires_at into current_expiry from public.user_inventory where user_id = uid and item_code = p_code;
    new_expiry := greatest(now(), coalesce(current_expiry, now())) + make_interval(mins => item.duration_minutes);
    insert into public.user_inventory (user_id, item_code, expires_at) values (uid, p_code, new_expiry)
    on conflict (user_id, item_code) do update set expires_at = excluded.expires_at, acquired_at = now();
  else
    insert into public.user_inventory (user_id, item_code) values (uid, p_code);
  end if;

  return jsonb_build_object('coins', balance - item.price, 'item', item.code, 'expires_at', new_expiry);
end;
$$;

-- ---------------------------------------------------------------------------
-- Time-of-day quests
-- ---------------------------------------------------------------------------
alter table public.places add column time_quest text check (time_quest in ('golden', 'night'));

-- TIME_QUESTS in packages/shared (also applied at the end of the dev seed).
update public.places p set time_quest = v.kind
from (values
  ('adraga', 'golden'), ('cruz-alta', 'golden'), ('sintra-national-palace', 'night'),
  ('lisbon-senhora-do-monte', 'golden'), ('lisbon-fado-alfama', 'night'),
  ('porto-serra-pilar', 'golden'), ('porto-dom-luis', 'night'),
  ('evora-alto-sao-bento', 'golden'), ('evora-roman-temple', 'night'),
  ('aveiro-costa-nova', 'golden'), ('aveiro-canal-piramides', 'night')
) as v(source_id, kind)
where p.source = 'seed' and p.source_id = v.source_id;

-- Mirrors timeQuestOpen(): SUNSET_MINUTES is Lisbon's mid-month sunset, local time.
create or replace function public.time_quest_open(p_kind text, p_at timestamptz default now())
returns boolean language sql stable set search_path = public, pg_temp as $$
  with t as (select p_at at time zone 'Europe/Lisbon' as l),
  s as (
    select extract(hour from l)::int * 60 + extract(minute from l)::int as m,
           (array[1055, 1090, 1120, 1210, 1240, 1265, 1265, 1240, 1195, 1145, 1040, 1035])[extract(month from l)::int] as sunset
    from t
  )
  select case p_kind
    when 'golden' then m >= sunset - 60 and m < sunset + 20
    when 'night' then m >= sunset + 60 or m < 300
    else false end
  from s
$$;
grant execute on function public.time_quest_open(text, timestamptz) to anon, authenticated;

-- Which places have a time quest. Runs as the caller, so the places policy still hides gems.
create or replace function public.time_quests()
returns table (place_id uuid, kind text) language sql stable set search_path = public, pg_temp as $$
  select id, time_quest from public.places where time_quest is not null and status = 'active'
$$;
grant execute on function public.time_quests() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- City stamps: one per city, the first time you discover a place there.
-- ---------------------------------------------------------------------------
create table public.city_stamps (
  user_id uuid not null references public.profiles (id) on delete cascade,
  region_slug text not null,
  gold boolean not null default false,
  collected_at timestamptz not null default now(),
  primary key (user_id, region_slug)
);
alter table public.city_stamps enable row level security;
create policy city_stamps_select_own on public.city_stamps for select to authenticated using (user_id = auth.uid());
revoke insert, update, delete on public.city_stamps from anon, authenticated;

-- Everyone keeps the stamps they've already earned (plain ink).
insert into public.city_stamps (user_id, region_slug, collected_at)
select v.user_id, r.slug, min(v.verified_at)
from public.visits v
join public.places p on p.id = v.place_id
join public.regions r on r.id = p.region_id
group by v.user_id, r.slug
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Friend beacon
-- ---------------------------------------------------------------------------
alter table public.friend_challenges add column beacon_date date;
alter table public.friend_challenges add column beacon_by uuid references public.profiles (id) on delete set null;

create or replace function public.light_beacon(p_challenge uuid)
returns date language plpgsql security definer set search_path = public, pg_temp as $$
declare
  uid uuid := auth.uid();
  today date := public.lisbon_today();
begin
  if uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  perform 1 from public.friend_challenges
  where id = p_challenge and uid in (from_user, to_user)
    and status in ('pending', 'accepted') and beacon_date is null
    and not public.is_blocked_between(from_user, to_user)
  for update;
  if not found then
    raise exception 'challenge_not_found' using errcode = 'P0002';
  end if;
  delete from public.user_inventory where user_id = uid and item_code = 'friend_beacon';
  if not found then
    raise exception 'no_beacon' using errcode = 'P0001';
  end if;
  update public.friend_challenges set beacon_date = today, beacon_by = uid where id = p_challenge;
  return today;
end;
$$;
revoke execute on function public.light_beacon(uuid) from public, anon;
grant execute on function public.light_beacon(uuid) to authenticated;

-- A challenge is done when its recipient discovers the place; a beacon lit today pays you both.
create or replace function public.complete_friend_challenges()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare
  c record;
begin
  for c in
    update public.friend_challenges
    set status = 'completed', completed_at = now()
    where to_user = new.user_id and place_id = new.place_id and status in ('pending', 'accepted')
    returning id, from_user, to_user, beacon_date
  loop
    if c.beacon_date = public.lisbon_today() then
      insert into public.points_ledger (user_id, kind, points, xp, visit_id, ref_id) values
        (c.to_user, 'friend_beacon', 50, 50, new.id, c.id),
        (c.from_user, 'friend_beacon', 50, 50, null, c.id);
      perform public.sync_profile_progress(c.from_user);
    end if;
  end loop;
  return new;
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
      'note', c.note, 'status', c.status, 'created_at', c.created_at,
      'beacon_date', c.beacon_date) order by c.created_at desc), '[]')
  from public.friend_challenges c
  join public.places pl on pl.id = c.place_id
  join public.profiles pr on pr.id = case when c.to_user = auth.uid() then c.from_user else c.to_user end
  where auth.uid() in (c.from_user, c.to_user)
    and not public.is_blocked_between(c.from_user, c.to_user)
    and c.created_at > now() - interval '90 days'
$$;

-- ---------------------------------------------------------------------------
-- Awarding a visit: as before, plus the time quest, the city stamp and the beacon.
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
  set_coins integer;
  time_bonus integer := 0;
  beacon_coins integer;
  v_region text;
  used_ink boolean;
  stamp jsonb;
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

  -- Time-of-day key (TIME_QUEST_BONUS).
  if pl.time_quest is not null and public.time_quest_open(pl.time_quest, now())
     and exists (select 1 from public.user_inventory
                 where user_id = uid and item_code = 'time_key' and expires_at > now()) then
    time_bonus := 40;
    insert into public.points_ledger (user_id, kind, points, xp, visit_id, breakdown)
    values (uid, 'time_quest', time_bonus, time_bonus, v_id, jsonb_build_object('quest', pl.time_quest));
  end if;

  -- Daily streak (Lisbon calendar days); streaks give XP only, never coins. The profile lock
  -- also serialises the city stamp below.
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

  -- First discovery in a city: its stamp, in gold if you hold stamp ink (used up).
  select slug into v_region from public.regions where id = pl.region_id;
  if v_region is not null
     and not exists (select 1 from public.city_stamps where user_id = uid and region_slug = v_region) then
    delete from public.user_inventory where user_id = uid and item_code = 'stamp_ink' returning true into used_ink;
    insert into public.city_stamps (user_id, region_slug, gold) values (uid, v_region, coalesce(used_ink, false));
    stamp := jsonb_build_object('region', v_region, 'gold', coalesce(used_ink, false));
  end if;

  -- Paid by the visits trigger when this completes a beaconed friend challenge.
  select coalesce(sum(points), 0) into beacon_coins from public.points_ledger
  where user_id = uid and visit_id = v_id and kind = 'friend_beacon';

  set_coins := public.award_collection_bonuses(uid, v_id);
  new_badges := public.award_badges(uid);
  select * into prof from public.profiles where id = uid;

  return jsonb_build_object(
    'status', 'verified',
    'visit_id', v_id,
    'coins', coins + first_bonus + set_coins + time_bonus + beacon_coins,
    'breakdown', jsonb_build_object('base', pl.base_points, 'multiplier', round(mult, 3),
                                    'first_discoverer', first_bonus, 'sets', set_coins,
                                    'time_quest', time_bonus, 'beacon', beacon_coins),
    'stamp', stamp,
    'xp', prof.xp,
    'level', prof.level,
    'streak', prof.streak_days,
    'new_badges', to_jsonb(new_badges)
  );
end;
$$;
revoke execute on function public.award_visit(uuid, uuid, double precision, double precision, real, integer, text[]) from public, anon, authenticated;

-- The data export includes your city stamps.
create or replace function public.export_my_data()
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  return public.export_my_core_data() || public.export_my_friends_data()
    || jsonb_build_object('last_city', (select jsonb_build_object('region', region_slug, 'seen_at', seen_at)
                                        from public.player_regions where user_id = auth.uid()))
    || jsonb_build_object('city_stamps', coalesce((select jsonb_agg(jsonb_build_object(
          'region', region_slug, 'gold', gold, 'collected_at', collected_at) order by collected_at)
        from public.city_stamps where user_id = auth.uid()), '[]'));
end;
$$;
