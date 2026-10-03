-- Europe: places outside Sintra unlock exactly like Sintra's, and count on their city board.
begin;
insert into auth.users (id, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000ee01', '{"username":"traveller"}'),
  ('00000000-0000-0000-0000-00000000ee02', '{"username":"pal"}');

select pg_temp.check((select count(*) from places p join regions r on r.id = p.region_id
                      where r.slug <> 'sintra' and p.status = 'active') >= 70,
  'every launch city has active places');
select pg_temp.check(not exists (
    select 1 from regions r where r.is_active
      and not exists (select 1 from places p where p.region_id = r.id and p.status = 'active' and not p.is_hidden)),
  'no launch city is empty');

-- A player in Paris sees Paris places (and not Sintra's) and can unlock the Eiffel Tower.
select pg_temp.as_user('00000000-0000-0000-0000-00000000ee01');
select pg_temp.check((select count(*) from nearby_places(48.8566, 2.3522, 30000)) = 6
  and not exists (select 1 from nearby_places(48.8566, 2.3522, 30000) p join regions r on r.id = p.region_id where r.slug <> 'paris'),
  'nearby places in Paris are the six Paris places');

create temp table ps on commit drop as
  select (start_checkin(pg_temp.place_id('paris-eiffel'), 48.8584, 2.2945, 8) ->> 'session_id')::uuid as id;
grant select on ps to authenticated;
reset role;
select pg_temp.simulate_session((select id from ps), 130);
select pg_temp.as_user('00000000-0000-0000-0000-00000000ee01');
create temp table pr on commit drop as select complete_checkin((select id from ps)) as r;
grant select on pr to authenticated;
select pg_temp.check((select r ->> 'status' from pr) = 'verified', 'the Eiffel Tower can be unlocked with a verified visit');
select pg_temp.check((select (r ->> 'coins')::int from pr) > 0, 'unlocking in Paris pays coins');
select pg_temp.check(exists (select 1 from visits where place_id = pg_temp.place_id('paris-eiffel')),
  'the Paris visit is recorded');
select pg_temp.check((select username from leaderboard('region', 'paris') limit 1) = 'traveller',
  'the Paris discovery counts on the Paris leaderboard');
select pg_temp.check(not exists (select 1 from leaderboard('region', 'sintra') where username = 'traveller'),
  'and not on Sintra''s');

-- A city's hidden gem unlocks once revealed (Madrid's walled garden).
select pg_temp.check(not exists (select 1 from reveal_hidden_gem(40.4168, -3.7038)),
  'Madrid''s gem stays hidden from the city centre');
select pg_temp.check((select name from reveal_hidden_gem(40.4130, -3.7110)) = 'Prince of Anglona Garden',
  'Madrid''s gem is revealed within 200 m');
create temp table gs on commit drop as
  select (start_checkin(pg_temp.place_id('madrid-anglona'), 40.4127, -3.7118, 8) ->> 'session_id')::uuid as id;
grant select on gs to authenticated;
reset role;
select pg_temp.simulate_session((select id from gs), 130);
select pg_temp.as_user('00000000-0000-0000-0000-00000000ee01');
select pg_temp.check((complete_checkin((select id from gs)) ->> 'status') = 'verified',
  'a revealed gem in another city can be unlocked');

-- Friends can challenge each other to places in other cities.
select pg_temp.check(send_friend_request('00000000-0000-0000-0000-00000000ee02') = 'pending', 'friend request across cities');
select pg_temp.as_user('00000000-0000-0000-0000-00000000ee02');
select respond_friend_request('00000000-0000-0000-0000-00000000ee01', true);
select pg_temp.check(challenge_friend('00000000-0000-0000-0000-00000000ee01', pg_temp.place_id('rome-colosseum'), 'Rome next?') is not null,
  'a friend can be challenged to a place in another city');
rollback;
