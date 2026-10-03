-- nearby_places() returned every place: inside the query, the bare names `lat` and `lng` resolved
-- to places_public's own lat/lng columns rather than the parameters, so each place was measured
-- against itself (distance 0). Unnoticed with one city; with Europe it loaded the whole
-- continent. Same signature, parameters now qualified with the function name.
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
    extensions.st_setsrid(extensions.st_makepoint(nearby_places.lng, nearby_places.lat), 4326)::extensions.geography,
    least(nearby_places.radius_m, 100000)
  )
  order by p.location operator(extensions.<->)
    extensions.st_setsrid(extensions.st_makepoint(nearby_places.lng, nearby_places.lat), 4326)::extensions.geography
  limit 500;
$$;
