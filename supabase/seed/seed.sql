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

-- BEGIN generated Europe places and city sets (pnpm --filter @wandro/shared seed)
-- Hidden gems stay off the map until a player is within 200 m.
insert into public.places (name, description, location, category, base_points, source, source_id, status, region_id, is_hidden, opening_hours)
select v.name, v.description,
       extensions.st_setsrid(extensions.st_makepoint(v.lng, v.lat), 4326)::extensions.geography,
       v.category::public.place_category, v.base_points, 'seed', v.source_id, 'active', r.id, v.hidden, v.hours
from (values
  ('sintra', 'sintra-fonte-mourisca', 'Moorish Fountain', 'Neo-Moorish fountain tiled in green and white, tucked into a bend of the old road.', 'heritage', 120, 38.7983, -9.3858, true, null),
  ('sintra', 'sintra-peninha', 'Peninha Sanctuary', 'Hermit chapel on a granite crag with the whole coast below it.', 'nature', 80, 38.7686, -9.4589, true, null),
  ('sintra', 'sintra-musa', 'MU.SA – Sintra Arts Museum', 'Modern and contemporary art in the old casino building, a short walk from the palace.', 'art', 100, 38.7988, -9.3826, false, null),
  ('sintra', 'sintra-anjos-teixeira', 'Anjos Teixeira Sculpture Museum', 'Father-and-son sculptor’s studio, tucked beside the stream below the town.', 'art', 100, 38.795, -9.392, false, null),
  ('sintra', 'sintra-leal-da-camara', 'Leal da Câmara House-Museum', 'Caricatures and posters by a cartoonist who mocked kings and politicians.', 'art', 100, 38.7826, -9.334, false, null),
  ('sintra', 'sintra-national-palace', 'Sintra National Palace', 'Medieval royal palace crowned by two giant white chimneys.', 'culture', 100, 38.7976, -9.3906, false, null),
  ('sintra', 'sintra-ferreira-de-castro', 'Ferreira de Castro House-Museum', 'The study and library of one of Portugal’s great novelists.', 'culture', 100, 38.7962, -9.3913, false, null),
  ('sintra', 'sintra-valley-of-lakes', 'Valley of the Lakes, Pena Park', 'Chain of ponds with a little duck castle, deep in the palace gardens.', 'nature', 80, 38.786, -9.392, false, null),
  ('sintra', 'sintra-lagoa-azul', 'Lagoa Azul', 'Quiet blue lake in the pine forest on the road to the coast.', 'nature', 80, 38.771, -9.418, false, null),
  ('sintra', 'sintra-pedra-amarela', 'Pedra Amarela', 'Granite outcrop with a sweeping view over the hills to the sea.', 'nature', 80, 38.781, -9.431, false, null),
  ('sintra', 'sintra-station', 'Sintra Station', 'Tiled 19th-century terminus where the train from Lisbon ends.', 'culture', 100, 38.7988, -9.378, false, null),
  ('sintra', 'sintra-tram', 'Sintra Tram at Praia das Maçãs', 'Vintage tram that rattles from the hills down to the beach.', 'culture', 100, 38.8226, -9.4664, false, null),
  ('lisbon', 'lisbon-belem-tower', 'Belém Tower', 'Sixteenth-century fortress that guarded the mouth of the Tagus.', 'heritage', 120, 38.6916, -9.216, false, null),
  ('lisbon', 'lisbon-jeronimos', 'Jerónimos Monastery', 'Manueline monastery carved with ropes, shells and sea creatures.', 'heritage', 120, 38.6979, -9.2068, false, null),
  ('lisbon', 'lisbon-sao-jorge', 'São Jorge Castle', 'Hilltop castle whose ramparts look over the red roofs of Alfama.', 'heritage', 120, 38.7139, -9.1335, false, null),
  ('lisbon', 'lisbon-senhora-do-monte', 'Senhora do Monte Viewpoint', 'The highest viewpoint in Lisbon, under umbrella pines.', 'nature', 80, 38.7193, -9.1326, false, null),
  ('lisbon', 'lisbon-lx-factory', 'LX Factory', 'Old textile mill turned into studios, bookshops and street art.', 'culture', 100, 38.7037, -9.1785, false, null),
  ('lisbon', 'lisbon-fado-alfama', 'Alfama Fado House', 'Candle-lit room where fado is sung most nights.', 'music_events', 100, 38.7106, -9.1305, false, '[{"days":[0,1,2,3,4,5,6],"open":"20:00","close":"01:00"}]'::jsonb),
  ('lisbon', 'lisbon-sao-cristovao-steps', 'São Cristóvão Steps', 'Stairway painted with a mural of the fado singers who lived here.', 'other', 60, 38.7128, -9.1351, true, null),
  ('lisbon', 'lisbon-maat', 'MAAT', 'Wave-shaped museum of art, architecture and technology you can walk on top of.', 'art', 100, 38.6956, -9.195, false, null),
  ('lisbon', 'lisbon-berardo', 'Berardo Collection at CCB', 'Modern art from Picasso to Warhol in the Belém Cultural Centre.', 'art', 100, 38.6957, -9.2083, false, null),
  ('lisbon', 'lisbon-crono-murals', 'Crono Project Murals', 'Giant murals painted across a row of abandoned buildings.', 'art', 100, 38.7315, -9.1468, false, null),
  ('lisbon', 'lisbon-gulbenkian', 'Calouste Gulbenkian Museum', 'From Egyptian treasures to Lalique jewels, in a modernist garden.', 'culture', 100, 38.7372, -9.1545, false, null),
  ('lisbon', 'lisbon-azulejo', 'National Tile Museum', 'Five centuries of Portuguese tiles in a gilded convent.', 'culture', 100, 38.7247, -9.1137, false, null),
  ('lisbon', 'lisbon-monsanto', 'Monsanto Panoramic', 'Abandoned hilltop restaurant in the forest with a 360° view.', 'nature', 80, 38.73, -9.1835, false, null),
  ('lisbon', 'lisbon-estufa-fria', 'Estufa Fria', 'Shaded greenhouse jungle of ferns, ponds and palms.', 'nature', 80, 38.7287, -9.153, false, null),
  ('lisbon', 'lisbon-estrela', 'Estrela Garden', 'Romantic park with a bandstand, ducks and a café by the lake.', 'nature', 80, 38.714, -9.1595, false, null),
  ('lisbon', 'lisbon-tram-28', 'Tram 28 at Martim Moniz', 'Start of the famous yellow tram that climbs through Graça and Alfama.', 'culture', 100, 38.716, -9.1365, false, null),
  ('lisbon', 'lisbon-santa-justa', 'Santa Justa Lift', 'Neo-Gothic iron lift linking the Baixa to the Carmo ruins.', 'culture', 100, 38.7121, -9.1393, false, null),
  ('porto', 'porto-ribeira', 'Ribeira Waterfront', 'Stacked, colourful houses along the Douro quay.', 'heritage', 120, 41.1407, -8.6131, false, null),
  ('porto', 'porto-lello', 'Livraria Lello', 'Neo-Gothic bookshop with a crimson staircase.', 'culture', 100, 41.1469, -8.6149, false, null),
  ('porto', 'porto-clerigos', 'Clérigos Tower', 'Baroque bell tower with 240 steps to the top.', 'heritage', 120, 41.1457, -8.6146, false, null),
  ('porto', 'porto-dom-luis', 'Dom Luís I Bridge', 'Double-decker iron bridge you can walk across at rooftop height.', 'heritage', 120, 41.1399, -8.6094, false, null),
  ('porto', 'porto-palacio-cristal', 'Crystal Palace Gardens', 'Romantic gardens with peacocks and river views.', 'nature', 80, 41.1479, -8.6255, false, null),
  ('porto', 'porto-foz', 'Foz do Douro Beach', 'Where the Douro meets the Atlantic, with a lighthouse pier.', 'coast', 80, 41.1497, -8.6764, false, null),
  ('porto', 'porto-virtudes', 'Virtudes Terraces', 'Sloping garden where locals watch the sun set over the river.', 'nature', 80, 41.1438, -8.6188, true, null),
  ('porto', 'porto-serralves', 'Serralves Museum', 'White Siza Vieira museum of contemporary art.', 'art', 100, 41.1597, -8.6598, false, null),
  ('porto', 'porto-soares-dos-reis', 'Soares dos Reis Museum', 'Portugal’s oldest public art museum, in a neoclassical palace.', 'art', 100, 41.1475, -8.6215, false, null),
  ('porto', 'porto-half-rabbit', 'Bordalo II’s Half Rabbit', 'Huge rabbit sculpted from street rubbish on a Gaia wall.', 'art', 100, 41.1372, -8.6095, false, null),
  ('porto', 'porto-bolsa', 'Palácio da Bolsa', 'Stock exchange palace with a dazzling Arab Room.', 'culture', 100, 41.1414, -8.6156, false, null),
  ('porto', 'porto-wow', 'World of Wine', 'Museums about wine, cork and chocolate in old port cellars.', 'culture', 100, 41.1355, -8.6143, false, null),
  ('porto', 'porto-serralves-park', 'Serralves Park', 'Gardens, woods and a giant red trowel sculpture.', 'nature', 80, 41.1585, -8.661, false, null),
  ('porto', 'porto-city-park', 'Porto City Park', 'The biggest urban park in Portugal, running down to the sea.', 'nature', 80, 41.1705, -8.678, false, null),
  ('porto', 'porto-passeio-alegre', 'Passeio Alegre Garden', 'Palm-lined promenade where the river meets the ocean.', 'nature', 80, 41.148, -8.672, false, null),
  ('porto', 'porto-sao-bento', 'São Bento Station', 'Station hall covered in 20,000 blue-and-white tiles.', 'culture', 100, 41.1456, -8.6106, false, null),
  ('porto', 'porto-guindais', 'Guindais Funicular', 'Funicular that climbs the old city walls from the river.', 'culture', 100, 41.1407, -8.6084, false, null),
  ('sintra', 'sintra-praia-macas', 'Praia das Maçãs', 'Where Lisbon’s Belle Époque day-trippers stepped off the tram. Quest: find the tidal sea pool at the north end.', 'coast', 80, 38.8262, -9.47, false, null),
  ('sintra', 'sintra-praia-ursa', 'Praia da Ursa', 'A wild cove under Cabo da Roca, reached only on foot. Quest: spot the rock the fishermen named the She-Bear.', 'coast', 80, 38.7893, -9.495, false, null),
  ('sintra', 'sintra-monserrate-ferns', 'Monserrate Fern Valley', 'Francis Cook’s Victorian plant collectors filled this ravine with tree ferns. Quest: stand beneath the tallest frond.', 'nature', 80, 38.7934, -9.4218, false, null),
  ('sintra', 'sintra-quinta-relogio', 'Quinta do Relógio', 'A neo-Moorish quinta of 1860 where King Carlos spent his honeymoon. Quest: photograph its horseshoe arches from the road.', 'heritage', 120, 38.7972, -9.3936, false, null),
  ('sintra', 'sintra-penha-verde', 'Quinta da Penha Verde', 'Estate of the viceroy João de Castro, planted with India’s first trees in Europe. Quest: find his chapels in the wood.', 'heritage', 120, 38.7925, -9.4078, false, null),
  ('sintra', 'sintra-chalet-biester', 'Chalet Biester', 'A Gothic-Revival chalet of the 1880s, painted inside by Luigi Manini. Quest: frame its slate turrets through the trees.', 'heritage', 120, 38.795, -9.3978, false, null),
  ('sintra', 'sintra-santa-maria', 'Santa Maria Church', 'Founded after Afonso Henriques took Sintra in 1147, with a Manueline portal. Quest: find the tomb slabs in the floor.', 'culture', 100, 38.796, -9.386, false, null),
  ('sintra', 'sintra-natural-history', 'Sintra Natural History Museum', 'Fossils and minerals in a 19th-century house on the old square. Quest: find the dinosaur egg.', 'culture', 100, 38.7995, -9.388, false, null),
  ('sintra', 'sintra-fonte-pipa', 'Fonte da Pipa', 'An azulejo-clad fountain where villagers once filled their jugs. Quest: read the date painted in its tiles.', 'art', 100, 38.7948, -9.3898, false, null),
  ('sintra', 'sintra-volta-duche', 'Volta do Duche Tile Benches', 'The Romantic promenade into town, lined with tiled benches. Quest: find a bench with a view of the Moorish walls.', 'art', 100, 38.7997, -9.3848, false, null),
  ('sintra', 'sintra-olga-cadaval', 'Olga Cadaval Cultural Centre', 'Named after the duchess who brought Europe’s musicians to Sintra. Quest: catch a concert or the festival poster.', 'music_events', 100, 38.7999, -9.3786, false, null),
  ('sintra', 'sintra-casa-teatro', 'Casa de Teatro de Sintra', 'A small theatre company’s home in Estefânia. Quest: find out what’s on tonight.', 'music_events', 100, 38.7976, -9.383, false, null),
  ('sintra', 'sintra-feira-merces', 'Feira das Mercês', 'Sintra’s oldest country fair, held around a hilltop chapel every autumn. Quest: find the chapel on the fairground.', 'music_events', 100, 38.7835, -9.316, false, null),
  ('sintra', 'sintra-colares-adega', 'Adega Regional de Colares', 'Cellars of the Ramisco vines that survived phylloxera in sand. Quest: join a harvest-time tasting or event.', 'music_events', 100, 38.7995, -9.4475, false, null),
  ('sintra', 'sintra-tram-banzao', 'Banzão Tram Stop', 'The 1904 tram still rattles through the vineyards here. Quest: wait for the bell and photograph the car.', 'culture', 100, 38.8128, -9.4505, false, null),
  ('sintra', 'sintra-tram-galamares', 'Galamares Tram Stop', 'A halt on the old line from the hills to the sea. Quest: ride one stop towards the coast.', 'culture', 100, 38.8003, -9.4155, false, null),
  ('sintra', 'sintra-portela-station', 'Portela de Sintra Station', 'Where the Lisbon line meets the town’s new quarter. Quest: find the tile panel in the hall.', 'culture', 100, 38.802, -9.3667, false, null),
  ('sintra', 'sintra-piriquita', 'Piriquita Bakery', 'Bakers since 1862, said to have named the queijada for a king. Quest: order a travesseiro, still warm.', 'culture', 100, 38.7978, -9.3925, false, null),
  ('sintra', 'sintra-sao-pedro-fair', 'São Pedro Fair', 'A market held on the 2nd and 4th Sunday since the Middle Ages. Quest: find something old and something edible.', 'culture', 100, 38.788, -9.377, false, null),
  ('sintra', 'sintra-azoia', 'Azóia Village', 'The westernmost village of mainland Europe. Quest: find the café the lighthouse keepers used.', 'other', 60, 38.766, -9.479, false, null),
  ('sintra', 'sintra-janas-chapel', 'Round Chapel of Janas', 'A circular chapel where farmers still bless their animals each August. Quest: walk once around it.', 'other', 60, 38.8125, -9.4215, false, null),
  ('sintra', 'sintra-dino-footprints', 'Praia Grande Dinosaur Footprints', 'Tracks left 120 million years ago on a cliff that was once a beach. Quest: find the trackway at the south end.', 'other', 60, 38.813, -9.479, false, null),
  ('lisbon', 'lisbon-carcavelos', 'Carcavelos Beach', 'Lisbon’s surf beach beneath the star-shaped fort of São Julião. Quest: watch a set roll in by the fort.', 'coast', 80, 38.679, -9.3365, false, null),
  ('lisbon', 'lisbon-praia-caxias', 'Caxias Beach', 'A small beach by the old royal estate. Quest: spot the lighthouse on the Bugio fort offshore.', 'coast', 80, 38.6997, -9.2765, false, null),
  ('lisbon', 'lisbon-caparica', 'Costa da Caparica', 'Fishermen hauled nets here long before the surfers came. Quest: catch the little beach train south.', 'coast', 80, 38.644, -9.2395, false, null),
  ('lisbon', 'lisbon-ribeira-das-naus', 'Ribeira das Naus', 'The royal shipyard that built the fleets of the Discoveries. Quest: sit on the river steps at sunset.', 'coast', 80, 38.7066, -9.142, false, null),
  ('lisbon', 'lisbon-paco-de-arcos', 'Paço de Arcos Beach', 'A fishing village beach below a 15th-century royal house. Quest: find the old pier.', 'coast', 80, 38.6925, -9.293, false, null),
  ('lisbon', 'lisbon-tapada-necessidades', 'Tapada das Necessidades', 'A royal walled garden with a cactus garden and a round greenhouse. Quest: find the cactus garden.', 'nature', 80, 38.7105, -9.1665, false, null),
  ('lisbon', 'lisbon-queluz', 'Queluz National Palace', 'The pink rococo palace of the Braganzas, Portugal’s little Versailles. Quest: walk the azulejo-lined canal.', 'heritage', 120, 38.7505, -9.2545, false, null),
  ('lisbon', 'lisbon-paco-caxias', 'Caxias Royal Palace', 'A royal summer house with cascading gardens and a grotto. Quest: find the waterfall of statues.', 'heritage', 120, 38.7012, -9.2738, false, null),
  ('lisbon', 'lisbon-fronteira', 'Fronteira Palace', 'A 17th-century hunting palace with the finest azulejo gardens in Lisbon. Quest: find the Gallery of Kings.', 'heritage', 120, 38.7405, -9.1835, false, null),
  ('lisbon', 'lisbon-ajuda', 'Ajuda National Palace', 'The unfinished royal palace, left as it was in 1910. Quest: find the room of Saxony porcelain.', 'heritage', 120, 38.7075, -9.1985, false, null),
  ('lisbon', 'lisbon-necessidades', 'Necessidades Palace', 'The pink palace the last king fled from in 1910, now the Foreign Ministry. Quest: photograph its obelisk fountain.', 'heritage', 120, 38.708, -9.1695, false, null),
  ('lisbon', 'lisbon-pombal-oeiras', 'Marquis of Pombal Palace, Oeiras', 'Country seat of the man who rebuilt Lisbon after 1755. Quest: find the waterfall in the gardens.', 'heritage', 120, 38.694, -9.312, false, null),
  ('lisbon', 'lisbon-museu-lisboa', 'Lisbon Museum – Pimenta Palace', 'The city’s story told in a palace where peacocks roam. Quest: find the model of Lisbon before the earthquake.', 'culture', 100, 38.757, -9.157, false, null),
  ('lisbon', 'lisbon-oriente', 'Museu do Oriente', 'Portugal’s Asian encounters, in an old salt-cod warehouse. Quest: find the Chinese opera masks.', 'culture', 100, 38.7038, -9.1735, false, null),
  ('lisbon', 'lisbon-mnaa', 'National Museum of Ancient Art', 'Portugal’s greatest paintings, in the palace of the counts of Alvor. Quest: find Bosch’s Temptations.', 'art', 100, 38.705, -9.161, false, null),
  ('lisbon', 'lisbon-pomar', 'Júlio Pomar Studio Museum', 'A warehouse turned studio by one of Portugal’s great modern painters. Quest: find a portrait of Fernando Pessoa.', 'art', 100, 38.7108, -9.1527, false, null),
  ('lisbon', 'lisbon-coliseu', 'Coliseu dos Recreios', 'A 1890 iron-domed hall that has hosted circuses, opera and rock. Quest: look up at the dome.', 'music_events', 100, 38.7155, -9.1405, false, null),
  ('lisbon', 'lisbon-hot-clube', 'Hot Clube de Portugal', 'One of Europe’s oldest jazz clubs, since 1948. Quest: catch a late set.', 'music_events', 100, 38.7195, -9.145, false, null),
  ('lisbon', 'lisbon-sao-carlos', 'São Carlos National Theatre', 'An opera house of 1793 built by merchants in three months. Quest: find the square where Pessoa was born.', 'music_events', 100, 38.7095, -9.1418, false, null),
  ('lisbon', 'lisbon-casa-independente', 'Casa Independente', 'A faded palace with gigs in its courtyard. Quest: find the courtyard bar.', 'music_events', 100, 38.7195, -9.136, false, null),
  ('lisbon', 'lisbon-bica', 'Elevador da Bica', 'A funicular of 1892 climbing a steep, washing-hung street. Quest: photograph it with the river behind.', 'culture', 100, 38.7086, -9.147, false, null),
  ('lisbon', 'lisbon-gloria', 'Elevador da Glória', 'The funicular from Restauradores to the São Pedro de Alcântara viewpoint. Quest: ride it up, walk down.', 'culture', 100, 38.7155, -9.144, false, null),
  ('lisbon', 'lisbon-pilar-7', 'Pillar 7 Bridge Experience', 'Inside a pillar of the 25 de Abril bridge. Quest: stand on the glass deck as the trains pass.', 'culture', 100, 38.6945, -9.1755, false, null),
  ('lisbon', 'lisbon-pasteis-belem', 'Pastéis de Belém', 'The custard tarts of the Jerónimos monks, made to a secret recipe since 1837. Quest: eat one with cinnamon.', 'culture', 100, 38.6975, -9.2032, false, null),
  ('lisbon', 'lisbon-feira-ladra', 'Feira da Ladra', 'The Thieves’ Market, held since the 13th century. Quest: find an old azulejo tile.', 'culture', 100, 38.715, -9.127, false, null),
  ('lisbon', 'lisbon-aqueduct', 'Águas Livres Aqueduct', 'Its arches survived the 1755 earthquake that flattened the city. Quest: walk along the top.', 'heritage', 120, 38.73, -9.168, false, null),
  ('lisbon', 'lisbon-ginjinha', 'A Ginjinha', 'A doorway bar pouring cherry liqueur since 1840. Quest: ask for it “com elas”, with the cherries.', 'culture', 100, 38.714, -9.138, false, null),
  ('lisbon', 'lisbon-pink-street', 'Pink Street', 'Once the sailors’ red-light street, now painted pink. Quest: find a bar named after an old brothel.', 'culture', 100, 38.7068, -9.144, false, null),
  ('lisbon', 'lisbon-recolhimento', 'Miradouro do Recolhimento', 'A walled garden viewpoint below the castle that few people find. Quest: find the gate.', 'other', 60, 38.7118, -9.133, true, null),
  ('porto', 'porto-matosinhos', 'Matosinhos Beach', 'Porto’s fishing harbour beach, under Janet Echelman’s giant net sculpture. Quest: find “She Changes”.', 'coast', 80, 41.176, -8.69, false, null),
  ('porto', 'porto-homem-do-leme', 'Homem do Leme Beach', 'Named for the statue of a helmsman steering towards the Atlantic. Quest: find the helmsman.', 'coast', 80, 41.16, -8.683, false, null),
  ('porto', 'porto-ingleses', 'Praia dos Ingleses', 'Where the English port merchants bathed in the 19th century. Quest: find the beach’s little pergola.', 'coast', 80, 41.1545, -8.68, false, null),
  ('porto', 'porto-afurada', 'Afurada Fishing Village', 'A fishing village where washing still dries in public tanks. Quest: find the communal laundry.', 'coast', 80, 41.143, -8.65, false, null),
  ('porto', 'porto-botanic', 'Porto Botanic Garden', 'The garden of the Andresen family, where the poet Sophia grew up. Quest: find the cactus house.', 'nature', 80, 41.153, -8.643, false, null),
  ('porto', 'porto-freixo', 'Freixo Palace', 'A baroque riverside palace by Nasoni, architect of the Clérigos tower. Quest: see it from the river path.', 'heritage', 120, 41.145, -8.585, false, null),
  ('porto', 'porto-serra-pilar', 'Serra do Pilar Monastery', 'A round monastery church that Wellington used to cross the Douro in 1809. Quest: walk the cloister.', 'heritage', 120, 41.1385, -8.6085, false, null),
  ('porto', 'porto-macieirinha', 'Quinta da Macieirinha', 'Where an exiled Sardinian king died in 1849, now the Romantic Museum. Quest: find the king’s bedroom.', 'heritage', 120, 41.147, -8.628, false, null),
  ('porto', 'porto-cpf', 'Portuguese Centre of Photography', 'Photographs in the old jail where the writer Camilo Castelo Branco was locked up. Quest: find his cell.', 'culture', 100, 41.144, -8.617, false, null),
  ('porto', 'porto-santa-clara', 'Santa Clara Church', 'A plain front hiding one of the richest gilded interiors in Portugal. Quest: step in and look up.', 'culture', 100, 41.1418, -8.6082, false, null),
  ('porto', 'porto-almas', 'Chapel of the Souls', 'Covered in 15,947 blue-and-white tiles of saints’ lives. Quest: find Saint Francis.', 'art', 100, 41.1497, -8.6065, false, null),
  ('porto', 'porto-carmo', 'Carmo Church Tile Wall', 'A whole side wall of azulejos telling the story of the Carmelites. Quest: find the hidden house between two churches.', 'art', 100, 41.1475, -8.6165, false, null),
  ('porto', 'porto-casa-musica', 'Casa da Música', 'Rem Koolhaas’s faceted concert hall of 2005. Quest: find the tiled room inside.', 'music_events', 100, 41.1588, -8.6307, false, null),
  ('porto', 'porto-tnsj', 'São João National Theatre', 'A neo-classical theatre of 1920 on the Batalha square. Quest: find the masks on its front.', 'music_events', 100, 41.143, -8.6075, false, null),
  ('porto', 'porto-maus-habitos', 'Maus Hábitos', 'A rooftop arts club on the fourth floor of a garage building. Quest: find the terrace.', 'music_events', 100, 41.1488, -8.6045, false, null),
  ('porto', 'porto-rivoli', 'Rivoli Theatre', 'An art deco theatre of 1932 on the Praça D. João I. Quest: find its deco lettering.', 'music_events', 100, 41.149, -8.611, false, null),
  ('porto', 'porto-casa-guitarra', 'Casa da Guitarra', 'A guitar shop where fado is played at night. Quest: hear the Portuguese guitar.', 'music_events', 100, 41.1415, -8.6115, false, null),
  ('porto', 'porto-maria-pia', 'Maria Pia Bridge', 'Eiffel’s company spanned the Douro with this iron arch in 1877. Quest: photograph the arch from the river.', 'culture', 100, 41.1395, -8.597, false, null),
  ('porto', 'porto-tram-museum', 'Porto Tram Museum', 'Old trams in a former power station. Quest: find the oldest car.', 'culture', 100, 41.147, -8.6345, false, null),
  ('porto', 'porto-gaia-cable-car', 'Gaia Cable Car', 'A short glide over the port lodges. Quest: count the lodge roofs you can read.', 'culture', 100, 41.1375, -8.607, false, null),
  ('porto', 'porto-majestic', 'Majestic Café', 'A Belle Époque café of 1921, all mirrors and carved wood. Quest: order a rabanada.', 'culture', 100, 41.1468, -8.6065, false, null),
  ('porto', 'porto-santiago', 'Café Santiago', 'Locals queue here for the francesinha, Porto’s monstrous sandwich. Quest: finish one.', 'culture', 100, 41.148, -8.603, false, null),
  ('porto', 'porto-grahams', 'Graham’s Port Lodge', 'A lodge of 1890 with a view over the whole Ribeira. Quest: taste a tawny.', 'culture', 100, 41.1365, -8.624, false, null),
  ('porto', 'porto-codecal', 'Codeçal Steps', 'A steep stair beside the old city wall. Quest: count the steps.', 'other', 60, 41.1408, -8.607, false, null),
  ('porto', 'porto-galerias-paris', 'Rua Galeria de Paris', 'A street of old shops turned bars, busiest after midnight. Quest: find the bar full of old toys.', 'culture', 100, 41.1468, -8.6135, false, null),
  ('porto', 'porto-vitoria', 'Miradouro da Vitória', 'A hidden terrace in the old Jewish quarter, looking over the Sé. Quest: find the stairway in.', 'other', 60, 41.144, -8.614, true, null),
  ('evora', 'evora-divor', 'Divor Reservoir', 'An Alentejo lake where storks fish in summer. Quest: find the dam wall.', 'coast', 80, 38.688, -7.878, false, null),
  ('evora', 'evora-monte-novo', 'Monte Novo Reservoir', 'The lake that keeps Évora in water through the dry months. Quest: watch the sunset over it.', 'coast', 80, 38.542, -7.717, false, null),
  ('evora', 'evora-portas-moura-fountain', 'Fountain of Portas de Moura', 'A Renaissance fountain shaped like a globe, fed by the aqueduct. Quest: find the sphere.', 'coast', 80, 38.5693, -7.9056, false, null),
  ('evora', 'evora-giraldo-fountain', 'Giraldo Square Fountain', 'Eight spouts for the eight streets that meet here. Quest: count them.', 'coast', 80, 38.5712, -7.9092, false, null),
  ('evora', 'evora-valverde', 'Bom Jesus de Valverde', 'A Renaissance convent by a stream, on a plan by the king’s architect. Quest: find the octagonal church.', 'coast', 80, 38.5235, -8.007, false, null),
  ('evora', 'evora-jardim-publico', 'Évora Public Garden', 'A Romantic garden with peacocks and fake ruins. Quest: find the false ruins.', 'nature', 80, 38.5655, -7.91, false, null),
  ('evora', 'evora-alto-sao-bento', 'Alto de São Bento', 'Windmills on a granite hill above the plain. Quest: find the mill you can climb.', 'nature', 80, 38.585, -7.948, false, null),
  ('evora', 'evora-ecopista', 'Ecopista of Évora', 'An old railway line turned into a path through the cork oaks. Quest: ride a kilometre.', 'nature', 80, 38.5795, -7.8985, false, null),
  ('evora', 'evora-mitra', 'Herdade da Mitra', 'The archbishops’ estate of cork and holm oaks. Quest: find a cork oak with its bark stripped.', 'nature', 80, 38.533, -8.015, false, null),
  ('evora', 'evora-cartuxa', 'Cartuxa Vineyards', 'Vines planted by Carthusian monks. Quest: find the monastery walls.', 'nature', 80, 38.581, -7.93, false, null),
  ('evora', 'evora-roman-temple', 'Roman Temple of Évora', 'Corinthian columns from the 1st century, once walled into a slaughterhouse. Quest: count the columns.', 'heritage', 120, 38.5728, -7.9073, false, null),
  ('evora', 'evora-almendres', 'Almendres Cromlech', 'Nearly 100 standing stones, older than Stonehenge. Quest: find the stone with a carved crook.', 'heritage', 120, 38.5575, -8.061, false, null),
  ('evora', 'evora-zambujeiro', 'Anta Grande do Zambujeiro', 'One of the largest dolmens in Europe. Quest: find its capstone.', 'heritage', 120, 38.537, -8.013, false, null),
  ('evora', 'evora-dom-manuel', 'Palace of King Manuel', 'The Ladies’ Gallery of a palace where Vasco da Gama got his orders. Quest: find the arches.', 'heritage', 120, 38.5665, -7.908, false, null),
  ('evora', 'evora-aqueduct', 'Água de Prata Aqueduct', 'Built in 1537; houses are tucked between its arches. Quest: find a door in an arch.', 'heritage', 120, 38.5755, -7.9105, false, null),
  ('evora', 'evora-se', 'Évora Cathedral', 'A fortress-like Gothic cathedral with a rooftop walk. Quest: climb to the roof.', 'culture', 100, 38.5705, -7.907, false, null),
  ('evora', 'evora-university', 'University of Évora', 'A Jesuit college of 1559 with tiled classrooms. Quest: find a tiled lecture hall.', 'culture', 100, 38.5735, -7.904, false, null),
  ('evora', 'evora-museu-evora', 'Museum of Évora', 'Flemish altarpieces in the archbishops’ palace. Quest: find the Life of the Virgin.', 'culture', 100, 38.5718, -7.9068, false, null),
  ('evora', 'evora-artesanato', 'Museum of Crafts and Design', 'Alentejo crafts from cork to clay. Quest: find a cork object.', 'culture', 100, 38.5698, -7.9093, false, null),
  ('evora', 'evora-biblioteca', 'Évora Public Library', 'One of Portugal’s oldest libraries. Quest: find the reading room.', 'culture', 100, 38.5715, -7.908, false, null),
  ('evora', 'evora-fea', 'Eugénio de Almeida Art Centre', 'Contemporary art in a palace by the temple. Quest: find the current show.', 'art', 100, 38.572, -7.9055, false, null),
  ('evora', 'evora-sao-bras', 'Hermitage of São Brás', 'A castle-like chapel of the 1480s with fortified turrets. Quest: count the turrets.', 'art', 100, 38.564, -7.903, false, null),
  ('evora', 'evora-station-tiles', 'Évora Station Tiles', 'Azulejo panels of Alentejo life on the old station. Quest: find the harvest scene.', 'art', 100, 38.5605, -7.905, false, null),
  ('evora', 'evora-santa-clara', 'Santa Clara Convent Tiles', 'A convent church lined with blue tiles. Quest: find the choir grille.', 'art', 100, 38.566, -7.911, false, null),
  ('evora', 'evora-merces', 'Mercês Church Tiles', 'A museum of decorative arts in a tiled church. Quest: find the tile flowers.', 'art', 100, 38.568, -7.903, false, null),
  ('evora', 'evora-garcia-resende', 'Garcia de Resende Theatre', 'An Italian-style theatre of 1892. Quest: find the painted ceiling.', 'music_events', 100, 38.5685, -7.9115, false, null),
  ('evora', 'evora-sao-joao-fair', 'São João Fair', 'The great June fair of the Alentejo. Quest: try the fried farturas.', 'music_events', 100, 38.565, -7.902, false, null),
  ('evora', 'evora-arena', 'Évora Bullring', 'A bullring of 1890 that also hosts concerts and fairs. Quest: find the poster.', 'music_events', 100, 38.5655, -7.905, false, null),
  ('evora', 'evora-harmonia', 'Harmonia Eborense', 'A music society since 1849 on Giraldo Square. Quest: find the ballroom.', 'music_events', 100, 38.5722, -7.9102, false, null),
  ('evora', 'evora-soror-mariana', 'Soror Mariana Auditorium', 'A convent turned concert hall. Quest: catch a concert.', 'music_events', 100, 38.574, -7.9095, false, null),
  ('evora', 'evora-bones', 'Chapel of Bones', '“We bones that are here, await yours.” Quest: find the inscription.', 'other', 60, 38.5687, -7.9093, false, null),
  ('evora', 'evora-mercado', 'Évora Market', 'Alentejo cheese and sausages. Quest: buy a queijo de Évora.', 'culture', 100, 38.5665, -7.9035, false, null),
  ('evora', 'evora-rua-do-cano', 'Rua do Cano', 'A street where houses are built into the aqueduct. Quest: find a window in an arch.', 'other', 60, 38.577, -7.913, false, null),
  ('evora', 'evora-pao-de-rala', 'Pão de Rala', 'Convent sweets made to old nuns’ recipes. Quest: try a pão de rala.', 'culture', 100, 38.5705, -7.9035, false, null),
  ('evora', 'evora-menhir', 'Almendres Menhir', 'A lone standing stone in the cork oaks. Quest: find it.', 'other', 60, 38.564, -8.056, false, null),
  ('evora', 'evora-sao-miguel', 'Pátio de São Miguel', 'A hidden courtyard of the counts of Basto. Quest: find the Moorish arch.', 'heritage', 120, 38.5727, -7.9085, true, null),
  ('evora', 'evora-cinco-quinas', 'Torre das Cinco Quinas', 'A five-cornered tower from the old walls. Quest: count the corners.', 'other', 60, 38.5745, -7.902, true, null),
  ('aveiro', 'aveiro-costa-nova', 'Costa Nova Beach', 'Atlantic dunes beside the striped fishermen’s houses. Quest: watch the surfers.', 'coast', 80, 40.614, -8.752, false, null),
  ('aveiro', 'aveiro-barra', 'Praia da Barra', 'A beach under Portugal’s tallest lighthouse. Quest: find the lighthouse.', 'coast', 80, 40.642, -8.747, false, null),
  ('aveiro', 'aveiro-sao-jacinto', 'São Jacinto Beach', 'A wild beach reached by ferry. Quest: cross by boat.', 'coast', 80, 40.668, -8.744, false, null),
  ('aveiro', 'aveiro-vagueira', 'Vagueira Beach', 'Fishermen still haul nets with tractors. Quest: watch the arte xávega.', 'coast', 80, 40.56, -8.768, false, null),
  ('aveiro', 'aveiro-salt-pans', 'Troncalhada Salt Pans', 'Salt made the old way in the lagoon. Quest: find the salt flower.', 'coast', 80, 40.6435, -8.662, false, null),
  ('aveiro', 'aveiro-sao-jacinto-dunes', 'São Jacinto Dunes Reserve', 'Dunes and pine forest between sea and lagoon. Quest: find the bird hide.', 'nature', 80, 40.685, -8.73, false, null),
  ('aveiro', 'aveiro-parque-d-pedro', 'Infante D. Pedro Park', 'A city park with a lake and tiled stairs. Quest: find the tiled stairs.', 'nature', 80, 40.6365, -8.652, false, null),
  ('aveiro', 'aveiro-fermentelos', 'Pateira de Fermentelos', 'A lagoon of reeds and herons. Quest: spot a heron.', 'nature', 80, 40.573, -8.522, false, null),
  ('aveiro', 'aveiro-bioria', 'BioRia Salreu', 'Wetland trails through rice fields. Quest: find the tower.', 'nature', 80, 40.73, -8.565, false, null),
  ('aveiro', 'aveiro-canal-piramides', 'Canal das Pirâmides', 'The canal where the lagoon meets the city, its mouth marked by two stone pyramids. Quest: find the pyramids.', 'other', 60, 40.642, -8.66, false, null),
  ('aveiro', 'aveiro-se', 'Aveiro Cathedral', 'A Dominican convent church of 1423. Quest: find the cross outside.', 'heritage', 120, 40.639, -8.6505, false, null),
  ('aveiro', 'aveiro-barra-lighthouse', 'Barra Lighthouse', 'The tallest lighthouse in Portugal, 62 m. Quest: count the stripes.', 'heritage', 120, 40.643, -8.748, false, null),
  ('aveiro', 'aveiro-vista-alegre-palace', 'Vista Alegre Palace and Chapel', 'A porcelain factory’s palace and baroque chapel. Quest: find the bishop’s tomb.', 'heritage', 120, 40.587, -8.678, false, null),
  ('aveiro', 'aveiro-goncalinho', 'Chapel of São Gonçalinho', 'In January locals throw cakes from its roof. Quest: find the dome.', 'heritage', 120, 40.6445, -8.6555, false, null),
  ('aveiro', 'aveiro-forte-barra', 'Forte da Barra', 'A tower guarding the lagoon’s mouth. Quest: find the tower.', 'heritage', 120, 40.644, -8.734, false, null),
  ('aveiro', 'aveiro-museu-aveiro', 'Museum of Aveiro', 'The convent of Princess Joana, with her marble tomb. Quest: find the tomb.', 'culture', 100, 40.6383, -8.6525, false, null),
  ('aveiro', 'aveiro-ilhavo', 'Ílhavo Maritime Museum', 'The cod fishing fleets, and an aquarium of cod. Quest: find the cod aquarium.', 'culture', 100, 40.6, -8.668, false, null),
  ('aveiro', 'aveiro-arte-nova', 'Art Nouveau Museum', 'A house of curving balconies on the canal. Quest: find the tea room.', 'culture', 100, 40.6418, -8.6535, false, null),
  ('aveiro', 'aveiro-station', 'Old Aveiro Station', 'Tiled scenes of the region on the 1916 station. Quest: find a moliceiro tile.', 'culture', 100, 40.644, -8.64, false, null),
  ('aveiro', 'aveiro-fabrica', 'Fábrica Ciência Viva', 'A science centre in an old factory. Quest: find the experiment.', 'culture', 100, 40.64, -8.656, false, null),
  ('aveiro', 'aveiro-vista-alegre-museum', 'Vista Alegre Museum', 'Two centuries of Portuguese porcelain. Quest: find the oldest piece.', 'art', 100, 40.5885, -8.68, false, null),
  ('aveiro', 'aveiro-moliceiros', 'Moliceiro Prows', 'Boats with painted prows, often cheeky. Quest: find a funny prow.', 'art', 100, 40.6428, -8.656, false, null),
  ('aveiro', 'aveiro-cooperativa', 'Cooperativa Agrícola Building', 'Art Nouveau tiles of flowers on a farm co-op. Quest: find the irises.', 'art', 100, 40.641, -8.6545, false, null),
  ('aveiro', 'aveiro-capitania', 'Antiga Capitania Gallery', 'Art in the old harbour master’s house. Quest: find the show.', 'art', 100, 40.6425, -8.651, false, null),
  ('aveiro', 'aveiro-palheiros', 'Costa Nova Striped Houses', 'Fishermen painted their sheds in stripes to find them in the fog. Quest: find your colour.', 'art', 100, 40.619, -8.749, false, null),
  ('aveiro', 'aveiro-aveirense', 'Teatro Aveirense', 'A theatre of 1881. Quest: catch a show.', 'music_events', 100, 40.6405, -8.6475, false, null),
  ('aveiro', 'aveiro-feira-marco', 'Feira de Março', 'A fair held every March for 600 years. Quest: ride the ferris wheel.', 'music_events', 100, 40.629, -8.641, false, null),
  ('aveiro', 'aveiro-gretua', 'GrETUA', 'The students’ theatre. Quest: catch a gig.', 'music_events', 100, 40.6305, -8.658, false, null),
  ('aveiro', 'aveiro-congressos', 'Centro de Congressos', 'A tile factory turned venue. Quest: find the chimney.', 'music_events', 100, 40.6425, -8.642, false, null),
  ('aveiro', 'aveiro-canais', 'Festival dos Canais', 'Street theatre and music on the canals in July. Quest: find a stage on the water.', 'music_events', 100, 40.644, -8.653, false, null),
  ('aveiro', 'aveiro-ovos-moles', 'Ovos Moles', 'Egg sweets in wafer shells shaped like shells and fish. Quest: try one.', 'culture', 100, 40.6415, -8.6505, false, null),
  ('aveiro', 'aveiro-mercado-peixe', 'Mercado do Peixe', 'The fish market by the canal. Quest: find the grilled sardines.', 'culture', 100, 40.6445, -8.6575, false, null),
  ('aveiro', 'aveiro-lacos', 'Bridge of Friendship Ribbons', 'Ribbons tied by friends and lovers. Quest: tie one.', 'other', 60, 40.643, -8.653, false, null),
  ('aveiro', 'aveiro-moliceiro-ride', 'Moliceiro Boat Ride', 'The boats that once gathered seaweed. Quest: take a ride.', 'culture', 100, 40.6415, -8.6558, false, null),
  ('aveiro', 'aveiro-sao-jacinto-ferry', 'São Jacinto Ferry', 'A ferry across the lagoon mouth. Quest: cross.', 'culture', 100, 40.665, -8.739, false, null),
  ('aveiro', 'aveiro-misericordia', 'Misericórdia Church', 'A tiled church with a lions’ portal. Quest: find the lions.', 'heritage', 120, 40.6413, -8.652, true, null),
  ('aveiro', 'aveiro-botiroes', 'Cais dos Botirões', 'Tiles of old fishermen on the quay. Quest: find the tile.', 'other', 60, 40.6455, -8.651, true, null),
  ('sintra', 'sintra-cafe-saudade', 'Café Saudade', 'Once the Mathilde bakery, where Sintra’s queijadas were made for the day-trippers off the train. Quest: order one with a galão.', 'culture', 100, 38.7998, -9.3818, false, null),
  ('sintra', 'sintra-santa-eufemia', 'Santa Eufémia Hermitage', 'A hilltop hermitage with a holy spring, where a pilgrimage and village festa have climbed every year for centuries. Quest: find the spring below the chapel.', 'culture', 100, 38.7838, -9.3851, false, null),
  ('sintra', 'sintra-almocageme', 'Almoçageme Village Square', 'A village of whitewashed houses where Colares locals meet over coffee before the beach. Quest: find the old fountain.', 'culture', 100, 38.796, -9.473, false, null),
  ('lisbon', 'lisbon-mercado-ribeira', 'Mercado da Ribeira', 'Lisbon’s market hall since 1882: fish and flowers at dawn, chefs’ stalls by lunch. Quest: find the fruit sellers who still open first.', 'culture', 100, 38.7068, -9.1458, false, null),
  ('lisbon', 'lisbon-santo-antonio', 'Santo António Church', 'Built where Lisbon’s favourite saint was born; on 13 June the city crowns him with sardines and basil pots. Quest: find the crypt of his birthplace.', 'culture', 100, 38.7101, -9.1335, false, null),
  ('lisbon', 'lisbon-mouraria', 'Rua do Capelão, Mouraria', 'The lane where fado was born, in the old Moorish quarter. Quest: find the plaque to the singer Maria Severa.', 'culture', 100, 38.7158, -9.1352, false, null),
  ('porto', 'porto-bolhao', 'Mercado do Bolhão', 'Porto’s market of 1914, reopened with its stallholders back in place. Quest: find a stall selling bread from Avintes.', 'culture', 100, 41.1488, -8.6075, false, null),
  ('porto', 'porto-fontainhas', 'Fontainhas', 'The cliffside heart of São João: on 23 June the city parties here with leeks, hammers and grilled sardines. Quest: look down on the Dom Luís bridge from the terrace.', 'culture', 100, 41.143, -8.602, false, null),
  ('porto', 'porto-miragaia', 'Miragaia', 'Porto’s old riverside quarter of washing lines and arcades, older than the city walls. Quest: walk under the arches by the river.', 'culture', 100, 41.1425, -8.619, false, null),
  ('evora', 'evora-quarta-feira', 'Taberna Quarta-Feira', 'An Alentejo tavern where there is no menu: the cook decides. Quest: try the pork with clams or the açorda.', 'culture', 100, 38.5735, -7.9063, false, null),
  ('evora', 'evora-scala-coeli', 'Scala Coeli Charterhouse', 'Carthusian monks kept their vow of silence here from 1598 until 2019, and their way of life still shapes the estate’s wine and bread. Quest: photograph the church front from the gate.', 'culture', 100, 38.5803, -7.9244, false, null),
  ('evora', 'evora-judiaria', 'Judiaria Lanes', 'The old Jewish quarter around Rua dos Mercadores, now a quiet weave of lanes and doorsteps. Quest: find the street sign for Rua dos Mercadores.', 'culture', 100, 38.5703, -7.9112, false, null),
  ('aveiro', 'aveiro-manuel-firmino', 'Mercado Manuel Firmino', 'Aveiro’s everyday market: eels, fruit, flowers and gossip. Quest: find a stall selling local salt.', 'culture', 100, 40.6378, -8.6496, false, null),
  ('aveiro', 'aveiro-arte-xavega', 'Arte Xávega at Vagueira', 'Fishermen still haul their nets up the beach the old way, with boats launched into the surf. Quest: watch a net come in (mornings, spring to autumn).', 'culture', 100, 40.559, -8.7685, false, null),
  ('aveiro', 'aveiro-beira-mar', 'Beira-Mar Quarter', 'The fishermen’s quarter between the canals, with tiled houses and front-door chats. Quest: find a house tiled in green.', 'culture', 100, 40.6452, -8.6538, false, null),
  ('sintra', 'sintra-capuchos', 'Convent of the Capuchos', 'Friars lived here in tiny cells lined with cork, with doors so low you have to bow. Quest: find a cork-lined door.', 'other', 60, 38.784, -9.4365, false, null),
  ('sintra', 'sintra-vila-sassetti', 'Vila Sassetti Path', 'A secret garden path that climbs from a hidden villa through boulders to the Moorish Castle. Quest: find the villa tower.', 'other', 60, 38.7937, -9.395, false, null),
  ('lisbon', 'lisbon-casa-dos-bicos', 'Casa dos Bicos', 'A house of 1523 covered in diamond-shaped stone spikes, with Roman fish-salting tanks in its basement. Quest: count the spikes in one row.', 'other', 60, 38.7088, -9.1323, false, null),
  ('lisbon', 'lisbon-prazeres', 'Prazeres Cemetery', 'A city of the dead: streets of family mausoleums, some with windows you can peer into. Quest: find a mausoleum with an angel on the roof.', 'other', 60, 38.7135, -9.17, false, null),
  ('lisbon', 'lisbon-cais-das-colunas', 'Cais das Colunas', 'Two marble columns and a stair into the Tagus, where kings and ambassadors once stepped ashore. Quest: photograph the columns with the river behind.', 'other', 60, 38.7067, -9.1363, false, null),
  ('lisbon', 'lisbon-sao-roque', 'São Roque Church', 'A plain church hiding a chapel built in Rome from lapis lazuli and gold, blessed by the Pope and shipped to Lisbon in 1747. Quest: find the mosaic that looks like a painting.', 'other', 60, 38.7133, -9.1434, false, null),
  ('lisbon', 'lisbon-sao-domingos', 'São Domingos Church', 'Gutted by fire in 1959 and reopened with its scorched columns and blackened walls left as they were. Quest: find a cracked column.', 'other', 60, 38.7148, -9.1374, false, null),
  ('porto', 'porto-agramonte', 'Agramonte Cemetery', 'Art Nouveau tombs, mourning statues and family chapels, built after a cholera outbreak in 1855. Quest: find a weeping statue.', 'other', 60, 41.1561, -8.6305, false, null),
  ('porto', 'porto-cedofeita', 'Old Church of Cedofeita', 'A tiny Romanesque church that may be the oldest in Porto, hidden behind its big modern namesake. Quest: find the carved animals on the doorway.', 'other', 60, 41.1546, -8.6189, false, null),
  ('porto', 'porto-senhor-da-pedra', 'Senhor da Pedra Chapel', 'A white hexagonal chapel standing on a rock in the surf at Miramar beach. Quest: photograph it with the waves behind.', 'other', 60, 41.0723, -8.6631, false, null),
  ('porto', 'porto-arrabida', 'Arrábida Bridge', 'When it opened in 1963 its arch was the longest concrete span in the world. Quest: spot the climbers on top of the arch.', 'other', 60, 41.1474, -8.6404, false, null),
  ('evora', 'evora-arco-isabel', 'Arch of Dona Isabel', 'A Roman gateway still standing in the old city wall, with houses built around it. Quest: walk through it.', 'other', 60, 38.5737, -7.9113, false, null),
  ('evora', 'evora-graca', 'Graça Church Giants', 'A church front guarded by four stone giants that locals call the Meninos da Graça, the Graça boys. Quest: count the giants.', 'other', 60, 38.5687, -7.9068, false, null),
  ('aveiro', 'aveiro-santo-andre', 'Santo André Museum Ship', 'A real cod-fishing trawler from 1948, now a museum ship you can walk through. Quest: find the cod hold.', 'other', 60, 40.634, -8.7135, false, null),
  ('aveiro', 'aveiro-baixa-santo-antonio', 'Baixa de Santo António Park', 'A green valley of lawns, ponds and old trees running below the city centre. Quest: find a bench by the water.', 'nature', 80, 40.6377, -8.6468, false, null),
  ('aveiro', 'aveiro-senhor-das-barrocas', 'Senhor das Barrocas Chapel', 'A small Baroque chapel built on an eight-sided plan, rare in Portugal. Quest: count its sides from outside.', 'other', 60, 40.6397, -8.6423, false, null),
  ('aveiro', 'aveiro-cais-do-bico', 'Cais do Bico, Murtosa', 'A quiet lagoon quay where painted moliceiro boats are still built and moored. Quest: find a prow with a cheeky painted joke.', 'other', 60, 40.733, -8.654, false, null)
) as v(region, source_id, name, description, category, base_points, lat, lng, hidden, hours)
join public.regions r on r.slug = v.region
on conflict (source, source_id) do nothing;

-- City sets: 5 places each (CITY_SETS).
insert into public.collections (slug, title, description, region_id, completion_bonus)
select v.slug, v.title, v.description, r.id, 50
from (values
  ('lisbon-icons', 'lisbon', 'Lisbon icons', 'The landmarks everyone talks about.'),
  ('lisbon-art', 'lisbon', 'Lisbon art & museums', 'Five galleries, studios and works of art.'),
  ('porto-icons', 'porto', 'Porto icons', 'The landmarks everyone talks about.'),
  ('porto-art', 'porto', 'Porto art & museums', 'Five galleries, studios and works of art.'),
  ('evora-icons', 'evora', 'Évora icons', 'The landmarks everyone talks about.'),
  ('evora-art', 'evora', 'Évora art & museums', 'Five galleries, studios and works of art.'),
  ('aveiro-icons', 'aveiro', 'Aveiro icons', 'The landmarks everyone talks about.'),
  ('aveiro-art', 'aveiro', 'Aveiro art & museums', 'Five galleries, studios and works of art.')
) as v(slug, region, title, description)
join public.regions r on r.slug = v.region
on conflict (slug) do nothing;

insert into public.collection_places (collection_id, place_id, position)
select c.id, p.id, v.pos
from (values
  ('lisbon-icons', 'lisbon-belem-tower', 1),
  ('lisbon-icons', 'lisbon-pasteis-belem', 2),
  ('lisbon-icons', 'lisbon-tram-28', 3),
  ('lisbon-icons', 'lisbon-jeronimos', 4),
  ('lisbon-icons', 'lisbon-sao-jorge', 5),
  ('lisbon-art', 'lisbon-maat', 1),
  ('lisbon-art', 'lisbon-berardo', 2),
  ('lisbon-art', 'lisbon-crono-murals', 3),
  ('lisbon-art', 'lisbon-mnaa', 4),
  ('lisbon-art', 'lisbon-pomar', 5),
  ('porto-icons', 'porto-sao-bento', 1),
  ('porto-icons', 'porto-ribeira', 2),
  ('porto-icons', 'porto-lello', 3),
  ('porto-icons', 'porto-dom-luis', 4),
  ('porto-icons', 'porto-clerigos', 5),
  ('porto-art', 'porto-serralves', 1),
  ('porto-art', 'porto-soares-dos-reis', 2),
  ('porto-art', 'porto-half-rabbit', 3),
  ('porto-art', 'porto-almas', 4),
  ('porto-art', 'porto-carmo', 5),
  ('evora-icons', 'evora-roman-temple', 1),
  ('evora-icons', 'evora-bones', 2),
  ('evora-icons', 'evora-se', 3),
  ('evora-icons', 'evora-giraldo-fountain', 4),
  ('evora-icons', 'evora-almendres', 5),
  ('evora-art', 'evora-fea', 1),
  ('evora-art', 'evora-sao-bras', 2),
  ('evora-art', 'evora-station-tiles', 3),
  ('evora-art', 'evora-santa-clara', 4),
  ('evora-art', 'evora-merces', 5),
  ('aveiro-icons', 'aveiro-costa-nova', 1),
  ('aveiro-icons', 'aveiro-moliceiro-ride', 2),
  ('aveiro-icons', 'aveiro-barra', 3),
  ('aveiro-icons', 'aveiro-ovos-moles', 4),
  ('aveiro-icons', 'aveiro-lacos', 5),
  ('aveiro-art', 'aveiro-vista-alegre-museum', 1),
  ('aveiro-art', 'aveiro-moliceiros', 2),
  ('aveiro-art', 'aveiro-cooperativa', 3),
  ('aveiro-art', 'aveiro-capitania', 4),
  ('aveiro-art', 'aveiro-palheiros', 5)
) as v(slug, source_id, pos)
join public.collections c on c.slug = v.slug
join public.places p on p.source = 'seed' and p.source_id = v.source_id
on conflict do nothing;
-- END generated Europe places and city sets

insert into public.place_stats (place_id)
select id from public.places
on conflict (place_id) do nothing;

-- 30 days of daily challenges from today (Lisbon): dated ones come from the migrations, the
-- rest from the shared rotation.
do $$
begin
  perform public.ensure_daily_challenge((now() at time zone 'Europe/Lisbon')::date + i)
  from generate_series(0, 29) as i;
end;
$$;

-- Curated collections (Phase 4).
with r as (select id from public.regions where slug = 'sintra')
insert into public.collections (slug, title, description, region_id, completion_bonus)
select v.slug, v.title, v.description, r.id, 50
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

-- Golden-hour and night quests (TIME_QUESTS in packages/shared; same list as the boosts migration).
update public.places p set time_quest = v.kind
from (values
  ('adraga', 'golden'), ('cruz-alta', 'golden'), ('sintra-national-palace', 'night'),
  ('lisbon-senhora-do-monte', 'golden'), ('lisbon-fado-alfama', 'night'),
  ('porto-serra-pilar', 'golden'), ('porto-dom-luis', 'night'),
  ('evora-alto-sao-bento', 'golden'), ('evora-roman-temple', 'night'),
  ('aveiro-costa-nova', 'golden'), ('aveiro-canal-piramides', 'night')
) as v(source_id, kind)
where p.source = 'seed' and p.source_id = v.source_id;
