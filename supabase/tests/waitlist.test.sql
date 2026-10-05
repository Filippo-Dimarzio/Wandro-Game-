-- Beta waitlist: anyone can join with consent; nobody can read the list through the API.
begin;

select pg_temp.as_anon();
insert into waitlist (email, lives_in, occupation, transport, interests, fog_walk, consent, source)
values ('ana@example.pt', 'lisbon', 'both', '{metro,walk}', '{culture}', 'yes', true, 'instagram');
select pg_temp.check(true, 'a visitor can join the waitlist');

do $$ begin
  insert into waitlist (email, lives_in, occupation, fog_walk, consent)
  values ('rui@example.pt', 'sintra', 'study', 'maybe', false);
  raise exception 'joining without consent should fail';
exception when check_violation or insufficient_privilege then
  raise notice 'ok - joining needs consent';
end $$;

do $$ begin
  insert into waitlist (email, lives_in, occupation, fog_walk, consent)
  values ('not-an-email', 'lisbon', 'work', 'no', true);
  raise exception 'a bad email should fail';
exception when check_violation then raise notice 'ok - the email must look real';
end $$;

do $$ begin
  insert into waitlist (email, lives_in, occupation, fog_walk, consent)
  values ('ANA@example.pt', 'lisbon', 'both', 'yes', true);
  raise exception 'a duplicate email should fail';
exception when unique_violation then raise notice 'ok - each email joins once';
end $$;

do $$ begin
  perform 1 from waitlist;
  raise exception 'visitors should not read the waitlist';
exception when insufficient_privilege then raise notice 'ok - visitors cannot read the waitlist';
end $$;

select pg_temp.as_user('00000000-0000-0000-0000-0000000000a1');
do $$ begin
  perform 1 from waitlist;
  raise exception 'players should not read the waitlist';
exception when insufficient_privilege then raise notice 'ok - signed-in players cannot read it either';
end $$;
reset role;

select pg_temp.check((select count(*) from waitlist) = 1, 'only the valid sign-up was saved');
rollback;
