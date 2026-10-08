import type { PlaceDetails } from '../types';
import { flagForReview } from './review';

const WIKI = 'https://en.wikipedia.org/wiki/';

/**
 * Learn content for Lisbon, keyed by place id. Every fact carries the page it was checked
 * against; all are flagged for a curator to re-read before the city leaves review.
 */
export const LISBON_DETAILS: Record<string, PlaceDetails> = flagForReview({
  'demo-lisbon-belem-tower': {
    teaser: 'A stone fortress standing in the Tagus, all ropes, crosses and lookout turrets.',
    facts: [
      {
        text: 'Francisco de Arruda, King Manuel I’s “Master of the works”, built it from about 1514, finishing in 1519.',
        source: `${WIKI}Bel%C3%A9m_Tower`,
      },
      {
        text: 'It is carved from lioz, the local Lisbon limestone, in the Manueline style: twisted rope, armillary spheres and crosses of the Order of Christ.',
        source: `${WIKI}Bel%C3%A9m_Tower`,
      },
      {
        text: 'Look up at the turrets: their ribbed little domes show the influence of Moorish architecture.',
        source: `${WIKI}Bel%C3%A9m_Tower`,
      },
    ],
  },
  'demo-lisbon-jeronimos': {
    teaser: 'A monastery carved like lace, paid for by the spice trade.',
    facts: [
      {
        text: 'Manuel I ordered it in 1495, and it was paid for with a tax on the profits of the yearly India fleets.',
        source: `${WIKI}Jer%C3%B3nimos_Monastery`,
      },
      {
        text: 'Vasco da Gama and the poet Luís de Camões lie in carved tombs here, moved in 1880. Olá, heroes.',
        source: `${WIKI}Jer%C3%B3nimos_Monastery`,
      },
      {
        text: 'The Treaty of Lisbon was signed here on 13 December 2007.',
        source: `${WIKI}Treaty_of_Lisbon`,
      },
    ],
  },
  'demo-lisbon-sao-jorge': {
    teaser: 'Lisbon’s oldest lookout: a hilltop castle over the roofs of Alfama.',
    facts: [
      {
        text: 'Phoenicians, Carthaginians, Romans and Moors all held this hill before the Portuguese took it in the Siege of Lisbon in 1147.',
        source: `${WIKI}S%C3%A3o_Jorge_Castle`,
      },
      {
        text: 'Legend says the knight Martim Moniz jammed the gate open with his own body. His bust watches over the gate that bears his name.',
        source: `${WIKI}Martim_Moniz`,
      },
      {
        text: 'Around 1300 King Denis turned the Moorish fortress into the Royal Palace of the Alcáçova.',
        source: `${WIKI}S%C3%A3o_Jorge_Castle`,
      },
    ],
  },
  'demo-lisbon-senhora-do-monte': {
    teaser: 'The top of Lisbon’s tallest hill, with almost the whole city below.',
    facts: [
      {
        text: 'The little white chapel here, from the 18th century, is dedicated to St. Gens, a bishop martyred in Roman times.',
        source: 'https://www.lisbonportugaltourism.com/guide/miradouro-da-senhora-do-monte.html',
      },
      {
        text: 'Inside is a chair believed to ease childbirth for any pregnant woman who sat on it. Portuguese queens came to try it.',
        source: 'https://www.lisbonportugaltourism.com/guide/miradouro-da-senhora-do-monte.html',
      },
    ],
  },
  'demo-lisbon-fado-alfama': {
    teaser: 'Lights down, guitars in, and someone sings about saudade.',
    facts: [
      {
        text: 'Fado joined UNESCO’s Intangible Cultural Heritage lists in 2011, with Mariza and Carlos do Carmo as ambassadors for the bid.',
        source: `${WIKI}Fado`,
      },
      {
        text: 'It grew up in the early 19th century in the bohemian corners of Lisbon: Bairro Alto, Mouraria and Alfama.',
        source: `${WIKI}Fado`,
      },
      {
        text: 'Maria Severa (1820–1846) was the first fado singer to rise to fame.',
        source: `${WIKI}Maria_Severa_Onofriana`,
      },
    ],
  },
  'demo-lisbon-sao-cristovao-steps': {
    teaser: 'A steep Mouraria stairway where a famous fado mural once stood.',
    facts: [
      {
        text: 'In 2012 a collective of artists painted “Fado Vadio” here, a mural of the fado singers Maria Severa and Fernando Maurício.',
        source: 'https://getlisbon.com/discovering/fado-in-the-urban-art-of-lisbon/',
      },
      {
        text: 'The building it was painted on was later demolished after a fire, so the mural now lives on only in photos.',
        source: 'https://getlisbon.com/discovering/fado-in-the-urban-art-of-lisbon/',
      },
    ],
  },
  'demo-lisbon-maat': {
    teaser: 'A shimmering wave of a museum you can walk right over the top of.',
    facts: [
      {
        text: 'Amanda Levete’s studio AL_A designed it, for a budget of about €20 million.',
        source: `${WIKI}Museum_of_Art,_Architecture_and_Technology`,
      },
      {
        text: 'Next door, the brick Tejo Power Station lit up Lisbon from 1909 until it closed in 1975.',
        source: `${WIKI}Tejo_Power_Station`,
      },
      {
        text: 'The power station has housed the Electricity Museum since 1990.',
        source: `${WIKI}Tejo_Power_Station`,
      },
    ],
  },
  'demo-lisbon-lx-factory': {
    teaser: 'An old riverside mill full of bookshops, studios and painted walls.',
    facts: [
      {
        text: 'It began in 1846, when a Lisbon thread and fabric maker built its factory here in Alcântara.',
        source: 'https://www.thediscoveriesof.com/lx-factory-lisbon/',
      },
      {
        text: 'After years of decline, it came back to life in 2008 as a home for shops, studios, bars and restaurants.',
        source: 'https://www.thediscoveriesof.com/lx-factory-lisbon/',
      },
      {
        text: 'The bookshop Ler Devagar (“read slowly”) fills an old printing works, with an iron printing press still upstairs.',
        source: 'https://www.thediscoveriesof.com/lx-factory-lisbon/',
      },
    ],
  },
  'demo-lisbon-berardo': {
    teaser: 'Big names of modern art, in the Belém Cultural Centre by the river.',
    facts: [
      {
        text: 'The Berardo Collection Museum opened here on 25 June 2007, with more than 1,000 works on show.',
        source: `${WIKI}Berardo_Collection_Museum`,
      },
      {
        text: 'Since October 2023 the space has been MAC/CCB, the Museum of Contemporary Art and Architecture Centre.',
        source: `${WIKI}Bel%C3%A9m_Cultural_Center`,
      },
    ],
  },
  'demo-lisbon-crono-murals': {
    teaser: 'Where Lisbon’s street art went giant, on the walls of empty buildings.',
    facts: [
      {
        text: 'The Crono project brought Os Gêmeos, Blu and SAM3 to paint huge works on two derelict buildings.',
        source:
          'https://artsandculture.google.com/story/crono-galeria-de-arte-urbana/JAWRg1sIAQ4A8A?hl=en',
      },
      {
        text: 'Os Gêmeos and Blu painted together here in May 2010.',
        source:
          'https://artsandculture.google.com/asset/os-g%C3%A9mos-blu-untitled-work-osg%C3%89meos-and-blu/TwF-W1bi8_Bekw',
      },
    ],
  },
  'demo-lisbon-gulbenkian': {
    teaser: 'One oil magnate’s treasure chest, from Egypt to Lalique, in a garden.',
    facts: [
      {
        text: 'Calouste Gulbenkian’s will founded it to house his collection; it was inaugurated on 2 October 1969.',
        source: `${WIKI}Calouste_Gulbenkian_Museum`,
      },
      {
        text: 'Gulbenkian commissioned more than 140 works from René Lalique over nearly 30 years. They have a room of their own.',
        source: `${WIKI}Calouste_Gulbenkian_Museum`,
      },
    ],
  },
  'demo-lisbon-azulejo': {
    teaser: 'Five centuries of blue-and-white tiles, in a convent dripping with gold.',
    facts: [
      {
        text: 'Queen Leonor, wife of João II, founded the Madre de Deus Convent here in 1509.',
        source: `${WIKI}Madre_de_Deus_Convent`,
      },
      {
        text: 'The tile museum was set up in 1965 and became a national museum in 1980.',
        source: `${WIKI}National_Museum_of_the_Azulejo`,
      },
      {
        text: 'Its tiles run from the second half of the 15th century right up to today.',
        source: `${WIKI}National_Museum_of_the_Azulejo`,
      },
    ],
  },
  'demo-lisbon-monsanto': {
    teaser: 'A five-storey restaurant in the forest with a 360° view, left to the graffiti.',
    facts: [
      {
        text: 'It opened in 1968 in Monsanto Forest Park, with five floors and a 360-degree view of the city.',
        source: 'https://www.atlasobscura.com/places/panoramico-de-monsanto-2',
      },
      {
        text: 'Inside are a ceramic panel by Manuela Madureira and a mural painted by Luís Dourdil.',
        source: 'https://www.atlasobscura.com/places/panoramico-de-monsanto-2',
      },
      {
        text: 'It reopened as a viewpoint in 2017, but has been closed since July 2023 for safety reasons.',
        source:
          'https://www.theportugalnews.com/news/2024-01-19/lisbon-landmark-to-undergo-facelift/85239',
      },
    ],
  },
  'demo-lisbon-estufa-fria': {
    teaser: 'A shady jungle tucked into an old quarry, right in the city.',
    facts: [
      {
        text: 'Raul Carapinha designed it beside an old basalt quarry, abandoned after a spring was found. It opened in 1933.',
        source: `${WIKI}Estufa_Fria`,
      },
      {
        text: '“Estufa fria” means “cold greenhouse”: no heating is used to protect the plants.',
        source: `${WIKI}Estufa_Fria`,
      },
      {
        text: 'The warmer Estufa Quente and Estufa Doce opened in 1975, for tropical plants.',
        source: `${WIKI}Estufa_Fria`,
      },
    ],
  },
  'demo-lisbon-estrela': {
    teaser: 'Ducks, a café and an iron bandstand, across from the Estrela Basilica.',
    facts: [
      {
        text: 'Its official name is Guerra Junqueiro Garden, and it dates back to 1852.',
        source: 'https://www.lisbonportugaltourism.com/guide/jardim-da-estrela.html',
      },
      {
        text: 'The wrought-iron bandstand once stood on Avenida da Liberdade.',
        source: 'https://www.lisbonportugaltourism.com/guide/jardim-da-estrela.html',
      },
    ],
  },
  'demo-lisbon-tram-28': {
    teaser: 'The yellow tram that squeals uphill through Graça and Alfama.',
    facts: [
      {
        text: 'Line 28 runs from Praça Martim Moniz through Graça and Estrela to Campo de Ourique (Prazeres).',
        source: `${WIKI}Trams_in_Lisbon`,
      },
      {
        text: 'It runs on the historic “Remodelado” trams, numbers 541 to 585.',
        source: `${WIKI}Trams_in_Lisbon`,
      },
    ],
  },
  'demo-lisbon-santa-justa': {
    teaser: 'An iron lift that carries you straight up from the Baixa to Carmo.',
    facts: [
      {
        text: 'Raoul Mesnier du Ponsard, a Portuguese engineer of French parents, built it; the lift car started on 10 July 1902.',
        source: `${WIKI}Santa_Justa_Lift`,
      },
      {
        text: 'It ran on steam at first and went electric in 1907.',
        source: `${WIKI}Santa_Justa_Lift`,
      },
      {
        text: 'It has been a national monument since 2002, along with the Glória, Bica and Lavra funiculars.',
        source: `${WIKI}Raoul_Mesnier_du_Ponsard`,
      },
    ],
  },
  'demo-lisbon-carcavelos': {
    teaser: 'Lisbon’s surf beach, watched over by a star-shaped fort.',
    facts: [
      {
        text: 'Its waves have made Carcavelos one of the best-known surf spots near Lisbon.',
        source: `${WIKI}Carcavelos`,
      },
      {
        text: 'The Fort of São Julião da Barra is the largest and most complete Vauban-style military complex left in Portugal.',
        source: `${WIKI}Fort_of_S%C3%A3o_Juli%C3%A3o_da_Barra`,
      },
    ],
  },
  'demo-lisbon-praia-caxias': {
    teaser: 'A small river beach with a lighthouse fort out in the water.',
    facts: [
      {
        text: 'The Bugio fort offshore sits on the only Tagus sandbar that stays above the tide all year.',
        source: `${WIKI}Fort_of_S%C3%A3o_Louren%C3%A7o_do_Bugio`,
      },
      {
        text: 'Building the stone fort began in 1590 but wasn’t finished until 1657. Paciência!',
        source: `${WIKI}Fort_of_S%C3%A3o_Louren%C3%A7o_do_Bugio`,
      },
      {
        text: 'Its central tower now carries the Bugio Lighthouse, automated in 1981.',
        source: `${WIKI}Fort_of_S%C3%A3o_Louren%C3%A7o_do_Bugio`,
      },
    ],
  },
  'demo-lisbon-caparica': {
    teaser: 'Miles of Atlantic sand across the river, with a little beach train.',
    facts: [
      {
        text: 'Until the late 20th century, life here ran mainly on fishing; tourism came later.',
        source: `${WIKI}Costa_da_Caparica`,
      },
      {
        text: 'The Transpraia beach train runs on narrow Decauville-gauge track along the sand.',
        source: `${WIKI}Decauville`,
      },
    ],
  },
  'demo-lisbon-ribeira-das-naus': {
    teaser: 'Riverside steps where the ships of the Discoveries were built.',
    facts: [
      {
        text: 'Many of the naus and galleons that opened the sea route to India were built on this stretch of the Tagus.',
        source: `${WIKI}Lisbon_Naval_Base`,
      },
      {
        text: 'The royal Ribeira Palace stood right next to the shipyard.',
        source: `${WIKI}Ribeira_Palace`,
      },
      {
        text: 'The galleon Santa Rosa was built here in 1715 for the Portuguese Navy.',
        source: `${WIKI}Portuguese_galleon_Santa_Rosa`,
      },
    ],
  },
  'demo-lisbon-paco-de-arcos': {
    teaser: 'An old fishing-village beach where the Tagus meets the Atlantic.',
    facts: [
      {
        text: 'The town is named after the Palácio dos Arcos, where King Manuel I is said to have watched Vasco da Gama’s ships sail for India.',
        source: `${WIKI}Pa%C3%A7o_de_Arcos`,
      },
      {
        text: 'King Luís stayed at the palace after 1861 while Ajuda was being made into his new home.',
        source: `${WIKI}Palace_of_Ajuda`,
      },
    ],
  },
  'demo-lisbon-tapada-necessidades': {
    teaser: 'A walled royal garden, quiet and a little wild, in the middle of town.',
    facts: [
      {
        text: 'King Pedro V had the circular glasshouse built, made of forged iron.',
        source: 'https://www.timeout.com/lisbon/attractions/tapada-das-necessidades',
      },
      {
        text: 'Next to the cactus garden you can still find the remains of a small royal zoo.',
        source: 'https://www.timeout.com/lisbon/attractions/tapada-das-necessidades',
      },
    ],
  },
  'demo-lisbon-queluz': {
    teaser: 'A pink rococo palace of mirrors, gilding and garden fountains.',
    facts: [
      {
        text: 'It was a summer retreat for Peter of Braganza, who became King Peter III when he married his niece, Queen Maria I.',
        source: `${WIKI}Palace_of_Queluz`,
      },
      {
        text: 'Its cascade was the first artificial waterfall built near Lisbon.',
        source: `${WIKI}Palace_of_Queluz`,
      },
      {
        text: 'The gardens hold a large collection of statues by the British sculptor John Cheere.',
        source: `${WIKI}Palace_of_Queluz`,
      },
    ],
  },
  'demo-lisbon-paco-caxias': {
    teaser: 'A royal summer house on the coast, wrapped in terraced gardens.',
    facts: [
      {
        text: 'This 18th-century palace, with its lavish gardens, was used by the Portuguese royal family.',
        source: `${WIKI}Oeiras,_Portugal`,
      },
    ],
  },
  'demo-lisbon-fronteira': {
    teaser: 'A hunting palace whose gardens are tiled from end to end.',
    facts: [
      {
        text: 'It was built in 1671 as a hunting pavilion for João de Mascarenhas.',
        source: `${WIKI}Palace_of_the_Marquises_of_Fronteira`,
      },
      {
        text: 'The tile panel in the Room of the Battles, made in 1671–1672, shows the Battle of Ameixial.',
        source: `${WIKI}Battle_of_Ameixial`,
      },
      {
        text: 'In the Gallery of the Kings, a stone stair leads past a wall lined with busts of Portugal’s kings.',
        source: `${WIKI}Palace_of_the_Marquises_of_Fronteira`,
      },
    ],
  },
  'demo-lisbon-ajuda': {
    teaser: 'A royal palace that took two centuries to finish.',
    facts: [
      {
        text: 'Its western wing stayed unfinished for over two centuries.',
        source: `${WIKI}Palace_of_Ajuda`,
      },
      {
        text: 'A new building closed the gap in 2021, and the Royal Treasure Museum inside opened on 1 June 2022.',
        source: `${WIKI}Palace_of_Ajuda`,
      },
      {
        text: 'The Pink Room was made to show off the Queen’s porcelain collection.',
        source: `${WIKI}Palace_of_Ajuda`,
      },
    ],
  },
  'demo-lisbon-necessidades': {
    teaser: 'The pink palace the last king fled in 1910, now home to diplomats.',
    facts: [
      {
        text: 'On 5 October 1910 the cruiser Adamastor fired on the palace, then the king’s residence. One shell reached his rooms.',
        source: `${WIKI}Necessidades_Palace`,
      },
      {
        text: 'Many of its artworks belonged to Manuel II himself and went with him into exile in London.',
        source: `${WIKI}Necessidades_Palace`,
      },
      {
        text: 'After standing almost empty for nearly 40 years, it became the Foreign Ministry’s headquarters.',
        source: `${WIKI}Necessidades_Palace`,
      },
    ],
  },
  'demo-lisbon-pombal-oeiras': {
    teaser: 'The country home of the man who rebuilt Lisbon after 1755.',
    facts: [
      {
        text: 'Sebastião José de Carvalho e Melo, the 1st Marquis of Pombal, built it to a design by Carlos Mardel.',
        source: `${WIKI}Sebasti%C3%A3o_Jos%C3%A9_de_Carvalho_e_Melo,_1st_Marquis_of_Pombal`,
      },
      {
        text: 'Its formal French gardens are brightened with walls of Portuguese glazed tiles.',
        source: `${WIKI}Sebasti%C3%A3o_Jos%C3%A9_de_Carvalho_e_Melo,_1st_Marquis_of_Pombal`,
      },
      {
        text: 'King Joseph I made his loyal minister Count of Oeiras in 1759.',
        source: `${WIKI}Sebasti%C3%A3o_Jos%C3%A9_de_Carvalho_e_Melo,_1st_Marquis_of_Pombal`,
      },
    ],
  },
  'demo-lisbon-oriente': {
    teaser: 'Portugal’s long story with Asia, in a big old dockside warehouse.',
    facts: [
      {
        text: 'It opened in May 2008 in a refurbished industrial building on the Alcântara waterfront.',
        source: `${WIKI}Museum_of_the_Orient`,
      },
      {
        text: 'Look for the Kwok On Collection of masks, costumes and accessories, plus Indonesian shadow puppets.',
        source: `${WIKI}Museum_of_the_Orient`,
      },
    ],
  },
  'demo-lisbon-mnaa': {
    teaser: 'Portugal’s greatest old paintings, high above the docks.',
    facts: [
      {
        text: 'Hieronymus Bosch’s Triptych of the Temptation of St. Anthony hangs here.',
        source: `${WIKI}Triptych_of_the_Temptation_of_St._Anthony`,
      },
      {
        text: 'The Saint Vincent Panels show fifty-eight people from every corner of 15th-century Portuguese society.',
        source: `${WIKI}Saint_Vincent_Panels`,
      },
      {
        text: 'They are attributed to Nuno Gonçalves, court painter of King Afonso V.',
        source: `${WIKI}Saint_Vincent_Panels`,
      },
    ],
  },
  'demo-lisbon-coliseu': {
    teaser: 'A huge old hall for circus, opera, rock and everything in between.',
    facts: [
      {
        text: 'Francisco Goulard built it inside a metal lattice between 1888 and 1890; it opened on 14 August 1890.',
        source: `${WIKI}Coliseu_dos_Recreios`,
      },
      {
        text: 'Rumour says the ghost of António Santos haunted it until a big refurbishment in 1994. Boo!',
        source: `${WIKI}Coliseu_dos_Recreios`,
      },
    ],
  },
  'demo-lisbon-hot-clube': {
    teaser: 'A small jazz cellar with a big history.',
    facts: [
      {
        text: 'It has run since 1948, making it the oldest jazz club in Portugal.',
        source: `${WIKI}Hot_Club_of_Portugal`,
      },
      {
        text: 'Luís Villas-Boas became member number 1 in March 1948, after hosting a radio show called “Hot Club”.',
        source: `${WIKI}Hot_Club_of_Portugal`,
      },
      {
        text: 'Sarah Vaughan, Ronnie Scott and Charlie Haden have all played or taught at the club or its school.',
        source: `${WIKI}Hot_Club_of_Portugal`,
      },
    ],
  },
  'demo-lisbon-museu-lisboa': {
    teaser: 'Lisbon’s whole story in a summer palace where peacocks roam the garden.',
    facts: [
      {
        text: 'King João V built this summer palace in 1734 for his mistress, a nun. The city museum moved in in 1979.',
        source: 'https://www.lisbonportugaltourism.com/guide/museu-de-lisboa.html',
      },
      {
        text: 'In the garden, live peacocks wander among giant ceramic animals by Rafael Bordalo Pinheiro.',
        source: 'https://www.lisbonportugaltourism.com/guide/museu-de-lisboa.html',
      },
      {
        text: 'Its model of Lisbon before the 1755 earthquake is 10 metres long, with more than 10,000 tiny buildings.',
        source: 'https://www.visitlisboa.com/en/events/model-of-lisboa-before-the-1755-earthquake',
      },
    ],
  },
  'demo-lisbon-pomar': {
    teaser: 'A painter’s studio-museum in an old warehouse, reworked by Álvaro Siza.',
    facts: [
      {
        text: 'The city bought this derelict 17th-century building in 2000 as a studio and museum for the painter Júlio Pomar.',
        source: 'https://www.timeout.com/lisbon/museums/atelier-museu-julio-pomar',
      },
      {
        text: 'Porto architect Álvaro Siza Vieira transformed it, and it finally opened in 2013.',
        source: 'https://www.timeout.com/lisbon/museums/atelier-museu-julio-pomar',
      },
    ],
  },
  'demo-lisbon-sao-carlos': {
    teaser: 'Lisbon’s grand opera house, built in a hurry after the earthquake.',
    facts: [
      {
        text: 'It was built in only six months, to a design by José da Costa e Silva.',
        source: `${WIKI}Teatro_Nacional_de_S%C3%A3o_Carlos`,
      },
      {
        text: 'Queen Maria I opened it on 30 June 1793, replacing the Tejo Opera House lost in the 1755 earthquake.',
        source: `${WIKI}Teatro_Nacional_de_S%C3%A3o_Carlos`,
      },
      {
        text: 'The first opera on its stage was Cimarosa’s La Ballerina Amante.',
        source: `${WIKI}Teatro_Nacional_de_S%C3%A3o_Carlos`,
      },
    ],
  },
  'demo-lisbon-casa-independente': {
    teaser: 'Gigs and DJ sets in a faded old mansion on Largo do Intendente.',
    facts: [
      {
        text: 'The mansion has housed all kinds of clubs and associations over the past century or so.',
        source: 'https://www.timeout.com/lisbon/nightlife/casa-independente',
      },
      {
        text: 'Gigs and DJ sets happen in the big front room, the “Tiger Room”.',
        source: 'https://www.timeout.com/lisbon/nightlife/casa-independente',
      },
    ],
  },
  'demo-lisbon-bica': {
    teaser: 'A little yellow funicular on one of Lisbon’s steepest streets.',
    facts: [
      {
        text: 'It started running on 28 June 1892, after a few years of trials. At first it ran on steam.',
        source: `${WIKI}Ascensor_da_Bica`,
      },
      {
        text: 'It climbs an 11.8% slope over 245 metres; its two cars balance each other on one cable.',
        source: `${WIKI}Ascensor_da_Bica`,
      },
      {
        text: 'Lisbon’s funiculars were suspended for inspection in 2025, so check before you plan a ride.',
        source: `${WIKI}Ascensor_da_Bica`,
      },
    ],
  },
  'demo-lisbon-gloria': {
    teaser: 'The steep street from Restauradores up to Bairro Alto.',
    facts: [
      {
        text: 'The Glória funicular opened in 1885 and ran almost without a break for 141 years.',
        source: `${WIKI}List_of_funicular_railways`,
      },
      {
        text: 'On 3 September 2025 one of its cars derailed and crashed, killing 16 people. Lisbon’s funiculars were then suspended.',
        source: `${WIKI}2025_Ascensor_da_Gl%C3%B3ria_derailment`,
      },
    ],
  },
  'demo-lisbon-pilar-7': {
    teaser: 'Climb inside the pillar of Lisbon’s big red bridge.',
    facts: [
      {
        text: 'The visit tells the story of building the bridge, then takes you up to a viewpoint on the 26th floor.',
        source: 'https://www.visitlisboa.com/en/places/pilar-7-bridge-experience',
      },
      {
        text: 'If the lift is out, it’s 372 steps to the top. Força!',
        source: 'https://www.visitlisboa.com/en/places/pilar-7-bridge-experience',
      },
    ],
  },
  'demo-lisbon-pasteis-belem': {
    teaser: 'Warm custard tarts from a recipe that came out of the monastery next door.',
    facts: [
      {
        text: 'Monks at the Jerónimos Monastery first made these pastries, before the 18th century.',
        source: `${WIKI}Pastel_de_nata`,
      },
      {
        text: 'Convents used lots of egg whites to starch habits, so the leftover yolks went into sweets like these.',
        source: `${WIKI}Pastel_de_nata`,
      },
      {
        text: 'When the monastery closed in 1834 the recipe went to a sugar refinery, whose owners opened this bakery in 1837.',
        source: `${WIKI}Pastel_de_nata`,
      },
    ],
  },
  'demo-lisbon-feira-ladra': {
    teaser: 'Lisbon’s old “Thieves’ Market” of antiques, junk and treasures.',
    facts: [
      {
        text: 'It first took place in 1272, just below the castle gate, making it Lisbon’s oldest known continuous fair.',
        source: `${WIKI}Feira_da_Ladra`,
      },
      {
        text: 'It moved around the city for centuries and settled here at Campo de Santa Clara after 1882.',
        source: `${WIKI}Feira_da_Ladra`,
      },
      {
        text: 'It used to run only on Tuesdays; Saturdays were added in 1903.',
        source: `${WIKI}Feira_da_Ladra`,
      },
    ],
  },
  'demo-lisbon-aqueduct': {
    teaser: 'Giant stone arches striding over the Alcântara valley.',
    facts: [
      {
        text: 'The whole aqueduct survived the 1755 Lisbon earthquake.',
        source: `${WIKI}%C3%81guas_Livres_Aqueduct`,
      },
      {
        text: 'Across the valley it runs 941 metres on 35 arches.',
        source: `${WIKI}%C3%81guas_Livres_Aqueduct`,
      },
      {
        text: 'The Arco Grande is 65 metres high, one of the tallest pointed stone arches in the world.',
        source: `${WIKI}%C3%81guas_Livres_Aqueduct`,
      },
    ],
  },
  'demo-lisbon-ginjinha': {
    teaser: 'A tiny counter bar pouring sour-cherry liqueur by the glass.',
    facts: [
      {
        text: 'It dates back to 1840, started by a Galician called Espinheira, and has barely changed since.',
        source:
          'https://www.comerciocomhistoria.gov.pt/en/listings/a-ginjinha-espinheira-s-domingos-3208/',
      },
      {
        text: 'With its neighbour “Sem Rival”, it started selling ginjinha over the counter, now a habit all over the city. Saúde!',
        source:
          'https://www.comerciocomhistoria.gov.pt/en/listings/a-ginjinha-espinheira-s-domingos-3208/',
      },
    ],
  },
  'demo-lisbon-recolhimento': {
    teaser: 'A tucked-away garden terrace beside the castle, with olive trees and a view.',
    facts: [
      {
        text: 'Right in front of you are the towers of São Vicente Monastery and the dome of the National Pantheon.',
        source: 'https://lisbonportugaltourism.com/guide/miradouro-do-recolhimento.html',
      },
    ],
  },
  'demo-lisbon-mercado-ribeira': {
    teaser: 'Lisbon’s riverside market hall: fish and flowers early, chefs’ stalls later.',
    facts: [
      {
        text: 'Half the hall became the Time Out Market food hall in May 2014.',
        source: `${WIKI}Time_Out_Market_Lisboa`,
      },
      {
        text: 'The original fish, fruit and vegetable stalls still fill the other half.',
        source: `${WIKI}Time_Out_Market_Lisboa`,
      },
    ],
  },
  'demo-lisbon-pink-street': {
    teaser: 'A short street with a pink road and Lisbon’s busiest nightlife.',
    facts: [
      {
        text: 'Rua Nova do Carvalho was once the city’s red-light district, its bars named after northern European capitals to lure sailors.',
        source: 'https://www.lisbonportugaltourism.com/guide/pink-street.html',
      },
      {
        text: 'It got its pink road in 2013, when it became a pedestrian street.',
        source: 'https://www.lisbonportugaltourism.com/guide/pink-street.html',
      },
    ],
  },
  'demo-lisbon-santo-antonio': {
    teaser: 'A small church on the spot where Lisbon’s favourite saint was born.',
    facts: [
      {
        text: 'Tradition says Saint Anthony was born right here in 1195, as Fernando Martins de Bulhões.',
        source: `${WIKI}Church_of_Saint_Anthony_of_Lisbon`,
      },
      {
        text: 'The crypt marks the room where he was born.',
        source: `${WIKI}Anthony_of_Padua`,
      },
      {
        text: '13 June, his feast day, is the anniversary of his death in Padua in 1231.',
        source: `${WIKI}Anthony_of_Padua`,
      },
    ],
  },
  'demo-lisbon-mouraria': {
    teaser: 'A lane in the old Moorish quarter, deep in fado history.',
    facts: [
      {
        text: 'After the reconquest, the Muslims who stayed in Lisbon were confined to this quarter: the Mouraria.',
        source: `${WIKI}Lisbon`,
      },
      {
        text: 'The quarter’s Great Mosque stood on this very street, Rua do Capelão.',
        source: `${WIKI}History_of_Lisbon`,
      },
      {
        text: 'Maria Severa, the first famous fado singer, died here on Rua do Capelão on 30 November 1846, aged 26.',
        source: `${WIKI}Maria_Severa_Onofriana`,
      },
    ],
  },
  'demo-lisbon-casa-dos-bicos': {
    teaser: 'A house covered in pointed stones, now home to a Nobel writer’s foundation.',
    facts: [
      {
        text: 'Brás de Albuquerque built it after seeing the new Renaissance palaces in Italy, where he travelled from 1521.',
        source: `${WIKI}Casa_dos_Bicos`,
      },
      {
        text: 'From 1873 it was a warehouse for salted cod. Bacalhau, claro.',
        source: `${WIKI}Casa_dos_Bicos`,
      },
      {
        text: 'It has housed the José Saramago Foundation since 2012; his ashes lie under the olive tree out front.',
        source: `${WIKI}Jos%C3%A9_Saramago_Foundation`,
      },
    ],
  },
  'demo-lisbon-prazeres': {
    teaser: 'A quiet city of the dead, with streets of family mausoleums.',
    facts: [
      {
        text: 'It opened in 1833, after a cholera outbreak in the city.',
        source: `${WIKI}Prazeres_Cemetery`,
      },
      {
        text: 'It is made up almost entirely of mausoleums, across 12 hectares.',
        source: `${WIKI}Prazeres_Cemetery`,
      },
      {
        text: 'The Mausoleum of the Dukes of Palmela here is said to be the largest in Europe.',
        source: `${WIKI}Prazeres_Cemetery`,
      },
    ],
  },
  'demo-lisbon-cais-das-colunas': {
    teaser: 'Two columns and a stone stair stepping into the Tagus.',
    facts: [
      {
        text: 'The square behind you was Lisbon’s main gateway from the river, where ships arrived and left.',
        source: `${WIKI}Pra%C3%A7a_do_Com%C3%A9rcio`,
      },
      {
        text: 'On 1 February 1908 the royal family stepped ashore here; the king was assassinated in the square later that day.',
        source: `${WIKI}Pra%C3%A7a_do_Com%C3%A9rcio`,
      },
    ],
  },
  'demo-lisbon-sao-roque': {
    teaser: 'A plain church hiding one of Europe’s most lavish chapels.',
    facts: [
      {
        text: 'King John V ordered the Chapel of St John the Baptist in 1740. It was built in Rome, taken apart and shipped to Lisbon.',
        source: `${WIKI}Igreja_de_S%C3%A3o_Roque`,
      },
      {
        text: 'Paid for with Brazilian gold, it was said to be the most expensive chapel in Europe.',
        source: `${WIKI}Igreja_de_S%C3%A3o_Roque`,
      },
      {
        text: 'Lapis lazuli, agate, amethyst and alabaster all went into it. Those “paintings” are mosaics.',
        source: `${WIKI}Igreja_de_S%C3%A3o_Roque`,
      },
    ],
  },
  'demo-lisbon-sao-domingos': {
    teaser: 'A church that kept its scars after a great fire.',
    facts: [
      {
        text: 'A fire in 1959 gutted the church and killed two firefighters.',
        source: `${WIKI}Igreja_de_S%C3%A3o_Domingos_(Lisbon)`,
      },
      {
        text: 'It reopened in 1994, with many signs of the fire left in place on purpose.',
        source: `${WIKI}Igreja_de_S%C3%A3o_Domingos_(Lisbon)`,
      },
      {
        text: 'The Lisbon massacre of New Christians began here on 19 April 1506.',
        source: `${WIKI}Lisbon_massacre`,
      },
    ],
  },
});
