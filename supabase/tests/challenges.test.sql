-- Daily challenge "tap to confirm" and submission approval ("approved mission").
begin;
insert into auth.users (id, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000c1', '{"username":"carla"}'),
  ('00000000-0000-0000-0000-0000000000d1', '{"username":"mod"}');
update profiles set is_moderator = true where id = '00000000-0000-0000-0000-0000000000d1';

-- Today's challenge targets "any place" so the test doesn't depend on the rotation.
update daily_challenges set category = null, place_id = null
where challenge_date = (now() at time zone 'Europe/Lisbon')::date;

select pg_temp.as_user('00000000-0000-0000-0000-0000000000c1');
create temp table ch on commit drop as select * from open_daily_challenge();
grant select on ch to authenticated;
select pg_temp.check((select count(*) from ch) = 1, 'today''s challenge opens');
select pg_temp.check((select not is_ready from ch), 'challenge not ready before a visit');
select pg_temp.check((select expires_at - started_at from ch) = interval '24 hours', 'window is a rolling 24 h');

do $$ begin
  perform complete_daily_challenge((select challenge_id from ch));
  raise exception 'should not complete without a visit';
exception when others then
  if sqlerrm <> 'challenge_not_satisfied' then raise; end if;
  raise notice 'ok - tap without a visit is rejected';
end $$;

reset role;
insert into visits (user_id, place_id, lat, lng, accuracy_m, dwell_seconds)
select '00000000-0000-0000-0000-0000000000c1', id, 38.79, -9.39, 8, 140 from places where source_id = 'adraga';

select pg_temp.as_user('00000000-0000-0000-0000-0000000000c1');
select pg_temp.check((select is_ready from open_daily_challenge()), 'challenge ready after a verified visit');
select pg_temp.check((complete_daily_challenge((select challenge_id from ch)) ->> 'status') = 'completed', 'tap to confirm completes');
select pg_temp.check((complete_daily_challenge((select challenge_id from ch)) ->> 'status') = 'already_completed', 'second tap is idempotent');
select pg_temp.check(my_total_points() = 75, 'bonus awarded exactly once');
select pg_temp.check((select xp from profiles where id = auth.uid()) = 75, 'xp updated server-side');

-- Submissions
insert into place_submissions (user_id, name, location, category, is_public_access, is_safe)
values (auth.uid(), 'Secret garden bench', 'SRID=4326;POINT(-9.40 38.79)', 'nature', true, true);

do $$ begin
  perform approve_place_submission((select id from place_submissions limit 1));
  raise exception 'non-moderator approval should fail';
exception when insufficient_privilege then raise notice 'ok - only moderators can approve';
end $$;

do $$ begin
  insert into place_submissions (user_id, name, location, category, is_public_access, is_safe, status)
  values (auth.uid(), 'Sneaky', 'SRID=4326;POINT(-9.40 38.79)', 'nature', true, true, 'approved');
  raise exception 'self-approved insert should fail';
exception when insufficient_privilege then raise notice 'ok - cannot submit as approved';
end $$;

do $$ begin
  insert into place_submissions (user_id, name, location, category, is_public_access, is_safe)
  values (auth.uid(), 'Cliff edge', 'SRID=4326;POINT(-9.40 38.79)', 'nature', true, false);
  raise exception 'unsafe submission should fail';
exception when check_violation then raise notice 'ok - unsafe places are refused';
end $$;

reset role;
select pg_temp.as_user('00000000-0000-0000-0000-0000000000d1');
create temp table approved on commit drop as
  select approve_place_submission((select id from place_submissions where name = 'Secret garden bench')) as place_id;
grant select on approved to authenticated;
select pg_temp.check((select count(*) from places_public where id = (select place_id from approved)) = 1,
  'approved submission becomes an active mission');
do $$ begin
  perform approve_place_submission((select id from place_submissions where name = 'Secret garden bench'));
  raise exception 'double approval should fail';
exception when others then
  if sqlerrm <> 'submission_already_reviewed' then raise; end if;
  raise notice 'ok - cannot approve twice';
end $$;
rollback;
