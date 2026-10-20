-- Social links on profiles (Instagram, Facebook, X, TripBFF). Only handles are stored, never
-- URLs: the app builds each link itself, so a profile can't carry a disguised or phishing link.
create or replace function public.valid_social_links(p jsonb)
returns boolean language sql immutable set search_path = public, pg_temp as $$
  select jsonb_typeof(p) = 'object' and not exists (
    select 1 from jsonb_each(p) e
    where e.key not in ('instagram', 'facebook', 'x', 'tripbff')
       or jsonb_typeof(e.value) <> 'string'
       or (e.value #>> '{}') !~ '^[A-Za-z0-9._-]{1,50}$'
  );
$$;

alter table public.profiles
  add column social_links jsonb not null default '{}'::jsonb
  constraint profiles_social_links_valid check (public.valid_social_links(social_links));

-- Players edit their own links (profiles_update_own limits it to their row).
grant update (social_links) on public.profiles to authenticated;

-- Like the home city, the links are part of the public profile card.
create or replace function public.profile_card(p_user uuid)
returns jsonb language sql stable security definer set search_path = public, pg_temp as $$
  select jsonb_build_object(
    'id', p.id, 'username', p.username, 'display_name', p.display_name, 'avatar_url', p.avatar_url,
    'home_city', p.home_city, 'is_private', p.is_private, 'level', p.level,
    'social_links', p.social_links,
    'followers', (select count(*) from public.follows where followee_id = p.id and status = 'accepted'),
    'following', (select count(*) from public.follows where follower_id = p.id and status = 'accepted'),
    'follow_status', (select status from public.follows where follower_id = auth.uid() and followee_id = p.id),
    'can_see', public.can_see_user(auth.uid(), p.id),
    'discoveries', case when public.can_see_user(auth.uid(), p.id)
                        then (select count(*) from public.visits where user_id = p.id) end
  )
  from public.profiles p
  where p.id = p_user and not public.is_blocked_between(auth.uid(), p_user);
$$;
