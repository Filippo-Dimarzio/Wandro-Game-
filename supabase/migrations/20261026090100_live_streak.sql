-- The daily streak, Duolingo style: the wallet reports the streak as it stands today (0 once a
-- day has been missed, even before the next check-in resets it) and the last day you completed a
-- challenge, so the app can light this week's flames (packages/shared/src/streak.ts).
create or replace function public.my_wallet()
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'coins', coalesce((select sum(points) from public.points_ledger where user_id = auth.uid()), 0),
    'coins_earned', coalesce((select sum(points) from public.points_ledger where user_id = auth.uid() and points > 0), 0),
    'xp', p.xp,
    'level', p.level,
    'streak', case when p.last_active_date >= public.lisbon_today() - 1 then p.streak_days else 0 end,
    'last_active_date', p.last_active_date,
    'discoveries', (select count(*) from public.visits where user_id = auth.uid())
  )
  from public.profiles p where p.id = auth.uid();
$$;
revoke execute on function public.my_wallet() from public, anon;
grant execute on function public.my_wallet() to authenticated;
