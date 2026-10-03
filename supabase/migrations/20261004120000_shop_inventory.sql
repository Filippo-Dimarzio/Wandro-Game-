-- Phase 8: coin store. Coins are earned by playing only (never bought); spending them is a
-- negative ledger entry, so XP and leaderboard rank (coins earned) never go down.

create type public.shop_item_kind as enum ('boost', 'skin', 'hat');

create table public.shop_items (
  code text primary key,
  name text not null,
  description text not null,
  kind public.shop_item_kind not null,
  price integer not null check (price > 0),
  duration_minutes integer check (duration_minutes > 0),
  color text,
  emoji text not null,
  is_active boolean not null default true,
  check ((kind = 'boost') = (duration_minutes is not null))
);

create table public.user_inventory (
  user_id uuid not null references public.profiles (id) on delete cascade,
  item_code text not null references public.shop_items (code),
  acquired_at timestamptz not null default now(),
  -- Boosts expire; cosmetics are owned forever (null).
  expires_at timestamptz,
  primary key (user_id, item_code)
);

alter table public.profiles add column equipped_skin text references public.shop_items (code);
alter table public.profiles add column equipped_hat text references public.shop_items (code);

alter table public.shop_items enable row level security;
alter table public.user_inventory enable row level security;
create policy shop_items_select on public.shop_items for select to anon, authenticated using (is_active);
create policy inventory_select_own on public.user_inventory for select to authenticated using (user_id = auth.uid());
revoke insert, update, delete on public.shop_items, public.user_inventory from anon, authenticated;

-- Keep in sync with packages/shared/src/shop.ts (a unit test compares them).
insert into public.shop_items (code, name, description, kind, price, duration_minutes, color, emoji) values
  ('incense_30', 'Incense trail · 30 min', 'A glowing incense circle around your octopus and a guiding line to your next adventure.', 'boost', 150, 30, null, '🪔'),
  ('incense_120', 'Incense trail · 2 hours', 'The incense trail for a whole afternoon of exploring.', 'boost', 400, 120, null, '🪔'),
  ('skin_ocean', 'Ocean octopus', 'Deep Atlantic blue.', 'skin', 300, null, '#2B6CB0', '🌊'),
  ('skin_coral', 'Coral octopus', 'Warm coral, like Pena Palace at sunset.', 'skin', 450, null, '#C05621', '🪸'),
  ('skin_midnight', 'Midnight octopus', 'For night walks and fado.', 'skin', 600, null, '#2D3748', '🌙'),
  ('skin_gold', 'Golden octopus', 'Shiny. Very shiny.', 'skin', 1200, null, '#B7791F', '✨'),
  ('hat_flower', 'Sintra flower', 'A hibiscus from the palace gardens.', 'hat', 200, null, null, '🌺'),
  ('hat_cap', 'Trail cap', 'Keeps the sun off on long walks.', 'hat', 250, null, null, '🧢'),
  ('hat_top', 'Explorer top hat', 'For the distinguished cartographer.', 'hat', 700, null, null, '🎩'),
  ('hat_crown', 'Palace crown', 'Fit for the hills of Sintra.', 'hat', 1500, null, null, '👑')
on conflict (code) do update set
  name = excluded.name, description = excluded.description, kind = excluded.kind, price = excluded.price,
  duration_minutes = excluded.duration_minutes, color = excluded.color, emoji = excluded.emoji;

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
begin
  if uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  select * into item from public.shop_items where code = p_code and is_active;
  if not found then
    raise exception 'item_not_found' using errcode = 'P0002';
  end if;
  -- Serialise purchases per user so two taps can't spend the same coins twice.
  perform 1 from public.profiles where id = uid for update;
  if item.kind <> 'boost' and exists (select 1 from public.user_inventory where user_id = uid and item_code = p_code) then
    raise exception 'already_owned' using errcode = 'P0001';
  end if;
  select coalesce(sum(points), 0) into balance from public.points_ledger where user_id = uid;
  if balance < item.price then
    raise exception 'insufficient_coins' using errcode = 'P0001';
  end if;

  insert into public.points_ledger (user_id, kind, points, xp, breakdown)
  values (uid, 'purchase', -item.price, 0, jsonb_build_object('item', item.code));

  if item.kind = 'boost' then
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

create or replace function public.equip_item(p_slot text, p_code text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if p_slot not in ('skin', 'hat') then
    raise exception 'invalid_slot' using errcode = 'P0001';
  end if;
  if p_code is not null and not exists (
    select 1 from public.user_inventory i join public.shop_items s on s.code = i.item_code
    where i.user_id = uid and i.item_code = p_code and s.kind::text = p_slot
  ) then
    raise exception 'not_owned' using errcode = 'P0001';
  end if;
  if p_slot = 'skin' then
    update public.profiles set equipped_skin = p_code where id = uid;
  else
    update public.profiles set equipped_hat = p_code where id = uid;
  end if;
end;
$$;

create or replace function public.my_inventory()
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'equipped_skin', p.equipped_skin,
    'equipped_hat', p.equipped_hat,
    'items', coalesce((select jsonb_agg(jsonb_build_object('item_code', i.item_code, 'expires_at', i.expires_at))
                       from public.user_inventory i where i.user_id = p.id), '[]')
  )
  from public.profiles p where p.id = auth.uid();
$$;

revoke execute on function public.buy_item(text) from public, anon;
revoke execute on function public.equip_item(text, text) from public, anon;
revoke execute on function public.my_inventory() from public, anon;
grant execute on function public.buy_item(text) to authenticated;
grant execute on function public.equip_item(text, text) to authenticated;
grant execute on function public.my_inventory() to authenticated;
