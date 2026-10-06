-- Portugal: the five launch cities unlock alike; other cities are kept but hidden;
-- a city's hidden gems appear once you've discovered 5 places there.
begin;
insert into auth.users (id, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000ee01', '{"username":"traveller"}'),
  ('00000000-0000-0000-0000-00000000ee02', '{"username":"pal"}');

select pg_temp.check((select array_agg(slug order by slug) from regions where is_active)
                     = array['aveiro', 'evora', 'lisbon', 'porto', 'sintra'],
  'only the Portuguese cities are active');
select pg_temp.check((select count(*) from regions where not is_active) >= 18,
  'the other cities are kept, switched off');
select pg_temp.check(not exists (
    select 1 from places p join regions r on r.id = p.region_id where not r.is_active and p.status = 'active'),
  'no place in a hidden city is playable');
select pg_temp.check(not exists (
    select 1 from regions r, unnest(enum_range(null::place_category)) as c(category)
    where r.is_active
      and c.category <> 'travel'  -- retired: folded into culture
      and (select count(*) from places p
           where p.region_id = r.id and p.category = c.category and p.status = 'active' and not p.is_hidden) < 5),
  'every city has at least 5 visible challenges in every category');
select pg_temp.check(not exists (
    select 1 from regions r where r.is_active
      and (select count(*) from places p where p.region_id = r.id and p.is_hidden) < 2),
  'every city has hidden gems');

-- A player in Évora sees Évora places (and no other city's) and can unlock the Roman Temple.
select pg_temp.as_user('00000000-0000-0000-0000-00000000ee01');
select pg_temp.check((select count(*) from nearby_places(38.5714, -7.9135, 30000)) = 40
  and not exists (select 1 from nearby_places(38.5714, -7.9135, 30000) p join regions r on r.id = p.region_id where r.slug <> 'evora'),
  'nearby places in Évora are the 40 visible Évora places');

create temp table ps on commit drop as
  select (start_checkin(pg_temp.place_id('evora-roman-temple'), 38.5728, -7.9073, 8) ->> 'session_id')::uuid as id;
grant select on ps to authenticated;
reset role;
select pg_temp.simulate_session((select id from ps), 130);
select pg_temp.as_user('00000000-0000-0000-0000-00000000ee01');
create temp table pr on commit drop as select complete_checkin((select id from ps)) as r;
grant select on pr to authenticated;
select pg_temp.check((select r ->> 'status' from pr) = 'verified', 'the Roman Temple can be unlocked with a verified visit');
select pg_temp.check((select (r ->> 'coins')::int from pr) > 0, 'unlocking in Évora pays coins');
select pg_temp.check((select username from leaderboard('region', 'evora') limit 1) = 'traveller',
  'the Évora discovery counts on the Évora leaderboard');
select pg_temp.check(not exists (select 1 from leaderboard('region', 'sintra') where username = 'traveller'),
  'and not on Sintra''s');

-- Hidden gems: still secret after 4 discoveries in Évora, all shown after the 5th.
reset role;
do $$ begin
  perform award_visit('00000000-0000-0000-0000-00000000ee01', pg_temp.place_id(s), 38.57, -7.91, 8, 130)
  from unnest(array['evora-se', 'evora-bones', 'evora-university']) as s;
end $$;
select pg_temp.as_user('00000000-0000-0000-0000-00000000ee01');
select pg_temp.check(not exists (select 1 from places_public where is_hidden),
  'with 4 discoveries in Évora its gems stay hidden');
reset role;
do $$ begin
  perform award_visit('00000000-0000-0000-0000-00000000ee01', pg_temp.place_id('evora-aqueduct'), 38.5755, -7.9105, 8, 130);
end $$;
select pg_temp.as_user('00000000-0000-0000-0000-00000000ee01');
select pg_temp.check((select array_agg(name order by name) from places_public where is_hidden)
                     = array['Pátio de São Miguel', 'Torre das Cinco Quinas'],
  'the 5th discovery in Évora shows all of Évora''s gems, and no other city''s');
select pg_temp.as_user('00000000-0000-0000-0000-00000000ee02');
select pg_temp.check(not exists (select 1 from places_public where is_hidden),
  'another player still cannot see them');

-- A gem elsewhere is still revealed one by one within 200 m (Aveiro's Misericórdia).
select pg_temp.check((select name from reveal_hidden_gem(40.6413, -8.6520)) = 'Misericórdia Church',
  'Aveiro''s gem is revealed within 200 m');

-- Friends can challenge each other to places in other cities.
select pg_temp.as_user('00000000-0000-0000-0000-00000000ee01');
select pg_temp.check(send_friend_request('00000000-0000-0000-0000-00000000ee02') = 'pending', 'friend request across cities');
select pg_temp.as_user('00000000-0000-0000-0000-00000000ee02');
select respond_friend_request('00000000-0000-0000-0000-00000000ee01', true);
select pg_temp.check(challenge_friend('00000000-0000-0000-0000-00000000ee01', pg_temp.place_id('aveiro-costa-nova'), 'Aveiro next?') is not null,
  'a friend can be challenged to a place in another city');

-- Suggestions become missions with their own base points (BASE_POINTS).
reset role;
update profiles set is_moderator = true where id = '00000000-0000-0000-0000-00000000ee02';
insert into place_submissions (user_id, name, location, category, is_public_access, is_safe) values
  ('00000000-0000-0000-0000-00000000ee01', 'Test mural', extensions.st_setsrid(extensions.st_makepoint(-8.65, 40.64), 4326)::extensions.geography, 'art', true, true),
  ('00000000-0000-0000-0000-00000000ee01', 'Test funicular', extensions.st_setsrid(extensions.st_makepoint(-8.61, 41.14), 4326)::extensions.geography, 'culture', true, true);
select pg_temp.as_user('00000000-0000-0000-0000-00000000ee02');
create temp table approved on commit drop as
  select name, approve_place_submission(id) as place_id
  from place_submissions where name in ('Test mural', 'Test funicular');
grant select on approved to authenticated;
select pg_temp.check(
  (select array_agg(p.base_points order by a.name) from approved a join places p on p.id = a.place_id) = array[100, 100],
  'approved art and culture places get 100 base points');
reset role;
do $$ begin
  insert into place_submissions (user_id, name, location, category, is_public_access, is_safe)
  values ('00000000-0000-0000-0000-00000000ee01', 'Old tram', extensions.st_setsrid(extensions.st_makepoint(-9.14, 38.71), 4326)::extensions.geography, 'travel', true, true);
  raise exception 'travel should be retired';
exception when check_violation then raise notice 'ok - the travel category is retired';
end $$;
select pg_temp.check(not exists (select 1 from places where category = 'travel'), 'no place is filed under travel');
rollback;
