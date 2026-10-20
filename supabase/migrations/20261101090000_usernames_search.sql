-- Usernames are unique, ignoring case (profiles.username is citext + unique). Sign-up asks the
-- server as you type so it can say "Username already taken" before you finish.
create or replace function public.username_available(p_name text)
returns boolean language sql stable security definer set search_path = public, extensions, pg_temp as $$
  select p_name ~ '^[a-zA-Z0-9_.]{3,24}$'
     and not exists (
       select 1 from public.profiles
       where username = p_name::extensions.citext and id is distinct from auth.uid());
$$;
revoke execute on function public.username_available(text) from public, anon;
grant execute on function public.username_available(text) to authenticated;

-- New accounts: the wanted name is compared ignoring case (it used to be compared as text, so
-- "Fil" next to an existing "fil" crashed sign-up). A clash, even a race between two sign-ups,
-- gets a placeholder name that the player then changes during sign-up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  wanted text := coalesce(new.raw_user_meta_data ->> 'username', '');
  fallback text := 'wanderer_' || substr(replace(new.id::text, '-', ''), 1, 10);
begin
  if wanted !~ '^[a-zA-Z0-9_.]{3,24}$'
     or exists (select 1 from public.profiles where username = wanted::extensions.citext) then
    wanted := fallback;
  end if;
  begin
    insert into public.profiles (id, username, display_name)
    values (new.id, wanted, new.raw_user_meta_data ->> 'display_name');
  exception when unique_violation then
    insert into public.profiles (id, username, display_name)
    values (new.id, fallback, new.raw_user_meta_data ->> 'display_name');
  end;
  return new;
end;
$$;

-- Search: ignore a leading "@", show your own profile too (so you can check how others find
-- you), and put exact matches first.
create or replace function public.search_profiles(q text)
returns table (id uuid, username text, display_name text, avatar_url text, is_private boolean)
language sql stable security definer set search_path = public, pg_temp as $$
  with needle as (
    select replace(replace(replace(ltrim(btrim(q), '@'), '\', ''), '%', ''), '_', '\_') as n
  )
  select p.id, p.username::text, p.display_name, p.avatar_url, p.is_private
  from public.profiles p, needle
  where length(needle.n) > 0
    and p.username ilike '%' || needle.n || '%'
    and not public.is_blocked_between(auth.uid(), p.id)
  order by (lower(p.username::text) = lower(ltrim(btrim(q), '@'))) desc,
           (p.id = auth.uid()) desc, length(p.username), p.username
  limit 20;
$$;
revoke execute on function public.search_profiles(text) from public, anon;
grant execute on function public.search_profiles(text) to authenticated;
