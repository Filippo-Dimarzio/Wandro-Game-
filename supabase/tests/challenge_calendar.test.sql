-- Daily challenge calendar: the 9-day rotation, dated challenges (a date or a range), and that
-- scheduling is server-only, idempotent and never rewrites a day somebody has opened.
begin;
insert into auth.users (id, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000e1', '{"username":"erin"}');

select pg_temp.check(
  (select count(distinct r.category) from generate_series(0, 8) as i,
     lateral challenge_rotation(date '2024-10-11' + i) r) = 7
  and exists (select 1 from generate_series(0, 8) as i,
     lateral challenge_rotation(date '2024-10-11' + i) r where r.category is null),
  'the rotation covers every category plus an "any place" day');
select pg_temp.check((select title from challenge_rotation(date '2024-10-11')) = 'Find a hidden viewpoint',
  'rotation entry 0 falls on day 20007 (2024-10-11), as in packages/shared');
select pg_temp.check((select title from challenge_rotation(date '2024-10-18')) = 'Sound check'
  and (select category from challenge_rotation(date '2024-10-16')) = 'other',
  'Sound check and Oddity of the day are in the rotation');

-- Dated challenges, seeded by the migration.
select pg_temp.check(
  (select title = 'International Museum Day' and category = 'art' and campaign = 'museum-day'
   from daily_challenges where challenge_date = '2027-05-18'),
  'a single-date challenge (International Museum Day, 18 May)');
select pg_temp.check(
  (select count(*) from daily_challenges
   where challenge_date between '2027-06-01' and '2027-06-30' and campaign = 'santos-populares') = 29
  and (select campaign from daily_challenges where challenge_date = '2027-06-21') = 'world-music-day',
  'a date range covers every day (Santos Populares), and a single day inside it wins');
select pg_temp.check(
  (select count(*) from daily_challenges where challenge_date = '2027-09-22'
   and title = 'World Car-Free Day' and category is null) = 1,
  'World Car-Free Day accepts any place');
select pg_temp.check(
  (select count(distinct campaign) from daily_challenges
   where challenge_date between '2026-10-01' and '2027-09-30') = 13,
  'twelve months of dated challenges are scheduled');

-- Scheduling: idempotent, validated, and server-only.
select pg_temp.check(
  schedule_daily_challenge('test-week', 'Test week', 'Discover anything.', null, '2030-03-01', '2030-03-03') = 3
  and schedule_daily_challenge('test-week', 'Test week', 'Discover anything.', null, '2030-03-01', '2030-03-03') = 3,
  'a three-day range schedules three days, twice over');
select pg_temp.check((select count(*) from daily_challenges where campaign = 'test-week') = 3,
  'scheduling a range twice leaves one row per day');

do $$ begin
  perform schedule_daily_challenge('bad', 'Bad', 'Bad.', null, '2030-03-05', '2030-03-01');
  raise exception 'should reject an inverted range';
exception when others then
  if sqlerrm <> 'invalid_date_range' then raise; end if;
  raise notice 'ok - an inverted range is rejected';
end $$;
do $$ begin
  perform schedule_daily_challenge('bad', 'Bad', 'Bad.', null, '2030-01-01', '2030-12-31');
  raise exception 'should reject a year-long range';
exception when others then
  if sqlerrm <> 'date_range_too_long' then raise; end if;
  raise notice 'ok - a range over 3 months is rejected';
end $$;

-- With nothing scheduled, opening today's challenge creates it from the rotation.
delete from daily_challenges where challenge_date = (now() at time zone 'Europe/Lisbon')::date;
create temp table expected on commit drop as
  select title from challenge_rotation((now() at time zone 'Europe/Lisbon')::date);
grant select on expected to authenticated;
select pg_temp.as_user('00000000-0000-0000-0000-0000000000e1');
select pg_temp.check(
  (select title from open_daily_challenge()) = (select title from expected),
  'an unscheduled day gets the rotation on first open');

do $$ begin
  perform schedule_daily_challenge('x', 'X', 'X.', null, '2030-04-01', '2030-04-01');
  raise exception 'a client should not schedule challenges';
exception when insufficient_privilege then
  raise notice 'ok - clients cannot schedule challenges';
end $$;
do $$ begin
  perform ensure_daily_challenge('2030-05-01');
  raise exception 'a client should not create challenge days';
exception when insufficient_privilege then
  raise notice 'ok - clients cannot create challenge days';
end $$;

-- A day somebody opened is never rewritten under them.
reset role;
select pg_temp.check(
  schedule_daily_challenge('late', 'Late change', 'Changed.', 'coast',
    (now() at time zone 'Europe/Lisbon')::date, (now() at time zone 'Europe/Lisbon')::date) = 0,
  'scheduling over an opened day changes nothing');
select pg_temp.check(
  (select campaign from daily_challenges
   where challenge_date = (now() at time zone 'Europe/Lisbon')::date) is null,
  'an opened day keeps its challenge');
rollback;
