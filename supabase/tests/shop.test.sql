-- Phase 8: coin store.
begin;
insert into auth.users (id, raw_user_meta_data) values ('00000000-0000-0000-0000-0000000000b9', '{"username":"shopper"}');

select pg_temp.as_user('00000000-0000-0000-0000-0000000000b9');
do $$ begin
  perform buy_item('incense_30');
  raise exception 'buying with no coins should fail';
exception when others then
  if sqlerrm <> 'insufficient_coins' then raise; end if;
  raise notice 'ok - you cannot buy without enough coins';
end $$;

reset role;
do $$ begin
  -- Pena: 120 x 5 + 50 pioneer = 650 coins.
  perform award_visit('00000000-0000-0000-0000-0000000000b9', pg_temp.place_id('pena'), 38.78, -9.39, 8, 130);
end $$;
select pg_temp.as_user('00000000-0000-0000-0000-0000000000b9');
create temp table before on commit drop as
  select (my_wallet() ->> 'coins')::int as coins, (my_wallet() ->> 'xp')::int as xp,
         (select xp from leaderboard('country') where is_me) as rank_xp;
grant select on before to authenticated;

select pg_temp.check((buy_item('incense_30') ->> 'coins')::int = (select coins from before) - 150, 'buying the incense trail spends 150 coins');
select pg_temp.check((my_wallet() ->> 'xp')::int = (select xp from before), 'spending coins never lowers XP');
select pg_temp.check((select xp from leaderboard('country') where is_me) = (select rank_xp from before), 'spending coins never lowers leaderboard rank');
select pg_temp.check((select expires_at from user_inventory where item_code = 'incense_30') between now() + interval '29 minutes' and now() + interval '31 minutes', 'incense trail runs for 30 minutes');
do $$ begin perform buy_item('incense_30'); end $$;
select pg_temp.check((select expires_at from user_inventory where item_code = 'incense_30') between now() + interval '59 minutes' and now() + interval '61 minutes', 'buying again extends the trail');

do $$ begin perform buy_item('hat_flower'); end $$;
do $$ begin
  perform buy_item('hat_flower');
  raise exception 'buying a cosmetic twice should fail';
exception when others then
  if sqlerrm <> 'already_owned' then raise; end if;
  raise notice 'ok - cosmetics are bought once';
end $$;
do $$ begin
  perform equip_item('hat', 'hat_crown');
  raise exception 'equipping an unowned item should fail';
exception when others then
  if sqlerrm <> 'not_owned' then raise; end if;
  raise notice 'ok - you can only equip what you own';
end $$;
do $$ begin
  perform equip_item('skin', 'hat_flower');
  raise exception 'equipping into the wrong slot should fail';
exception when others then
  if sqlerrm <> 'not_owned' then raise; end if;
  raise notice 'ok - items only fit their own slot';
end $$;
do $$ begin perform equip_item('hat', 'hat_flower'); end $$;
select pg_temp.check((my_inventory() ->> 'equipped_hat') = 'hat_flower', 'equipping a hat shows on the profile');
select pg_temp.check((my_wallet() ->> 'coins')::int = (select coins from before) - 150 - 150 - 200, 'balance reflects every purchase');

do $$ begin
  begin insert into user_inventory (user_id, item_code) values (auth.uid(), 'hat_crown');
    raise exception 'inventory insert should fail';
  exception when insufficient_privilege then raise notice 'ok - clients cannot grant themselves items'; end;
  begin update profiles set equipped_hat = 'hat_crown' where id = auth.uid();
    raise exception 'equipped update should fail';
  exception when insufficient_privilege then raise notice 'ok - equipment changes go through equip_item'; end;
  begin insert into points_ledger (user_id, kind, points) values (auth.uid(), 'purchase', 5000);
    raise exception 'ledger insert should fail';
  exception when insufficient_privilege then raise notice 'ok - clients cannot mint coins'; end;
end $$;
rollback;
