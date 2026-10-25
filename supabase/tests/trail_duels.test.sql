-- Trail duels: friends only, on a trail you've unlocked, one open duel per pair and trail, settled
-- once both have finished (+25 each, +25 more for the better score, ties both win).
begin;
insert into auth.users (id, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000e1', '{"username":"dueller"}'),
  ('00000000-0000-0000-0000-0000000000e2', '{"username":"rival"}'),
  ('00000000-0000-0000-0000-0000000000e3', '{"username":"stranger2"}');
insert into friendships (user_a, user_b, requested_by, status, accepted_at) values
  ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000e2',
   '00000000-0000-0000-0000-0000000000e1', 'accepted', now());

-- Both players: 5 Sintra discoveries (the old-town trail's four stops plus Pena) and coins.
do $$ begin
  perform award_visit(u, pg_temp.place_id(x), 38.79, -9.39, 8, 130)
  from unnest(array['00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000e2']::uuid[]) as u,
       unnest(array['sintra-santa-maria', 'sintra-national-palace', 'regaleira', 'seteais', 'pena']) as x;
  insert into points_ledger (user_id, kind, points) values
    ('00000000-0000-0000-0000-0000000000e1', 'moderation', 300),
    ('00000000-0000-0000-0000-0000000000e2', 'moderation', 300);
end $$;

select pg_temp.as_user('00000000-0000-0000-0000-0000000000e1');
do $$ begin
  perform challenge_trail_duel('00000000-0000-0000-0000-0000000000e2', 'sintra-magpies-millionaire');
  raise exception 'a duel on a trail you have not unlocked should fail';
exception when others then
  if sqlerrm <> 'not_started' then raise; end if;
  raise notice 'ok - you challenge friends to trails you have unlocked';
end $$;
do $$ begin perform start_trail('sintra-magpies-millionaire'); end $$;
do $$ begin
  perform challenge_trail_duel('00000000-0000-0000-0000-0000000000e3', 'sintra-magpies-millionaire');
  raise exception 'a duel with a non-friend should fail';
exception when others then
  if sqlerrm <> 'not_friends' then raise; end if;
  raise notice 'ok - only friends can be challenged';
end $$;
create temp table duel on commit drop as
  select challenge_trail_duel('00000000-0000-0000-0000-0000000000e2', 'sintra-magpies-millionaire') as id;
select pg_temp.check(challenge_trail_duel('00000000-0000-0000-0000-0000000000e2', 'sintra-magpies-millionaire')
                     = (select id from duel), 'challenging again returns the open duel');
do $$ begin
  insert into trail_duels (trail_id, from_user, to_user)
  select id, auth.uid(), '00000000-0000-0000-0000-0000000000e3' from trails limit 1;
  raise exception 'duel insert should fail';
exception when insufficient_privilege then raise notice 'ok - duels are only made through the functions';
end $$;
reset role;

select pg_temp.as_user('00000000-0000-0000-0000-0000000000e3');
select pg_temp.check((select count(*) from trail_duels) = 0 and my_trail_duels() = '[]'::jsonb,
  'others cannot see your duels');
do $$ begin
  perform respond_trail_duel((select id from duel), true);
  raise exception 'a stranger accepting should fail';
exception when others then
  if sqlerrm <> 'duel_not_found' then raise; end if;
  raise notice 'ok - only the challenged friend can answer';
end $$;
reset role;

-- The rival accepts, unlocks the trail by the usual rules and plays it cleanly.
select pg_temp.as_user('00000000-0000-0000-0000-0000000000e2');
select pg_temp.check((my_trail_duels() -> 0 ->> 'direction') = 'incoming', 'the duel shows as incoming');
do $$ begin
  perform respond_trail_duel((select id from duel), true);
  perform start_trail('sintra-magpies-millionaire');
  perform answer_trail_clue('sintra-magpies-millionaire', 1, '3');
  perform answer_trail_clue('sintra-magpies-millionaire', 2, 'Por bem');
  perform answer_trail_clue('sintra-magpies-millionaire', 3, '9');
  perform answer_trail_clue('sintra-magpies-millionaire', 4, 'Pena Palace');
end $$;
select pg_temp.check((select status from trail_duels) = 'accepted',
  'finishing first does not settle the duel: it waits for the other player');
reset role;

-- The challenger uses a hint, then finishes: the duel settles.
select pg_temp.as_user('00000000-0000-0000-0000-0000000000e1');
select pg_temp.check((my_trail_duels() -> 0 ->> 'friend_solved')::int = 4
  and (my_trail_duels() -> 0 ->> 'friend_score') is null,
  'while open you see how far your friend got, not their score');
do $$ begin
  perform use_trail_hint('sintra-magpies-millionaire', 1);
  perform answer_trail_clue('sintra-magpies-millionaire', 1, '3');
  perform answer_trail_clue('sintra-magpies-millionaire', 2, 'Por bem');
  perform answer_trail_clue('sintra-magpies-millionaire', 3, '9');
  perform answer_trail_clue('sintra-magpies-millionaire', 4, 'Pena Palace');
end $$;
select pg_temp.check((my_trail_duels() -> 0 ->> 'status') = 'done'
  and (my_trail_duels() -> 0 ->> 'my_score')::int = 75
  and (my_trail_duels() -> 0 ->> 'friend_score')::int = 80,
  'once both finish the duel settles with both scores');
reset role;

select pg_temp.check((select points from points_ledger
                      where user_id = '00000000-0000-0000-0000-0000000000e2' and kind = 'trail_duel') = 50
  and (select points from points_ledger
       where user_id = '00000000-0000-0000-0000-0000000000e1' and kind = 'trail_duel') = 25,
  'the better score gets 50, the other 25');
do $$ begin perform resolve_trail_duel((select id from duel)); end $$;
select pg_temp.check((select count(*) from points_ledger where kind = 'trail_duel') = 2, 'a duel pays once');

-- A new duel between them is allowed once the last one is settled.
select pg_temp.as_user('00000000-0000-0000-0000-0000000000e2');
select pg_temp.check(challenge_trail_duel('00000000-0000-0000-0000-0000000000e1', 'sintra-magpies-millionaire')
                     <> (select id from duel), 'a settled duel frees the pair for a rematch');
select pg_temp.check(jsonb_array_length(export_my_data() -> 'trail_duels') = 2, 'duels are in the data export');
reset role;
rollback;
