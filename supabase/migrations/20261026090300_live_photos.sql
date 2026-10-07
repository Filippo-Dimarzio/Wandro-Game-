-- Live photos, BeReal style: a moment can carry a second photo, the front-camera selfie taken
-- with it, shown inset over the main photo. It lives next to the photo in the author's folder of
-- the post-photos bucket and follows exactly the same rules: EXIF stripped by the app, checked for
-- blank frames by check-photo before anyone else sees it, 24 h for others, forever for you, and
-- exported and deleted with your account like the photo.

alter table public.posts add column selfie_path text;
alter table public.posts add constraint posts_selfie_needs_photo
  check (selfie_path is null or photo_path is not null);

-- check-photo checks both photos; when either is blank, both are removed and their storage paths
-- returned so the function can delete the files.
drop function public.record_photo_check(uuid, boolean);
create function public.record_photo_check(p_post uuid, p_ok boolean)
returns text[] language plpgsql security definer set search_path = public, pg_temp as $$
declare
  old_photo text;
  old_selfie text;
begin
  select photo_path, selfie_path into old_photo, old_selfie from public.posts where id = p_post for update;
  if not found then
    raise exception 'post_not_found' using errcode = 'P0002';
  end if;
  if p_ok then
    update public.posts set photo_checked_at = now() where id = p_post;
    return '{}'::text[];
  end if;
  update public.posts set photo_path = null, selfie_path = null, photo_checked_at = now() where id = p_post;
  return array_remove(array[old_photo, old_selfie], null);
end;
$$;
revoke execute on function public.record_photo_check(uuid, boolean) from public, anon, authenticated;
grant execute on function public.record_photo_check(uuid, boolean) to service_role;

-- The feed and your library (my_passport) carry the selfie too.
drop function public.feed(timestamptz, integer);
create function public.feed(p_before timestamptz default null, p_limit integer default 20)
returns table (
  post_id uuid, user_id uuid, username text, place_id uuid, place_name text,
  category public.place_category, caption text, photo_path text, selfie_path text,
  created_at timestamptz,
  like_count bigint, liked_by_me boolean
)
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select p.id, p.user_id, pr.username::text, p.place_id, pl.name, pl.category, p.caption,
         case when p.user_id = auth.uid() or p.photo_checked_at is not null then p.photo_path end,
         case when p.user_id = auth.uid() or p.photo_checked_at is not null then p.selfie_path end,
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
revoke execute on function public.feed(timestamptz, integer) from public, anon;
grant execute on function public.feed(timestamptz, integer) to authenticated;

drop function public.my_passport();
create function public.my_passport()
returns table (
  post_id uuid, place_id uuid, place_name text, category public.place_category, region_slug text,
  caption text, photo_path text, selfie_path text, created_at timestamptz
)
language sql stable security definer set search_path = public, pg_temp as $$
  select p.id, p.place_id, pl.name, pl.category, r.slug, p.caption, p.photo_path, p.selfie_path, p.created_at
  from public.posts p
  join public.places pl on pl.id = p.place_id
  left join public.regions r on r.id = pl.region_id
  where p.user_id = auth.uid() and p.status <> 'removed'
  order by p.created_at desc;
$$;
revoke execute on function public.my_passport() from public, anon;
grant execute on function public.my_passport() to authenticated;

create or replace function public.export_my_data()
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  return public.export_my_core_data() || public.export_my_friends_data()
    || jsonb_build_object('last_city', (select jsonb_build_object('region', region_slug, 'seen_at', seen_at)
                                        from public.player_regions where user_id = auth.uid()))
    || jsonb_build_object('city_stamps', coalesce((select jsonb_agg(jsonb_build_object(
          'region', region_slug, 'gold', gold, 'collected_at', collected_at) order by collected_at)
        from public.city_stamps where user_id = auth.uid()), '[]'))
    -- Posts again, now with the live photo's selfie.
    || jsonb_build_object('posts', coalesce((select jsonb_agg(jsonb_build_object(
          'caption', p.caption, 'photo_path', p.photo_path, 'selfie_path', p.selfie_path,
          'status', p.status, 'created_at', p.created_at))
        from public.posts p where p.user_id = auth.uid()), '[]'));
end;
$$;

-- The selfie file follows the photo's storage rule: its author always; others once checked.
do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'storage') then
    execute 'drop policy if exists "post photos: read own or checked moments" on storage.objects';
    execute $p$create policy "post photos: read own or checked moments" on storage.objects for select to authenticated
      using (bucket_id = 'post-photos'
             and ((storage.foldername(name))[1] = auth.uid()::text
                  or exists (select 1 from public.posts p
                             where (p.photo_path = name or p.selfie_path = name)
                               and p.photo_checked_at is not null)))$p$;
  end if;
end $$;
