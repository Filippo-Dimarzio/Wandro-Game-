-- Blank photos: others only see a photo once the server has checked it; a blank one is removed.
begin;
insert into auth.users (id, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000cc01', '{"username":"snapper"}'),
  ('00000000-0000-0000-0000-00000000cc02', '{"username":"viewer"}');
do $$ begin
  perform award_visit('00000000-0000-0000-0000-00000000cc01', pg_temp.place_id('pena'), 38.7876, -9.3906, 8, 130);
  perform award_visit('00000000-0000-0000-0000-00000000cc02', pg_temp.place_id('adraga'), 38.8236, -9.4731, 8, 130);
end $$;
insert into posts (user_id, visit_id, place_id, caption, photo_path)
select user_id, id, place_id, 'Pena!', user_id || '/' || id || '.jpg' from visits;
insert into friendships (user_a, user_b, requested_by, status) values
  ('00000000-0000-0000-0000-00000000cc01', '00000000-0000-0000-0000-00000000cc02', '00000000-0000-0000-0000-00000000cc01', 'accepted');
create temp table snap on commit drop as
  select id from posts where user_id = '00000000-0000-0000-0000-00000000cc01';
grant select on snap to authenticated, service_role;

select pg_temp.as_user('00000000-0000-0000-0000-00000000cc01');
select pg_temp.check((select photo_path from feed() where user_id = auth.uid()) is not null,
  'the author always sees their own photo');
do $$ begin
  perform record_photo_check((select id from snap), true);
  raise exception 'should be denied';
exception when insufficient_privilege then raise notice 'ok - players cannot mark their own photo as checked';
end $$;

select pg_temp.as_user('00000000-0000-0000-0000-00000000cc02');
select pg_temp.check((select photo_path from feed() where username = 'snapper') is null,
  'others don''t get an unchecked photo');

reset role;
set local role service_role;
select pg_temp.check(record_photo_check((select id from snap), true) is null, 'a good photo passes');
reset role;
select pg_temp.as_user('00000000-0000-0000-0000-00000000cc02');
select pg_temp.check((select photo_path from feed() where username = 'snapper') is not null,
  'a checked photo is shown to friends');

reset role;
set local role service_role;
select pg_temp.check(record_photo_check((select id from snap), false) like '%.jpg',
  'a blank photo hands back its file to delete');
reset role;
select pg_temp.check((select photo_path is null and photo_checked_at is not null from posts where id = (select id from snap)),
  'a blank photo is removed from the post, even after it had been shown');
rollback;
