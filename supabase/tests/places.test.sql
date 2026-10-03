-- Coast category and opening hours are exposed through the public read path.
begin;
select pg_temp.as_anon();
select pg_temp.check(
  (select count(*) from places_public where category = 'coast') = 4,
  'coastal places are listed under the coast category');
select pg_temp.check(
  (select opening_hours -> 0 ->> 'open' from places_public
   where name = 'Sintra Live Music Corner') = '21:30',
  'opening hours are readable by anyone');
select pg_temp.check(
  (select opening_hours from places_public where name = 'Pena Palace') is null,
  'places without set times have no opening hours');

reset role;
do $$ begin
  update places set opening_hours = '{"open": "10:00"}' where name = 'Pena Palace';
  raise exception 'should reject non-array opening hours';
exception when check_violation then
  raise notice 'ok - opening hours must be an array';
end $$;

select pg_temp.as_user('00000000-0000-0000-0000-0000000000e1');
do $$ begin
  update places set opening_hours = '[]' where name = 'Pena Palace';
  if found then raise exception 'clients must not edit places'; end if;
  raise notice 'ok - clients cannot edit opening hours';
exception when insufficient_privilege then
  raise notice 'ok - clients cannot edit opening hours';
end $$;
rollback;
