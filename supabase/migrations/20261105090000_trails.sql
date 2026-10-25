-- Trails (Phase 17): a walk through 4–5 places in order, with a story and a clue at each stop
-- that you can only answer by looking around you there. The content lives in
-- packages/shared/src/trails.ts and is written below by trailsSql() (trails.test.ts checks it).
--
-- The server decides everything that pays: answers and hints live in trail_secrets, which no
-- client can read; progress is written only by the functions here. A clue can only be answered
-- once you've discovered that stop's place (a verified visit) and solved the stops before it.
-- Nothing is timed: start any time, pause, come back.

alter type public.ledger_kind add value if not exists 'trail_stop';
alter type public.ledger_kind add value if not exists 'trail';

create table public.trails (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  region_id uuid not null references public.regions (id),
  title text not null,
  intro text not null,
  outro text not null,
  theme public.place_category not null,
  position integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.trail_stops (
  trail_id uuid not null references public.trails (id) on delete cascade,
  position integer not null check (position >= 1),
  place_id uuid not null references public.places (id) on delete cascade,
  story text not null,
  question text not null,
  kind text not null check (kind in ('choice', 'number')),
  choices text[],
  primary key (trail_id, position),
  check ((kind = 'choice') = (choices is not null))
);

-- Answers and hints: server-only (RLS on, no policies, no grants).
create table public.trail_secrets (
  trail_id uuid not null references public.trails (id) on delete cascade,
  position integer not null,
  answer text not null,
  hints text[] not null check (cardinality(hints) = 3),
  primary key (trail_id, position)
);

create table public.trail_progress (
  user_id uuid not null references public.profiles (id) on delete cascade,
  trail_id uuid not null references public.trails (id) on delete cascade,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  primary key (user_id, trail_id)
);

create table public.trail_stop_progress (
  user_id uuid not null references public.profiles (id) on delete cascade,
  trail_id uuid not null references public.trails (id) on delete cascade,
  position integer not null,
  hints_used integer not null default 0 check (hints_used between 0 and 3),
  wrong integer not null default 0 check (wrong >= 0),
  solved_at timestamptz,
  coins integer,
  primary key (user_id, trail_id, position)
);

alter table public.trails enable row level security;
alter table public.trail_stops enable row level security;
alter table public.trail_secrets enable row level security;
alter table public.trail_progress enable row level security;
alter table public.trail_stop_progress enable row level security;

create policy trails_select on public.trails for select to anon, authenticated using (is_active);
create policy trail_stops_select on public.trail_stops for select to anon, authenticated
  using (exists (select 1 from public.trails t where t.id = trail_id and t.is_active));
create policy trail_progress_select_own on public.trail_progress for select to authenticated
  using (user_id = auth.uid());
create policy trail_stop_progress_select_own on public.trail_stop_progress for select to authenticated
  using (user_id = auth.uid());

revoke all on public.trail_secrets from anon, authenticated;
revoke insert, update, delete on public.trails, public.trail_stops, public.trail_progress,
  public.trail_stop_progress from anon, authenticated;

-- Finishing a trail is a completed challenge (50 XP), like a discovery or the daily challenge.
-- Compared as text so this function doesn't use the enum values added above in the same run.
create or replace function public.ledger_xp(k public.ledger_kind)
returns integer language sql immutable as $$
  select case when k::text in ('visit', 'daily_challenge', 'trail') then 50 else 0 end
$$;

-- Mirrors trailStopCoins() in packages/shared: 20, minus 5 per hint or wrong answer, at least 5.
create or replace function public.trail_stop_coins(p_hints integer, p_wrong integer)
returns integer language sql immutable as $$
  select greatest(5, 20 - 5 * (p_hints + p_wrong))
$$;

-- Mirrors normalizeAnswer(): case, outer spaces and repeated spaces don't matter.
create or replace function public.normalize_answer(s text)
returns text language sql immutable as $$
  select lower(btrim(regexp_replace(coalesce(s, ''), '\s+', ' ', 'g')))
$$;

-- The stop a player may work on: started, this stop exists, every earlier stop solved and this
-- one not. Raises a stable error code otherwise.
create or replace function public.trail_current_stop(uid uuid, p_trail text, p_position integer)
returns public.trail_stops language plpgsql stable security definer set search_path = public, pg_temp as $$
declare
  t public.trails;
  s public.trail_stops;
begin
  select * into t from public.trails where slug = p_trail and is_active;
  if not found then raise exception 'unknown_trail' using errcode = 'P0001'; end if;
  select * into s from public.trail_stops where trail_id = t.id and position = p_position;
  if not found then raise exception 'unknown_stop' using errcode = 'P0001'; end if;
  if not exists (select 1 from public.trail_progress where user_id = uid and trail_id = t.id) then
    raise exception 'not_started' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.trail_stop_progress
             where user_id = uid and trail_id = t.id and position = p_position and solved_at is not null) then
    raise exception 'already_solved' using errcode = 'P0001';
  end if;
  if (select count(*) from public.trail_stop_progress
      where user_id = uid and trail_id = t.id and position < p_position and solved_at is not null)
     < p_position - 1 then
    raise exception 'not_current' using errcode = 'P0001';
  end if;
  return s;
end;
$$;
revoke execute on function public.trail_current_stop(uuid, text, integer) from public, anon, authenticated;

-- Start (or resume) a trail. Idempotent.
create or replace function public.start_trail(p_trail text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare
  uid uuid := auth.uid();
  tid uuid;
begin
  if uid is null then raise exception 'not_authenticated' using errcode = 'P0001'; end if;
  select id into tid from public.trails where slug = p_trail and is_active;
  if tid is null then raise exception 'unknown_trail' using errcode = 'P0001'; end if;
  insert into public.trail_progress (user_id, trail_id) values (uid, tid) on conflict do nothing;
end;
$$;

-- Reveal the next hint for the current stop; it costs 5 of that stop's coins. Returns the hint.
create or replace function public.use_trail_hint(p_trail text, p_position integer)
returns text language plpgsql security definer set search_path = public, pg_temp as $$
declare
  uid uuid := auth.uid();
  s public.trail_stops;
  used integer;
begin
  if uid is null then raise exception 'not_authenticated' using errcode = 'P0001'; end if;
  s := public.trail_current_stop(uid, p_trail, p_position);
  insert into public.trail_stop_progress (user_id, trail_id, position) values (uid, s.trail_id, s.position)
    on conflict do nothing;
  select hints_used into used from public.trail_stop_progress
    where user_id = uid and trail_id = s.trail_id and position = s.position for update;
  if used >= 3 then raise exception 'no_more_hints' using errcode = 'P0001'; end if;
  update public.trail_stop_progress set hints_used = used + 1
    where user_id = uid and trail_id = s.trail_id and position = s.position;
  return (select hints[used + 1] from public.trail_secrets where trail_id = s.trail_id and position = s.position);
end;
$$;

-- Answer the current stop's clue. You must have discovered the place (a verified visit).
-- Right: pays the stop's coins and, on the last stop, the completion bonus. Wrong: costs 5 of
-- the stop's coins. Returns { correct, coins, completed, bonus }.
create or replace function public.answer_trail_clue(p_trail text, p_position integer, p_answer text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  uid uuid := auth.uid();
  s public.trail_stops;
  sp public.trail_stop_progress;
  secret public.trail_secrets;
  paid integer;
  last_position integer;
  bonus integer := 0;
begin
  if uid is null then raise exception 'not_authenticated' using errcode = 'P0001'; end if;
  s := public.trail_current_stop(uid, p_trail, p_position);
  if not exists (select 1 from public.visits where user_id = uid and place_id = s.place_id) then
    raise exception 'not_discovered' using errcode = 'P0001';
  end if;
  insert into public.trail_stop_progress (user_id, trail_id, position) values (uid, s.trail_id, s.position)
    on conflict do nothing;
  select * into sp from public.trail_stop_progress
    where user_id = uid and trail_id = s.trail_id and position = s.position for update;
  -- A second call racing the first sees the stop solved and pays nothing twice.
  if sp.solved_at is not null then raise exception 'already_solved' using errcode = 'P0001'; end if;
  select * into secret from public.trail_secrets where trail_id = s.trail_id and position = s.position;

  if public.normalize_answer(p_answer) <> public.normalize_answer(secret.answer) then
    update public.trail_stop_progress set wrong = wrong + 1
      where user_id = uid and trail_id = s.trail_id and position = s.position;
    return jsonb_build_object('correct', false, 'coins', 0, 'completed', false, 'bonus', 0);
  end if;

  paid := public.trail_stop_coins(sp.hints_used, sp.wrong);
  update public.trail_stop_progress set solved_at = now(), coins = paid
    where user_id = uid and trail_id = s.trail_id and position = s.position;
  insert into public.points_ledger (user_id, kind, points, ref_id, breakdown)
  values (uid, 'trail_stop', paid, s.trail_id, jsonb_build_object('trail', p_trail, 'stop', s.position));

  select max(position) into last_position from public.trail_stops where trail_id = s.trail_id;
  if s.position = last_position then
    update public.trail_progress set completed_at = now()
      where user_id = uid and trail_id = s.trail_id and completed_at is null;
    if found then
      bonus := 50;
      insert into public.points_ledger (user_id, kind, points, ref_id, breakdown)
      values (uid, 'trail', bonus, s.trail_id, jsonb_build_object('trail', p_trail));
    end if;
  end if;
  return jsonb_build_object('correct', true, 'coins', paid, 'completed', s.position = last_position, 'bonus', bonus);
end;
$$;

-- Every active trail with its stops and the caller's progress. Hints you've used come back as
-- text; the rest, and every answer, stay on the server.
create or replace function public.my_trails()
returns table (slug text, region_slug text, title text, intro text, outro text, theme text,
               started_at timestamptz, completed_at timestamptz, stops jsonb)
language sql stable security definer set search_path = public, pg_temp as $$
  select t.slug, r.slug, t.title, t.intro, t.outro, t.theme::text, tp.started_at, tp.completed_at,
         coalesce((
           select jsonb_agg(jsonb_build_object(
                    'position', s.position,
                    'place_id', s.place_id,
                    'place_name', p.name,
                    'lat', extensions.st_y(p.location::extensions.geometry),
                    'lng', extensions.st_x(p.location::extensions.geometry),
                    'story', s.story,
                    'question', s.question,
                    'kind', s.kind,
                    'choices', s.choices,
                    'hints', coalesce(sec.hints[1:coalesce(sp.hints_used, 0)], '{}'),
                    'wrong', coalesce(sp.wrong, 0),
                    'solved', sp.solved_at is not null,
                    'coins', sp.coins,
                    'discovered', exists (select 1 from public.visits v
                                          where v.user_id = auth.uid() and v.place_id = s.place_id))
                  order by s.position)
           from public.trail_stops s
           join public.places p on p.id = s.place_id
           join public.trail_secrets sec on sec.trail_id = s.trail_id and sec.position = s.position
           left join public.trail_stop_progress sp
             on sp.user_id = auth.uid() and sp.trail_id = s.trail_id and sp.position = s.position
           where s.trail_id = t.id), '[]'::jsonb) as stops
  from public.trails t
  join public.regions r on r.id = t.region_id
  left join public.trail_progress tp on tp.trail_id = t.id and tp.user_id = auth.uid()
  where t.is_active
  order by t.position;
$$;

revoke execute on function public.start_trail(text), public.use_trail_hint(text, integer),
  public.answer_trail_clue(text, integer, text) from public, anon;
grant execute on function public.start_trail(text), public.use_trail_hint(text, integer),
  public.answer_trail_clue(text, integer, text) to authenticated;
grant execute on function public.my_trails() to anon, authenticated;

-- Data export now includes trail progress (account deletion cascades from the profile).
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
        from public.posts p where p.user_id = auth.uid()), '[]'))
    || jsonb_build_object('trails', coalesce((select jsonb_agg(jsonb_build_object(
          'trail', t.slug, 'started_at', tp.started_at, 'completed_at', tp.completed_at,
          'stops', coalesce((select jsonb_agg(jsonb_build_object(
              'position', sp.position, 'hints_used', sp.hints_used, 'wrong', sp.wrong,
              'solved_at', sp.solved_at, 'coins', sp.coins) order by sp.position)
            from public.trail_stop_progress sp where sp.user_id = tp.user_id and sp.trail_id = tp.trail_id), '[]'))
          order by tp.started_at)
        from public.trail_progress tp join public.trails t on t.id = tp.trail_id
        where tp.user_id = auth.uid()), '[]'));
end;
$$;

-- Two trail stops were only in demo mode until now: Seteais and the Countess of Edla's Chalet
-- (both open to visitors; the dev seed lists them too).
insert into public.places (name, description, location, category, base_points, source, source_id, status, region_id)
select v.name, v.description,
       extensions.st_setsrid(extensions.st_makepoint(v.lng, v.lat), 4326)::extensions.geography,
       v.category::public.place_category, v.base_points, 'seed', v.source_id, 'active', r.id
from public.regions r, (values
  ('seteais', 'Seteais Palace Gardens', 'Neoclassical arch with sweeping views of the coast.', 'culture', 100, 38.7938, -9.403),
  ('condessa', 'Countess of Edla''s Chalet', 'Alpine-style chalet in the Pena Park.', 'culture', 100, 38.7845, -9.3917)
) as v(source_id, name, description, category, base_points, lat, lng)
where r.slug = 'sintra'
on conflict (source, source_id) do nothing;
update public.places set details = '{"teaser":"A neoclassical palace whose arch frames Pena on the hilltop.","facts":[{"text":"It was built in the late 1700s for the Dutch consul Daniel Gildemeester."},{"text":"The triumphal arch celebrates a visit by the future King John VI in 1802."},{"text":"The palace is a hotel today, but you can walk to the arch and its lawn."}],"lookFor":"Pena Palace framed in the middle of the arch.","bestTime":"Golden hour, before sunset.","durationMin":20,"cost":"free","access":"step_free"}'::jsonb where source = 'seed' and source_id = 'seteais';
update public.places set details = '{"teaser":"An Alpine-style chalet a king built for an opera singer.","facts":[{"text":"Ferdinand II built it in the 1860s with Elise Hensler, the singer he later married."},{"text":"Its decoration uses cork, the local material of the Sintra hills."},{"text":"Fire gutted it in 1999; it was restored and reopened in 2011."}],"lookFor":"The cork trim around the windows and doors.","bestTime":"Pair it with Pena: it sits in the quieter western part of the park.","durationMin":45,"cost":"ticket","access":"trail"}'::jsonb where source = 'seed' and source_id = 'condessa';

-- Trail content (generated by trailsSql(); the dev seed carries the same block).
insert into public.trails (slug, region_id, title, intro, outro, theme, position)
select 'sintra-artist-king', r.id, 'The Artist King', 'In the 1800s a German prince known as the “Artist King”, Ferdinand II, fell for these hills. He saved a ruined castle, raised a palace on a peak and planted a park with trees from around the world. Follow him through five of his projects.', 'You’ve walked the Artist King’s Sintra: the castle he saved, the palace he dreamed up, his cross on the summit, his garden and the chalet he built for love.', 'heritage', 1
from public.regions r where r.slug = 'sintra'
on conflict (slug) do update set title = excluded.title, intro = excluded.intro, outro = excluded.outro,
  theme = excluded.theme, position = excluded.position;
insert into public.trail_stops (trail_id, position, place_id, story, question, kind, choices)
select t.id, 1, p.id, 'The Moors built these walls in the 8th and 9th centuries, and Christian forces took them after Lisbon fell in 1147. By Ferdinand’s day they were a ruin, and he restored them while building his palace next door.', 'Climb to the highest point of the walls. What is that tower called?', 'choice', array['The Royal Tower', 'The Bell Tower', 'The Watchman’s Tower', 'The Moors’ Gate']::text[]
from public.trails t join public.places p on p.source = 'seed' and p.source_id = 'mouros'
where t.slug = 'sintra-artist-king'
on conflict (trail_id, position) do update set place_id = excluded.place_id, story = excluded.story,
  question = excluded.question, kind = excluded.kind, choices = excluded.choices;
insert into public.trail_secrets (trail_id, position, answer, hints)
select t.id, 1, 'The Royal Tower', array['It is the highest point of the walls.', 'Check the names on the signs along the walls.', 'It is named after royalty.']::text[] from public.trails t where t.slug = 'sintra-artist-king'
on conflict (trail_id, position) do update set answer = excluded.answer, hints = excluded.hints;
insert into public.trail_stops (trail_id, position, place_id, story, question, kind, choices)
select t.id, 2, p.id, 'Ferdinand built his palace in the mid-1800s around the ruins of a 16th-century monastery, whose cloister and chapel survive inside. It is part of the Cultural Landscape of Sintra, a UNESCO World Heritage Site since 1995.', 'Find the Triton arch. What holds up the window on its back?', 'choice', array['A sea monster', 'A dragon', 'A lion', 'An eagle']::text[]
from public.trails t join public.places p on p.source = 'seed' and p.source_id = 'pena'
where t.slug = 'sintra-artist-king'
on conflict (trail_id, position) do update set place_id = excluded.place_id, story = excluded.story,
  question = excluded.question, kind = excluded.kind, choices = excluded.choices;
insert into public.trail_secrets (trail_id, position, answer, hints)
select t.id, 2, 'A sea monster', array['The arch is named after it.', 'Triton was a god of the sea.', 'It lives in the waves.']::text[] from public.trails t where t.slug = 'sintra-artist-king'
on conflict (trail_id, position) do update set answer = excluded.answer, hints = excluded.hints;
insert into public.trail_stops (trail_id, position, place_id, story, question, kind, choices)
select t.id, 3, p.id, 'At about 529 m this is the roof of the Sintra hills. Ferdinand replaced the original 16th-century cross with a new one in the 1800s.', 'Stand by the cross and look down. Whose yellow towers do you see below you?', 'choice', array['Pena Palace', 'Monserrate Palace', 'Quinta da Regaleira', 'Seteais Palace']::text[]
from public.trails t join public.places p on p.source = 'seed' and p.source_id = 'cruz-alta'
where t.slug = 'sintra-artist-king'
on conflict (trail_id, position) do update set place_id = excluded.place_id, story = excluded.story,
  question = excluded.question, kind = excluded.kind, choices = excluded.choices;
insert into public.trail_secrets (trail_id, position, answer, hints)
select t.id, 3, 'Pena Palace', array['You have already been there today.', 'It is red and yellow.', 'Ferdinand built it.']::text[] from public.trails t where t.slug = 'sintra-artist-king'
on conflict (trail_id, position) do update set answer = excluded.answer, hints = excluded.hints;
insert into public.trail_stops (trail_id, position, place_id, story, question, kind, choices)
select t.id, 4, p.id, 'Ferdinand laid out Pena Park as a Romantic garden with trees from around the world, and threaded this valley with a chain of ponds.', 'A little castle sits on the water. Who was it built for?', 'choice', array['Ducks', 'Swans', 'The king’s children', 'The gardener']::text[]
from public.trails t join public.places p on p.source = 'seed' and p.source_id = 'sintra-valley-of-lakes'
where t.slug = 'sintra-artist-king'
on conflict (trail_id, position) do update set place_id = excluded.place_id, story = excluded.story,
  question = excluded.question, kind = excluded.kind, choices = excluded.choices;
insert into public.trail_secrets (trail_id, position, answer, hints)
select t.id, 4, 'Ducks', array['Whoever lives there can swim.', 'It is not the swans.', 'Listen for quacking.']::text[] from public.trails t where t.slug = 'sintra-artist-king'
on conflict (trail_id, position) do update set answer = excluded.answer, hints = excluded.hints;
insert into public.trail_stops (trail_id, position, place_id, story, question, kind, choices)
select t.id, 5, p.id, 'Ferdinand built this Alpine-style chalet in the 1860s with Elise Hensler, the opera singer he later married. Fire gutted it in 1999; it was restored and reopened in 2011.', 'What local material trims its windows and doors?', 'choice', array['Cork', 'Marble', 'Iron', 'Bamboo']::text[]
from public.trails t join public.places p on p.source = 'seed' and p.source_id = 'condessa'
where t.slug = 'sintra-artist-king'
on conflict (trail_id, position) do update set place_id = excluded.place_id, story = excluded.story,
  question = excluded.question, kind = excluded.kind, choices = excluded.choices;
insert into public.trail_secrets (trail_id, position, answer, hints)
select t.id, 5, 'Cork', array['It is the local material of the Sintra hills.', 'It comes from the bark of a tree.', 'Wine bottles are stopped with it.']::text[] from public.trails t where t.slug = 'sintra-artist-king'
on conflict (trail_id, position) do update set answer = excluded.answer, hints = excluded.hints;
insert into public.trails (slug, region_id, title, intro, outro, theme, position)
select 'sintra-magpies-millionaire', r.id, 'Kings, Magpies and a Millionaire', 'Sintra has drawn kings, consuls and millionaires for nine centuries. Walk through the old town from a church as old as Portugal’s first king’s conquest to a consul’s arch with the best view in town.', 'From a church founded after 1147 to an arch built for a future king in 1802: nine centuries of Sintra in one walk.', 'heritage', 2
from public.regions r where r.slug = 'sintra'
on conflict (slug) do update set title = excluded.title, intro = excluded.intro, outro = excluded.outro,
  theme = excluded.theme, position = excluded.position;
insert into public.trail_stops (trail_id, position, place_id, story, question, kind, choices)
select t.id, 1, p.id, 'One of Sintra’s oldest churches, founded after Afonso Henriques took Sintra in 1147. It was built as Romanesque gave way to Gothic, and it has been a National Monument since 1922.', 'Step inside. How many naves (aisles) does the church have?', 'number', null
from public.trails t join public.places p on p.source = 'seed' and p.source_id = 'sintra-santa-maria'
where t.slug = 'sintra-magpies-millionaire'
on conflict (trail_id, position) do update set place_id = excluded.place_id, story = excluded.story,
  question = excluded.question, kind = excluded.kind, choices = excluded.choices;
insert into public.trail_secrets (trail_id, position, answer, hints)
select t.id, 1, '3', array['Count the rows of space between the columns, front to back.', 'More than one.', 'Fewer than four.']::text[] from public.trails t where t.slug = 'sintra-magpies-millionaire'
on conflict (trail_id, position) do update set answer = excluded.answer, hints = excluded.hints;
insert into public.trail_stops (trail_id, position, place_id, story, question, kind, choices)
select t.id, 2, p.id, 'The two cone-shaped chimneys, about 33 m tall, belong to the royal kitchen of the best-preserved medieval royal palace in Portugal. Kings used it for centuries.', 'In the Magpie Room, every magpie holds the same motto. What does it say?', 'choice', array['Por bem', 'Por Portugal', 'Sempre fiel', 'Ordem e progresso']::text[]
from public.trails t join public.places p on p.source = 'seed' and p.source_id = 'sintra-national-palace'
where t.slug = 'sintra-magpies-millionaire'
on conflict (trail_id, position) do update set place_id = excluded.place_id, story = excluded.story,
  question = excluded.question, kind = excluded.kind, choices = excluded.choices;
insert into public.trail_secrets (trail_id, position, answer, hints)
select t.id, 2, 'Por bem', array['There are 136 magpies on the ceiling.', 'It is just two words.', 'It means “for the good”.']::text[] from public.trails t where t.slug = 'sintra-magpies-millionaire'
on conflict (trail_id, position) do update set answer = excluded.answer, hints = excluded.hints;
insert into public.trail_stops (trail_id, position, place_id, story, question, kind, choices)
select t.id, 3, p.id, 'António Augusto Carvalho Monteiro, nicknamed “Monteiro the Millionaire”, had the Italian architect Luigi Manini design this palace and garden in the early 1900s. His strangest idea goes down, not up.', 'Spiral down the Initiation Well. How many landings does it have?', 'number', null
from public.trails t join public.places p on p.source = 'seed' and p.source_id = 'regaleira'
where t.slug = 'sintra-magpies-millionaire'
on conflict (trail_id, position) do update set place_id = excluded.place_id, story = excluded.story,
  question = excluded.question, kind = excluded.kind, choices = excluded.choices;
insert into public.trail_secrets (trail_id, position, answer, hints)
select t.id, 3, '9', array['The well is about 27 m deep.', 'More than seven.', 'One fewer than ten.']::text[] from public.trails t where t.slug = 'sintra-magpies-millionaire'
on conflict (trail_id, position) do update set answer = excluded.answer, hints = excluded.hints;
insert into public.trail_stops (trail_id, position, place_id, story, question, kind, choices)
select t.id, 4, p.id, 'A neoclassical palace built in the late 1700s for the Dutch consul Daniel Gildemeester. Its triumphal arch celebrates a visit by the future King John VI in 1802. The palace is a hotel today, but the arch and its lawn are open to walk to.', 'Stand under the arch and look up the hill. Which palace sits in the middle of the frame?', 'choice', array['Pena Palace', 'Quinta da Regaleira', 'Monserrate Palace', 'Sintra National Palace']::text[]
from public.trails t join public.places p on p.source = 'seed' and p.source_id = 'seteais'
where t.slug = 'sintra-magpies-millionaire'
on conflict (trail_id, position) do update set place_id = excluded.place_id, story = excluded.story,
  question = excluded.question, kind = excluded.kind, choices = excluded.choices;
insert into public.trail_secrets (trail_id, position, answer, hints)
select t.id, 4, 'Pena Palace', array['It is on the highest peak you can see.', 'It is red and yellow.', 'Ferdinand II built it.']::text[] from public.trails t where t.slug = 'sintra-magpies-millionaire'
on conflict (trail_id, position) do update set answer = excluded.answer, hints = excluded.hints;
