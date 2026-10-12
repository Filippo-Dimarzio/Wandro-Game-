-- The Algarve: a live region with Faro's airport, challenges in every category and surf spots.
begin;
insert into auth.users (id, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000a7', '{"username":"surfer"}');

select pg_temp.check((select is_active and airport = 'FAO' from regions where slug = 'algarve'),
  'the Algarve is live and flies into Faro');
select pg_temp.check(region_at(37.0058, -8.9442) = 'algarve' and region_at(37.1268, -7.6488) = 'algarve',
  'Sagres and Tavira are both in the Algarve');
select pg_temp.check((select min(n) from (
    select count(*) as n from places p join regions r on r.id = p.region_id
    where r.slug = 'algarve' and p.status = 'active' and not p.is_hidden
    group by p.category) c) >= 5
  and (select count(distinct p.category) from places p join regions r on r.id = p.region_id
       where r.slug = 'algarve') = 7,
  'five or more challenges in each of the seven categories');
select pg_temp.check((select count(*) from places where source = 'seed'
    and source_id in ('algarve-arrifana', 'algarve-amado', 'algarve-tonel', 'algarve-benagil', 'algarve-marinha')) = 5,
  'surf and water challenges are seeded');
select pg_temp.check((select count(*) from collections c join regions r on r.id = c.region_id
    where r.slug = 'algarve' and c.is_active) = 2, 'two city sets');

select pg_temp.as_user('00000000-0000-0000-0000-0000000000a7');
select pg_temp.check(check_arrival(38.7139, -9.1394) ->> 'to' = 'lisbon', 'start in Lisbon');
select pg_temp.check(check_arrival(37.0891, -8.2479) @> '{"arrived": true, "from": "lisbon", "to": "algarve"}',
  'Lisbon to the Algarve is a trip');
select pg_temp.check(not exists (select 1 from places where name = 'Roman Ruins of Milreu'),
  'its hidden gems stay hidden until found');
reset role;
rollback;
