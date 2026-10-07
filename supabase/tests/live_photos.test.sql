-- Live photos (BeReal style): a selfie rides along with the photo and follows its rules.
begin;
insert into auth.users (id, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000dd01', '{"username":"liver"}'),
  ('00000000-0000-0000-0000-00000000dd02', '{"username":"pal"}');
do $$ begin
  perform award_visit('00000000-0000-0000-0000-00000000dd01', pg_temp.place_id('pena'), 38.7876, -9.3906, 8, 130);
  perform award_visit('00000000-0000-0000-0000-00000000dd02', pg_temp.place_id('adraga'), 38.8236, -9.4731, 8, 130);
end $$;
insert into friendships (user_a, user_b, requested_by, status) values
  ('00000000-0000-0000-0000-00000000dd01', '00000000-0000-0000-0000-00000000dd02', '00000000-0000-0000-0000-00000000dd01', 'accepted');

do $$ begin
  insert into posts (user_id, visit_id, place_id, selfie_path)
  select user_id, id, place_id, user_id || '/x-selfie.jpg' from visits
  where user_id = '00000000-0000-0000-0000-00000000dd01';
  raise exception 'a selfie alone should be refused';
exception when check_violation then raise notice 'ok - a selfie needs the main photo';
end $$;

-- Both players post (pal's post unlocks the feed for pal).
insert into posts (user_id, visit_id, place_id, caption, photo_path, selfie_path)
select user_id, id, place_id, 'Live!', user_id || '/' || id || '.jpg', user_id || '/' || id || '-selfie.jpg' from visits;
create temp table lp on commit drop as
  select id from posts where user_id = '00000000-0000-0000-0000-00000000dd01';
grant select on lp to authenticated, service_role;

select pg_temp.as_user('00000000-0000-0000-0000-00000000dd01');
select pg_temp.check((select selfie_path from feed() where user_id = auth.uid()) like '%-selfie.jpg',
  'the author sees their own live photo selfie');
select pg_temp.check((select selfie_path from my_passport() limit 1) like '%-selfie.jpg',
  'the selfie stays in your library');
select pg_temp.check((export_my_data() -> 'posts' -> 0 ->> 'selfie_path') like '%-selfie.jpg',
  'the selfie is in your data export');

select pg_temp.as_user('00000000-0000-0000-0000-00000000dd02');
select pg_temp.check((select selfie_path from feed() where username = 'liver') is null,
  'friends don''t get an unchecked selfie');

reset role;
set local role service_role;
select pg_temp.check(cardinality(record_photo_check((select id from lp), true)) = 0, 'a good live photo passes');
reset role;
select pg_temp.as_user('00000000-0000-0000-0000-00000000dd02');
select pg_temp.check((select selfie_path from feed() where username = 'liver') like '%-selfie.jpg',
  'friends see a checked live photo with its selfie');

reset role;
set local role service_role;
select pg_temp.check(cardinality(record_photo_check((select id from lp), false)) = 2,
  'a blank live photo hands back both files to delete');
reset role;
select pg_temp.check((select photo_path is null and selfie_path is null from posts where id = (select id from lp)),
  'and both are removed from the post');
rollback;
