-- Boosts: time-of-day key, gold stamp ink and the friend beacon.
begin;
insert into auth.users (id, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000c1', '{"username":"keyholder"}'),
  ('00000000-0000-0000-0000-0000000000c2', '{"username":"beaconfriend"}'),
  ('00000000-0000-0000-0000-0000000000c3', '{"username":"stranger"}');

-- The windows match timeQuestOpen() in packages/shared (Lisbon time).
select pg_temp.check(time_quest_open('golden', '2026-07-15T19:10:00Z'), 'golden hour is open just before a July sunset');
select pg_temp.check(not time_quest_open('golden', '2026-07-15T18:59:00Z'), 'golden hour is closed earlier in the evening');
select pg_temp.check(time_quest_open('golden', '2026-12-10T16:30:00Z'), 'golden hour follows the earlier winter sunset');
select pg_temp.check(time_quest_open('night', '2026-07-16T03:30:00Z'), 'night quests are open before dawn');
select pg_temp.check(not time_quest_open('night', '2026-07-15T12:00:00Z'), 'night quests are closed at midday');

select pg_temp.as_anon();
select pg_temp.check((select count(*) from time_quests()) = 11, 'anyone can see which places have time quests');
reset role;

-- Coins to spend: Pena (also collects the Sintra stamp, in plain ink).
do $$ begin
  perform award_visit('00000000-0000-0000-0000-0000000000c1', pg_temp.place_id('pena'), 38.78, -9.39, 8, 130);
end $$;

select pg_temp.as_user('00000000-0000-0000-0000-0000000000c1');
select pg_temp.check((select count(*) from city_stamps) = 1 and not (select gold from city_stamps where region_slug = 'sintra'),
  'your first discovery in a city collects its stamp');

do $$ begin perform buy_item('time_key'); end $$;
select pg_temp.check((select expires_at from user_inventory where item_code = 'time_key') between now() + interval '1439 minutes' and now() + interval '1441 minutes',
  'the time-of-day key lasts 24 hours');
do $$ begin perform buy_item('stamp_ink'); end $$;
select pg_temp.check((select expires_at from user_inventory where item_code = 'stamp_ink') is null, 'stamp ink is held until used');
do $$ begin
  perform buy_item('stamp_ink');
  raise exception 'buying a second ink should fail';
exception when others then
  if sqlerrm <> 'already_owned' then raise; end if;
  raise notice 'ok - you hold one stamp ink at a time';
end $$;
do $$ begin
  insert into city_stamps (user_id, region_slug, gold) values (auth.uid(), 'porto', true);
  raise exception 'stamp insert should fail';
exception when insufficient_privilege then raise notice 'ok - clients cannot stamp their own passport';
end $$;
reset role;

-- Pretend it's golden hour and night all day (rolled back with the test).
create or replace function public.time_quest_open(p_kind text, p_at timestamptz default now())
returns boolean language sql stable as $$ select true $$;

create temp table r on commit drop as
  select award_visit('00000000-0000-0000-0000-0000000000c1', pg_temp.place_id('evora-roman-temple'), 38.57, -7.91, 8, 130) as v;
select pg_temp.check((select (v -> 'breakdown' ->> 'time_quest')::int from r) = 40, 'a night quest with the key pays +40 coins');
select pg_temp.check((select (v -> 'stamp' ->> 'gold')::boolean from r), 'stamp ink makes the next city stamp gold');
select pg_temp.check(not exists (select 1 from user_inventory where user_id = '00000000-0000-0000-0000-0000000000c1' and item_code = 'stamp_ink'),
  'the ink is used up');
select pg_temp.check((select gold from city_stamps where user_id = '00000000-0000-0000-0000-0000000000c1' and region_slug = 'evora'),
  'the gold stamp is stored');
select pg_temp.check((select (v -> 'breakdown' ->> 'time_quest')::int from (
    select award_visit('00000000-0000-0000-0000-0000000000c3', pg_temp.place_id('evora-roman-temple'), 38.57, -7.91, 8, 130) as v) x) = 0,
  'without the key a time quest pays nothing extra');
select pg_temp.check((select (v -> 'breakdown' ->> 'time_quest')::int from (
    select award_visit('00000000-0000-0000-0000-0000000000c1', pg_temp.place_id('lisbon-belem-tower'), 38.69, -9.21, 8, 130) as v) x) = 0,
  'places without a time quest pay nothing extra');
select pg_temp.check(not (select gold from city_stamps where user_id = '00000000-0000-0000-0000-0000000000c1' and region_slug = 'lisbon'),
  'without ink the next stamp is plain');

-- Friend beacon.
insert into friendships (user_a, user_b, requested_by, status, accepted_at)
values ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000c2',
        '00000000-0000-0000-0000-0000000000c1', 'accepted', now());

select pg_temp.as_user('00000000-0000-0000-0000-0000000000c1');
create temp table ch on commit drop as
  select challenge_friend('00000000-0000-0000-0000-0000000000c2', pg_temp.place_id('porto-ribeira'), 'Sunset by the river') as id;
grant select on ch to authenticated;
do $$ begin
  perform light_beacon((select id from ch));
  raise exception 'lighting without a beacon should fail';
exception when others then
  if sqlerrm <> 'no_beacon' then raise; end if;
  raise notice 'ok - you need a beacon to light one';
end $$;
do $$ begin perform buy_item('friend_beacon'); end $$;
select pg_temp.check(light_beacon((select id from ch)) = lisbon_today(), 'lighting a beacon marks the challenge for today');
select pg_temp.check(not exists (select 1 from user_inventory where item_code = 'friend_beacon'), 'the beacon is used up');
do $$ begin
  update friend_challenges set beacon_date = lisbon_today() - 1;
  raise exception 'challenge update should fail';
exception when insufficient_privilege then raise notice 'ok - clients cannot move a beacon';
end $$;
select pg_temp.check((select (c ->> 'beacon_date')::date from jsonb_array_elements(my_friend_challenges()) c
                      where (c ->> 'id')::uuid = (select id from ch)) = lisbon_today(), 'both friends see the lit beacon');

select pg_temp.as_user('00000000-0000-0000-0000-0000000000c3');
do $$ begin
  perform light_beacon((select id from ch));
  raise exception 'a stranger lighting a beacon should fail';
exception when others then
  if sqlerrm <> 'challenge_not_found' then raise; end if;
  raise notice 'ok - only the two friends can light a beacon';
end $$;
reset role;

create temp table before on commit drop as
  select coalesce(sum(points), 0)::int as coins from points_ledger where user_id = '00000000-0000-0000-0000-0000000000c1';
select pg_temp.check((select (v -> 'breakdown' ->> 'beacon')::int from (
    select award_visit('00000000-0000-0000-0000-0000000000c2', pg_temp.place_id('porto-ribeira'), 41.14, -8.61, 8, 130) as v) x) = 50,
  'finishing a beaconed challenge today pays the friend +50');
select pg_temp.check((select coalesce(sum(points), 0)::int from points_ledger where user_id = '00000000-0000-0000-0000-0000000000c1')
                     = (select coins from before) + 50, 'and the challenger +50');
select pg_temp.check((select status from friend_challenges where id = (select id from ch)) = 'completed', 'the challenge is completed');

-- A beacon from another day pays nothing.
insert into friend_challenges (from_user, to_user, place_id, status, beacon_date)
values ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000c2', pg_temp.place_id('porto-clerigos'),
        'accepted', lisbon_today() - 1);
select pg_temp.check((select (v -> 'breakdown' ->> 'beacon')::int from (
    select award_visit('00000000-0000-0000-0000-0000000000c2', pg_temp.place_id('porto-clerigos'), 41.14, -8.61, 8, 130) as v) x) = 0,
  'a beacon lit on another day pays nothing');

select pg_temp.as_user('00000000-0000-0000-0000-0000000000c1');
select pg_temp.check(jsonb_array_length(export_my_data() -> 'city_stamps') = 3, 'the data export includes your city stamps');
rollback;
