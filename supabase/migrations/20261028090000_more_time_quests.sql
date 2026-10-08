-- Five more time-of-day quests (Time-of-day key): open, public, lit spots only at night.
-- TIME_QUESTS in packages/shared lists every quest (a test compares them with the migrations).
update public.places p set time_quest = v.kind
from (values
  ('lisbon-belem-tower', 'golden'), ('lisbon-santa-justa', 'night'),
  ('porto-foz', 'golden'), ('porto-ribeira', 'night'),
  ('evora-giraldo-fountain', 'night')
) as v(source_id, kind)
where p.source = 'seed' and p.source_id = v.source_id;
