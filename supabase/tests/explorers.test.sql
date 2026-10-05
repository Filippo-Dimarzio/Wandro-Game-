-- Explorers: players choose their own avatar; only known explorers, only on your own profile.
begin;
insert into auth.users (id, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000e1', '{"username":"picker"}'),
  ('00000000-0000-0000-0000-0000000000e2', '{"username":"other"}');

select pg_temp.check(
  (select explorer from profiles where id = '00000000-0000-0000-0000-0000000000e1') is null,
  'a new player has not chosen an explorer yet');

select pg_temp.as_user('00000000-0000-0000-0000-0000000000e1');
update profiles set explorer = 'e4' where id = '00000000-0000-0000-0000-0000000000e1';
select pg_temp.check(
  (select explorer from profiles where id = '00000000-0000-0000-0000-0000000000e1') = 'e4',
  'a player can choose their explorer');

do $$ begin
  update profiles set explorer = 'octopus' where id = '00000000-0000-0000-0000-0000000000e1';
  raise exception 'unknown explorer should be rejected';
exception when check_violation then raise notice 'ok - only known explorers are accepted';
end $$;

update profiles set explorer = 'e2' where id = '00000000-0000-0000-0000-0000000000e2';
reset role;
select pg_temp.check(
  (select explorer from profiles where id = '00000000-0000-0000-0000-0000000000e2') is null,
  'a player cannot change someone else''s explorer');

select pg_temp.as_user('00000000-0000-0000-0000-0000000000e2');
select pg_temp.check(
  (select explorer from profiles where id = '00000000-0000-0000-0000-0000000000e1') = 'e4',
  'other players can see which explorer you chose');
reset role;

select pg_temp.check(
  (select name from shop_items where code = 'skin_ocean') = 'Atlantic jacket',
  'skins are sold as outfits');
select pg_temp.check(
  not exists (select 1 from shop_items where name ilike '%octopus%' or description ilike '%octopus%'),
  'the store no longer mentions the octopus');
rollback;
