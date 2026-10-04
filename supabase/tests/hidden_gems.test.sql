-- Europe regions and hidden gems: secret until you're within 200 m, coarse hints, no early check-ins.
begin;
insert into auth.users (id, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000f1', '{"username":"gem_hunter"}'),
  ('00000000-0000-0000-0000-0000000000f2', '{"username":"bystander"}');

select pg_temp.check((select count(*) from regions where is_active) = 5, 'the Portuguese launch cities are seeded');
select pg_temp.check(region_at(41.1407, -8.6131) = 'porto' and region_at(38.7876, -9.3906) = 'sintra',
  'region_at finds the city for a point');

select pg_temp.as_user('00000000-0000-0000-0000-0000000000f1');
select pg_temp.check(
  not exists (select 1 from places_public where id = pg_temp.place_id('sintra-fonte-mourisca')),
  'hidden gems are not in the public place list');
select pg_temp.check(
  not exists (select 1 from nearby_places(38.7983, -9.3858, 1000) where id = pg_temp.place_id('sintra-fonte-mourisca')),
  'hidden gems are not returned by nearby_places, even right next to them');
select pg_temp.check(
  not exists (select 1 from places where is_hidden),
  'hidden rows cannot be read from places directly');

-- Sintra centre: the fountain is ~410 m away, Peninha ~6 km, Lisbon's two gems ~22 km.
select pg_temp.check(hidden_gem_hint(38.7975, -9.3905) = '{"count": 4, "hint": "very_close"}'::jsonb,
  'the hint gives a count and a coarse distance band');
select pg_temp.check(hidden_gem_hint(40, -30) = '{"count": 0, "hint": null}'::jsonb,
  'no hint far from any gem');

do $$ begin
  perform start_checkin(pg_temp.place_id('sintra-fonte-mourisca'), 38.7983, -9.3858, 8);
  raise exception 'should not start';
exception when others then
  if sqlerrm <> 'place_not_active' then raise; end if;
  raise notice 'ok - a gem cannot be checked into before it is revealed';
end $$;

select pg_temp.check(not exists (select 1 from reveal_hidden_gem(38.7975, -9.3905)),
  'nothing is revealed from 400 m away');

create temp table rv on commit drop as select * from reveal_hidden_gem(38.7983, -9.3870);
grant select on rv to authenticated;
select pg_temp.check((select count(*) from rv) = 1 and (select name from rv) = 'Moorish Fountain' and (select is_hidden from rv),
  'within 200 m the closest gem is revealed');
select pg_temp.check(exists (select 1 from places_public where id = pg_temp.place_id('sintra-fonte-mourisca')),
  'a revealed gem shows up for its finder');
select pg_temp.check(not exists (select 1 from reveal_hidden_gem(38.7983, -9.3870)),
  'revealing again returns nothing new');
select pg_temp.check((hidden_gem_hint(38.7975, -9.3905) ->> 'count')::int = 3, 'the hint no longer counts it');
select pg_temp.check(start_checkin(pg_temp.place_id('sintra-fonte-mourisca'), 38.7983, -9.3858, 8) is not null,
  'once revealed, the gem can be checked into');

do $$ begin
  insert into hidden_reveals (user_id, place_id)
  values (auth.uid(), pg_temp.place_id('sintra-peninha'));
  raise exception 'should be denied';
exception when insufficient_privilege then
  raise notice 'ok - players cannot reveal gems by writing rows';
end $$;

select pg_temp.as_user('00000000-0000-0000-0000-0000000000f2');
select pg_temp.check(not exists (select 1 from places_public where id = pg_temp.place_id('sintra-fonte-mourisca')),
  'one player''s reveal does not show the gem to others');

-- Daily cap stops a spoofed position from sweeping a city.
reset role;
insert into hidden_reveals (user_id, place_id)
select '00000000-0000-0000-0000-0000000000f2', id from places
where is_hidden limit 10;
select pg_temp.as_user('00000000-0000-0000-0000-0000000000f2');
do $$ begin
  perform reveal_hidden_gem(38.7983, -9.3870);
  raise exception 'should be rate limited';
exception when others then
  if sqlerrm <> 'rate_limited' then raise; end if;
  raise notice 'ok - reveals are capped per day';
end $$;

select pg_temp.as_anon();
do $$ begin
  perform reveal_hidden_gem(38.7983, -9.3870);
  raise exception 'should be denied';
exception when insufficient_privilege then
  raise notice 'ok - anonymous visitors cannot reveal gems';
end $$;
rollback;
