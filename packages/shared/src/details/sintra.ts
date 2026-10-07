import type { PlaceDetails } from '../types';

/**
 * Learn and Plan content for Sintra, keyed by place id. Facts are kept short and checkable;
 * the pilot city for place details (review before adding the other cities).
 */
export const SINTRA_DETAILS: Record<string, PlaceDetails> = {
  'demo-pena': {
    teaser: 'A fairy-tale palace painted red and yellow on a peak above the clouds.',
    facts: [
      {
        text: 'King Ferdinand II, a German prince known as the "Artist King", built it in the mid-1800s.',
      },
      {
        text: 'It rises around the ruins of a 16th-century monastery, whose cloister and chapel survive inside.',
      },
      {
        text: 'It is part of the Cultural Landscape of Sintra, a UNESCO World Heritage Site since 1995.',
      },
    ],
    lookFor: 'The Triton arch: a sea monster holding up a window on its back.',
    bestTime: 'The first entry slot of the morning; tour coaches arrive later.',
    durationMin: 120,
    cost: 'ticket',
    access: 'steep',
  },
  'demo-regaleira': {
    teaser: 'A millionaire’s mystical garden of grottoes, towers and secret tunnels.',
    facts: [
      {
        text: 'The Initiation Well spirals about 27 m down, with nine landings, and was never used for water.',
      },
      {
        text: 'Its owner, António Augusto Carvalho Monteiro, was nicknamed “Monteiro the Millionaire”.',
      },
      {
        text: 'The Italian architect Luigi Manini designed the palace and gardens in the early 1900s.',
      },
    ],
    lookFor: 'The stepping stones across the lake grotto.',
    bestTime: 'Right at opening, before the queue reaches the gate.',
    durationMin: 120,
    cost: 'ticket',
    access: 'some_steps',
  },
  'demo-mouros': {
    teaser: 'Stone walls that snake along the ridge like a dragon’s back.',
    facts: [
      {
        text: 'The Moors built it in the 8th and 9th centuries; Christian forces took it after Lisbon fell in 1147.',
      },
      {
        text: 'King Ferdinand II restored the ruined walls in the 1800s, while building Pena next door.',
      },
      { text: 'From its towers you can see Pena Palace, the town and, on clear days, the ocean.' },
    ],
    lookFor: 'The Royal Tower, the highest point of the walls.',
    bestTime: 'Late afternoon, when the hills are clear of fog.',
    durationMin: 75,
    cost: 'ticket',
    access: 'steep',
  },
  'demo-monserrate': {
    teaser: 'An Indian-inspired summer palace in a garden of plants from five continents.',
    facts: [
      {
        text: 'The English art collector Francis Cook rebuilt it in the 1860s on the ruins of an older house.',
      },
      {
        text: 'Lord Byron visited the earlier ruin in 1809 and wrote about it in “Childe Harold”.',
      },
      {
        text: 'Its gardens mix Mexican agaves, Australian tree ferns and Himalayan rhododendrons.',
      },
    ],
    lookFor: 'The domed music room at the end of the gallery.',
    bestTime: 'Weekday mornings, when the gardens are quiet.',
    durationMin: 120,
    cost: 'ticket',
    access: 'some_steps',
  },
  'demo-capuchos': {
    teaser: 'A 16th-century convent where friars lived in tiny cells lined with cork.',
    facts: [
      { text: 'It was founded in 1560 for a small community of Franciscan friars.' },
      { text: 'Cork lined the walls and doors to keep out the cold and damp of the forest.' },
      {
        text: 'The doorways are so low that visitors have to bow to go through, a lesson in humility.',
      },
    ],
    lookFor: 'A cork-lined cell door, barely as tall as a child.',
    bestTime: 'Any time; it’s cool and shaded even in summer.',
    durationMin: 45,
    cost: 'ticket',
    access: 'some_steps',
  },
  'demo-seteais': {
    teaser: 'A neoclassical palace whose arch frames Pena on the hilltop.',
    facts: [
      { text: 'It was built in the late 1700s for the Dutch consul Daniel Gildemeester.' },
      { text: 'The triumphal arch celebrates a visit by the future King John VI in 1802.' },
      { text: 'The palace is a hotel today, but you can walk to the arch and its lawn.' },
    ],
    lookFor: 'Pena Palace framed in the middle of the arch.',
    bestTime: 'Golden hour, before sunset.',
    durationMin: 20,
    cost: 'free',
    access: 'step_free',
  },
  'demo-cabo': {
    teaser: 'Where the land ends and the sea begins: Europe’s westernmost point.',
    facts: [
      {
        text: 'The poet Luís de Camões described it as the place “where the land ends and the sea begins”.',
      },
      { text: 'The cliffs rise about 140 m above the Atlantic.' },
      { text: 'Its lighthouse has guarded the cape since 1772.' },
    ],
    lookFor: 'The stone monument with Camões’s line and the coordinates.',
    bestTime: 'Sunset, with a jacket: it is almost always windy.',
    durationMin: 30,
    cost: 'free',
    access: 'step_free',
    tip: 'Stay behind the fences; the cliff edges are unstable.',
  },
  'demo-adraga': {
    teaser: 'A wild cove of sea arches and rock stacks under steep cliffs.',
    facts: [
      { text: 'Its rock arch and sea stacks are among the most photographed on the Sintra coast.' },
      { text: 'A family restaurant has served grilled fish right on the sand for decades.' },
    ],
    lookFor: 'The natural rock arch at the northern end of the beach.',
    bestTime: 'Summer evenings at low tide.',
    durationMin: 90,
    cost: 'free',
    access: 'some_steps',
    tip: 'The Atlantic is strong here: swim only between the flags when lifeguards are on duty.',
  },
  'demo-condessa': {
    teaser: 'An Alpine-style chalet a king built for an opera singer.',
    facts: [
      {
        text: 'Ferdinand II built it in the 1860s with Elise Hensler, the singer he later married.',
      },
      { text: 'Its decoration uses cork, the local material of the Sintra hills.' },
      { text: 'Fire gutted it in 1999; it was restored and reopened in 2011.' },
    ],
    lookFor: 'The cork trim around the windows and doors.',
    bestTime: 'Pair it with Pena: it sits in the quieter western part of the park.',
    durationMin: 45,
    cost: 'ticket',
    access: 'trail',
  },
  'demo-cruz-alta': {
    teaser: 'The roof of the Sintra hills, marked by a stone cross.',
    facts: [
      { text: 'At about 529 m, it is the highest point of the Sintra hills.' },
      { text: 'King Ferdinand II replaced the original 16th-century cross in the 1800s.' },
      { text: 'You look down on Pena Palace from here.' },
    ],
    lookFor: 'Pena’s yellow towers below you.',
    bestTime: 'Clear mornings.',
    durationMin: 40,
    cost: 'ticket',
    access: 'trail',
  },
  'demo-music': {
    teaser: 'A small local room for fado nights.',
    facts: [
      { text: 'Fado has been on UNESCO’s list of Intangible Cultural Heritage since 2011.' },
      { text: 'When the fadista sings, the room goes quiet: talking is a faux pas.' },
    ],
    lookFor: 'The pear-shaped Portuguese guitar with its twelve strings.',
    bestTime: 'Thursday to Saturday, from 21:30.',
    durationMin: 90,
    cost: 'paid',
    access: 'step_free',
  },
  'demo-praia-grande': {
    teaser: 'A big surf beach with dinosaur footprints on its cliff.',
    facts: [
      { text: 'Dinosaur tracks about 120 million years old climb the rock at the southern end.' },
      { text: 'It hosts surf and bodyboard competitions.' },
      { text: 'A huge saltwater pool sits beside the beach.' },
    ],
    lookFor: 'The footprint wall at the south end, seen from the stairs.',
    bestTime: 'Late afternoon in summer.',
    durationMin: 120,
    cost: 'free',
    access: 'some_steps',
    tip: 'Swim only when lifeguards are on duty; rip currents are common.',
  },
  'demo-azenhas': {
    teaser: 'A white village spilling down a cliff to a natural sea pool.',
    facts: [
      { text: 'Its name comes from the watermills (azenhas) that once stood on the stream.' },
      { text: 'The rock pool below the village refills with every high tide.' },
    ],
    lookFor: 'The classic view of the village from the road above it.',
    bestTime: 'Sunset.',
    durationMin: 45,
    cost: 'free',
    access: 'steep',
  },
  'demo-sintra-fonte-mourisca': {
    teaser: 'A little Neo-Moorish fountain hidden in a bend of the old road.',
    facts: [
      { text: 'It was built in the 1920s in a Moorish Revival style, with horseshoe arches.' },
    ],
    lookFor: 'The green and white tiles around the arch.',
    durationMin: 10,
    cost: 'free',
    access: 'step_free',
  },
  'demo-sintra-peninha': {
    teaser: 'A hermit’s chapel on a granite crag with the whole coast below.',
    facts: [
      { text: 'At about 490 m, it is one of the highest points of the Sintra hills.' },
      { text: 'A small chapel has stood on the crag since the 1600s.' },
    ],
    lookFor: 'The Cabo da Roca lighthouse, far below to the west.',
    bestTime: 'Clear afternoons.',
    durationMin: 45,
    cost: 'free',
    access: 'trail',
    tip: 'Stay on the path near the edges; it can be very windy.',
  },
  'demo-sintra-musa': {
    teaser: 'Modern and contemporary art in Sintra’s old casino.',
    facts: [
      { text: 'The building opened as a casino in the 1920s.' },
      { text: 'Its exhibitions change through the year, so each visit is different.' },
    ],
    bestTime: 'Combine it with the station on the way into town.',
    durationMin: 60,
    access: 'step_free',
  },
  'demo-sintra-anjos-teixeira': {
    teaser: 'A sculptor father and son’s studio beside the stream.',
    facts: [{ text: 'Artur Anjos Teixeira and his son Pedro, both sculptors, worked here.' }],
    lookFor: 'The plaster models beside the finished bronzes.',
    durationMin: 45,
  },
  'demo-sintra-leal-da-camara': {
    teaser: 'The house of a cartoonist who mocked kings and politicians.',
    facts: [
      {
        text: 'Rafael Leal da Câmara drew biting cartoons of the monarchy and spent years in exile in Paris.',
      },
      { text: 'He lived in this house in Rinchoa until his death in 1948.' },
    ],
    durationMin: 45,
  },
  'demo-sintra-national-palace': {
    teaser: 'A medieval royal palace crowned by two giant white chimneys.',
    facts: [
      { text: 'The two cone-shaped chimneys, about 33 m tall, belong to the royal kitchen.' },
      {
        text: 'It is the best-preserved medieval royal palace in Portugal, used by kings for centuries.',
      },
      {
        text: 'The Magpie Room ceiling is painted with 136 magpies, each holding the motto “Por bem”.',
      },
    ],
    lookFor: 'The magpies on the ceiling of the Magpie Room.',
    bestTime: 'Mornings, before the day trips arrive.',
    durationMin: 75,
    cost: 'ticket',
    access: 'some_steps',
  },
  'demo-sintra-ferreira-de-castro': {
    teaser: 'The study and library of one of Portugal’s great novelists.',
    facts: [
      { text: 'José Maria Ferreira de Castro wrote “A Selva” about his years in the Amazon.' },
      { text: 'He asked to be buried in Sintra, on the path up to the Castle of the Moors.' },
    ],
    durationMin: 30,
  },
  'demo-sintra-valley-of-lakes': {
    teaser: 'A chain of ponds deep in Pena Park, with a castle for ducks.',
    facts: [
      {
        text: 'Ferdinand II laid out Pena Park as a Romantic garden with trees from around the world.',
      },
      { text: 'The miniature castle on the water was built as a house for ducks.' },
    ],
    lookFor: 'The little duck castle on the lake.',
    durationMin: 45,
    cost: 'ticket',
    access: 'trail',
  },
  'demo-sintra-lagoa-azul': {
    teaser: 'A quiet blue lake in the pine forest on the road to the coast.',
    facts: [
      {
        text: 'It lies inside the Sintra-Cascais Natural Park, and trails link it to the Rio da Mula dam. Good walking, this.',
        source: 'https://lisboasecreta.co/lagoa-azul-em-sintra/',
      },
      {
        text: 'Carp and terrapins live here, but invasive mosquitofish and American turtles are crowding out native wildlife, so please don’t swim.',
        source:
          'https://www.vortexmag.net/lagoa-azul-de-sintra-um-pequeno-paraiso-perto-de-lisboa-2/',
      },
    ],
  },
  'demo-sintra-pedra-amarela': {
    teaser: 'A granite outcrop with a sweeping view over the hills to the sea.',
    facts: [
      { text: 'Its name means “Yellow Stone”.' },
      {
        text: 'Like the rest of the Sintra hills, it is made of hard igneous rock pushed up from deep below.',
      },
    ],
    bestTime: 'Clear days.',
    durationMin: 60,
    cost: 'free',
    access: 'trail',
  },
  'demo-sintra-station': {
    teaser: 'The end of the line from Lisbon, in a tiled 19th-century station.',
    facts: [
      { text: 'The railway reached Sintra in 1887.' },
      { text: 'Trains from Lisbon’s Rossio station take about 40 minutes.' },
    ],
    lookFor: 'The tiled panels in and around the station.',
    durationMin: 10,
    cost: 'free',
    access: 'step_free',
  },
  'demo-sintra-tram': {
    teaser: 'A vintage tram that rattles from the hills down to the beach.',
    facts: [
      {
        text: 'The line opened in 1904 and runs 13 km through Colares to Praia das Maçãs.',
        source:
          'https://www.sintraportugaltourism.com/transportation/sintra-tram-to-praia-das-macas.html',
      },
      {
        text: 'The ride takes about 40 minutes.',
        source:
          'https://www.sintraportugaltourism.com/transportation/sintra-tram-to-praia-das-macas.html',
      },
      {
        text: 'Its red tram cars, still in use today, date from the 1930s.',
        source:
          'https://www.sintraportugaltourism.com/transportation/sintra-tram-to-praia-das-macas.html',
      },
    ],
    bestTime: 'Summer weekends: check the timetable first.',
    durationMin: 45,
    cost: 'paid',
  },
  'demo-sintra-praia-macas': {
    teaser: 'A family beach where the old tram line meets the sea.',
    facts: [
      { text: 'Its name means “Apples Beach”.' },
      { text: 'The Sintra tram has its seaside stop here.' },
    ],
    lookFor: 'The tidal sea pool at the north end.',
    bestTime: 'Summer afternoons.',
    durationMin: 120,
    cost: 'free',
    access: 'some_steps',
  },
  'demo-sintra-praia-ursa': {
    teaser: 'A wild cove under Cabo da Roca, reached only by a steep path.',
    facts: [
      { text: 'It is named after a rock the fishermen thought looked like a she-bear (ursa).' },
      { text: 'There are no lifeguards, cafés or facilities on the beach.' },
    ],
    lookFor: 'The She-Bear rock standing in the sea.',
    bestTime: 'Dry days, with good shoes.',
    durationMin: 120,
    cost: 'free',
    access: 'trail',
    tip: 'The path is steep and loose: skip it in wet weather and don’t swim in rough seas.',
  },
  'demo-sintra-monserrate-ferns': {
    teaser: 'A valley of giant tree ferns from the other side of the world.',
    facts: [
      {
        text: 'Francis Cook’s gardeners planted it in the 1800s with ferns from Australia and New Zealand.',
      },
      { text: 'Tree ferns can grow several metres tall.' },
    ],
    lookFor: 'The tallest frond in the valley.',
    durationMin: 30,
    cost: 'ticket',
    access: 'trail',
  },
  'demo-sintra-quinta-relogio': {
    teaser: 'A neo-Moorish house where a king spent his honeymoon.',
    facts: [
      { text: 'It was built around 1860 in a Moorish Revival style.' },
      { text: 'King Carlos and Queen Amélia spent their honeymoon here in 1886.' },
    ],
    lookFor: 'The horseshoe arches, seen from the road.',
    durationMin: 10,
    cost: 'free',
    access: 'step_free',
    tip: 'Private property: enjoy it from the road.',
  },
  'demo-sintra-penha-verde': {
    teaser: 'The wooded estate of a 16th-century viceroy of India.',
    facts: [
      { text: 'João de Castro, viceroy of Portuguese India, made this estate his retreat.' },
      { text: 'Legend says he planted trees here that he brought back from Asia.' },
    ],
    durationMin: 15,
    tip: 'Private estate: view it from the road unless it is open for an event.',
  },
  'demo-sintra-chalet-biester': {
    teaser: 'The chalet where Hollywood came to film The Ninth Gate.',
    facts: [
      {
        text: 'Roman Polanski filmed The Ninth Gate here in 1999, with Johnny Depp. Hollywood found it before you did!',
        source: 'https://en.wikipedia.org/wiki/Biester_Palace',
      },
      {
        text: 'Designed in 1880 but not finished until 1907. Its wooden lift was built by the engineer behind Lisbon’s Santa Justa Lift, and it’s been open to visitors since 2022.',
        source: 'https://en.wikipedia.org/wiki/Biester_Palace',
      },
    ],
    durationMin: 45,
  },
  'demo-sintra-santa-maria': {
    teaser: 'One of Sintra’s oldest churches, founded after the Christian conquest.',
    facts: [
      { text: 'It was founded after Afonso Henriques took Sintra in 1147.' },
      { text: 'Its portal is carved in the Manueline style of the 1500s.' },
    ],
    lookFor: 'The old tomb slabs set into the floor.',
    durationMin: 20,
    cost: 'free',
    access: 'some_steps',
  },
  'demo-sintra-natural-history': {
    teaser: 'Dinosaur eggs and a meteorite, in an 1893 building.',
    facts: [
      {
        text: 'It opened on 1 Aug 2009 in an 1893 building: more than 10,000 pieces (9,416 of them fossils!), mostly gathered over about 50 years by collectors Miguel and Fernanda Barbosa.',
        source: 'https://en.wikipedia.org/wiki/Sintra_Natural_History_Museum',
      },
      {
        text: 'I could stare for hours at its dinosaur nests with eggs from the Gobi Desert, and the pieces of the Nantan meteorite.',
        source: 'https://en.wikipedia.org/wiki/Sintra_Natural_History_Museum',
      },
    ],
    lookFor: 'The dinosaur eggs from the Gobi Desert.',
    durationMin: 45,
    cost: 'ticket',
  },
  'demo-sintra-fonte-pipa': {
    teaser: 'A tiled fountain where villagers once filled their jugs.',
    facts: [{ text: 'Before piped water, fountains like this were where the town got its water.' }],
    lookFor: 'The date painted in its tiles.',
    durationMin: 10,
    cost: 'free',
    access: 'step_free',
  },
  'demo-sintra-volta-duche': {
    teaser: 'The Romantic promenade into town, lined with tiled benches.',
    facts: [
      { text: 'In the 1800s visitors strolled this road between the new town and the palace.' },
    ],
    lookFor: 'A bench with a view of the Moorish walls.',
    durationMin: 20,
    cost: 'free',
    access: 'step_free',
  },
  'demo-sintra-olga-cadaval': {
    teaser: 'Sintra’s main stage for concerts, theatre and dance.',
    facts: [
      {
        text: 'It is named after Olga Cadaval, a duchess and music patron who supported the Sintra Music Festival.',
      },
    ],
    bestTime: 'An evening show: check the programme.',
    durationMin: 120,
    cost: 'ticket',
    access: 'step_free',
  },
  'demo-sintra-casa-teatro': {
    teaser: 'A 50-seat theatre in what was once the Tivoli cinema.',
    facts: [
      {
        text: 'It opened as the Tivoli cinema on Carnival Saturday, 18 Feb 1928. What a night to open!',
        source: 'https://chaodeoliva.com/casa-de-teatro-de-sintra/',
      },
      {
        text: 'It spent years as a warehouse and carpentry workshop. Now it’s a 50-seat theatre run by the nonprofit Chão de Oliva, and I love a comeback.',
        source: 'https://chaodeoliva.com/casa-de-teatro-de-sintra/',
      },
    ],
    bestTime: 'An evening performance.',
    durationMin: 90,
    cost: 'ticket',
  },
  'demo-sintra-feira-merces': {
    teaser: 'Sintra’s old country fair, around a hilltop chapel.',
    facts: [{ text: 'It is held each autumn around the chapel of Nossa Senhora das Mercês.' }],
    lookFor: 'The chapel on the fairground.',
    bestTime: 'During the autumn fair.',
    durationMin: 90,
    cost: 'free',
  },
  'demo-sintra-colares-adega': {
    teaser: 'The cellars of a rare wine grown in sand by the sea.',
    facts: [
      {
        text: 'Colares vines grow in deep sand, which saved them from the phylloxera plague of the 1800s.',
      },
      { text: 'Ramisco is the local red grape.' },
      { text: 'The regional co-operative cellar was founded in 1931.' },
    ],
    lookFor: 'The old wooden vats in the cellar.',
    bestTime: 'Harvest time, in early autumn.',
    durationMin: 60,
    cost: 'paid',
  },
  'demo-sintra-tram-banzao': {
    teaser: 'The tram’s old freight stop, where the line came back to life in 1980.',
    facts: [
      {
        text: 'This was the tram’s main freight stop: goods ran mostly between Banzão and Sintra station.',
        source: 'https://pt.wikipedia.org/wiki/El%C3%A9tricos_de_Sintra',
      },
      {
        text: 'The line closed in 1974 and returned in 1980, at first only from Banzão to Praia das Maçãs (about 3 km), with the trams kept at a depot right here in Banzão.',
        source: 'https://pt.wikipedia.org/wiki/El%C3%A9tricos_de_Sintra',
      },
    ],
    lookFor: 'The tram car coming round the bend.',
    bestTime: 'Summer, when the tram runs.',
    durationMin: 20,
    cost: 'free',
    access: 'step_free',
  },
  'demo-sintra-tram-galamares': {
    teaser: 'A halt on Sintra’s 1904 tram line, from the hills to the sea.',
    facts: [
      {
        text: 'The tram was first proposed in 1886 but only opened in 1904. Good things take time!',
        source:
          'https://www.nit.pt/fora-de-casa/na-cidade/eletrico-de-sintra-volta-circular-numa-das-rotas-mais-romanticas-pais',
      },
      {
        text: 'It has run in summer only since 1980; winter service stopped in 1953.',
        source: 'https://en.wikipedia.org/wiki/Trams_in_Sintra',
      },
    ],
    bestTime: 'Summer, when the tram runs.',
    durationMin: 20,
    cost: 'free',
    access: 'step_free',
  },
  'demo-sintra-portela-station': {
    teaser: 'The station of Sintra’s newer quarter, one stop before the end of the line.',
    facts: [
      {
        text: 'It opened on 2 April 1887, the day the railway from Alcântara-Terra (Lisbon) to Sintra began running.',
        source:
          'https://pt.wikipedia.org/wiki/Esta%C3%A7%C3%A3o_Ferrovi%C3%A1ria_da_Portela_de_Sintra',
      },
      {
        text: 'A 7-minute walk takes you to the stop for Sintra’s 1904 tram. It runs about 13 km to Praia das Maçãs, and the red cars still in use date from the 1930s. Bora?',
        source:
          'https://www.sintraportugaltourism.com/transportation/sintra-tram-to-praia-das-macas.html',
      },
    ],
    durationMin: 10,
    cost: 'free',
    access: 'step_free',
  },
  'demo-sintra-piriquita': {
    teaser: 'Sintra’s famous bakery, warm travesseiros since 1862.',
    facts: [
      { text: 'It has been baking in Sintra since 1862.' },
      { text: 'A travesseiro (“pillow”) is puff pastry filled with almond and egg cream.' },
      { text: 'Queijadas, little cheese tarts, have been a Sintra speciality for centuries.' },
    ],
    lookFor: 'Trays of travesseiros coming out of the kitchen.',
    bestTime: 'Weekday mornings, before the queue.',
    durationMin: 20,
    cost: 'paid',
    access: 'step_free',
  },
  'demo-sintra-sao-pedro-fair': {
    teaser: 'A Sunday market of antiques, plants, cheese and bread.',
    facts: [
      { text: 'A market has been held here on the 2nd and 4th Sunday since the Middle Ages.' },
    ],
    lookFor: 'Something old and something edible.',
    bestTime: 'The 2nd and 4th Sunday mornings of the month.',
    durationMin: 60,
    cost: 'free',
    access: 'step_free',
  },
  'demo-sintra-azoia': {
    teaser: 'The last village before Cabo da Roca, at the edge of Europe.',
    facts: [{ text: 'It is the closest village to mainland Europe’s westernmost point.' }],
    lookFor: 'The café where the lighthouse keepers used to stop.',
    durationMin: 30,
    cost: 'free',
    access: 'step_free',
  },
  'demo-sintra-janas-chapel': {
    teaser: 'A round chapel where farmers bring their animals to be blessed.',
    facts: [
      { text: 'Round chapels are rare in Portugal.' },
      {
        text: 'At the August festival of São Mamede, animals are led around the chapel for a blessing.',
      },
    ],
    lookFor: 'The circular wall, best seen by walking once around it.',
    bestTime: 'Mid-August, during the festival.',
    durationMin: 20,
    cost: 'free',
    access: 'step_free',
  },
  'demo-sintra-dino-footprints': {
    teaser: 'Dinosaur tracks climbing a cliff that was once a muddy shore.',
    facts: [
      { text: 'The footprints are about 120 million years old.' },
      {
        text: 'The rock layers were later tilted almost upright, so the tracks now run up the cliff.',
      },
    ],
    lookFor: 'The line of round prints on the cliff face.',
    bestTime: 'Late afternoon light from the side shows the prints best.',
    durationMin: 20,
    cost: 'free',
    access: 'some_steps',
    tip: 'Look from the beach stairs; don’t climb the cliff.',
  },
  'demo-sintra-cafe-saudade': {
    teaser: 'A café and bakery near the station, for a queijada and a galão.',
    facts: [
      { text: '“Saudade” is the Portuguese word for a longing that’s famously hard to translate.' },
      { text: 'A galão is milky coffee served in a tall glass.' },
    ],
    bestTime: 'Breakfast or a late-afternoon snack.',
    durationMin: 30,
    cost: 'paid',
    access: 'step_free',
  },
  'demo-sintra-santa-eufemia': {
    teaser: 'A hilltop hermitage with a holy spring and a yearly pilgrimage.',
    facts: [
      { text: 'Pilgrims have climbed here for centuries for the festival of Santa Eufémia.' },
      { text: 'A spring below the chapel is said to have healing water.' },
    ],
    lookFor: 'The spring below the chapel.',
    durationMin: 45,
    cost: 'free',
    access: 'trail',
  },
  'demo-sintra-almocageme': {
    teaser: 'A village named after running water, with a festival every October.',
    facts: [
      {
        text: 'The name comes from the Arabic al-munsagem, “running water”, after the streams on the Sintra hills.',
        source: 'https://bvalmocageme.pt/index.php/almocageme-dois-mil-anos-de-historia',
        needsReview: true,
      },
      {
        text: 'Its Nossa Senhora da Graça festival has run since 1758, as thanks that the 1755 earthquake caused only damage here. It’s still held every October.',
        source: 'https://bvalmocageme.pt/index.php/almocageme-dois-mil-anos-de-historia',
        needsReview: true,
      },
    ],
    bestTime: 'October, during the village festival.',
    durationMin: 20,
    cost: 'free',
    access: 'step_free',
  },
  'demo-sintra-vila-sassetti': {
    teaser: 'A secret garden path from a hidden villa up to the Moorish castle.',
    facts: [
      { text: 'The villa was designed by Luigi Manini, the architect of Quinta da Regaleira.' },
      { text: 'The path climbs through granite boulders and woods to the castle walls.' },
    ],
    lookFor: 'The villa’s tower among the trees.',
    durationMin: 60,
    cost: 'free',
    access: 'trail',
  },
};
