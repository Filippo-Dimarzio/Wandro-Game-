-- Blank photos (a black frame from a covered lens, a flat colour, nothing in it) never reach
-- other players. The app refuses them when you pick one; the check-photo Edge Function then
-- checks every uploaded photo on the server. Others only see a post's photo once it has passed;
-- a blank one is deleted from storage and removed from the post. The function's sweep mode
-- re-checks photos that are already up.

alter table public.posts add column photo_checked_at timestamptz;

-- Called only by the check-photo Edge Function (service role). Returns the storage path to
-- delete when the photo was blank.
create or replace function public.record_photo_check(p_post uuid, p_ok boolean)
returns text language plpgsql security definer set search_path = public, pg_temp as $$
declare
  old_path text;
begin
  select photo_path into old_path from public.posts where id = p_post for update;
  if not found then
    raise exception 'post_not_found' using errcode = 'P0002';
  end if;
  if p_ok then
    update public.posts set photo_checked_at = now() where id = p_post;
    return null;
  end if;
  update public.posts set photo_path = null, photo_checked_at = now() where id = p_post;
  return old_path;
end;
$$;
revoke execute on function public.record_photo_check(uuid, boolean) from public, anon, authenticated;
grant execute on function public.record_photo_check(uuid, boolean) to service_role;

-- Same feed, but other people's photos only once checked.
create or replace function public.feed(p_before timestamptz default null, p_limit integer default 20)
returns table (
  post_id uuid, user_id uuid, username text, place_id uuid, place_name text,
  category public.place_category, caption text, photo_path text, created_at timestamptz,
  like_count bigint, liked_by_me boolean
)
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select p.id, p.user_id, pr.username::text, p.place_id, pl.name, pl.category, p.caption,
         case when p.user_id = auth.uid() or p.photo_checked_at is not null then p.photo_path end,
         p.created_at,
         (select count(*) from public.likes l where l.post_id = p.id),
         exists (select 1 from public.likes l where l.post_id = p.id and l.user_id = auth.uid())
  from public.posts p
  join public.profiles pr on pr.id = p.user_id
  join public.places pl on pl.id = p.place_id
  where p.status = 'visible'
    and p.created_at > now() - interval '24 hours'
    and (p.user_id = auth.uid()
         or (public.posted_recently(auth.uid())
             and (exists (select 1 from public.follows f
                          where f.follower_id = auth.uid() and f.followee_id = p.user_id and f.status = 'accepted')
                  or public.are_friends(auth.uid(), p.user_id))))
    and (p_before is null or p.created_at < p_before)
  order by p.created_at desc
  limit least(greatest(p_limit, 1), 50);
$$;

-- The photo file itself: its author always; others only when the post's photo passed the check.
do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'storage') then
    execute 'drop policy if exists "post photos: read own or visible moments" on storage.objects';
    execute $p$create policy "post photos: read own or checked moments" on storage.objects for select to authenticated
      using (bucket_id = 'post-photos'
             and ((storage.foldername(name))[1] = auth.uid()::text
                  or exists (select 1 from public.posts p
                             where p.photo_path = name and p.photo_checked_at is not null)))$p$;
  end if;
end $$;
