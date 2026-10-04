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
  ('sintra', 'sintra-station', 'Sintra Station', 'Tiled 19th-century terminus where the train from Lisbon ends.', 'travel', 80, 38.7988, -9.378, false, null),
  ('sintra', 'sintra-tram', 'Sintra Tram at Praia das Maçãs', 'Vintage tram that rattles from the hills down to the beach.', 'travel', 80, 38.8226, -9.4664, false, null),
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
  ('lisbon', 'lisbon-tram-28', 'Tram 28 at Martim Moniz', 'Start of the famous yellow tram that climbs through Graça and Alfama.', 'travel', 80, 38.716, -9.1365, false, null),
  ('lisbon', 'lisbon-santa-justa', 'Santa Justa Lift', 'Neo-Gothic iron lift linking the Baixa to the Carmo ruins.', 'travel', 80, 38.7121, -9.1393, false, null),
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
  ('porto', 'porto-sao-bento', 'São Bento Station', 'Station hall covered in 20,000 blue-and-white tiles.', 'travel', 80, 41.1456, -8.6106, false, null),
  ('porto', 'porto-guindais', 'Guindais Funicular', 'Funicular that climbs the old city walls from the river.', 'travel', 80, 41.1407, -8.6084, false, null),
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
  ('sintra', 'sintra-tram-banzao', 'Banzão Tram Stop', 'The 1904 tram still rattles through the vineyards here. Quest: wait for the bell and photograph the car.', 'travel', 80, 38.8128, -9.4505, false, null),
  ('sintra', 'sintra-tram-galamares', 'Galamares Tram Stop', 'A halt on the old line from the hills to the sea. Quest: ride one stop towards the coast.', 'travel', 80, 38.8003, -9.4155, false, null),
  ('sintra', 'sintra-portela-station', 'Portela de Sintra Station', 'Where the Lisbon line meets the town’s new quarter. Quest: find the tile panel in the hall.', 'travel', 80, 38.802, -9.3667, false, null),
  ('sintra', 'sintra-piriquita', 'Piriquita Bakery', 'Bakers since 1862, said to have named the queijada for a king. Quest: order a travesseiro, still warm.', 'other', 60, 38.7978, -9.3925, false, null),
  ('sintra', 'sintra-sao-pedro-fair', 'São Pedro Fair', 'A market held on the 2nd and 4th Sunday since the Middle Ages. Quest: find something old and something edible.', 'other', 60, 38.788, -9.377, false, null),
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
  ('lisbon', 'lisbon-bica', 'Elevador da Bica', 'A funicular of 1892 climbing a steep, washing-hung street. Quest: photograph it with the river behind.', 'travel', 80, 38.7086, -9.147, false, null),
  ('lisbon', 'lisbon-gloria', 'Elevador da Glória', 'The funicular from Restauradores to the São Pedro de Alcântara viewpoint. Quest: ride it up, walk down.', 'travel', 80, 38.7155, -9.144, false, null),
  ('lisbon', 'lisbon-pilar-7', 'Pillar 7 Bridge Experience', 'Inside a pillar of the 25 de Abril bridge. Quest: stand on the glass deck as the trains pass.', 'travel', 80, 38.6945, -9.1755, false, null),
  ('lisbon', 'lisbon-pasteis-belem', 'Pastéis de Belém', 'The custard tarts of the Jerónimos monks, made to a secret recipe since 1837. Quest: eat one with cinnamon.', 'other', 60, 38.6975, -9.2032, false, null),
  ('lisbon', 'lisbon-feira-ladra', 'Feira da Ladra', 'The Thieves’ Market, held since the 13th century. Quest: find an old azulejo tile.', 'other', 60, 38.715, -9.127, false, null),
  ('lisbon', 'lisbon-aqueduct', 'Águas Livres Aqueduct', 'Its arches survived the 1755 earthquake that flattened the city. Quest: walk along the top.', 'other', 60, 38.73, -9.168, false, null),
  ('lisbon', 'lisbon-ginjinha', 'A Ginjinha', 'A doorway bar pouring cherry liqueur since 1840. Quest: ask for it “com elas”, with the cherries.', 'other', 60, 38.714, -9.138, false, null),
  ('lisbon', 'lisbon-pink-street', 'Pink Street', 'Once the sailors’ red-light street, now painted pink. Quest: find a bar named after an old brothel.', 'other', 60, 38.7068, -9.144, false, null),
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
  ('porto', 'porto-maria-pia', 'Maria Pia Bridge', 'Eiffel’s company spanned the Douro with this iron arch in 1877. Quest: photograph the arch from the river.', 'travel', 80, 41.1395, -8.597, false, null),
  ('porto', 'porto-tram-museum', 'Porto Tram Museum', 'Old trams in a former power station. Quest: find the oldest car.', 'travel', 80, 41.147, -8.6345, false, null),
  ('porto', 'porto-gaia-cable-car', 'Gaia Cable Car', 'A short glide over the port lodges. Quest: count the lodge roofs you can read.', 'travel', 80, 41.1375, -8.607, false, null),
  ('porto', 'porto-majestic', 'Majestic Café', 'A Belle Époque café of 1921, all mirrors and carved wood. Quest: order a rabanada.', 'other', 60, 41.1468, -8.6065, false, null),
  ('porto', 'porto-santiago', 'Café Santiago', 'Locals queue here for the francesinha, Porto’s monstrous sandwich. Quest: finish one.', 'other', 60, 41.148, -8.603, false, null),
  ('porto', 'porto-grahams', 'Graham’s Port Lodge', 'A lodge of 1890 with a view over the whole Ribeira. Quest: taste a tawny.', 'other', 60, 41.1365, -8.624, false, null),
  ('porto', 'porto-codecal', 'Codeçal Steps', 'A steep stair beside the old city wall. Quest: count the steps.', 'other', 60, 41.1408, -8.607, false, null),
  ('porto', 'porto-galerias-paris', 'Rua Galeria de Paris', 'A street of old shops turned bars, busiest after midnight. Quest: find the bar full of old toys.', 'other', 60, 41.1468, -8.6135, false, null)
) as v(region, source_id, name, description, category, base_points, lat, lng, hidden, hours)
join public.regions r on r.slug = v.region
on conflict (source, source_id) do nothing;

-- City sets: 5 places each (CITY_SETS).
insert into public.collections (slug, title, description, region_id, completion_bonus)
select v.slug, v.title, v.description, r.id, 50
from (values
  ('lisbon-icons', 'lisbon', 'Lisbon icons', 'The landmarks everyone talks about.'),
  ('lisbon-art-rails', 'lisbon', 'Lisbon art & rails', 'Three works of art and two rides worth taking.'),
  ('porto-icons', 'porto', 'Porto icons', 'The landmarks everyone talks about.'),
  ('porto-art-rails', 'porto', 'Porto art & rails', 'Three works of art and two rides worth taking.')
) as v(slug, region, title, description)
join public.regions r on r.slug = v.region
on conflict (slug) do nothing;

insert into public.collection_places (collection_id, place_id, position)
select c.id, p.id, v.pos
from (values
  ('lisbon-icons', 'lisbon-belem-tower', 1),
  ('lisbon-icons', 'lisbon-pasteis-belem', 2),
  ('lisbon-icons', 'lisbon-jeronimos', 3),
  ('lisbon-icons', 'lisbon-sao-jorge', 4),
  ('lisbon-icons', 'lisbon-carcavelos', 5),
  ('lisbon-art-rails', 'lisbon-maat', 1),
  ('lisbon-art-rails', 'lisbon-berardo', 2),
  ('lisbon-art-rails', 'lisbon-crono-murals', 3),
  ('lisbon-art-rails', 'lisbon-tram-28', 4),
  ('lisbon-art-rails', 'lisbon-santa-justa', 5),
  ('porto-icons', 'porto-ribeira', 1),
  ('porto-icons', 'porto-lello', 2),
  ('porto-icons', 'porto-dom-luis', 3),
  ('porto-icons', 'porto-clerigos', 4),
  ('porto-icons', 'porto-bolsa', 5),
  ('porto-art-rails', 'porto-serralves', 1),
  ('porto-art-rails', 'porto-soares-dos-reis', 2),
  ('porto-art-rails', 'porto-half-rabbit', 3),
  ('porto-art-rails', 'porto-sao-bento', 4),
  ('porto-art-rails', 'porto-guindais', 5)
) as v(slug, source_id, pos)
join public.collections c on c.slug = v.slug
join public.places p on p.source = 'seed' and p.source_id = v.source_id
on conflict do nothing;
-- END generated Europe places and city sets

insert into public.place_stats (place_id)
select id from public.places
on conflict (place_id) do nothing;

-- 30 days of daily challenges starting today (Lisbon), rotating themes.
insert into public.daily_challenges (challenge_date, title, description, category, bonus_points)
select d::date,
       (array['Find a hidden viewpoint', 'Step into history', 'Culture hunt', 'Follow the coastline',
              'Art attack', 'All aboard', 'Wander anywhere new'])[1 + (i % 7)],
       (array['Discover any nature spot today.', 'Discover any heritage site today.',
              'Discover a museum or cultural place today.', 'Discover any beach or coastal spot today.',
              'Discover a gallery, mural or piece of street art today.',
              'Discover a famous station, tram, funicular or cable car today.',
              'Discover any place you have never visited.'])[1 + (i % 7)],
       (array['nature', 'heritage', 'culture', 'coast', 'art', 'travel', null])[1 + (i % 7)]::public.place_category,
       75
from generate_series(0, 29) as i,
     lateral (select (now() at time zone 'Europe/Lisbon')::date + i as d) x
on conflict (challenge_date) do nothing;

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
