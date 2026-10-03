-- Phase 5: data export and account deletion.
begin;
insert into auth.users (id, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000f1', '{"username":"gone"}'),
  ('00000000-0000-0000-0000-0000000000f2', '{"username":"stays"}');
do $$ begin
  perform award_visit('00000000-0000-0000-0000-0000000000f1', pg_temp.place_id('pena'), 38.78, -9.39, 8, 130);
  perform award_visit('00000000-0000-0000-0000-0000000000f2', pg_temp.place_id('pena'), 38.78, -9.39, 8, 130);
end $$;
insert into follows (follower_id, followee_id) values ('00000000-0000-0000-0000-0000000000f2', '00000000-0000-0000-0000-0000000000f1');

select pg_temp.as_user('00000000-0000-0000-0000-0000000000f1');
create temp table ex on commit drop as select export_my_data() as d;
grant select on ex to authenticated;
select pg_temp.check((select d -> 'profile' ->> 'username' from ex) = 'gone', 'export contains the profile');
select pg_temp.check((select jsonb_array_length(d -> 'visits') from ex) = 1, 'export contains visits');
select pg_temp.check((select jsonb_array_length(d -> 'coins_and_xp') from ex) > 0, 'export contains the coin ledger');
select pg_temp.check((select jsonb_array_length(d -> 'followers') from ex) = 1, 'export contains followers');
select pg_temp.check((select not (d -> 'profile' ? 'is_moderator') from ex), 'export omits internal flags');

do $$ begin perform delete_my_account(); end $$;
reset role;
select pg_temp.check(not exists (select 1 from profiles where id = '00000000-0000-0000-0000-0000000000f1'), 'account deletion removes the profile');
select pg_temp.check(not exists (select 1 from visits where user_id = '00000000-0000-0000-0000-0000000000f1'), 'account deletion removes visits');
select pg_temp.check(not exists (select 1 from points_ledger where user_id = '00000000-0000-0000-0000-0000000000f1'), 'account deletion removes the ledger');
select pg_temp.check(not exists (select 1 from follows where followee_id = '00000000-0000-0000-0000-0000000000f1'), 'account deletion removes follows');
select pg_temp.check(exists (select 1 from visits where user_id = '00000000-0000-0000-0000-0000000000f2'), 'other explorers keep their data');
select pg_temp.check((select first_discoverer_id from place_stats where place_id = pg_temp.place_id('pena')) is null, 'pioneer credit is cleared, not reassigned');
select pg_temp.check((select unique_visitors from place_stats where place_id = pg_temp.place_id('pena')) = 2, 'anonymous visitor counts remain');

select pg_temp.as_anon();
do $$ begin
  perform delete_my_account();
  raise exception 'anon delete should fail';
exception when insufficient_privilege then raise notice 'ok - anonymous callers cannot delete accounts';
end $$;
rollback;
