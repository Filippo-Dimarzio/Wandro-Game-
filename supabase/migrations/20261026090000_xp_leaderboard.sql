-- One leaderboard for Portugal, ranked by XP (50 per completed challenge) instead of coins.
-- The global and weekly boards are gone; the city boards and the friends board rank by XP too.
-- Scopes: 'country' (every public player, the default), 'region' (XP earned in that city) and
-- 'friends'. Coins are for spending, so they no longer decide anyone's rank.
drop function public.leaderboard(text, text);
create function public.leaderboard(p_scope text default 'country', p_region text default 'sintra')
returns table (rank bigint, user_id uuid, username text, level integer, xp bigint, challenges bigint, is_me boolean)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if p_scope not in ('country', 'region', 'friends') then
    raise exception 'invalid_scope' using errcode = 'P0001';
  end if;

  return query
  with scored as (
    select l.user_id,
           coalesce(sum(l.xp), 0)::bigint as xp,
           count(*) filter (where l.kind in ('visit', 'daily_challenge'))::bigint as challenges
    from public.points_ledger l
    left join public.visits v on v.id = l.visit_id
    left join public.places pl on pl.id = v.place_id
    left join public.regions rg on rg.id = pl.region_id
    where p_scope <> 'region' or rg.slug = p_region
    group by l.user_id
  ), visible as (
    select s.user_id, s.xp, s.challenges, p.username::text as username, p.level
    from scored s join public.profiles p on p.id = s.user_id
    where s.xp > 0
      and not public.is_blocked_between(auth.uid(), s.user_id)
      and (s.user_id = auth.uid()
           or (p_scope = 'friends' and (public.are_friends(auth.uid(), s.user_id)
               or exists (select 1 from public.follows f
                          where f.follower_id = auth.uid() and f.followee_id = s.user_id and f.status = 'accepted')))
           or (p_scope <> 'friends' and not p.is_private))
  )
  select rank() over (order by vis.xp desc), vis.user_id, vis.username, vis.level, vis.xp,
         vis.challenges, vis.user_id = auth.uid()
  from visible vis
  order by vis.xp desc, vis.challenges desc, vis.username
  limit 100;
end;
$$;
revoke execute on function public.leaderboard(text, text) from public, anon;
grant execute on function public.leaderboard(text, text) to authenticated;
