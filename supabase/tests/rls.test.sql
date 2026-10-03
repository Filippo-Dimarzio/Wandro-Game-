-- RLS: users can't write server-owned tables, read others' private data, or escalate.
begin;
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'a@test', '{"username":"ana"}'),
  ('00000000-0000-0000-0000-00000000000b', 'b@test', '{"username":"ana"}');

select pg_temp.check((select username::text from profiles where id = '00000000-0000-0000-0000-00000000000a') = 'ana',
  'profile is created from sign-up metadata');
select pg_temp.check((select username::text from profiles where id = '00000000-0000-0000-0000-00000000000b') like 'wanderer_%',
  'duplicate username falls back to a generated one');

insert into visits (user_id, place_id, lat, lng, accuracy_m, dwell_seconds)
select '00000000-0000-0000-0000-00000000000b', id, 38.78, -9.39, 10, 130 from places limit 1;

select pg_temp.as_anon();
select pg_temp.check((select count(*) from places_public where region_id = (select id from regions where slug = 'sintra')) = 21, 'anon can read active places, minus hidden gems');
select pg_temp.check((select count(*) from profiles) = 0, 'anon cannot read profiles');

reset role;
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
select pg_temp.check((select count(*) from visits) = 0, 'user cannot read another user''s visits');
select pg_temp.check((select count(*) from profiles) = 2, 'signed-in user can see profile cards');

update profiles set home_city = 'Sintra' where id = '00000000-0000-0000-0000-00000000000a';
update profiles set home_city = 'Hacked' where id = '00000000-0000-0000-0000-00000000000b';
reset role;
select pg_temp.check((select home_city from profiles where id = '00000000-0000-0000-0000-00000000000a') = 'Sintra',
  'user can edit own profile');
select pg_temp.check((select home_city from profiles where id = '00000000-0000-0000-0000-00000000000b') is null,
  'user cannot edit someone else''s profile');
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');

do $$ begin
  begin update profiles set xp = 99999 where id = auth.uid();
    raise exception 'xp update should fail';
  exception when insufficient_privilege then raise notice 'ok - cannot edit own xp'; end;
  begin update profiles set is_moderator = true where id = auth.uid();
    raise exception 'moderator escalation should fail';
  exception when insufficient_privilege then raise notice 'ok - cannot make self moderator'; end;
  begin insert into visits (user_id, place_id, lat, lng, accuracy_m, dwell_seconds)
    select auth.uid(), id, 0, 0, 1, 999 from places limit 1;
    raise exception 'visit insert should fail';
  exception when insufficient_privilege then raise notice 'ok - cannot insert visits'; end;
  begin insert into points_ledger (user_id, kind, points) values (auth.uid(), 'visit', 1000);
    raise exception 'ledger insert should fail';
  exception when insufficient_privilege then raise notice 'ok - cannot award own points'; end;
  begin update place_stats set unique_visitors = 0;
    raise exception 'stats update should fail';
  exception when insufficient_privilege then raise notice 'ok - cannot change rarity'; end;
  begin insert into places (name, location, category, base_points, source, source_id)
    values ('x', 'SRID=4326;POINT(0 0)', 'other', 1, 'x', 'x');
    raise exception 'place insert should fail';
  exception when insufficient_privilege then raise notice 'ok - cannot create places directly'; end;
end $$;

reset role;
do $$ begin
  begin
    insert into visits (user_id, place_id, lat, lng, accuracy_m, dwell_seconds)
    select user_id, place_id, 0, 0, 1, 1 from visits limit 1;
    raise exception 'duplicate visit should fail';
  exception when unique_violation then raise notice 'ok - one completion per user per place'; end;
  begin
    update places set is_private_property = true where source_id = 'pena';
    raise exception 'active private place should fail';
  exception when check_violation then raise notice 'ok - private property cannot be an active challenge'; end;
end $$;
rollback;
