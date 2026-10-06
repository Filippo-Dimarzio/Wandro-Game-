-- Bakeries, bars, cafés, port lodges and markets were filed as Curiosities when Culture meant
-- museums. Culture now covers food, markets and cafés, so they move there; Aveiro's Canal das
-- Pirâmides (find the pyramids) becomes a Curiosity. Mirrors packages/shared/src/quests.
-- Coins already earned are untouched; base points follow the new category for future visits.

update public.places
set category = 'culture', base_points = 100
where source = 'seed'
  and category = 'other'
  and source_id in (
    'sintra-piriquita', 'sintra-sao-pedro-fair',
    'lisbon-pasteis-belem', 'lisbon-feira-ladra', 'lisbon-ginjinha', 'lisbon-pink-street',
    'porto-majestic', 'porto-santiago', 'porto-grahams', 'porto-galerias-paris',
    'evora-mercado', 'evora-pao-de-rala',
    'aveiro-ovos-moles', 'aveiro-mercado-peixe'
  );

update public.places
set category = 'other', base_points = 60
where source = 'seed'
  and source_id in ('aveiro-canal-piramides', 'evora-cinco-quinas');
