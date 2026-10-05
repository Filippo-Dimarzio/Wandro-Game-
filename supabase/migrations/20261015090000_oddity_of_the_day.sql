-- Oddity of the day: the Curiosities slot of the daily challenge rotation cycles through its own
-- list of quests, one per 9-day cycle. Mirrors ODDITIES in packages/shared/src/challenges.ts
-- (catalog-sync.test.ts checks). Any curiosity discovered that day still counts.

create or replace function public.challenge_rotation(d date)
returns table (title text, description text, category public.place_category)
language sql
immutable
set search_path = public, pg_temp
as $$
  select case when r.i = 5 then o.title else r.title end,
         case when r.i = 5 then o.description else r.description end,
         r.category
  from (values
    (0, 'Find a hidden viewpoint', 'Discover any nature spot today.', 'nature'::public.place_category),
    (1, 'Step into history', 'Discover any heritage site today.', 'heritage'::public.place_category),
    (2, 'Catch the music', 'Discover a concert hall, music club or event venue today.', 'music_events'::public.place_category),
    (3, 'Culture hunt', 'Discover a market, café, festival spot or old neighbourhood today.', 'culture'::public.place_category),
    (4, 'Follow the coastline', 'Discover any beach or coastal spot today.', 'coast'::public.place_category),
    (5, 'Oddity of the day', 'Discover any curiosity today.', 'other'::public.place_category),
    (6, 'Art attack', 'Discover a gallery, museum, mural or piece of street art today.', 'art'::public.place_category),
    (7, 'Sound check', 'Discover any music venue or event spot today.', 'music_events'::public.place_category),
    (8, 'Wander anywhere new', 'Discover any place you have never visited.', null)
  ) as r (i, title, description, category)
  left join (values
    (0, 'Oddity of the day: Look up!', 'Discover any curiosity today. Find something odd above eye level: a carved face, a strange weathervane, a forgotten sign.'),
    (1, 'Oddity of the day: Behind the door', 'Discover any curiosity today. Look for one tucked down a side street most people walk past.'),
    (2, 'Oddity of the day: The smallest thing', 'Discover any curiosity today. Photograph its tiniest detail.'),
    (3, 'Oddity of the day: Secret staircase', 'Discover any curiosity today. Look for one reached by steps, an alley or a hidden passage.'),
    (4, 'Oddity of the day: Local legend', 'Discover any curiosity today. Find one with a myth, ghost story or legend attached.'),
    (5, 'Oddity of the day: Lost and found', 'Discover any curiosity today. Find one that was once forgotten, abandoned or rediscovered.'),
    (6, 'Oddity of the day: Saints and superstitions', 'Discover any curiosity today. Find one linked to a local belief or lucky ritual.'),
    (7, 'Oddity of the day: Unsolved', 'Discover any curiosity today. Find one nobody can fully explain: why it is there, who made it, what it was for.'),
    (8, 'Oddity of the day: Royal oddity', 'Discover any curiosity today. Find one with a story about a king, queen or noble eccentric.'),
    (9, 'Oddity of the day: Bones and stones', 'Discover any curiosity today. Find one made of something unexpected: bones, shells, bottles or cork.'),
    (10, 'Oddity of the day: Tiny architecture', 'Discover any curiosity today. Hunt for the smallest building, door or chapel you can find.'),
    (11, 'Oddity of the day: Odd one out', 'Discover any curiosity today. Find one that looks completely out of place where it stands.'),
    (12, 'Oddity of the day: Ancient puzzle', 'Discover any curiosity today. Find one older than the town around it: a standing stone, a fossil, a footprint.'),
    (13, 'Oddity of the day: Mechanical marvel', 'Discover any curiosity today. Find one with old machinery: a lift, a clock, a mill or a pump.'),
    (14, 'Oddity of the day: Water wonders', 'Discover any curiosity today. Find a curious fountain, well, spring or old washhouse.'),
    (15, 'Oddity of the day: Sweet secret', 'Discover any curiosity today. Find one with a sweet or pastry made to a centuries-old recipe.'),
    (16, 'Oddity of the day: Follow your nose', 'Discover any curiosity today. Find one you can smell before you see it: a bakery, a market, the sea.'),
    (17, 'Oddity of the day: Listen closely', 'Discover any curiosity today. Record five seconds of its sound: bells, trams, gulls or chatter.'),
    (18, 'Oddity of the day: Take the slow road', 'Discover any curiosity today. Get there by tram, funicular, ferry or on foot.'),
    (19, 'Oddity of the day: Ask a local', 'Discover any curiosity today. Ask someone there for a story about it.'),
    (20, 'Oddity of the day: Compass point', 'Discover any curiosity today. Pick the one furthest north (or west) you can reach today.'),
    (21, 'Oddity of the day: Spot the octopus', 'Discover any curiosity today. Find something shaped like a tentacle, swirl or spiral there.'),
    (22, 'Oddity of the day: Cabinet of curiosities', 'Discover any curiosity today. Photograph three odd objects nearby for your collection.')
  ) as o (j, title, description) on o.j = ((d - date '1970-01-01') / 9) % 23
  where r.i = (d - date '1970-01-01') % 9;
$$;

revoke execute on function public.challenge_rotation(date) from public, anon, authenticated;

-- Curiosities days already created but not yet opened get their quest.
update public.daily_challenges c
set (title, description) = (
  select r.title, r.description from public.challenge_rotation(c.challenge_date) r
)
where c.campaign is null
  and c.place_id is null
  and c.category = 'other'
  and c.challenge_date >= (now() at time zone 'Europe/Lisbon')::date
  and not exists (select 1 from public.user_daily_challenges u where u.challenge_id = c.id);
