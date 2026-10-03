-- Phase 4: follows, privacy, blocks, posts, likes, feed, reports, moderation, leaderboards, collections.
begin;
insert into auth.users (id, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000a1', '{"username":"alice"}'),
  ('00000000-0000-0000-0000-0000000000b1', '{"username":"bruno"}'),
  ('00000000-0000-0000-0000-0000000000c1', '{"username":"clara"}'),
  ('00000000-0000-0000-0000-0000000000d1', '{"username":"mod"}');
update profiles set is_private = true where id = '00000000-0000-0000-0000-0000000000c1';
update profiles set is_moderator = true where id = '00000000-0000-0000-0000-0000000000d1';

-- Verified visits (as the server would create them) for posts and leaderboards.
do $$ begin
  perform award_visit('00000000-0000-0000-0000-0000000000b1', pg_temp.place_id('cabo-da-roca'), 38.78, -9.49, 8, 130);
  perform award_visit('00000000-0000-0000-0000-0000000000b1', pg_temp.place_id('adraga'), 38.82, -9.47, 8, 130);
  perform award_visit('00000000-0000-0000-0000-0000000000c1', pg_temp.place_id('pena'), 38.78, -9.39, 8, 130);
end $$;
create temp table clara_visit on commit drop as
  select id from visits where user_id = '00000000-0000-0000-0000-0000000000c1';
grant select on clara_visit to authenticated;
select pg_temp.check((select count(*) from user_collection_rewards where user_id = '00000000-0000-0000-0000-0000000000b1') = 1,
  'completing every place in a collection awards its bonus');
select pg_temp.check((select count(*) from points_ledger where user_id = '00000000-0000-0000-0000-0000000000b1' and kind = 'collection') = 1,
  'collection bonus is paid once');

-- Bruno posts about his visit; Clara (private) posts too.
select pg_temp.as_user('00000000-0000-0000-0000-0000000000b1');
insert into posts (user_id, visit_id, place_id, caption)
select auth.uid(), v.id, v.place_id, 'Windy but worth it' from visits v where v.user_id = auth.uid() and v.place_id = pg_temp.place_id('adraga');
do $$ begin
  insert into posts (user_id, visit_id, place_id, caption)
  select auth.uid(), id, pg_temp.place_id('pena'), 'fake' from clara_visit;
  raise exception 'posting about someone else''s visit should fail';
exception when insufficient_privilege then raise notice 'ok - you can only post about your own verified visit';
end $$;
reset role;
select pg_temp.as_user('00000000-0000-0000-0000-0000000000c1');
insert into posts (user_id, visit_id, place_id, caption)
select auth.uid(), v.id, v.place_id, 'Private sunset' from visits v where v.user_id = auth.uid();
reset role;

-- Alice follows public Bruno (accepted) and private Clara (pending).
select pg_temp.as_user('00000000-0000-0000-0000-0000000000a1');
insert into follows (follower_id, followee_id) values (auth.uid(), '00000000-0000-0000-0000-0000000000b1');
insert into follows (follower_id, followee_id) values (auth.uid(), '00000000-0000-0000-0000-0000000000c1');
select pg_temp.check((select status from follows where followee_id = '00000000-0000-0000-0000-0000000000b1' and follower_id = auth.uid()) = 'accepted', 'following a public profile is immediate');
select pg_temp.check((select status from follows where followee_id = '00000000-0000-0000-0000-0000000000c1' and follower_id = auth.uid()) = 'pending', 'following a private profile sends a request');
select pg_temp.check((select count(*) from feed()) = 1, 'feed shows posts from accepted follows only');
select pg_temp.check((select count(*) from posts where user_id = '00000000-0000-0000-0000-0000000000c1') = 0, 'private posts are hidden from non-followers');
select pg_temp.check((profile_card('00000000-0000-0000-0000-0000000000c1') ->> 'discoveries') is null, 'private profile hides discovery counts');
do $$ begin
  update follows set status = 'accepted' where followee_id = '00000000-0000-0000-0000-0000000000c1';
  raise exception 'self-accept should fail';
exception when insufficient_privilege then raise notice 'ok - followers cannot accept their own request';
end $$;

-- Likes
insert into likes (user_id, post_id) select auth.uid(), post_id from feed();
select pg_temp.check((select liked_by_me and like_count = 1 from feed() limit 1), 'likes are counted and shown');
reset role;

-- Clara accepts Alice; now her post shows up.
select pg_temp.as_user('00000000-0000-0000-0000-0000000000c1');
do $$ begin perform respond_follow_request('00000000-0000-0000-0000-0000000000a1', true); end $$;
reset role;
select pg_temp.as_user('00000000-0000-0000-0000-0000000000a1');
select pg_temp.check((select count(*) from feed()) = 2, 'accepted followers see private posts');

-- Leaderboards: private Clara is hidden globally but visible to Alice among friends.
select pg_temp.check(not exists (select 1 from leaderboard('global') where username = 'clara'), 'private profiles stay off the global leaderboard');
select pg_temp.check(exists (select 1 from leaderboard('friends') where username = 'clara'), 'friends leaderboard includes accepted private friends');
select pg_temp.check((select username from leaderboard('global') order by rank limit 1) = 'bruno', 'leaderboard ranks by coins earned');
select pg_temp.check(exists (select 1 from leaderboard('weekly')) and exists (select 1 from leaderboard('region', 'sintra')), 'weekly and region boards work');

-- Reports
insert into reports (reporter_id, target_type, target_id, reason)
select auth.uid(), 'post', post_id, 'Spam' from feed() where username = 'bruno';
do $$ begin
  perform moderation_queue();
  raise exception 'queue should be forbidden';
exception when insufficient_privilege then raise notice 'ok - only moderators see the moderation queue';
end $$;

-- Blocking hides content both ways and removes follows.
insert into blocks (blocker_id, blocked_id) values (auth.uid(), '00000000-0000-0000-0000-0000000000b1');
select pg_temp.check((select count(*) from follows where follower_id = auth.uid() and followee_id = '00000000-0000-0000-0000-0000000000b1') = 0, 'blocking removes the follow');
select pg_temp.check((select count(*) from posts where user_id = '00000000-0000-0000-0000-0000000000b1') = 0, 'blocked users'' posts are hidden');
reset role;
select pg_temp.as_user('00000000-0000-0000-0000-0000000000b1');
do $$ begin
  insert into follows (follower_id, followee_id) values (auth.uid(), '00000000-0000-0000-0000-0000000000a1');
  raise exception 'blocked follow should fail';
exception when insufficient_privilege then raise notice 'ok - blocked users cannot follow you';
end $$;
select pg_temp.check(not exists (select 1 from search_profiles('ali')), 'blocked users cannot find you in search');
reset role;

-- Moderator removes the reported post.
select pg_temp.as_user('00000000-0000-0000-0000-0000000000d1');
select pg_temp.check(jsonb_array_length(moderation_queue() -> 'reports') = 1, 'moderator sees open reports');
do $$ begin perform resolve_report((select id from reports limit 1), true); end $$;
reset role;
select pg_temp.check((select status from posts where user_id = '00000000-0000-0000-0000-0000000000b1') = 'removed', 'resolved report removes the post');
select pg_temp.as_user('00000000-0000-0000-0000-0000000000c1');
select pg_temp.check((select count(*) from posts where user_id = '00000000-0000-0000-0000-0000000000b1') = 0, 'removed posts disappear for everyone');
select pg_temp.check((select count(*) from my_collections()) = 3, 'collections list with progress');
reset role;
rollback;
