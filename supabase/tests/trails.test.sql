-- Trails: clues answered in order at discovered places, hints and wrong answers cost coins,
-- answers and hints stay on the server, and finishing pays once.
begin;
insert into auth.users (id, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000d1', '{"username":"trailwalker"}'),
  ('00000000-0000-0000-0000-0000000000d2', '{"username":"couchpotato"}');

select pg_temp.check((select count(*) from trails t join regions r on r.id = t.region_id where r.slug = 'sintra') = 2
  and (select count(*) from trails t join regions r on r.id = t.region_id where r.slug = 'lisbon') = 2,
  'two trails each in Sintra and Lisbon');
select pg_temp.check((select count(*) from trail_stops s join trails t on t.id = s.trail_id
                      where t.slug in ('lisbon-belem', 'lisbon-alfama')) = 10, 'every Lisbon stop is seeded');
select pg_temp.check((select count(*) from trail_stops s join trails t on t.id = s.trail_id
                      where t.slug = 'sintra-magpies-millionaire') = 4, 'the old-town trail has four stops');

-- Nobody can read answers or hints, or write progress.
select pg_temp.as_anon();
select pg_temp.check((select count(*) from my_trails()) = 4, 'anyone can see the trails');
do $$ begin
  perform 1 from trail_secrets;
  raise exception 'reading secrets should fail';
exception when insufficient_privilege then raise notice 'ok - visitors cannot read answers';
end $$;
reset role;

select pg_temp.as_user('00000000-0000-0000-0000-0000000000d1');
do $$ begin
  perform 1 from trail_secrets;
  raise exception 'reading secrets should fail';
exception when insufficient_privilege then raise notice 'ok - players cannot read answers or hints';
end $$;
do $$ begin
  insert into trail_stop_progress (user_id, trail_id, position, solved_at)
  select auth.uid(), id, 1, now() from trails limit 1;
  raise exception 'progress insert should fail';
exception when insufficient_privilege then raise notice 'ok - players cannot mark a stop solved';
end $$;
do $$ begin
  perform answer_trail_clue('sintra-magpies-millionaire', 1, '3');
  raise exception 'answering before starting should fail';
exception when others then
  if sqlerrm <> 'not_started' then raise; end if;
  raise notice 'ok - you start a trail before answering';
end $$;
do $$ begin
  perform start_trail('sintra-magpies-millionaire');
  raise exception 'starting before 5 discoveries should fail';
exception when others then
  if sqlerrm <> 'locked' then raise; end if;
  raise notice 'ok - a trail is locked until you have discovered 5 places in its city';
end $$;
reset role;

-- Five Sintra discoveries (none of them on this trail) open it, but they pay at most 250 coins.
do $$ begin
  perform award_visit('00000000-0000-0000-0000-0000000000d1', pg_temp.place_id(x), 38.79, -9.39, 8, 130)
  from unnest(array['pena', 'mouros', 'monserrate', 'capuchos', 'adraga']) as x;
end $$;
select pg_temp.as_user('00000000-0000-0000-0000-0000000000d1');
select pg_temp.check((select discoveries from my_trails() where slug = 'sintra-magpies-millionaire') = 5
  and (select discoveries from my_trails() where slug = 'lisbon-belem') = 0,
  'my_trails counts your discoveries in each trail''s city');
do $$ begin
  perform start_trail('lisbon-belem');
  raise exception 'Lisbon should still be locked';
exception when others then
  if sqlerrm <> 'locked' then raise; end if;
  raise notice 'ok - discoveries only count in the trail''s own city';
end $$;
do $$ begin
  perform start_trail('sintra-magpies-millionaire');
  raise exception 'starting with under 300 coins should fail';
exception when others then
  if sqlerrm <> 'insufficient_coins' then raise; end if;
  raise notice 'ok - unlocking a trail costs 300 coins';
end $$;
reset role;
insert into points_ledger (user_id, kind, points) values ('00000000-0000-0000-0000-0000000000d1', 'moderation', 100);
create temp table before_unlock on commit drop as
  select sum(points) as coins from points_ledger where user_id = '00000000-0000-0000-0000-0000000000d1';
select pg_temp.as_user('00000000-0000-0000-0000-0000000000d1');
do $$ begin perform start_trail('sintra-magpies-millionaire'); perform start_trail('sintra-magpies-millionaire'); end $$;
select pg_temp.check((select count(*) from trail_progress) = 1, 'starting twice is harmless (resume)');
reset role;
select pg_temp.check((select sum(points) from points_ledger where user_id = '00000000-0000-0000-0000-0000000000d1')
                     = (select coins from before_unlock) - 300,
  'unlocking takes 300 coins once, and resuming is free');
select pg_temp.as_user('00000000-0000-0000-0000-0000000000d1');
do $$ begin
  perform answer_trail_clue('sintra-magpies-millionaire', 1, '3');
  raise exception 'answering away from the place should fail';
exception when others then
  if sqlerrm <> 'not_discovered' then raise; end if;
  raise notice 'ok - you must discover a stop''s place before answering its clue';
end $$;
do $$ begin
  perform answer_trail_clue('sintra-magpies-millionaire', 2, 'Por bem');
  raise exception 'skipping ahead should fail';
exception when others then
  if sqlerrm <> 'not_current' then raise; end if;
  raise notice 'ok - stops are answered in order';
end $$;
reset role;

-- Discover the first two stops (a verified visit, as check-in would write it).
do $$ begin
  perform award_visit('00000000-0000-0000-0000-0000000000d1', pg_temp.place_id('sintra-santa-maria'), 38.796, -9.386, 8, 130);
  perform award_visit('00000000-0000-0000-0000-0000000000d1', pg_temp.place_id('sintra-national-palace'), 38.7976, -9.3906, 8, 130);
end $$;

select pg_temp.as_user('00000000-0000-0000-0000-0000000000d1');
select pg_temp.check(use_trail_hint('sintra-magpies-millionaire', 1) like 'Count the rows%', 'a hint comes back as text');
select pg_temp.check(not (answer_trail_clue('sintra-magpies-millionaire', 1, '4') ->> 'correct')::boolean,
  'a wrong answer is not accepted');
create temp table a1 on commit drop as select answer_trail_clue('sintra-magpies-millionaire', 1, ' 3 ') as r;
select pg_temp.check((select (r ->> 'correct')::boolean and (r ->> 'coins')::int = 10 from a1),
  'the right answer pays 20 coins minus 5 for the hint and 5 for the wrong answer');
do $$ begin
  perform answer_trail_clue('sintra-magpies-millionaire', 1, '3');
  raise exception 'answering twice should fail';
exception when others then
  if sqlerrm <> 'already_solved' then raise; end if;
  raise notice 'ok - a solved stop pays once';
end $$;
select pg_temp.check((select (stops -> 0 -> 'hints') = '["Count the rows of space between the columns, front to back."]'::jsonb
                             and (stops -> 0 ->> 'solved')::boolean and (stops -> 1 ->> 'discovered')::boolean
                             and (stops -> 1 -> 'hints') = '[]'::jsonb
                      from my_trails() where slug = 'sintra-magpies-millionaire'),
  'my_trails shows used hints only, and which stops you have discovered');
select pg_temp.check((answer_trail_clue('sintra-magpies-millionaire', 2, 'por bem') ->> 'coins')::int = 20,
  'a clean answer pays the full 20 coins');
reset role;

-- The last two stops, then the finish.
do $$ begin
  perform award_visit('00000000-0000-0000-0000-0000000000d1', pg_temp.place_id('regaleira'), 38.7967, -9.3958, 8, 130);
  perform award_visit('00000000-0000-0000-0000-0000000000d1', pg_temp.place_id('seteais'), 38.7938, -9.403, 8, 130);
end $$;
select pg_temp.as_user('00000000-0000-0000-0000-0000000000d1');
do $$ begin
  perform use_trail_hint('sintra-magpies-millionaire', 3);
  perform use_trail_hint('sintra-magpies-millionaire', 3);
  perform use_trail_hint('sintra-magpies-millionaire', 3);
end $$;
do $$ begin
  perform use_trail_hint('sintra-magpies-millionaire', 3);
  raise exception 'a fourth hint should fail';
exception when others then
  if sqlerrm <> 'no_more_hints' then raise; end if;
  raise notice 'ok - three hints per stop';
end $$;
select pg_temp.check((answer_trail_clue('sintra-magpies-millionaire', 3, '9') ->> 'coins')::int = 5,
  'a stop always pays at least 5 coins');
create temp table fin on commit drop as select answer_trail_clue('sintra-magpies-millionaire', 4, 'Pena Palace') as r;
select pg_temp.check((select (r ->> 'completed')::boolean and (r ->> 'bonus')::int = 50 from fin),
  'the last stop finishes the trail with a 50-coin bonus');
select pg_temp.check((select completed_at is not null from trail_progress), 'the trail is marked finished');
reset role;

select pg_temp.check((select coalesce(sum(points), 0) from points_ledger
                      where user_id = '00000000-0000-0000-0000-0000000000d1' and kind in ('trail_stop', 'trail')) = 10 + 20 + 5 + 20 + 50,
  'the ledger holds each stop once and the finish once');
select pg_temp.check((select xp from points_ledger
                      where user_id = '00000000-0000-0000-0000-0000000000d1' and kind = 'trail') = 50
                     and (select sum(xp) from points_ledger
                          where user_id = '00000000-0000-0000-0000-0000000000d1' and kind = 'trail_stop') = 0,
  'finishing a trail is a challenge (50 XP); stops give coins only');

-- Someone else sees none of this.
select pg_temp.as_user('00000000-0000-0000-0000-0000000000d2');
select pg_temp.check((select count(*) from trail_progress) = 0 and (select count(*) from trail_stop_progress) = 0,
  'players cannot see each other''s trail progress');
select pg_temp.check((select started_at is null and (stops -> 0 -> 'hints') = '[]'::jsonb
                      from my_trails() where slug = 'sintra-magpies-millionaire'),
  'another player''s hints are not shown to you');
select pg_temp.check((export_my_data() -> 'trails') = '[]'::jsonb, 'your export has only your trails');
reset role;
select pg_temp.as_user('00000000-0000-0000-0000-0000000000d1');
select pg_temp.check(jsonb_array_length(export_my_data() -> 'trails') = 1, 'trail progress is in the data export');
reset role;
rollback;
