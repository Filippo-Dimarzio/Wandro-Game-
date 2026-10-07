-- Instant check-in: no more waiting at a place. start_checkin already checks you're inside the
-- geofence with a good GPS fix; complete_checkin now verifies straight away as long as your
-- latest fix is still inside. Mock locations, teleport jumps and impossible travel are still
-- held for a moderator, each place is still completed once, and raw pings are still deleted.
-- places.dwell_seconds is no longer used.
create or replace function public.complete_checkin(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  uid uuid := auth.uid();
  s public.checkin_sessions;
  pl public.places;
  elapsed integer;
  total integer;
  inside integer;
  last_inside timestamptz;
  mocked boolean;
  max_speed double precision;
  best_acc real;
  last_ping record;
  prev_visit record;
  travel_speed double precision;
  v_reason text;
  v_result jsonb;
begin
  if uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  select * into s from public.checkin_sessions where id = p_session_id and user_id = uid for update;
  if not found then
    raise exception 'session_not_found' using errcode = 'P0002';
  end if;
  -- Idempotent: replaying a finished session returns its stored result.
  if s.status <> 'open' then
    return coalesce(s.result, jsonb_build_object('status', s.status::text, 'reason', s.reason));
  end if;
  if now() > s.expires_at then
    update public.checkin_sessions set status = 'abandoned', reason = 'expired', completed_at = now() where id = s.id;
    delete from public.checkin_pings where session_id = s.id;
    return jsonb_build_object('status', 'rejected', 'reason', 'expired');
  end if;

  select * into pl from public.places where id = s.place_id;
  elapsed := extract(epoch from (now() - s.started_at))::integer;

  with pings as (
    select cp.*, extensions.st_distance(pl.location,
             extensions.st_setsrid(extensions.st_makepoint(cp.lng, cp.lat), 4326)::extensions.geography) as dist
    from public.checkin_pings cp where cp.session_id = s.id
  ), ordered as (
    select *, lag(lat) over w as plat, lag(lng) over w as plng, lag(recorded_at) over w as pat
    from pings window w as (order by recorded_at)
  )
  select count(*),
         count(*) filter (where dist <= pl.geofence_radius_m + least(accuracy_m, 25) and accuracy_m <= 50),
         max(recorded_at) filter (where dist <= pl.geofence_radius_m + least(accuracy_m, 25) and accuracy_m <= 50),
         bool_or(is_mocked),
         min(accuracy_m),
         max(case when pat is not null and recorded_at > pat then
           extensions.st_distance(
             extensions.st_setsrid(extensions.st_makepoint(lng, lat), 4326)::extensions.geography,
             extensions.st_setsrid(extensions.st_makepoint(plng, plat), 4326)::extensions.geography)
           / extract(epoch from (recorded_at - pat)) end)
  into total, inside, last_inside, mocked, best_acc, max_speed
  from ordered;

  select cp.lat, cp.lng, cp.accuracy_m,
         extensions.st_distance(pl.location,
           extensions.st_setsrid(extensions.st_makepoint(cp.lng, cp.lat), 4326)::extensions.geography) as dist
  into last_ping from public.checkin_pings cp
  where cp.session_id = s.id order by cp.recorded_at desc limit 1;

  -- Travel plausibility against the previous verified visit (>300 km/h is impossible on foot).
  select v.lat, v.lng, v.verified_at into prev_visit from public.visits v
  where v.user_id = uid order by v.verified_at desc limit 1;
  if prev_visit.verified_at is not null and s.started_at > prev_visit.verified_at then
    travel_speed := extensions.st_distance(
      extensions.st_setsrid(extensions.st_makepoint(prev_visit.lng, prev_visit.lat), 4326)::extensions.geography,
      extensions.st_setsrid(extensions.st_makepoint(last_ping.lng, last_ping.lat), 4326)::extensions.geography)
      / greatest(extract(epoch from (s.started_at - prev_visit.verified_at)), 1);
  end if;

  -- No waiting: you only need to be there now (the latest fix inside the geofence).
  if inside < 1 or last_ping.accuracy_m > 50
     or last_ping.dist > pl.geofence_radius_m + least(last_ping.accuracy_m, 25) then
    v_reason := 'left_geofence';
  end if;

  if v_reason is not null then
    v_result := jsonb_build_object('status', 'rejected', 'reason', v_reason);
    update public.checkin_sessions
    set status = 'rejected', reason = v_reason, result = v_result, completed_at = now(),
        ping_count = total, best_accuracy_m = best_acc
    where id = s.id;
    delete from public.checkin_pings where session_id = s.id;
    return v_result;
  end if;

  if mocked then
    v_reason := 'mock_location';
  elsif max_speed > 50 then
    v_reason := 'impossible_speed';
  elsif travel_speed > 83 then
    v_reason := 'impossible_travel';
  end if;

  if v_reason is not null then
    -- Held for a moderator; no coins until approved. Keep only a summary, never the raw track.
    v_result := jsonb_build_object('status', 'flagged', 'reason', v_reason);
    update public.checkin_sessions
    set status = 'flagged', reason = v_reason, result = v_result, completed_at = now(),
        ping_count = total, best_accuracy_m = best_acc, last_lat = last_ping.lat, last_lng = last_ping.lng
    where id = s.id;
    delete from public.checkin_pings where session_id = s.id;
    return v_result;
  end if;

  v_result := public.award_visit(uid, s.place_id, last_ping.lat, last_ping.lng, best_acc, elapsed);
  update public.checkin_sessions
  set status = 'verified', result = v_result, completed_at = now(), ping_count = total, best_accuracy_m = best_acc
  where id = s.id;
  delete from public.checkin_pings where session_id = s.id;
  return v_result;
end;
$$;
grant execute on function public.complete_checkin(uuid) to authenticated;
