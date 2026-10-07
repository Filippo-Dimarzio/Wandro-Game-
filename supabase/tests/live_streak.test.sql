-- The wallet's streak is the live, Duolingo-style streak: kept today, at risk, or broken.
begin;
insert into auth.users (id, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000e1', '{"username":"flame"}');

select pg_temp.as_user('00000000-0000-0000-0000-0000000000e1');
select pg_temp.check((my_wallet() ->> 'streak')::int = 0, 'a new player has no streak');
reset role;

do $$ begin
  perform award_visit('00000000-0000-0000-0000-0000000000e1', pg_temp.place_id('pena'), 38.78, -9.39, 8, 130);
end $$;
select pg_temp.as_user('00000000-0000-0000-0000-0000000000e1');
select pg_temp.check((my_wallet() ->> 'streak')::int = 1, 'completing a challenge starts a 1-day streak');
select pg_temp.check((my_wallet() ->> 'last_active_date')::date = lisbon_today(), 'and records today as played');
reset role;

update profiles set streak_days = 6, last_active_date = lisbon_today() - 1
where id = '00000000-0000-0000-0000-0000000000e1';
select pg_temp.as_user('00000000-0000-0000-0000-0000000000e1');
select pg_temp.check((my_wallet() ->> 'streak')::int = 6, 'played yesterday: the streak is still alive today');
reset role;

do $$ begin
  perform award_visit('00000000-0000-0000-0000-0000000000e1', pg_temp.place_id('adraga'), 38.82, -9.47, 8, 130);
end $$;
select pg_temp.as_user('00000000-0000-0000-0000-0000000000e1');
select pg_temp.check((my_wallet() ->> 'streak')::int = 7, 'a challenge today extends it to 7');
reset role;

update profiles set streak_days = 7, last_active_date = lisbon_today() - 2
where id = '00000000-0000-0000-0000-0000000000e1';
select pg_temp.as_user('00000000-0000-0000-0000-0000000000e1');
select pg_temp.check((my_wallet() ->> 'streak')::int = 0, 'a missed day breaks the streak');
reset role;
rollback;
