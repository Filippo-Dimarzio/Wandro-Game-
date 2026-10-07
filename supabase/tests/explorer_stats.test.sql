-- my_explorer_stats(): the caller's own record only.
begin;
insert into auth.users (id, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000a7', '{"username":"anna"}'),
  ('00000000-0000-0000-0000-0000000000a8', '{"username":"bruno"}');

insert into visits (user_id, place_id, lat, lng, accuracy_m, dwell_seconds)
select '00000000-0000-0000-0000-0000000000a7', id, 38.79, -9.39, 8, 140
from places where source = 'seed' and source_id in ('pena', 'mouros', 'cruz-alta');
insert into visits (user_id, place_id, lat, lng, accuracy_m, dwell_seconds)
select '00000000-0000-0000-0000-0000000000a8', id, 38.79, -9.39, 8, 140
from places where source = 'seed' and source_id = 'adraga';
insert into points_ledger (user_id, kind, points, xp)
values ('00000000-0000-0000-0000-0000000000a7', 'first_discoverer', 50, 50);

select pg_temp.as_user('00000000-0000-0000-0000-0000000000a7');
create temp table s on commit drop as select my_explorer_stats() as j;
select pg_temp.check((select (j ->> 'total')::int from s) = 3, 'counts only my discoveries');
select pg_temp.check((select (j -> 'by_category' ->> 'heritage')::int from s) = 2
  and (select j -> 'by_category' ->> 'coast' from s) is null, 'groups them by category');
select pg_temp.check(
  (select (c ->> 'found')::int from s, jsonb_array_elements(j -> 'cities') c where c ->> 'region' = 'sintra') = 3
  and (select (c ->> 'total')::int from s, jsonb_array_elements(j -> 'cities') c where c ->> 'region' = 'sintra') > 3,
  'shows found and total per city');
select pg_temp.check((select (j ->> 'first_discoveries')::int from s) = 1, 'counts first discoveries');
select pg_temp.check((select j -> 'rarest' ->> 'name' from s) is not null, 'names the rarest find');
reset role;

select pg_temp.as_anon();
do $$ begin
  perform my_explorer_stats();
  raise exception 'anon should not call my_explorer_stats';
exception when insufficient_privilege then
  raise notice 'ok - anonymous visitors cannot call it';
end $$;
rollback;
