-- Friends: mutual requests, privacy, friend challenges, completion on discovery, blocking, export.
begin;
insert into auth.users (id, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000aa01', '{"username":"ana"}'),
  ('00000000-0000-0000-0000-00000000aa02', '{"username":"ben"}'),
  ('00000000-0000-0000-0000-00000000aa03', '{"username":"cai"}'),
  ('00000000-0000-0000-0000-00000000aa04', '{"username":"dan"}');
update profiles set is_private = true where id = '00000000-0000-0000-0000-00000000aa02';

-- Ben (private) has a verified visit and a post.
do $$ begin
  perform award_visit('00000000-0000-0000-0000-00000000aa02', pg_temp.place_id('pena'), 38.7876, -9.3906, 8, 130);
end $$;
insert into posts (user_id, visit_id, place_id, caption)
select user_id, id, place_id, 'Palace in the clouds' from visits where user_id = '00000000-0000-0000-0000-00000000aa02';
-- Ana posts today too, so today's moments are unlocked for her.
do $$ begin
  perform award_visit('00000000-0000-0000-0000-00000000aa01', pg_temp.place_id('capuchos'), 38.784, -9.433, 8, 130);
end $$;
insert into posts (user_id, visit_id, place_id, caption)
select user_id, id, place_id, 'Cork walls' from visits where user_id = '00000000-0000-0000-0000-00000000aa01';

-- Requests
select pg_temp.as_user('00000000-0000-0000-0000-00000000aa01');
do $$ begin
  perform send_friend_request(auth.uid());
  raise exception 'should fail';
exception when others then
  if sqlerrm <> 'cannot_friend_self' then raise; end if;
  raise notice 'ok - you cannot friend yourself';
end $$;
select pg_temp.check(send_friend_request('00000000-0000-0000-0000-00000000aa02') = 'pending', 'a friend request starts pending');
select pg_temp.check(send_friend_request('00000000-0000-0000-0000-00000000aa02') = 'pending', 'sending again is idempotent');
select pg_temp.check(friendship_with('00000000-0000-0000-0000-00000000aa02') = 'outgoing', 'the sender sees an outgoing request');
select pg_temp.check(not exists (select 1 from posts where user_id = '00000000-0000-0000-0000-00000000aa02'),
  'a pending request does not open a private profile');
do $$ begin
  insert into friendships (user_a, user_b, requested_by, status)
  values ('00000000-0000-0000-0000-00000000aa01', '00000000-0000-0000-0000-00000000aa03',
          '00000000-0000-0000-0000-00000000aa01', 'accepted');
  raise exception 'should be denied';
exception when insufficient_privilege then
  raise notice 'ok - friendships cannot be written directly';
end $$;
do $$ begin
  perform respond_friend_request('00000000-0000-0000-0000-00000000aa02', true);
  raise exception 'should fail';
exception when others then
  if sqlerrm <> 'request_not_found' then raise; end if;
  raise notice 'ok - the sender cannot accept their own request';
end $$;

select pg_temp.as_user('00000000-0000-0000-0000-00000000aa02');
select pg_temp.check(friendship_with('00000000-0000-0000-0000-00000000aa01') = 'incoming', 'the recipient sees an incoming request');
select pg_temp.check(jsonb_array_length(my_friends() -> 'incoming') = 1, 'my_friends lists incoming requests');
select respond_friend_request('00000000-0000-0000-0000-00000000aa01', true);
select pg_temp.check(are_friends('00000000-0000-0000-0000-00000000aa01', '00000000-0000-0000-0000-00000000aa02'),
  'accepting makes you friends');
select pg_temp.check((my_friends() -> 'friends' -> 0 ->> 'username') = 'ana', 'my_friends lists friends');

select pg_temp.as_user('00000000-0000-0000-0000-00000000aa01');
select pg_temp.check(exists (select 1 from posts where user_id = '00000000-0000-0000-0000-00000000aa02'),
  'friends can see a private profile''s posts');
select pg_temp.check(exists (select 1 from leaderboard('friends') where username = 'ben'),
  'friends appear on the friends leaderboard');

-- Two people asking each other become friends straight away.
select pg_temp.as_user('00000000-0000-0000-0000-00000000aa03');
select send_friend_request('00000000-0000-0000-0000-00000000aa04');
select pg_temp.as_user('00000000-0000-0000-0000-00000000aa04');
select pg_temp.check(send_friend_request('00000000-0000-0000-0000-00000000aa03') = 'accepted',
  'asking someone who already asked you accepts');

-- Challenges
select pg_temp.as_user('00000000-0000-0000-0000-00000000aa01');
do $$ begin
  perform challenge_friend('00000000-0000-0000-0000-00000000aa03', pg_temp.place_id('adraga'), 'hi');
  raise exception 'should fail';
exception when others then
  if sqlerrm <> 'not_friends' then raise; end if;
  raise notice 'ok - only friends can be challenged';
end $$;
do $$ begin
  perform challenge_friend('00000000-0000-0000-0000-00000000aa02', pg_temp.place_id('pena'), null);
  raise exception 'should fail';
exception when others then
  if sqlerrm <> 'already_discovered' then raise; end if;
  raise notice 'ok - you cannot challenge a friend to a place they have found';
end $$;
do $$ begin
  perform challenge_friend('00000000-0000-0000-0000-00000000aa02', pg_temp.place_id('adraga'), repeat('x', 281));
  raise exception 'should fail';
exception when others then
  if sqlerrm <> 'note_too_long' then raise; end if;
  raise notice 'ok - notes are capped at 280 characters';
end $$;
do $$ begin
  perform challenge_friend('00000000-0000-0000-0000-00000000aa02', pg_temp.place_id('sintra-fonte-mourisca'), null);
  raise exception 'should fail';
exception when others then
  if sqlerrm <> 'place_not_active' then raise; end if;
  raise notice 'ok - hidden gems cannot be shared';
end $$;

create temp table fc on commit drop as
  select challenge_friend('00000000-0000-0000-0000-00000000aa02', pg_temp.place_id('adraga'), '  Go at low tide for the arches  ') as id;
grant select on fc to authenticated;
select pg_temp.check(challenge_friend('00000000-0000-0000-0000-00000000aa02', pg_temp.place_id('adraga'), 'again') = (select id from fc),
  'the same open challenge is not sent twice');
select pg_temp.check((select note from friend_challenges where id = (select id from fc)) = 'Go at low tide for the arches',
  'notes are trimmed');
do $$ begin
  update friend_challenges set status = 'completed' where id = (select id from fc);
  raise exception 'should be denied';
exception when insufficient_privilege then
  raise notice 'ok - challenges cannot be edited directly';
end $$;
do $$ begin
  perform respond_friend_challenge((select id from fc), true);
  raise exception 'should fail';
exception when others then
  if sqlerrm <> 'challenge_not_found' then raise; end if;
  raise notice 'ok - only the recipient can answer a challenge';
end $$;

select pg_temp.as_user('00000000-0000-0000-0000-00000000aa02');
select pg_temp.check((my_friend_challenges() -> 0 ->> 'direction') = 'incoming'
  and (my_friend_challenges() -> 0 ->> 'friend_username') = 'ana', 'the recipient sees the challenge and who sent it');
select respond_friend_challenge((select id from fc), true);
select pg_temp.check((select status from friend_challenges where id = (select id from fc)) = 'accepted', 'challenges can be accepted');

select pg_temp.as_user('00000000-0000-0000-0000-00000000aa03');
select pg_temp.check(not exists (select 1 from friend_challenges), 'other players cannot read the challenge');

reset role;
do $$ begin
  perform award_visit('00000000-0000-0000-0000-00000000aa02', pg_temp.place_id('adraga'), 38.8236, -9.4731, 8, 130);
end $$;
select pg_temp.check((select status from friend_challenges where id = (select id from fc)) = 'completed',
  'discovering the place completes the challenge');

-- Export includes friends and challenges.
select pg_temp.as_user('00000000-0000-0000-0000-00000000aa01');
select pg_temp.check(jsonb_array_length(export_my_data() -> 'friends') = 1
  and jsonb_array_length(export_my_data() -> 'friend_challenges') = 1
  and export_my_data() ? 'profile', 'the data export includes friends and challenges');

-- Reporting a note lets a moderator remove it.
insert into reports (reporter_id, target_type, target_id, reason)
values (auth.uid(), 'friend_challenge', (select id from fc), 'test report');
reset role;
update profiles set is_moderator = true where id = '00000000-0000-0000-0000-00000000aa04';
select pg_temp.as_user('00000000-0000-0000-0000-00000000aa04');
select resolve_report((select id from reports where target_id = (select id from fc)), true);
reset role;
select pg_temp.check((select note from friend_challenges where id = (select id from fc)) is null,
  'moderators can remove a reported note');

-- Blocking ends the friendship and declines open challenges.
select pg_temp.as_user('00000000-0000-0000-0000-00000000aa01');
create temp table fc2 on commit drop as
  select challenge_friend('00000000-0000-0000-0000-00000000aa02', pg_temp.place_id('cabo-da-roca'), null) as id;
grant select on fc2 to authenticated;
insert into blocks (blocker_id, blocked_id) values (auth.uid(), '00000000-0000-0000-0000-00000000aa02');
select pg_temp.check(not are_friends('00000000-0000-0000-0000-00000000aa01', '00000000-0000-0000-0000-00000000aa02'),
  'blocking removes the friendship');
select pg_temp.check((select status from friend_challenges where id = (select id from fc2)) = 'declined',
  'blocking declines open challenges');
do $$ begin
  perform send_friend_request('00000000-0000-0000-0000-00000000aa02');
  raise exception 'should fail';
exception when others then
  if sqlerrm <> 'blocked' then raise; end if;
  raise notice 'ok - you cannot friend someone you blocked';
end $$;

select pg_temp.as_anon();
do $$ begin
  perform my_friends();
  raise exception 'should be denied';
exception when insufficient_privilege then
  raise notice 'ok - anonymous visitors cannot use friends';
end $$;
rollback;
