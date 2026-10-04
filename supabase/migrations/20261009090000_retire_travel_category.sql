-- Travel is folded into Culture (stations, funiculars and bridges are part of a city's culture),
-- and Art is shown as "Art & museums". Postgres can't drop an enum value, so 'travel' stays in
-- the type but nothing may use it any more. Mirrors CATEGORIES in packages/shared.

update public.places
set category = 'culture', base_points = case when base_points = 80 then 100 else base_points end
where category = 'travel';

update public.place_submissions set category = 'culture' where category = 'travel';

-- The travel day of the challenge rotation becomes a music & events day.
update public.daily_challenges
set category = 'music_events', title = 'Catch the music',
    description = 'Discover a concert hall, music club or event venue today.'
where category = 'travel';

alter table public.places add constraint places_category_not_travel check (category <> 'travel');
alter table public.place_submissions add constraint place_submissions_category_not_travel check (category <> 'travel');
alter table public.daily_challenges add constraint daily_challenges_category_not_travel check (category is distinct from 'travel');
