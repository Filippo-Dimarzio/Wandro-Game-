-- XP per challenge, skins earned by a challenge, and the city leaderboard by challenges.
begin;
insert into auth.users (id, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000d1', '{"username":"walker"}'),
  ('00000000-0000-0000-0000-0000000000d2', '{"username":"richie"}');

do $$ begin
  perform award_visit('00000000-0000-0000-0000-0000000000d1', pg_temp.place_id('pena'), 38.78, -9.39, 8, 130);
end $$;
select pg_temp.check((select xp from profiles where username = 'walker') = 50,
  'a discovery is one challenge: 50 XP, however many coins it paid');
select pg_temp.check((select coalesce(sum(points), 0) from points_ledger
                      where user_id = '00000000-0000-0000-0000-0000000000d1') > 50,
  'coins are counted separately from XP');

select pg_temp.as_user('00000000-0000-0000-0000-0000000000d1');
do $$ begin
  perform buy_item('skin_ocean');
  raise exception 'buying before the challenge should fail';
exception when others then
  if sqlerrm <> 'challenge_not_done' then raise; end if;
  raise notice 'ok - a skin can only be bought once its challenge is done';
end $$;
reset role;

do $$ begin
  perform award_visit('00000000-0000-0000-0000-0000000000d1', pg_temp.place_id('adraga'), 38.82, -9.47, 8, 130);
  perform award_visit('00000000-0000-0000-0000-0000000000d1', pg_temp.place_id('praia-grande'), 38.81, -9.47, 8, 130);
  perform award_visit('00000000-0000-0000-0000-0000000000d1', pg_temp.place_id('azenhas'), 38.84, -9.46, 8, 130);
end $$;
select pg_temp.check((select xp from profiles where username = 'walker') = 200, '4 challenges = 200 XP');
select pg_temp.check((select level from profiles where username = 'walker') = 1, 'still level 1 below 250 XP');

select pg_temp.as_user('00000000-0000-0000-0000-0000000000d1');
select pg_temp.check((buy_item('skin_ocean') ->> 'item') = 'skin_ocean',
  'after 3 beaches & coast spots the ocean skin can be bought');
reset role;

-- richie has far more coins in Sintra but only one challenge there.
create temp table rv on commit drop as
  select (award_visit('00000000-0000-0000-0000-0000000000d2', pg_temp.place_id('cruz-alta'), 38.78, -9.39, 8, 130) ->> 'visit_id')::uuid as v;
insert into points_ledger (user_id, kind, points, xp, visit_id)
values ('00000000-0000-0000-0000-0000000000d2', 'first_discoverer', 10000, 999, (select v from rv));
select pg_temp.check((select xp from points_ledger where points = 10000) = 0, 'reward rows only carry XP for challenges');

select pg_temp.as_user('00000000-0000-0000-0000-0000000000d2');
select pg_temp.check((select username from leaderboard('region', 'sintra') order by rank limit 1) = 'walker',
  'the city leaderboard ranks by challenges completed there');
select pg_temp.check((select challenges from leaderboard('region', 'sintra') where username = 'walker') = 4,
  'and shows how many');
select pg_temp.check((select username from leaderboard('country') order by rank limit 1) = 'walker',
  'the Portugal board ranks by XP, not coins: richie''s 10,000 coins do not put him first');
select pg_temp.check((select xp from leaderboard('country') where username = 'walker') = 200,
  'and shows each player''s XP');
do $$ begin
  perform leaderboard('global');
  raise exception 'the global board should be gone';
exception when others then
  if sqlerrm <> 'invalid_scope' then raise; end if;
  raise notice 'ok - the global and weekly boards are gone';
end $$;
rollback;
