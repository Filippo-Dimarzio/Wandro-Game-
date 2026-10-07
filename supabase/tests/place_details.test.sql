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

-- Checked facts keep their source next to them; local-source facts are flagged for review.
select pg_temp.check(
  (select bool_and(f ? 'source' and f ->> 'source' like 'https://%')
   from places x, jsonb_array_elements(x.details -> 'facts') f
   where x.source = 'seed' and x.source_id in ('sintra-lagoa-azul', 'sintra-chalet-biester',
     'sintra-tram-banzao', 'sintra-tram-galamares', 'sintra-natural-history')),
  'each checked fact carries its https source');
select pg_temp.check(
  (select bool_and((f ->> 'needsReview')::boolean)
   from places x, jsonb_array_elements(x.details -> 'facts') f
   where x.source = 'seed' and x.source_id = 'sintra-almocageme'),
  'Almoçageme facts from local sources are flagged for curator review');

-- The Toy Museum closed in 2014; the NewsMuseum waits as a draft for a curator.
select pg_temp.check(
  not exists (select 1 from places where source = 'seed' and source_id = 'brinquedo' and status = 'active'),
  'the closed Toy Museum is never an active place');
select pg_temp.check(
  (select status from places where source = 'seed' and source_id = 'sintra-newsmuseum') = 'draft'
  and not exists (select 1 from places_public p join places x on x.id = p.id
                  where x.source_id = 'sintra-newsmuseum'),
  'the NewsMuseum is a draft, hidden from players until a curator approves it');

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
