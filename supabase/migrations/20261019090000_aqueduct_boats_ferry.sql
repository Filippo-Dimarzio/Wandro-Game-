-- Not oddities after all: the Águas Livres Aqueduct is Heritage, and the moliceiro boat ride and
-- São Jacinto ferry are ways of getting around, so Culture. Mirrors packages/shared/src/quests.

update public.places set category = 'heritage', base_points = 120
where source = 'seed' and source_id = 'lisbon-aqueduct' and category = 'other';

update public.places set category = 'culture', base_points = 100
where source = 'seed' and source_id in ('aveiro-moliceiro-ride', 'aveiro-sao-jacinto-ferry')
  and category = 'other';
