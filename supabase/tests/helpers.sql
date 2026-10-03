-- Test helpers: act as a given user, and assertions.
create or replace function pg_temp.as_user(uid uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
end $$;

create or replace function pg_temp.as_anon() returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', '{}', true);
  execute 'set local role anon';
end $$;

create or replace function pg_temp.check(ok boolean, msg text) returns void language plpgsql as $$
begin
  if ok is not true then raise exception 'ASSERTION FAILED: %', msg; end if;
  raise notice 'ok - %', msg;
end $$;

-- Simulates a check-in that started `secs` seconds ago, with pings every 20 s at an offset
-- (metres east) from the place. Runs as the table owner, like a real elapsed session would.
create or replace function pg_temp.simulate_session(
  sid uuid, secs integer, offset_m double precision default 5, acc real default 8,
  mocked boolean default false
) returns void language plpgsql as $$
declare
  pl record;
  t integer := 0;
begin
  select p.location, extensions.st_y(p.location::extensions.geometry) as lat,
         extensions.st_x(p.location::extensions.geometry) as lng
  into pl from public.places p join public.checkin_sessions s on s.place_id = p.id where s.id = sid;
  update public.checkin_sessions set started_at = now() - make_interval(secs => secs),
    expires_at = now() + interval '20 minutes' where id = sid;
  delete from public.checkin_pings where session_id = sid;
  while t <= secs loop
    insert into public.checkin_pings (session_id, lat, lng, accuracy_m, is_mocked, recorded_at)
    values (sid, pl.lat, pl.lng + offset_m / (111320 * cos(radians(pl.lat))), acc, mocked,
            now() - make_interval(secs => secs - t));
    t := t + 20;
  end loop;
end $$;

create or replace function pg_temp.place_id(src text) returns uuid language sql as $$
  select id from public.places where source_id = src
$$;
