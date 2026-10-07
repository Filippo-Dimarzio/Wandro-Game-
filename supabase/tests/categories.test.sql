-- Food, drink and markets are Culture; genuine oddities are Curiosities (mirrors packages/shared).
begin;
select pg_temp.check(
  (select count(*) from places where source = 'seed' and category = 'culture' and source_id in
    ('lisbon-pasteis-belem', 'lisbon-ginjinha', 'lisbon-feira-ladra', 'sintra-piriquita', 'porto-majestic')) = 5,
  'bakeries, bars, cafés and markets are Culture');
select pg_temp.check(
  (select count(*) from places where source = 'seed' and category = 'other' and source_id in
    ('aveiro-canal-piramides', 'lisbon-casa-dos-bicos', 'porto-agramonte', 'evora-graca')) = 4,
  'oddities are Curiosities');
select pg_temp.check(
  (select base_points from places where source = 'seed' and source_id = 'lisbon-pasteis-belem') = 100,
  'moved places earn their new category''s base points');
select pg_temp.check(
  (select category from places where source = 'seed' and source_id = 'lisbon-aqueduct') = 'heritage'
  and (select count(*) from places where source = 'seed' and category = 'culture'
       and source_id in ('aveiro-moliceiro-ride', 'aveiro-sao-jacinto-ferry')) = 2,
  'the aqueduct is Heritage; the boat ride and ferry are Culture');
select pg_temp.check(
  (select category from places where source = 'seed' and source_id = 'capuchos') = 'other'
  and not exists (select 1 from places where source = 'seed' and source_id = 'sintra-capuchos'
                  and status = 'active'),
  'the Convent of the Capuchos is one Curiosity, not two places');
-- Private estates are never active challenges (CLAUDE.md rule 6).
insert into places (name, location, category, base_points, source, source_id, status, region_id)
select 'Quinta do Relógio', extensions.st_setsrid(extensions.st_makepoint(-9.3936, 38.7972), 4326)::extensions.geography,
       'heritage', 120, 'seed', 'sintra-quinta-relogio', 'active', r.id
from regions r where r.slug = 'sintra'
on conflict (source, source_id) do update set status = 'active', is_private_property = false;
update places set is_private_property = true, status = 'closed'
where source = 'seed' and source_id in ('sintra-quinta-relogio', 'sintra-penha-verde');
select pg_temp.check(
  (select is_private_property and status = 'closed' from places
   where source = 'seed' and source_id = 'sintra-quinta-relogio'),
  'private estates are marked private and closed');
do $$ begin
  update places set status = 'active' where source = 'seed' and source_id = 'sintra-quinta-relogio';
  raise exception 'a private place must not become active';
exception when check_violation then
  raise notice 'ok - a private place can never be an active challenge';
end $$;
select pg_temp.check(
  (select category from places where source = 'seed' and source_id = 'sintra-national-palace') = 'heritage',
  'the Sintra National Palace is Heritage');
rollback;
