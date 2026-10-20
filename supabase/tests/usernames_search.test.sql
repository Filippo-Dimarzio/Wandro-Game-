-- Unique usernames (any case) and finding players by name.
begin;
insert into auth.users (id, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000006a1', '{"username":"fil_dm7"}'),
  ('00000000-0000-0000-0000-0000000006a2', '{"username":"Fil_DM7"}'),
  ('00000000-0000-0000-0000-0000000006a3', '{"username":"sofia"}');

select pg_temp.check(
  (select username::text from profiles where id = '00000000-0000-0000-0000-0000000006a2') like 'wanderer_%',
  'signing up with a name someone has (in any case) gets a placeholder, not a duplicate');

select pg_temp.as_user('00000000-0000-0000-0000-0000000006a3');
select pg_temp.check(not username_available('fil_dm7') and not username_available('FIL_dm7'),
  'a taken username is reported as taken, whatever the case');
select pg_temp.check(username_available('sofia'), 'your own username counts as available to you');
select pg_temp.check(username_available('new_explorer'), 'a free username is available');
select pg_temp.check(not username_available('no spaces') and not username_available('ab'),
  'invalid usernames are never available');
do $$ begin
  update profiles set username = 'FIL_DM7' where id = auth.uid();
  raise exception 'duplicate should fail';
exception when unique_violation then raise notice 'ok - the database refuses a duplicate username';
end $$;

select pg_temp.check((select username from search_profiles('@fil_dm7') limit 1) = 'fil_dm7',
  'search ignores a leading @ and puts the exact match first');
select pg_temp.check(exists (select 1 from search_profiles('sof') where username = 'sofia'),
  'you can find yourself in search');
select pg_temp.check(not exists (select 1 from search_profiles('%')) and not exists (select 1 from search_profiles('  ')),
  'empty or wildcard searches return nothing');
reset role;
rollback;
