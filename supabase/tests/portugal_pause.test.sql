-- Pausing a city keeps every player's history: a Paris place with a visit, coins, a post, a set
-- and an open friend challenge (as it could be before Phase 10) is closed, never deleted.
begin;
insert into auth.users (id, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000ef01', '{"username":"was_in_paris"}'),
  ('00000000-0000-0000-0000-00000000ef02', '{"username":"friend"}');

select pg_temp.check((select count(*) from regions where airport is null) = 0, 'every region has an airport code');
select pg_temp.check((select array_agg(distinct airport order by airport) from regions where is_active) = array['LIS', 'OPO'],
  'live cities use Lisbon and Porto airports');

update regions set is_active = true where slug = 'paris';
insert into places (name, description, location, category, base_points, source, source_id, status, region_id)
select 'Test Paris place', 'x', extensions.st_setsrid(extensions.st_makepoint(2.29, 48.86), 4326)::extensions.geography,
       'heritage', 120, 'seed', 'test-paris', 'active', id
from regions where slug = 'paris';
insert into visits (user_id, place_id, lat, lng, accuracy_m, dwell_seconds)
values ('00000000-0000-0000-0000-00000000ef01', pg_temp.place_id('test-paris'), 48.86, 2.29, 8, 140);
insert into points_ledger (user_id, visit_id, kind, points, xp)
select user_id, id, 'visit', 360, 360 from visits where place_id = pg_temp.place_id('test-paris');
insert into posts (user_id, visit_id, place_id, caption)
select user_id, id, place_id, 'Bonjour' from visits where place_id = pg_temp.place_id('test-paris');
insert into collections (slug, title, description, region_id)
select 'test-paris-set', 'Paris test', 'x', id from regions where slug = 'paris';
insert into friend_challenges (from_user, to_user, place_id, note)
values ('00000000-0000-0000-0000-00000000ef02', '00000000-0000-0000-0000-00000000ef01', pg_temp.place_id('test-paris'), 'Go!');

update regions set is_active = false where slug = 'paris';
select pause_inactive_regions();

select pg_temp.check((select status from places where source_id = 'test-paris') = 'closed',
  'the paused city''s place is closed, not deleted');
select pg_temp.check(not exists (select 1 from places_public where name = 'Test Paris place'),
  'and leaves the public place list');
select pg_temp.check(exists (select 1 from visits where place_id = pg_temp.place_id('test-paris')), 'the visit is kept');
select pg_temp.check(exists (select 1 from points_ledger l join visits v on v.id = l.visit_id
                             where v.place_id = pg_temp.place_id('test-paris')),
  'the coins stay in the ledger, still linked to the visit');
select pg_temp.check(exists (select 1 from posts where place_id = pg_temp.place_id('test-paris')), 'the post is kept');
select pg_temp.check(not (select is_active from collections where slug = 'test-paris-set'), 'the city''s set is closed');
select pg_temp.check((select status from friend_challenges where place_id = pg_temp.place_id('test-paris')) = 'declined',
  'the open friend challenge is declined');
select pg_temp.check((select status from places where source_id = 'porto-clerigos') = 'active',
  'live cities are untouched');

select pg_temp.as_user('00000000-0000-0000-0000-00000000ef01');
select pg_temp.check(exists (select 1 from my_passport() where place_name = 'Test Paris place'),
  'the player''s passport still shows the paused place');
select pg_temp.check(exists (select 1 from jsonb_array_elements(export_my_data() -> 'visits') v
                             where v ->> 'place' = 'Test Paris place'),
  'the data export still includes the visit');

select pg_temp.as_anon();
do $$ begin
  perform pause_inactive_regions();
  raise exception 'should be denied';
exception when insufficient_privilege then
  raise notice 'ok - only the server can pause cities';
end $$;
rollback;
