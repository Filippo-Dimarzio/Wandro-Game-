-- Development seed: the Sintra region, a handful of curated places, and daily
-- challenges. Real place data comes from scripts/importer (OSM + Wikidata).
-- Coordinates are approximate.

insert into public.regions (slug, name, bbox, is_active)
values ('sintra', 'Sintra', extensions.st_makeenvelope(-9.52, 38.73, -9.30, 38.85, 4326), true)
on conflict (slug) do nothing;

with r as (select id from public.regions where slug = 'sintra')
insert into public.places (name, description, location, category, base_points, source, source_id, status, region_id)
select v.name, v.description,
       extensions.st_setsrid(extensions.st_makepoint(v.lng, v.lat), 4326)::extensions.geography,
       v.category::public.place_category, v.base_points, 'seed', v.source_id, 'active', r.id
from r, (values
  ('pena', 'Pena Palace', 'Colourful Romanticist palace on a hilltop above Sintra.', 'heritage', 120, 38.7876, -9.3906),
  ('regaleira', 'Quinta da Regaleira', 'Estate with gardens, grottoes and the famous initiation well.', 'heritage', 120, 38.7967, -9.3958),
  ('mouros', 'Castle of the Moors', 'Medieval hilltop castle with walls that climb the ridge.', 'heritage', 120, 38.7917, -9.3880),
  ('monserrate', 'Monserrate Palace', 'Exotic palace surrounded by botanical gardens.', 'culture', 100, 38.7919, -9.4191),
  ('capuchos', 'Convent of the Capuchos', 'Tiny cork-lined convent hidden in the forest.', 'heritage', 120, 38.7777, -9.4469),
  ('cabo-da-roca', 'Cabo da Roca Viewpoint', 'The westernmost point of mainland Europe.', 'coast', 80, 38.7804, -9.4989),
  ('adraga', 'Adraga Beach', 'Wild cove with rock arches and dramatic sunsets.', 'coast', 80, 38.8236, -9.4731),
  ('praia-grande', 'Praia Grande', 'Surf beach where dinosaur footprints climb the cliff at the southern end.', 'coast', 80, 38.8160, -9.4785),
  ('azenhas', 'Azenhas do Mar', 'White village tumbling down a cliff to a tide pool.', 'coast', 80, 38.8406, -9.4618),
  ('music-corner', 'Sintra Live Music Corner', 'Small local venue with traditional fado nights.', 'music_events', 100, 38.7985, -9.3875),
  ('cruz-alta', 'Cruz Alta Viewpoint', 'The highest point of the Sintra hills.', 'nature', 80, 38.7861, -9.3897)
) as v(source_id, name, description, category, base_points, lat, lng)
on conflict (source, source_id) do nothing;

-- Venues with set times (Thu–Sat, 21:30 to 00:30).
update public.places
set opening_hours = '[{"days": [4, 5, 6], "open": "21:30", "close": "00:30"}]'
where source = 'seed' and source_id = 'music-corner';

-- Europe launch cities (mirrors EUROPE_PLACES in packages/shared). Hidden gems stay off the map
-- until a player is within 200 m.
insert into public.places (name, description, location, category, base_points, source, source_id, status, region_id, is_hidden, opening_hours)
select v.name, v.description,
       extensions.st_setsrid(extensions.st_makepoint(v.lng, v.lat), 4326)::extensions.geography,
       v.category::public.place_category, v.base_points, 'seed', v.source_id, 'active', r.id, v.hidden, v.hours
from (values
  ('sintra', 'sintra-fonte-mourisca', 'Moorish Fountain', 'Neo-Moorish fountain tiled in green and white, tucked into a bend of the old road.', 'heritage', 120, 38.7983, -9.3858, true, null),
  ('sintra', 'sintra-peninha', 'Peninha Sanctuary', 'Hermit chapel on a granite crag with the whole coast below it.', 'nature', 80, 38.7686, -9.4589, true, null),
  ('lisbon', 'lisbon-belem-tower', 'Belém Tower', 'Sixteenth-century fortress that guarded the mouth of the Tagus.', 'heritage', 120, 38.6916, -9.216, false, null),
  ('lisbon', 'lisbon-jeronimos', 'Jerónimos Monastery', 'Manueline monastery carved with ropes, shells and sea creatures.', 'heritage', 120, 38.6979, -9.2068, false, null),
  ('lisbon', 'lisbon-sao-jorge', 'São Jorge Castle', 'Hilltop castle whose ramparts look over the red roofs of Alfama.', 'heritage', 120, 38.7139, -9.1335, false, null),
  ('lisbon', 'lisbon-senhora-do-monte', 'Senhora do Monte Viewpoint', 'The highest viewpoint in Lisbon, under umbrella pines.', 'nature', 80, 38.7193, -9.1326, false, null),
  ('lisbon', 'lisbon-lx-factory', 'LX Factory', 'Old textile mill turned into studios, bookshops and street art.', 'culture', 100, 38.7037, -9.1785, false, null),
  ('lisbon', 'lisbon-fado-alfama', 'Alfama Fado House', 'Candle-lit room where fado is sung most nights.', 'music_events', 100, 38.7106, -9.1305, false, '[{"days": [0, 1, 2, 3, 4, 5, 6], "open": "20:00", "close": "01:00"}]'::jsonb),
  ('lisbon', 'lisbon-sao-cristovao-steps', 'São Cristóvão Steps', 'Stairway painted with a mural of the fado singers who lived here.', 'other', 60, 38.7128, -9.1351, true, null),
  ('porto', 'porto-ribeira', 'Ribeira Waterfront', 'Stacked, colourful houses along the Douro quay.', 'heritage', 120, 41.1407, -8.6131, false, null),
  ('porto', 'porto-lello', 'Livraria Lello', 'Neo-Gothic bookshop with a crimson staircase.', 'culture', 100, 41.1469, -8.6149, false, null),
  ('porto', 'porto-clerigos', 'Clérigos Tower', 'Baroque bell tower with 240 steps to the top.', 'heritage', 120, 41.1457, -8.6146, false, null),
  ('porto', 'porto-dom-luis', 'Dom Luís I Bridge', 'Double-decker iron bridge you can walk across at rooftop height.', 'heritage', 120, 41.1399, -8.6094, false, null),
  ('porto', 'porto-palacio-cristal', 'Crystal Palace Gardens', 'Romantic gardens with peacocks and river views.', 'nature', 80, 41.1479, -8.6255, false, null),
  ('porto', 'porto-foz', 'Foz do Douro Beach', 'Where the Douro meets the Atlantic, with a lighthouse pier.', 'coast', 80, 41.1497, -8.6764, false, null),
  ('porto', 'porto-virtudes', 'Virtudes Terraces', 'Sloping garden where locals watch the sun set over the river.', 'nature', 80, 41.1438, -8.6188, true, null),
  ('madrid', 'madrid-royal-palace', 'Royal Palace of Madrid', 'One of the largest palaces in Europe, with 3,400 rooms.', 'heritage', 120, 40.418, -3.7143, false, null),
  ('madrid', 'madrid-prado', 'Prado Museum', 'Velázquez, Goya and Bosch under one roof.', 'culture', 100, 40.4138, -3.6921, false, null),
  ('madrid', 'madrid-retiro', 'Retiro Park', 'Rowing lake, rose garden and a glass palace.', 'nature', 80, 40.4153, -3.6845, false, null),
  ('madrid', 'madrid-plaza-mayor', 'Plaza Mayor', 'Arcaded seventeenth-century square at the heart of old Madrid.', 'heritage', 120, 40.4155, -3.7074, false, null),
  ('madrid', 'madrid-debod', 'Temple of Debod', 'Ancient Egyptian temple rebuilt on a hill above the city.', 'heritage', 120, 40.424, -3.7178, false, null),
  ('madrid', 'madrid-san-miguel', 'San Miguel Market', 'Iron-and-glass market hall full of tapas stalls.', 'other', 60, 40.4154, -3.709, false, '[{"days": [0, 1, 2, 3, 4, 5, 6], "open": "10:00", "close": "00:00"}]'::jsonb),
  ('madrid', 'madrid-anglona', 'Prince of Anglona Garden', 'A tiny walled garden from the 1700s, easy to walk past.', 'nature', 80, 40.4127, -3.7118, true, null),
  ('barcelona', 'barcelona-sagrada-familia', 'Sagrada Família', 'Gaudí’s basilica, still being built after more than a century.', 'heritage', 120, 41.4036, 2.1744, false, null),
  ('barcelona', 'barcelona-park-guell', 'Park Güell', 'Mosaic terraces and gingerbread houses above the city.', 'nature', 80, 41.4145, 2.1527, false, null),
  ('barcelona', 'barcelona-casa-batllo', 'Casa Batlló', 'A house with a dragon’s back for a roof.', 'culture', 100, 41.3917, 2.1649, false, null),
  ('barcelona', 'barcelona-barceloneta', 'Barceloneta Beach', 'The city’s beach, a short walk from the old town.', 'coast', 80, 41.3784, 2.1925, false, null),
  ('barcelona', 'barcelona-cathedral', 'Barcelona Cathedral', 'Gothic cathedral whose cloister is home to thirteen geese.', 'heritage', 120, 41.3839, 2.1762, false, null),
  ('barcelona', 'barcelona-palau-musica', 'Palau de la Música Catalana', 'Modernista concert hall lit by a stained-glass skylight.', 'music_events', 100, 41.3875, 2.1753, false, '[{"days": [0, 1, 2, 3, 4, 5, 6], "open": "10:00", "close": "23:00"}]'::jsonb),
  ('barcelona', 'barcelona-bunkers', 'Carmel Bunkers', 'Old anti-aircraft battery with a 360° view of Barcelona.', 'nature', 80, 41.4192, 2.1617, true, null),
  ('paris', 'paris-eiffel', 'Eiffel Tower', 'Iron lattice tower that sparkles on the hour after dark.', 'heritage', 120, 48.8584, 2.2945, false, null),
  ('paris', 'paris-louvre', 'Louvre Museum', 'The world’s most visited museum, behind a glass pyramid.', 'culture', 100, 48.8606, 2.3376, false, null),
  ('paris', 'paris-notre-dame', 'Notre-Dame de Paris', 'Gothic cathedral on the Île de la Cité, restored after the 2019 fire.', 'heritage', 120, 48.853, 2.3499, false, null),
  ('paris', 'paris-sacre-coeur', 'Sacré-Cœur', 'White basilica on top of Montmartre.', 'heritage', 120, 48.8867, 2.3431, false, null),
  ('paris', 'paris-luxembourg', 'Luxembourg Gardens', 'Palace gardens with toy sailboats on the pond.', 'nature', 80, 48.8462, 2.3372, false, null),
  ('paris', 'paris-orsay', 'Musée d’Orsay', 'Impressionist paintings inside a former railway station.', 'culture', 100, 48.86, 2.3266, false, null),
  ('paris', 'paris-cremieux', 'Rue Crémieux', 'A short cobbled street of pastel-painted houses.', 'other', 60, 48.847, 2.3709, true, null),
  ('rome', 'rome-colosseum', 'Colosseum', 'Amphitheatre that held 50,000 spectators.', 'heritage', 120, 41.8902, 12.4922, false, null),
  ('rome', 'rome-pantheon', 'Pantheon', 'Two-thousand-year-old temple with an open eye in its dome.', 'heritage', 120, 41.8986, 12.4769, false, null),
  ('rome', 'rome-trevi', 'Trevi Fountain', 'Throw a coin over your shoulder to return to Rome.', 'heritage', 120, 41.9009, 12.4833, false, null),
  ('rome', 'rome-forum', 'Roman Forum', 'The ruins of ancient Rome’s public square.', 'heritage', 120, 41.8925, 12.4853, false, null),
  ('rome', 'rome-borghese', 'Villa Borghese Gardens', 'Rome’s central park, with a lake temple and a view from the Pincio.', 'nature', 80, 41.9142, 12.4923, false, null),
  ('rome', 'rome-vatican-museums', 'Vatican Museums', 'Miles of galleries ending at the Sistine Chapel.', 'culture', 100, 41.9065, 12.4536, false, null),
  ('rome', 'rome-aventine-keyhole', 'Aventine Keyhole', 'Peek through a garden door’s keyhole to see St Peter’s dome framed perfectly.', 'other', 60, 41.8833, 12.4797, true, null),
  ('florence', 'florence-duomo', 'Florence Cathedral', 'Brunelleschi’s dome still dominates the skyline.', 'heritage', 120, 43.7731, 11.256, false, null),
  ('florence', 'florence-uffizi', 'Uffizi Gallery', 'Botticelli’s Venus and the Renaissance masters.', 'culture', 100, 43.7678, 11.2553, false, null),
  ('florence', 'florence-ponte-vecchio', 'Ponte Vecchio', 'Medieval bridge lined with goldsmiths’ shops.', 'heritage', 120, 43.768, 11.2531, false, null),
  ('florence', 'florence-michelangelo', 'Piazzale Michelangelo', 'The classic sunset view over Florence.', 'nature', 80, 43.7629, 11.265, false, null),
  ('florence', 'florence-boboli', 'Boboli Gardens', 'Terraced Medici gardens full of statues and grottoes.', 'nature', 80, 43.7625, 11.2484, false, null),
  ('florence', 'florence-rose-garden', 'Rose Garden', 'Quiet terraced rose garden just below the famous viewpoint.', 'nature', 80, 43.7638, 11.2626, true, null),
  ('amsterdam', 'amsterdam-rijksmuseum', 'Rijksmuseum', 'Rembrandt’s Night Watch and the Dutch Golden Age.', 'culture', 100, 52.36, 4.8852, false, null),
  ('amsterdam', 'amsterdam-anne-frank', 'Anne Frank House', 'The canal house where Anne Frank wrote her diary.', 'heritage', 120, 52.3752, 4.884, false, null),
  ('amsterdam', 'amsterdam-vondelpark', 'Vondelpark', 'The city’s favourite park for cycling and picnics.', 'nature', 80, 52.358, 4.8686, false, null),
  ('amsterdam', 'amsterdam-van-gogh', 'Van Gogh Museum', 'The largest collection of Van Gogh’s work.', 'culture', 100, 52.3584, 4.8811, false, null),
  ('amsterdam', 'amsterdam-dam', 'Royal Palace on Dam Square', 'Seventeenth-century town hall turned royal palace.', 'heritage', 120, 52.3731, 4.8913, false, null),
  ('amsterdam', 'amsterdam-concertgebouw', 'Concertgebouw', 'Concert hall famous for its near-perfect acoustics.', 'music_events', 100, 52.3563, 4.8789, false, '[{"days": [0, 1, 2, 3, 4, 5, 6], "open": "10:00", "close": "23:00"}]'::jsonb),
  ('amsterdam', 'amsterdam-begijnhof', 'Begijnhof', 'Hidden courtyard of almshouses behind an unmarked door.', 'heritage', 120, 52.3693, 4.8901, true, null),
  ('berlin', 'berlin-brandenburg', 'Brandenburg Gate', 'Neoclassical gate and symbol of reunified Germany.', 'heritage', 120, 52.5163, 13.3777, false, null),
  ('berlin', 'berlin-reichstag', 'Reichstag Dome', 'Glass dome on the parliament building with a spiral walkway.', 'heritage', 120, 52.5186, 13.3762, false, null),
  ('berlin', 'berlin-east-side-gallery', 'East Side Gallery', 'The longest surviving stretch of the Berlin Wall, covered in murals.', 'culture', 100, 52.505, 13.4397, false, null),
  ('berlin', 'berlin-museum-island', 'Museum Island', 'Five world-class museums on an island in the Spree.', 'culture', 100, 52.5169, 13.4019, false, null),
  ('berlin', 'berlin-tiergarten', 'Tiergarten', 'Huge park in the centre of Berlin.', 'nature', 80, 52.5145, 13.3501, false, null),
  ('berlin', 'berlin-wall-memorial', 'Berlin Wall Memorial', 'The preserved death strip on Bernauer Strasse.', 'heritage', 120, 52.5351, 13.3903, false, null),
  ('berlin', 'berlin-schwarzenberg', 'Haus Schwarzenberg Courtyard', 'Street-art-covered courtyard just off a busy street.', 'culture', 100, 52.5245, 13.4022, true, null),
  ('prague', 'prague-charles-bridge', 'Charles Bridge', 'Gothic stone bridge lined with thirty statues.', 'heritage', 120, 50.0865, 14.4114, false, null),
  ('prague', 'prague-castle', 'Prague Castle', 'The largest ancient castle complex in the world.', 'heritage', 120, 50.0909, 14.4005, false, null),
  ('prague', 'prague-old-town', 'Old Town Square', 'Home of the astronomical clock that has ticked since 1410.', 'heritage', 120, 50.087, 14.4207, false, null),
  ('prague', 'prague-petrin', 'Petřín Hill', 'Wooded hill with a mini Eiffel Tower and orchards.', 'nature', 80, 50.0833, 14.395, false, null),
  ('prague', 'prague-dancing-house', 'Dancing House', 'Curvy building nicknamed Fred and Ginger.', 'culture', 100, 50.0755, 14.4141, false, null),
  ('prague', 'prague-lennon-wall', 'Lennon Wall', 'A wall of ever-changing graffiti and messages of peace.', 'culture', 100, 50.0862, 14.4067, true, null),
  ('vienna', 'vienna-schonbrunn', 'Schönbrunn Palace', 'Habsburg summer palace with formal gardens and a hilltop arcade.', 'heritage', 120, 48.1845, 16.3122, false, null),
  ('vienna', 'vienna-stephansdom', 'St Stephen’s Cathedral', 'Gothic cathedral with a glazed-tile roof.', 'heritage', 120, 48.2085, 16.3731, false, null),
  ('vienna', 'vienna-belvedere', 'Belvedere', 'Baroque palace that holds Klimt’s The Kiss.', 'culture', 100, 48.1915, 16.3809, false, null),
  ('vienna', 'vienna-opera', 'Vienna State Opera', 'One of the world’s great opera houses.', 'music_events', 100, 48.203, 16.369, false, '[{"days": [0, 1, 2, 3, 4, 5, 6], "open": "10:00", "close": "23:00"}]'::jsonb),
  ('vienna', 'vienna-prater', 'Prater Giant Wheel', 'Ferris wheel turning above the Prater since 1897.', 'other', 60, 48.2166, 16.3958, false, null),
  ('vienna', 'vienna-naschmarkt', 'Naschmarkt', 'Vienna’s most popular market, over a kilometre long.', 'other', 60, 48.1985, 16.3632, false, '[{"days": [1, 2, 3, 4, 5, 6], "open": "06:00", "close": "19:30"}]'::jsonb),
  ('vienna', 'vienna-hundertwasser', 'Hundertwasser House', 'A wavy, colourful apartment block with trees growing on its roof.', 'culture', 100, 48.2072, 16.394, true, null),
  ('edinburgh', 'edinburgh-castle', 'Edinburgh Castle', 'Fortress on an extinct volcano above the city.', 'heritage', 120, 55.9486, -3.1999, false, null),
  ('edinburgh', 'edinburgh-arthurs-seat', 'Arthur’s Seat', 'Ancient volcano you can climb for a view over the Firth of Forth.', 'nature', 80, 55.9441, -3.1618, false, null),
  ('edinburgh', 'edinburgh-st-giles', 'St Giles’ Cathedral', 'Crowned spire on the Royal Mile.', 'heritage', 120, 55.9495, -3.1909, false, null),
  ('edinburgh', 'edinburgh-calton-hill', 'Calton Hill', 'Hill of monuments with the best sunset view in town.', 'nature', 80, 55.9553, -3.1827, false, null),
  ('edinburgh', 'edinburgh-national-museum', 'National Museum of Scotland', 'From Dolly the sheep to Pictish stones.', 'culture', 100, 55.9469, -3.19, false, null),
  ('edinburgh', 'edinburgh-portobello', 'Portobello Beach', 'Sandy beach with a Victorian promenade.', 'coast', 80, 55.9541, -3.11, false, null),
  ('edinburgh', 'edinburgh-dean-village', 'Dean Village', 'Old mill village beside the Water of Leith, minutes from Princes Street.', 'other', 60, 55.9522, -3.2161, true, null)
) as v(region, source_id, name, description, category, base_points, lat, lng, hidden, hours)
join public.regions r on r.slug = v.region
on conflict (source, source_id) do nothing;

insert into public.place_stats (place_id)
select id from public.places
on conflict (place_id) do nothing;

-- 30 days of daily challenges starting today (Lisbon), rotating themes.
insert into public.daily_challenges (challenge_date, title, description, category, bonus_points)
select d::date,
       (array['Find a hidden viewpoint', 'Step into history', 'Culture hunt', 'Follow the coastline', 'Wander anywhere new'])[1 + (i % 5)],
       (array['Discover any nature spot today.', 'Discover any heritage site today.',
              'Discover a museum or cultural place today.', 'Discover any beach or coastal spot today.',
              'Discover any place you have never visited.'])[1 + (i % 5)],
       (array['nature', 'heritage', 'culture', 'coast', null])[1 + (i % 5)]::public.place_category,
       75
from generate_series(0, 29) as i,
     lateral (select (now() at time zone 'Europe/Lisbon')::date + i as d) x
on conflict (challenge_date) do nothing;

-- Curated collections (Phase 4).
with r as (select id from public.regions where slug = 'sintra')
insert into public.collections (slug, title, description, region_id, completion_bonus)
select v.slug, v.title, v.description, r.id, 200
from r, (values
  ('sintra-palaces', 'Sintra''s palaces', 'Romantic palaces, castles and estates in the hills.'),
  ('wild-coast', 'The wild coast', 'Cliffs, coves and the westernmost point of Europe.'),
  ('forest-secrets', 'Forest secrets', 'Quiet corners of the Sintra hills.')
) as v(slug, title, description)
on conflict (slug) do nothing;

insert into public.collection_places (collection_id, place_id, position)
select c.id, p.id, v.pos
from (values
  ('sintra-palaces', 'pena', 1), ('sintra-palaces', 'regaleira', 2), ('sintra-palaces', 'mouros', 3),
  ('sintra-palaces', 'monserrate', 4),
  ('wild-coast', 'cabo-da-roca', 1), ('wild-coast', 'adraga', 2),
  ('forest-secrets', 'capuchos', 1), ('forest-secrets', 'cruz-alta', 2)
) as v(slug, source_id, pos)
join public.collections c on c.slug = v.slug
join public.places p on p.source = 'seed' and p.source_id = v.source_id
on conflict do nothing;
