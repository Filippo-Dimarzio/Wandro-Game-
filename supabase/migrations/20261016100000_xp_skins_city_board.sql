-- XP, skin challenges and the city leaderboard.
--
-- XP is separate from coins: every completed challenge (a discovered place or a daily challenge)
-- gives 50 XP, nothing else gives XP. Level 2 is 250 XP (5 challenges) and each next level costs
-- twice the one before. One rule sets the XP of every reward row (ledger_xp), so existing
-- players' XP is recalculated with it. Mirrors CHALLENGE_XP / levelFromXp / ledgerXp in
-- packages/shared.

create or replace function public.ledger_xp(k public.ledger_kind)
returns integer language sql immutable as $$
  select case when k in ('visit', 'daily_challenge') then 50 else 0 end
$$;

create or replace function public.level_for_xp(xp integer)
returns integer language sql immutable as $$
  select 1 + (select count(*)::integer from generate_series(1, 40) n
              where greatest(xp, 0) >= 250 * (power(2, n)::bigint - 1))
$$;

create or replace function public.points_ledger_xp()
returns trigger language plpgsql as $$
begin
  new.xp := public.ledger_xp(new.kind);
  return new;
end;
$$;
drop trigger if exists points_ledger_xp on public.points_ledger;
create trigger points_ledger_xp before insert or update of kind, xp on public.points_ledger
  for each row execute function public.points_ledger_xp();

update public.points_ledger set xp = public.ledger_xp(kind) where xp <> public.ledger_xp(kind);
update public.profiles p
set xp = s.xp, level = public.level_for_xp(s.xp)
from (select pr.id, coalesce(sum(l.xp), 0)::integer as xp
      from public.profiles pr left join public.points_ledger l on l.user_id = pr.id
      group by pr.id) s
where p.id = s.id;

-- ---------------------------------------------------------------------------
-- Skins are earned with a challenge, then bought (ShopUnlock in packages/shared/src/shop.ts).
-- ---------------------------------------------------------------------------
alter table public.shop_items add column unlock_kind text check (unlock_kind in ('category', 'stamps'));
alter table public.shop_items add column unlock_category public.place_category;
alter table public.shop_items add column unlock_count integer check (unlock_count > 0);

-- Keep in sync with packages/shared/src/shop.ts (a unit test compares them).
update public.shop_items s
set unlock_kind = v.kind, unlock_category = v.category::public.place_category,
    unlock_count = v.count, description = v.description
from (values
  ('skin_ocean', 'category', 'coast', 3, 'Deep Atlantic blue.'),
  ('skin_coral', 'category', 'heritage', 5, 'Warm coral, like Pena Palace at sunset.'),
  ('skin_midnight', 'category', 'music_events', 2, 'For night walks and fado.'),
  ('skin_gold', 'stamps', null, 3, 'Shiny. Very shiny.')
) as v(code, kind, category, count, description)
where s.code = v.code;

create or replace function public.item_unlocked(uid uuid, item public.shop_items)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select case item.unlock_kind
    when 'category' then (select count(*) from public.visits v join public.places p on p.id = v.place_id
                          where v.user_id = uid and p.category = item.unlock_category) >= item.unlock_count
    when 'stamps' then (select count(*) from public.city_stamps where user_id = uid) >= item.unlock_count
    else true end
$$;
revoke execute on function public.item_unlocked(uuid, public.shop_items) from public, anon, authenticated;

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
  -- Some items are earned before they can be bought (UnlockStats / unlockProgress in the app).
  if not public.item_unlocked(uid, item) then
    raise exception 'challenge_not_done' using errcode = 'P0001';
  end if;
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
-- City leaderboards rank by challenges completed (places discovered in that city); the others
-- still rank by coins earned. Every row now also carries its challenge count.
-- ---------------------------------------------------------------------------
drop function public.leaderboard(text, text);
create function public.leaderboard(p_scope text default 'global', p_region text default 'sintra')
returns table (rank bigint, user_id uuid, username text, level integer, coins bigint, challenges bigint, is_me boolean)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with scored as (
    select l.user_id,
           coalesce(sum(l.points) filter (where l.points > 0), 0)::bigint as coins,
           count(*) filter (where l.kind in ('visit', 'daily_challenge'))::bigint as challenges
    from public.points_ledger l
    left join public.visits v on v.id = l.visit_id
    left join public.places pl on pl.id = v.place_id
    left join public.regions rg on rg.id = pl.region_id
    where (p_scope <> 'weekly' or l.created_at > now() - interval '7 days')
      and (p_scope <> 'region' or rg.slug = p_region)
    group by l.user_id
  ), visible as (
    select s.*, p.username::text as username, p.level
    from scored s join public.profiles p on p.id = s.user_id
    where (s.coins > 0 or s.challenges > 0)
      and not public.is_blocked_between(auth.uid(), s.user_id)
      and (s.user_id = auth.uid()
           or (p_scope = 'friends' and (public.are_friends(auth.uid(), s.user_id)
               or exists (select 1 from public.follows f
                          where f.follower_id = auth.uid() and f.followee_id = s.user_id and f.status = 'accepted')))
           or (p_scope <> 'friends' and not p.is_private))
  )
  select rank() over (order by case when p_scope = 'region' then challenges else coins end desc),
         user_id, username, level, coins, challenges, user_id = auth.uid()
  from visible
  order by case when p_scope = 'region' then challenges else coins end desc, coins desc, username
  limit 100;
$$;
revoke execute on function public.leaderboard(text, text) from public, anon;
grant execute on function public.leaderboard(text, text) to authenticated;
