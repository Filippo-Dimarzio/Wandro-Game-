-- Food, drink and markets are Culture; genuine oddities are Curiosities (mirrors packages/shared).
begin;
select pg_temp.check(
  (select count(*) from places where source = 'seed' and category = 'culture' and source_id in
    ('lisbon-pasteis-belem', 'lisbon-ginjinha', 'lisbon-feira-ladra', 'sintra-piriquita', 'porto-majestic')) = 5,
  'bakeries, bars, cafés and markets are Culture');
select pg_temp.check(
  (select count(*) from places where source = 'seed' and category = 'other' and source_id in
    ('aveiro-canal-piramides', 'lisbon-casa-dos-bicos', 'porto-agramonte', 'evora-graca')) = 4,
  'oddities are Curiosities');
select pg_temp.check(
  (select base_points from places where source = 'seed' and source_id = 'lisbon-pasteis-belem') = 100,
  'moved places earn their new category''s base points');
rollback;
