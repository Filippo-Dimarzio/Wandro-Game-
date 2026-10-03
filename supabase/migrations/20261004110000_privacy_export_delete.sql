-- Phase 5: GDPR data export and account deletion.

-- Everything we hold about the caller, as one JSON document (raw location pings are never kept).
create or replace function public.export_my_data()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  return jsonb_build_object(
    'exported_at', now(),
    'profile', (select to_jsonb(p) - 'is_moderator' from public.profiles p where p.id = uid),
    'visits', coalesce((select jsonb_agg(jsonb_build_object(
        'place', pl.name, 'verified_at', v.verified_at, 'lat', v.lat, 'lng', v.lng,
        'accuracy_m', v.accuracy_m, 'dwell_seconds', v.dwell_seconds) order by v.verified_at)
      from public.visits v join public.places pl on pl.id = v.place_id where v.user_id = uid), '[]'),
    'coins_and_xp', coalesce((select jsonb_agg(jsonb_build_object(
        'kind', l.kind, 'coins', l.points, 'xp', l.xp, 'at', l.created_at) order by l.created_at)
      from public.points_ledger l where l.user_id = uid), '[]'),
    'badges', coalesce((select jsonb_agg(jsonb_build_object('badge', b.code, 'awarded_at', ub.awarded_at))
      from public.user_badges ub join public.badges b on b.id = ub.badge_id where ub.user_id = uid), '[]'),
    'posts', coalesce((select jsonb_agg(jsonb_build_object(
        'caption', p.caption, 'photo_path', p.photo_path, 'status', p.status, 'created_at', p.created_at))
      from public.posts p where p.user_id = uid), '[]'),
    'likes', coalesce((select jsonb_agg(jsonb_build_object('post_id', l.post_id, 'at', l.created_at))
      from public.likes l where l.user_id = uid), '[]'),
    'following', coalesce((select jsonb_agg(jsonb_build_object('username', pr.username, 'status', f.status))
      from public.follows f join public.profiles pr on pr.id = f.followee_id where f.follower_id = uid), '[]'),
    'followers', coalesce((select jsonb_agg(jsonb_build_object('username', pr.username, 'status', f.status))
      from public.follows f join public.profiles pr on pr.id = f.follower_id where f.followee_id = uid), '[]'),
    'blocked', coalesce((select jsonb_agg(pr.username) from public.blocks b
      join public.profiles pr on pr.id = b.blocked_id where b.blocker_id = uid), '[]'),
    'reports_filed', coalesce((select jsonb_agg(jsonb_build_object('target_type', r.target_type, 'reason', r.reason, 'status', r.status))
      from public.reports r where r.reporter_id = uid), '[]'),
    'place_submissions', coalesce((select jsonb_agg(jsonb_build_object(
        'name', s.name, 'status', s.status, 'created_at', s.created_at))
      from public.place_submissions s where s.user_id = uid), '[]'),
    'daily_challenges', coalesce((select jsonb_agg(jsonb_build_object(
        'started_at', u.started_at, 'completed_at', u.completed_at))
      from public.user_daily_challenges u where u.user_id = uid), '[]'),
    'checkin_summaries', coalesce((select jsonb_agg(jsonb_build_object(
        'status', c.status, 'reason', c.reason, 'started_at', c.started_at, 'completed_at', c.completed_at))
      from public.checkin_sessions c where c.user_id = uid), '[]')
  );
end;
$$;

-- Deletes the caller's account. Every table references auth.users/profiles with ON DELETE CASCADE,
-- so all personal rows go with it; anonymous aggregates (a place's visitor count) remain.
-- The app removes the user's photos from storage before calling this.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  delete from auth.users where id = uid;
end;
$$;

revoke execute on function public.export_my_data() from public, anon;
revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.export_my_data() to authenticated;
grant execute on function public.delete_my_account() to authenticated;
