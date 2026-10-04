-- Phase 3: server-verified check-ins, coins, streaks, badges, daily double coins.
begin;
insert into auth.users (id, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000e1', '{"username":"eva"}'),
  ('00000000-0000-0000-0000-0000000000e2', '{"username":"rui"}'),
  ('00000000-0000-0000-0000-0000000000e3', '{"username":"modo"}');
update profiles set is_moderator = true where id = '00000000-0000-0000-0000-0000000000e3';

select pg_temp.check(rarity_multiplier(0) = 5 and rarity_multiplier(10) = 3, 'rarity multiplier matches the shared formula');
select pg_temp.check(level_for_xp(0) = 1 and level_for_xp(100) = 2 and level_for_xp(400) = 3, 'levels match the shared formula');

select pg_temp.as_user('00000000-0000-0000-0000-0000000000e1');

-- Start-time checks
do $$ begin
  perform start_checkin(pg_temp.place_id('adraga'), 38.70, -9.40, 8);
  raise exception 'should be too far';
exception when others then
  if sqlerrm <> 'too_far' then raise; end if;
  raise notice 'ok - too far from the place is refused';
end $$;
do $$ begin
  perform start_checkin(pg_temp.place_id('adraga'), 38.8236, -9.4731, 120);
  raise exception 'should be low accuracy';
exception when others then
  if sqlerrm <> 'low_accuracy' then raise; end if;
  raise notice 'ok - poor GPS accuracy is refused';
end $$;

-- Open today's challenge first so the discovery falls inside the window.
reset role;
update daily_challenges set category = 'coast', place_id = null where challenge_date = lisbon_today();
select pg_temp.as_user('00000000-0000-0000-0000-0000000000e1');
create temp table ch on commit drop as select * from open_daily_challenge();
grant select on ch to authenticated;

create temp table s1 on commit drop as
  select (start_checkin(pg_temp.place_id('adraga'), 38.8236, -9.4731, 8) ->> 'session_id')::uuid as id;
grant select on s1 to authenticated;
select pg_temp.check((complete_checkin((select id from s1)) ->> 'status') = 'pending', 'completing before the dwell time is pending');

reset role;
select pg_temp.simulate_session((select id from s1), 130);
select pg_temp.as_user('00000000-0000-0000-0000-0000000000e1');
create temp table r1 on commit drop as select complete_checkin((select id from s1)) as r;
grant select on r1 to authenticated;
select pg_temp.check((select r ->> 'status' from r1) = 'verified', 'a 2-minute visit inside the geofence is verified');
select pg_temp.check((select (r ->> 'coins')::int from r1) = 80 * 5 + 50 + 20, 'first discovery pays base x 5 rarity + 50 pioneer bonus + 20 for a place from a set');
select pg_temp.check((select r -> 'new_badges' from r1) ?& array['first_step', 'first_discoverer', 'hidden_gem'], 'first badges are awarded');
select pg_temp.check((select (r ->> 'streak')::int from r1) = 1, 'streak starts at 1');
select pg_temp.check((complete_checkin((select id from s1)) ->> 'coins')::int = 470, 'replaying a completed session returns the same result');
select pg_temp.check((select count(*) from visits where user_id = auth.uid()) = 1, 'exactly one visit recorded');
select pg_temp.check((my_wallet() ->> 'coins')::int = 470, 'wallet shows the coins');

reset role;
select pg_temp.check((select count(*) from checkin_pings where session_id = (select id from s1)) = 0, 'raw pings are deleted after verification');
select pg_temp.check((select unique_visitors from place_stats where place_id = pg_temp.place_id('adraga')) = 1, 'rarity counter incremented');
select pg_temp.check((select first_discoverer_id from place_stats where place_id = pg_temp.place_id('adraga')) = '00000000-0000-0000-0000-0000000000e1', 'first discoverer recorded');
select pg_temp.check((select xp from profiles where id = '00000000-0000-0000-0000-0000000000e1') = (select sum(xp) from points_ledger where user_id = '00000000-0000-0000-0000-0000000000e1'), 'profile xp equals the ledger');

-- Daily challenge pays double: bonus equals the qualifying discovery's coins.
select pg_temp.as_user('00000000-0000-0000-0000-0000000000e1');
select pg_temp.check((complete_daily_challenge((select challenge_id from ch)) ->> 'bonus_points')::int = 400, 'daily challenge doubles the discovery coins');
select pg_temp.check((my_wallet() ->> 'coins')::int = 870, 'wallet includes the double reward');

do $$ begin
  perform start_checkin(pg_temp.place_id('adraga'), 38.8236, -9.4731, 8);
  raise exception 'should be already discovered';
exception when others then
  if sqlerrm <> 'already_discovered' then raise; end if;
  raise notice 'ok - each place can be completed once';
end $$;

-- Clients can't touch pings or award themselves visits.
do $$ begin
  begin insert into checkin_pings (session_id, lat, lng, accuracy_m) values ((select id from s1), 0, 0, 1);
    raise exception 'ping insert should fail';
  exception when insufficient_privilege then raise notice 'ok - clients cannot write pings directly'; end;
  begin perform award_visit(auth.uid(), pg_temp.place_id('pena'), 0, 0, 1, 999);
    raise exception 'award_visit should fail';
  exception when insufficient_privilege then raise notice 'ok - clients cannot call award_visit'; end;
  begin perform 1 from checkin_pings limit 1;
    raise exception 'ping read should fail';
  exception when insufficient_privilege then raise notice 'ok - raw pings are never readable'; end;
end $$;

-- Second explorer at the same place: rarity drops, no pioneer bonus.
reset role;
select pg_temp.as_user('00000000-0000-0000-0000-0000000000e2');
create temp table s2 on commit drop as
  select (start_checkin(pg_temp.place_id('adraga'), 38.8236, -9.4731, 8) ->> 'session_id')::uuid as id;
grant select on s2 to authenticated;
reset role;
select pg_temp.simulate_session((select id from s2), 125);
select pg_temp.as_user('00000000-0000-0000-0000-0000000000e2');
select pg_temp.check((complete_checkin((select id from s2)) ->> 'coins')::int = round(80 * (1 + 4.0 / 1.1)) + 20, 'second explorer earns the lower rarity rate (plus the set step)');

-- Leaving the geofence is rejected.
create temp table s3 on commit drop as
  select (start_checkin(pg_temp.place_id('cabo-da-roca'), 38.7804, -9.4989, 8) ->> 'session_id')::uuid as id;
grant select on s3 to authenticated;
reset role;
select pg_temp.simulate_session((select id from s3), 130, 400);
select pg_temp.as_user('00000000-0000-0000-0000-0000000000e2');
select pg_temp.check((complete_checkin((select id from s3)) ->> 'reason') = 'left_geofence', 'walking away during the dwell is rejected');

-- Mock location is held for review, then approved by a moderator.
create temp table s4 on commit drop as
  select (start_checkin(pg_temp.place_id('cruz-alta'), 38.7861, -9.3897, 8, true) ->> 'session_id')::uuid as id;
grant select on s4 to authenticated;
reset role;
select pg_temp.simulate_session((select id from s4), 130, 5, 8, true);
select pg_temp.as_user('00000000-0000-0000-0000-0000000000e2');
select pg_temp.check((complete_checkin((select id from s4)) ->> 'status') = 'flagged', 'mock location is flagged');
select pg_temp.check((select count(*) from visits where place_id = pg_temp.place_id('cruz-alta')) = 0, 'flagged check-in awards nothing');
do $$ begin
  perform review_flagged_checkin((select id from s4), true);
  raise exception 'non-moderator review should fail';
exception when insufficient_privilege then raise notice 'ok - only moderators review flagged check-ins';
end $$;
reset role;
select pg_temp.as_user('00000000-0000-0000-0000-0000000000e3');
select pg_temp.check((review_flagged_checkin((select id from s4), true) ->> 'status') = 'verified', 'moderator approval awards the visit');

-- Impossible speed inside the pings is flagged.
reset role;
select pg_temp.as_user('00000000-0000-0000-0000-0000000000e2');
create temp table s5 on commit drop as
  select (start_checkin(pg_temp.place_id('capuchos'), 38.7777, -9.4469, 8) ->> 'session_id')::uuid as id;
grant select on s5 to authenticated;
reset role;
select pg_temp.simulate_session((select id from s5), 130);
update checkin_pings set lat = lat + 0.02
  where id = (select id from checkin_pings where session_id = (select id from s5) order by recorded_at limit 1 offset 1);
select pg_temp.as_user('00000000-0000-0000-0000-0000000000e2');
select pg_temp.check((complete_checkin((select id from s5)) ->> 'reason') = 'impossible_speed', 'teleport jumps are flagged');

-- Purge removes leftover pings.
reset role;
select pg_temp.check(purge_stale_checkins() >= 0 and (select count(*) from checkin_pings p join checkin_sessions s on s.id = p.session_id where s.status <> 'open') = 0, 'purge leaves no pings for finished sessions');
rollback;
