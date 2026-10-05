-- Beta waitlist from the /join page. Anyone may add themselves; nobody can read the list back
-- through the API (only the project owners, from the dashboard). Consent is required.

create table public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email extensions.citext not null unique
    check (email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]{2,}$' and char_length(email) <= 254),
  first_name text check (char_length(first_name) <= 60),
  lives_in text not null check (lives_in in ('lisbon', 'sintra', 'porto', 'portugal', 'visiting')),
  occupation text not null check (occupation in ('study', 'work', 'both', 'other')),
  transport text[] not null default '{}'
    check (transport <@ array['metro', 'train', 'bus_tram', 'walk', 'bike', 'car']),
  interests text[] not null default '{}'
    check (interests <@ array['coast', 'nature', 'heritage', 'culture', 'art', 'music_events', 'other']),
  fog_walk text not null check (fog_walk in ('yes', 'maybe', 'no')),
  consent boolean not null check (consent),
  source text check (source ~ '^[a-z0-9_-]{1,32}$'),
  created_at timestamptz not null default now()
);

alter table public.waitlist enable row level security;

create policy waitlist_insert on public.waitlist for insert to anon, authenticated with check (consent);

revoke all on public.waitlist from anon, authenticated;
grant insert (email, first_name, lives_in, occupation, transport, interests, fog_walk, consent, source)
  on public.waitlist to anon, authenticated;
