-- The Convent of the Capuchos was added twice in Sintra: the original place ('capuchos', Heritage)
-- and a later Curiosities copy ('sintra-capuchos'). Keep the original as the curiosity, and
-- close the copy rather than delete it, so any visits or posts to it are kept.

update public.places set category = 'other', base_points = 60
where source = 'seed' and source_id = 'capuchos' and category = 'heritage';

update public.places set status = 'closed'
where source = 'seed' and source_id = 'sintra-capuchos' and status = 'active';
