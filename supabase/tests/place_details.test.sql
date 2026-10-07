-- Place details (Learn and Plan) reach the app through places_public and nearby_places(),
-- and only the server writes them.
begin;
insert into auth.users (id, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000f1', '{"username":"fiona"}');

select pg_temp.check(
  (select p.details ->> 'teaser' from places_public p join places x on x.id = p.id
   where x.source = 'seed' and x.source_id = 'pena') like 'A fairy-tale palace%',
  'places_public carries the details');
select pg_temp.check(
  (select jsonb_array_length(n.details -> 'facts') from nearby_places(38.7876, -9.3906, 2000) n
   join places x on x.id = n.id where x.source_id = 'pena') = 3,
  'nearby_places() returns the facts');
select pg_temp.check(
  (select count(*) from places where details = '{}'::jsonb and source = 'seed' and source_id = 'lisbon-belem-tower') = 1,
  'places without details default to an empty object');

select pg_temp.as_user('00000000-0000-0000-0000-0000000000f1');
do $$ begin
  update places set details = '{"teaser":"hacked"}' where source_id = 'pena';
  raise exception 'a player should not edit place details';
exception when insufficient_privilege then
  raise notice 'ok - players cannot edit place details';
end $$;
reset role;

do $$ begin
  update places set details = '[]'::jsonb where source_id = 'pena';
  raise exception 'details must be an object';
exception when check_violation then
  raise notice 'ok - details must be a JSON object';
end $$;
rollback;
