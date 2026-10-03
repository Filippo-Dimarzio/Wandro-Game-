-- Arrival flights: only the city is remembered; a flight is a new city at least 300 km away.
begin;
insert into auth.users (id, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000bb01', '{"username":"flyer"}'),
  ('00000000-0000-0000-0000-00000000bb02', '{"username":"other"}');

select pg_temp.as_user('00000000-0000-0000-0000-00000000bb01');
select pg_temp.check((check_arrival(38.7975, -9.3905) ->> 'arrived')::boolean = false,
  'a first visit is not a flight');
select pg_temp.check((check_arrival(38.7975, -9.3905) ->> 'arrived')::boolean = false,
  'opening the app again in the same city is not a flight');
select pg_temp.check(check_arrival(38.7139, -9.1394) @> '{"arrived": false, "from": "sintra", "to": "lisbon"}',
  'Sintra to Lisbon is a short hop, not a flight');

create temp table fl on commit drop as select check_arrival(48.8566, 2.3522) as r;
grant select on fl to authenticated;
select pg_temp.check((select r @> '{"arrived": true, "from": "lisbon", "to": "paris"}' from fl),
  'landing in Paris after Lisbon is an arrival flight');
select pg_temp.check((select (r ->> 'km')::int between 1400 and 1500 from fl), 'the flight distance is returned');
select pg_temp.check((check_arrival(40, -30) ->> 'to') is null, 'outside the launch cities nothing is recorded');
select pg_temp.check((select region_slug from player_regions) = 'paris', 'only the city is stored, not coordinates');
select pg_temp.check(not exists (
    select 1 from information_schema.columns
    where table_name = 'player_regions' and column_name in ('lat', 'lng', 'location')),
  'the table has no coordinate columns');
select pg_temp.check((export_my_data() -> 'last_city' ->> 'region') = 'paris', 'the export includes the remembered city');

do $$ begin
  update player_regions set region_slug = 'rome';
  raise exception 'should be denied';
exception when insufficient_privilege then
  raise notice 'ok - players cannot edit their remembered city';
end $$;

select pg_temp.as_user('00000000-0000-0000-0000-00000000bb02');
select pg_temp.check(not exists (select 1 from player_regions), 'nobody can see another player''s city');

select pg_temp.as_anon();
do $$ begin
  perform check_arrival(48.8566, 2.3522);
  raise exception 'should be denied';
exception when insufficient_privilege then
  raise notice 'ok - anonymous visitors cannot check arrivals';
end $$;
rollback;
