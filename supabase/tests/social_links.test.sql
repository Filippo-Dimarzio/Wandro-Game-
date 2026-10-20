-- Account settings: change your username and add social handles, on your own profile only.
begin;
insert into auth.users (id, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000005a1', '{"username":"surfer"}'),
  ('00000000-0000-0000-0000-0000000005a2', '{"username":"hiker"}');

select pg_temp.check(
  (select social_links from profiles where id = '00000000-0000-0000-0000-0000000005a1') = '{}'::jsonb,
  'a new player has no social links');

select pg_temp.as_user('00000000-0000-0000-0000-0000000005a1');
update profiles set social_links = '{"instagram":"fil.dm7","x":"fil_dm7","facebook":"100012345678","tripbff":"fil-dm7"}'
  where id = auth.uid();
select pg_temp.check(
  (select social_links ->> 'instagram' from profiles where id = auth.uid()) = 'fil.dm7',
  'a player can add Instagram, Facebook, X and TripBFF handles');

do $$ begin
  update profiles set social_links = '{"instagram":"https://evil.example/login"}' where id = auth.uid();
  raise exception 'a URL should be rejected';
exception when check_violation then raise notice 'ok - only handles are stored, never URLs';
end $$;
do $$ begin
  update profiles set social_links = '{"onlyfans":"someone"}' where id = auth.uid();
  raise exception 'an unknown network should be rejected';
exception when check_violation then raise notice 'ok - only the four supported networks';
end $$;
do $$ begin
  update profiles set social_links = '["fil"]' where id = auth.uid();
  raise exception 'a non-object should be rejected';
exception when check_violation then raise notice 'ok - links are a network -> handle object';
end $$;

update profiles set username = 'fil_dm7' where id = auth.uid();
select pg_temp.check((select username from profiles where id = auth.uid()) = 'fil_dm7',
  'a player can change their username');
do $$ begin
  update profiles set username = 'hiker' where id = auth.uid();
  raise exception 'a taken username should be rejected';
exception when unique_violation then raise notice 'ok - usernames stay unique';
end $$;

update profiles set social_links = '{"x":"hijack"}', username = 'hijacked'
  where id = '00000000-0000-0000-0000-0000000005a2';
reset role;
select pg_temp.check(
  (select social_links from profiles where id = '00000000-0000-0000-0000-0000000005a2') = '{}'::jsonb
  and (select username from profiles where id = '00000000-0000-0000-0000-0000000005a2') = 'hiker',
  'a player cannot change someone else''s links or username');

select pg_temp.as_user('00000000-0000-0000-0000-0000000005a2');
select pg_temp.check(
  (profile_card('00000000-0000-0000-0000-0000000005a1') -> 'social_links' ->> 'x') = 'fil_dm7',
  'other players see the links on the profile card');
reset role;
rollback;
