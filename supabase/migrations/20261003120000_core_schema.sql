-- Wandro core schema: profiles, places, visits, scoring ledger.
-- Points, visits and stats are written only by SECURITY DEFINER functions / service role.

create schema if not exists extensions;
create extension if not exists postgis with schema extensions;
create extension if not exists citext with schema extensions;

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username extensions.citext not null unique
    check (username ~ '^[a-zA-Z0-9_.]{3,24}$'),
  display_name text check (char_length(display_name) <= 50),
  avatar_url text,
  home_city text check (char_length(home_city) <= 80),
  is_private boolean not null default false,
  explorer_styles text[] not null default '{}',
  locale text not null default 'en',
  xp integer not null default 0 check (xp >= 0),
  level integer not null default 1 check (level >= 1),
  streak_days integer not null default 0,
  last_active_date date,
  is_moderator boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  wanted text := coalesce(new.raw_user_meta_data ->> 'username', '');
begin
  if wanted !~ '^[a-zA-Z0-9_.]{3,24}$'
     or exists (select 1 from public.profiles where username = wanted) then
    wanted := 'wanderer_' || substr(replace(new.id::text, '-', ''), 1, 10);
  end if;
  insert into public.profiles (id, username, display_name)
  values (new.id, wanted, new.raw_user_meta_data ->> 'display_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Regions and places
-- ---------------------------------------------------------------------------
create table public.regions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  bbox extensions.geometry (Polygon, 4326) not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

create type public.place_category as enum ('culture', 'heritage', 'nature', 'music_events', 'other');
create type public.place_status as enum ('draft', 'active', 'hidden', 'closed');

create table public.places (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  location extensions.geography (Point, 4326) not null,
  category public.place_category not null,
  geofence_radius_m integer not null default 75 check (geofence_radius_m between 20 and 500),
  dwell_seconds integer not null default 120 check (dwell_seconds between 30 and 1800),
  base_points integer not null check (base_points > 0),
  source text not null,
  source_id text not null,
  wikidata_id text,
  region_id uuid references public.regions (id),
  status public.place_status not null default 'draft',
  is_private_property boolean not null default false,
  safety_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source, source_id),
  -- Safety rule: private property can never be an active challenge.
  constraint active_not_private check (not (status = 'active' and is_private_property))
);

create index places_location_idx on public.places using gist (location);
create index places_status_idx on public.places (status);

create trigger places_touch before update on public.places
  for each row execute function public.touch_updated_at();

create table public.place_photos (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places (id) on delete cascade,
  storage_path text,
  external_url text,
  author text,
  license text,
  source_url text,
  is_primary boolean not null default false,
  status text not null default 'approved' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  check (storage_path is not null or external_url is not null)
);

create unique index place_photos_one_primary on public.place_photos (place_id) where is_primary;

create table public.place_stats (
  place_id uuid primary key references public.places (id) on delete cascade,
  unique_visitors integer not null default 0 check (unique_visitors >= 0),
  first_discoverer_id uuid references public.profiles (id) on delete set null
);

-- ---------------------------------------------------------------------------
-- Visits and scoring (server-written only)
-- ---------------------------------------------------------------------------
create table public.visits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  place_id uuid not null references public.places (id) on delete cascade,
  verified_at timestamptz not null default now(),
  lat double precision not null,
  lng double precision not null,
  accuracy_m real not null,
  dwell_seconds integer not null,
  flags text[] not null default '{}',
  unique (user_id, place_id)
);

create index visits_user_idx on public.visits (user_id, verified_at desc);

create type public.ledger_kind as enum ('visit', 'first_discoverer', 'daily_challenge', 'collection', 'badge', 'streak');

create table public.points_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind public.ledger_kind not null,
  points integer not null default 0,
  xp integer not null default 0,
  visit_id uuid references public.visits (id) on delete set null,
  ref_id uuid,
  breakdown jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index points_ledger_user_idx on public.points_ledger (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Read helpers
-- ---------------------------------------------------------------------------
create view public.places_public
with (security_invoker = true) as
select
  p.id,
  p.name,
  p.description,
  p.category,
  extensions.st_y(p.location::extensions.geometry) as lat,
  extensions.st_x(p.location::extensions.geometry) as lng,
  p.geofence_radius_m,
  p.dwell_seconds,
  p.base_points,
  coalesce(s.unique_visitors, 0) as unique_visitors,
  ph.external_url as photo_url,
  ph.author as photo_author,
  ph.license as photo_license,
  p.region_id
from public.places p
left join public.place_stats s on s.place_id = p.id
left join public.place_photos ph on ph.place_id = p.id and ph.is_primary and ph.status = 'approved'
where p.status = 'active';

create or replace function public.nearby_places(lat double precision, lng double precision, radius_m integer default 20000)
returns setof public.places_public
language sql
stable
set search_path = public, extensions, pg_temp
as $$
  select pp.*
  from public.places_public pp
  join public.places p on p.id = pp.id
  where extensions.st_dwithin(
    p.location,
    extensions.st_setsrid(extensions.st_makepoint(lng, lat), 4326)::extensions.geography,
    least(radius_m, 100000)
  )
  order by p.location operator(extensions.<->) extensions.st_setsrid(extensions.st_makepoint(lng, lat), 4326)::extensions.geography
  limit 500;
$$;

create or replace function public.my_total_points()
returns integer
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select coalesce(sum(points), 0)::integer from public.points_ledger where user_id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.regions enable row level security;
alter table public.places enable row level security;
alter table public.place_photos enable row level security;
alter table public.place_stats enable row level security;
alter table public.visits enable row level security;
alter table public.points_ledger enable row level security;

create or replace function public.is_moderator()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce((select is_moderator from public.profiles where id = auth.uid()), false);
$$;

-- Profiles: basic profile cards are visible to signed-in users (like Instagram);
-- activity on private profiles is restricted by the social tables in Phase 4.
create policy profiles_select on public.profiles for select to authenticated using (true);
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- Only these columns are user-editable; xp/level/streak/is_moderator are server-owned.
revoke update on public.profiles from anon, authenticated;
grant update (username, display_name, avatar_url, home_city, is_private, explorer_styles, locale)
  on public.profiles to authenticated;

create policy regions_select on public.regions for select to anon, authenticated using (true);

create policy places_select on public.places for select to anon, authenticated
  using (status = 'active' or public.is_moderator());

create policy place_photos_select on public.place_photos for select to anon, authenticated
  using (status = 'approved' or public.is_moderator());

create policy place_stats_select on public.place_stats for select to anon, authenticated using (true);

create policy visits_select_own on public.visits for select to authenticated using (user_id = auth.uid());

create policy ledger_select_own on public.points_ledger for select to authenticated using (user_id = auth.uid());

-- Clients never write gameplay tables directly.
revoke insert, update, delete on public.regions, public.places, public.place_photos, public.place_stats,
  public.visits, public.points_ledger from anon, authenticated;

grant select on public.places_public to anon, authenticated;
