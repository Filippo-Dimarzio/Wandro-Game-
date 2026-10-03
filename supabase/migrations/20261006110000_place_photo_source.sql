-- Expose each photo's source page (Wikimedia Commons) so the app can link its attribution.
create or replace view public.places_public
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
  p.region_id,
  p.opening_hours,
  p.is_hidden,
  ph.source_url as photo_source
from public.places p
left join public.place_stats s on s.place_id = p.id
left join public.place_photos ph on ph.place_id = p.id and ph.is_primary and ph.status = 'approved'
where p.status = 'active';
