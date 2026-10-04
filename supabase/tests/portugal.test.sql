-- Portugal focus: Sintra, Lisbon and Porto are live; paused cities keep every player's history.
begin;
insert into auth.users (id, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000ee01', '{"username":"traveller"}'),
  ('00000000-0000-0000-0000-00000000ee02', '{"username":"pal"}');

select pg_temp.check((select array_agg(slug order by slug) from regions where is_active) = array['lisbon', 'porto', 'sintra'],
  'only Sintra, Lisbon and Porto are live');
select pg_temp.check((select count(*) from regions where not is_active) = 18, 'the other 18 cities are paused, not deleted');
select pg_temp.check(not exists (
    select 1 from places p join regions r on r.id = p.region_id where not r.is_active and p.status = 'active'),
  'no active place outside the live cities');
select pg_temp.check(not exists (
    select 1 from collections c join regions r on r.id = c.region_id where not r.is_active and c.is_active),
  'no open set outside the live cities');
select pg_temp.check(not exists (
    select 1 from regions r, unnest(enum_range(null::place_category)) as c(category)
    where r.is_active and (select count(*) from places p
           where p.region_id = r.id and p.category = c.category and p.status = 'active' and not p.is_hidden) < 5),
  'every live city has at least 5 visible challenges in every category');
select pg_temp.check(region_at(48.8584, 2.2945) is null and region_at(41.1457, -8.6146) = 'porto',
  'a paused city no longer counts as a launch city');

-- A player in Porto sees Porto places (and not Lisbon's) and can unlock the Clérigos Tower.
select pg_temp.as_user('00000000-0000-0000-0000-00000000ee01');
select pg_temp.check((select count(*) from nearby_places(41.1496, -8.611, 30000)) = 41
  and not exists (select 1 from nearby_places(41.1496, -8.611, 30000) p join regions r on r.id = p.region_id where r.slug <> 'porto'),
  'nearby places in Porto are the 41 visible Porto places');

create temp table ps on commit drop as
  select (start_checkin(pg_temp.place_id('porto-clerigos'), 41.1457, -8.6146, 8) ->> 'session_id')::uuid as id;
grant select on ps to authenticated;
reset role;
select pg_temp.simulate_session((select id from ps), 130);
select pg_temp.as_user('00000000-0000-0000-0000-00000000ee01');
create temp table pr on commit drop as select complete_checkin((select id from ps)) as r;
grant select on pr to authenticated;
select pg_temp.check((select r ->> 'status' from pr) = 'verified', 'the Clérigos Tower can be unlocked with a verified visit');
select pg_temp.check((select (r ->> 'coins')::int from pr) > 0, 'unlocking in Porto pays coins');
select pg_temp.check((select username from leaderboard('region', 'porto') limit 1) = 'traveller',
  'the Porto discovery counts on the Porto leaderboard');
select pg_temp.check(not exists (select 1 from leaderboard('region', 'sintra') where username = 'traveller'),
  'and not on Sintra''s');

-- Porto's hidden gem unlocks once revealed.
select pg_temp.check(not exists (select 1 from reveal_hidden_gem(41.1496, -8.611)),
  'Porto''s gem stays hidden from the city centre');
select pg_temp.check((select name from reveal_hidden_gem(41.1440, -8.6185)) = 'Virtudes Terraces',
  'Porto''s gem is revealed within 200 m');

-- Friends can challenge each other to places in another live city.
select pg_temp.check(send_friend_request('00000000-0000-0000-0000-00000000ee02') = 'pending', 'friend request across cities');
select pg_temp.as_user('00000000-0000-0000-0000-00000000ee02');
select respond_friend_request('00000000-0000-0000-0000-00000000ee01', true);
select pg_temp.check(challenge_friend('00000000-0000-0000-0000-00000000ee01', pg_temp.place_id('porto-ribeira'), 'Porto next?') is not null,
  'a friend can be challenged to a place in another live city');

-- Pausing a city with player history: a Paris place with a visit, a post, a set and an open
-- friend challenge (as it was before Phase 10).
reset role;
update regions set is_active = true where slug = 'paris';
insert into places (name, description, location, category, base_points, source, source_id, status, region_id)
select 'Test Paris place', 'x', extensions.st_setsrid(extensions.st_makepoint(2.29, 48.86), 4326)::extensions.geography,
       'heritage', 120, 'seed', 'test-paris', 'active', id
from regions where slug = 'paris';
insert into visits (user_id, place_id, lat, lng, accuracy_m, dwell_seconds)
values ('00000000-0000-0000-0000-00000000ee01', pg_temp.place_id('test-paris'), 48.86, 2.29, 8, 140);
insert into points_ledger (user_id, visit_id, kind, points, xp)
select user_id, id, 'visit', 360, 360 from visits where place_id = pg_temp.place_id('test-paris');
insert into posts (user_id, visit_id, place_id, caption)
select user_id, id, place_id, 'Bonjour' from visits where place_id = pg_temp.place_id('test-paris');
insert into collections (slug, title, description, region_id)
select 'test-paris-set', 'Paris test', 'x', id from regions where slug = 'paris';
insert into friend_challenges (from_user, to_user, place_id, note)
values ('00000000-0000-0000-0000-00000000ee02', '00000000-0000-0000-0000-00000000ee01', pg_temp.place_id('test-paris'), 'Go!');

update regions set is_active = false where slug = 'paris';
select pause_inactive_regions();

select pg_temp.check((select status from places where source_id = 'test-paris') = 'hidden',
  'the paused city''s place is hidden, not deleted');
select pg_temp.check(not exists (select 1 from places_public where name = 'Test Paris place'),
  'and leaves the public place list');
select pg_temp.check(exists (select 1 from visits where place_id = pg_temp.place_id('test-paris')), 'the visit is kept');
select pg_temp.check(exists (select 1 from points_ledger l join visits v on v.id = l.visit_id where v.place_id = pg_temp.place_id('test-paris')),
  'the coins stay in the ledger, still linked to the visit');
select pg_temp.check(exists (select 1 from posts where place_id = pg_temp.place_id('test-paris')), 'the post is kept');
select pg_temp.check(not (select is_active from collections where slug = 'test-paris-set'), 'the city''s set is closed');
select pg_temp.check((select status from friend_challenges where place_id = pg_temp.place_id('test-paris')) = 'declined',
  'the open friend challenge is declined');
select pg_temp.check((select status from places where source_id = 'porto-clerigos') = 'active',
  'live cities are untouched');

select pg_temp.as_user('00000000-0000-0000-0000-00000000ee01');
select pg_temp.check(exists (select 1 from my_passport() where place_name = 'Test Paris place'),
  'the player''s passport still shows the paused place');
select pg_temp.as_anon();
do $$ begin
  perform pause_inactive_regions();
  raise exception 'should be denied';
exception when insufficient_privilege then
  raise notice 'ok - only the server can pause cities';
end $$;
rollback;
