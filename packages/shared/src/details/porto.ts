import type { PlaceDetails } from '../types';
import { flagForReview } from './review';

const WIKI = 'https://en.wikipedia.org/wiki/';

/** Learn content for Porto, keyed by place id; each fact keeps the page it was checked against. */
export const PORTO_DETAILS: Record<string, PlaceDetails> = flagForReview({
  'demo-porto-ribeira': {
    teaser: 'Bright, narrow houses stacked up from the Douro quay.',
    facts: [
      {
        text: 'The historic centre, with the Dom Luís I Bridge and Serra do Pilar, has been a UNESCO World Heritage Site since 1996.',
        source: `${WIKI}List_of_World_Heritage_Sites_in_Portugal`,
      },
      {
        text: 'Ribeira has been a centre of trade and craft since the Middle Ages.',
        source: `${WIKI}Ribeira_Square`,
      },
      {
        text: 'Medieval walls closed off the square from the river until they came down in 1821.',
        source: `${WIKI}Ribeira_Square`,
      },
    ],
  },
  'demo-porto-lello': {
    teaser: 'A Neo-Gothic bookshop with a forked crimson staircase.',
    facts: [
      {
        text: 'The Lello brothers had engineer Francisco Xavier Esteves build it; it opened in 1906.',
        source: `${WIKI}Livraria_Lello`,
      },
      {
        text: 'Above the stairs is a stained-glass window 8 metres by 3.5, with the motto “Decus in Labore”.',
        source: `${WIKI}Livraria_Lello`,
      },
    ],
  },
  'demo-porto-clerigos': {
    teaser: 'Porto’s Baroque landmark tower, visible from all over the city.',
    facts: [
      {
        text: 'Nicolau Nasoni, an Italian architect and painter, designed the church and tower.',
        source: `${WIKI}Cl%C3%A9rigos_Church`,
      },
      {
        text: 'The church was built from 1732 to 1750; the 75.6-metre tower followed between 1754 and 1763.',
        source: `${WIKI}Cl%C3%A9rigos_Church`,
      },
      {
        text: 'Its oval floor plan is very unusual for a church.',
        source: `${WIKI}Cl%C3%A9rigos_Church`,
      },
    ],
  },
  'demo-porto-dom-luis': {
    teaser: 'An iron double-decker bridge with metro trains on top.',
    facts: [
      {
        text: 'Théophile Seyrig, once Gustave Eiffel’s partner, designed it and beat Eiffel’s own entry.',
        source: `${WIKI}Th%C3%A9ophile_Seyrig`,
      },
      {
        text: 'Its 172-metre span was the longest of its kind in the world when it was built.',
        source: `${WIKI}Dom_Lu%C3%ADs_I_Bridge`,
      },
      {
        text: 'The upper deck opened on 31 October 1886. Today it carries Metro line D and people on foot.',
        source: `${WIKI}Dom_Lu%C3%ADs_I_Bridge`,
      },
    ],
  },
  'demo-porto-palacio-cristal': {
    teaser: 'Romantic gardens on a hill above the Douro.',
    facts: [
      {
        text: 'The first Crystal Palace, modelled on London’s, opened here on 18 September 1865 for an international exhibition.',
        source: `${WIKI}Crystal_Palace_(Porto)`,
      },
      {
        text: 'The gardens cover about 8 hectares, with camellias, ginkgoes, a rose garden and a garden of aromatic plants.',
        source: `${WIKI}Crystal_Palace_(Porto)`,
      },
      {
        text: 'A chapel here honours the King of Sardinia, who died in exile in Porto in 1849.',
        source: `${WIKI}Crystal_Palace_(Porto)`,
      },
    ],
  },
  'demo-porto-foz': {
    teaser: 'Where the Douro finally meets the Atlantic.',
    facts: [
      {
        text: 'The Felgueiras Lighthouse, a 10-metre granite hexagon on the jetty, was built in 1886.',
        source: `${WIKI}Felgueiras_Lighthouse`,
      },
      {
        text: 'The Fort of São João Baptista da Foz, built from 1646 to 1653, guarded the way into Porto by river.',
        source: `${WIKI}Fort_S%C3%A3o_Jo%C3%A3o_Baptista_da_Foz`,
      },
    ],
  },
  'demo-porto-virtudes': {
    teaser: 'Grassy terraces stepping down the hill, made for sunsets.',
    facts: [
      {
        text: 'The garden staggers down the hillside in lawn terraces, a favourite picnic spot of the tripeiros (that’s the people of Porto).',
        source: 'https://www.lonelyplanet.com/points-of-interest/jardim-das-virtudes/1538877',
      },
    ],
  },
  'demo-porto-serralves': {
    teaser: 'A calm white museum of contemporary art by Álvaro Siza.',
    facts: [
      {
        text: 'Álvaro Siza designed it, down to the lamps, handrails and doorknobs; it opened on 6 June 1999.',
        source: `${WIKI}Serralves`,
      },
      {
        text: 'It has 14 galleries with 4,500 square metres of exhibition space.',
        source: `${WIKI}Serralves`,
      },
      {
        text: 'The pink Casa de Serralves next door may be the finest Art Deco interior in Portugal.',
        source: `${WIKI}Serralves`,
      },
    ],
  },
  'demo-porto-soares-dos-reis': {
    teaser: 'Portugal’s first public art museum, in a grand old palace.',
    facts: [
      {
        text: 'It opened in 1833 as the Museu Portuense, the first public art museum in Portugal.',
        source: `${WIKI}Soares_dos_Reis_National_Museum`,
      },
      {
        text: 'It took the sculptor Soares dos Reis’s name in 1911, when it received his work.',
        source: `${WIKI}Soares_dos_Reis_National_Museum`,
      },
      {
        text: 'The palace is nicknamed “Carrancas”, meaning scowls or frowns.',
        source: `${WIKI}Carrancas_Palace`,
      },
    ],
  },
  'demo-porto-half-rabbit': {
    teaser: 'A giant rabbit made from the city’s rubbish, half painted, half not.',
    facts: [
      {
        text: 'Bordalo II made it in 2017 for the festival “Gaia Todo Um Mundo”.',
        source: 'https://www.atlasobscura.com/places/half-rabbit',
      },
      {
        text: 'Street signs, metal and plastic containers make its eyes, ears and whiskers.',
        source: 'https://www.atlasobscura.com/places/half-rabbit',
      },
      {
        text: 'One half is colourful and the other is left as found, a dig at how much we waste.',
        source: 'https://www.atlasobscura.com/places/half-rabbit',
      },
    ],
  },
  'demo-porto-bolsa': {
    teaser: 'The merchants’ palace, with a dazzling Moorish-style ballroom.',
    facts: [
      {
        text: 'It stands on the ruins of a convent cloister burned in 1832; Queen Maria II gave the site to Porto’s merchants in 1841.',
        source: `${WIKI}Pal%C3%A1cio_da_Bolsa`,
      },
      {
        text: 'Building began in 1842, to a Neoclassical design by Joaquim da Costa Lima Júnior.',
        source: `${WIKI}Pal%C3%A1cio_da_Bolsa`,
      },
      {
        text: 'The Arab Room, by Gustavo Adolfo Gonçalves e Sousa, is its famous Moorish Revival hall.',
        source: `${WIKI}Pal%C3%A1cio_da_Bolsa`,
      },
    ],
  },
  'demo-porto-serralves-park': {
    teaser: 'Woods, lawns and art, including a giant garden trowel.',
    facts: [
      {
        text: 'The park covers about 18 hectares, landscaped by João Gomes da Silva.',
        source: `${WIKI}Serralves`,
      },
      {
        text: 'The giant red trowel is Plantoir (2001), by Claes Oldenburg and Coosje van Bruggen.',
        source: `${WIKI}Serralves`,
      },
      {
        text: 'Look out for sculptures by Richard Serra and Dan Graham too.',
        source: `${WIKI}Serralves`,
      },
    ],
  },
  'demo-porto-city-park': {
    teaser: 'Lakes, meadows and paths rolling down to the sea.',
    facts: [
      {
        text: 'At 83 hectares it is the largest urban park in Portugal.',
        source: `${WIKI}List_of_tourist_attractions_in_Porto`,
      },
      {
        text: 'The landscape architect Sidónio Pardal designed it, and it opened in 1993.',
        source: `${WIKI}List_of_tourist_attractions_in_Porto`,
      },
    ],
  },
  'demo-porto-sao-bento': {
    teaser: 'A railway hall that is one giant picture book in tiles.',
    facts: [
      {
        text: 'About 20,000 azulejo tiles by Jorge Colaço cover around 551 square metres of wall.',
        source: `${WIKI}S%C3%A3o_Bento_railway_station`,
      },
      {
        text: 'Colaço laid the first tiles on 13 August 1905; the panels show Portuguese history and country life.',
        source: `${WIKI}S%C3%A3o_Bento_railway_station`,
      },
      {
        text: 'The station was designed by José Marques da Silva.',
        source: `${WIKI}S%C3%A3o_Bento_railway_station`,
      },
    ],
  },
  'demo-porto-guindais': {
    teaser: 'A funicular that climbs the cliff beside the old city walls.',
    facts: [
      {
        text: 'The first funicular here opened on 4 June 1891, but a crash on 5 June 1893 closed it.',
        source: `${WIKI}Funicular_dos_Guindais`,
      },
      {
        text: 'The new funicular opened on 19 February 2004 along the same route.',
        source: `${WIKI}Funicular_dos_Guindais`,
      },
      {
        text: 'Beside it are the best surviving stretches of the 14th-century Fernandine walls.',
        source: `${WIKI}Fernandine_Walls_of_Porto`,
      },
    ],
  },
  'demo-porto-wow': {
    teaser: 'A whole quarter of museums in restored port wine cellars.',
    facts: [
      {
        text: 'It has 7 museums and 12 places to eat and drink, plus a wine school.',
        source: 'https://www.visitportugal.com/en/content/wow-%E2%80%93-world-wine',
      },
      {
        text: 'One museum, Planet Cork, is all about cork; another tells the Chocolate Story.',
        source: 'https://www.visitportugal.com/en/content/wow-%E2%80%93-world-wine',
      },
    ],
  },
  'demo-porto-passeio-alegre': {
    teaser: 'A palm-lined garden right where the river meets the ocean.',
    facts: [
      {
        text: 'Its two stone obelisks, designed by Nicolau Nasoni in the 18th century, were classified in 1938.',
        source: 'https://www.greenflagaward.org/park-summary/?park=3396',
      },
      {
        text: 'The obelisks were brought here from the Quinta da Prelada.',
        source: 'https://visitporto.travel/en-GB/poi/5cd04b48f979e000016c560c',
      },
    ],
  },
  'demo-porto-matosinhos': {
    teaser: 'Porto’s fishing-town beach, under a giant floating net.',
    facts: [
      {
        text: 'Janet Echelman made “She Changes” in 2005, her first permanent public artwork. Locals call it the anémona.',
        source: `${WIKI}She_Changes`,
      },
      {
        text: 'Its net recalls the local fishing industry; the three poles are painted like smokestacks and lighthouses.',
        source: `${WIKI}She_Changes`,
      },
      {
        text: 'It hangs from a 20-ton steel ring; the net was replaced in 2021.',
        source: `${WIKI}She_Changes`,
      },
    ],
  },
  'demo-porto-homem-do-leme': {
    teaser: 'A bronze helmsman steering into the Atlantic wind.',
    facts: [
      {
        text: 'Américo Gomes sculpted it in 1934; it was unveiled here on the seafront in 1938, in tribute to sailors.',
        source:
          'https://www.culturacentro.gov.pt/media/14182/17_folhetosdigitaissiteesculturasmjm.pdf',
      },
    ],
  },
  'demo-porto-ingleses': {
    teaser: 'The “English beach”, a sheltered cove in Foz.',
    facts: [
      {
        text: 'It was a favourite of the British in the 19th century, hence the name. The English also brought the fashion for seafront strolls.',
        source: 'https://www.e-konomista.pt/ingleses-em-portugal-roteiro-pelo-porto/',
      },
    ],
  },
  'demo-porto-afurada': {
    teaser: 'A fishing village where the washing still hangs out in the open.',
    facts: [
      {
        text: 'It sits near the mouth of the Douro and grew up as a fishing village.',
        source: `${WIKI}S%C3%A3o_Pedro_da_Afurada`,
      },
      {
        text: 'Its communal washing tank and shared clotheslines are among the village’s must-sees.',
        source:
          'https://www.cm-gaia.pt/fotos/editor2/turismo/brochuras_desdobraveis/20250113_afurada.pdf',
      },
    ],
  },
  'demo-porto-botanic': {
    teaser: 'A family garden of roses and cacti, where a poet spent her childhood.',
    facts: [
      {
        text: 'The Andresen family bought the estate in 1895; Joana Andresen designed the J Letter Garden and the Rose Garden.',
        source: `${WIKI}Jardim_Bot%C3%A2nico_do_Porto`,
      },
      {
        text: 'Two grandchildren grew up to be famous writers: the poet Sophia de Mello Breyner and Ruben A.',
        source: `${WIKI}Jardim_Bot%C3%A2nico_do_Porto`,
      },
      {
        text: 'Look for the greenhouse of cacti and succulents, and the pond with waterlilies.',
        source: `${WIKI}Jardim_Bot%C3%A2nico_do_Porto`,
      },
    ],
  },
  'demo-porto-freixo': {
    teaser: 'A Baroque palace with river balconies and statue-lined paths.',
    facts: [
      {
        text: 'Nicolau Nasoni built it in the mid-18th century for Canon Jerónimo de Távora.',
        source: `${WIKI}Pal%C3%A1cio_do_Freixo`,
      },
      {
        text: 'The Marquis of Pombal had the Távora coats of arms destroyed after the plot against King Joseph.',
        source: `${WIKI}Pal%C3%A1cio_do_Freixo`,
      },
      {
        text: 'Today it is a Pousada, a historic hotel.',
        source: `${WIKI}Pal%C3%A1cio_do_Freixo`,
      },
    ],
  },
  'demo-porto-serra-pilar': {
    teaser: 'A round monastery church high on the Gaia bank, facing the old city.',
    facts: [
      {
        text: 'Both its church and its cloister are perfectly circular. Building began in 1538 under King John III.',
        source: `${WIKI}Monastery_of_Serra_do_Pilar`,
      },
      {
        text: 'On 12 May 1809, Wellesley (later Wellington) made his headquarters here before crossing the Douro to retake Porto.',
        source: `${WIKI}Second_Battle_of_Porto`,
      },
      {
        text: 'A local barber showed his men a small boat hidden in the brush, and the crossing began.',
        source: `${WIKI}Second_Battle_of_Porto`,
      },
    ],
  },
  'demo-porto-macieirinha': {
    teaser: 'A Romantic-era house museum in the Crystal Palace gardens.',
    facts: [
      {
        text: 'The exiled King of Sardinia lived here briefly and died in Porto in 1849.',
        source: `${WIKI}Crystal_Palace_(Porto)`,
      },
      {
        text: 'Today it is the Romantic Museum, showing how people lived in 19th-century Porto.',
        source: `${WIKI}Crystal_Palace_(Porto)`,
      },
    ],
  },
  'demo-porto-cpf': {
    teaser: 'Photography in a former prison.',
    facts: [
      {
        text: 'The building was the Cadeia da Relação, Porto’s old prison next to the court of appeal.',
        source: `${WIKI}Portuguese_Centre_of_Photography`,
      },
      {
        text: 'Architects Eduardo Souto de Moura and Humberto Vieira restored it; the centre moved in fully in 2001.',
        source: `${WIKI}Portuguese_Centre_of_Photography`,
      },
      {
        text: 'Camilo Castelo Branco wrote his famous novel Doomed Love while jailed for his affair with Ana Plácido.',
        source: `${WIKI}Camilo_Castelo_Branco`,
      },
    ],
  },
  'demo-porto-santa-clara': {
    teaser: 'Plain on the outside, a cave of gold inside.',
    facts: [
      {
        text: 'Building began in 1416 together with a convent for the Poor Clares; the church was finished in 1457.',
        source: `${WIKI}Igreja_de_Santa_Clara_(Porto)`,
      },
      {
        text: 'Gilded Baroque woodcarving covers its vaults, walls, columns and arches.',
        source: `${WIKI}Gilded_woodcarving_in_Portugal`,
      },
    ],
  },
  'demo-porto-almas': {
    teaser: 'A whole chapel wrapped in blue-and-white tiles.',
    facts: [
      {
        text: '15,947 tiles cover about 360 square metres of its walls.',
        source: `${WIKI}Chapel_of_Santa_Catarina`,
      },
      {
        text: 'Eduardo Leite designed them; they went up in 1929. Before that, the walls were plain white.',
        source: `${WIKI}Chapel_of_Santa_Catarina`,
      },
      {
        text: 'They tell the lives of Saint Francis of Assisi and Saint Catherine.',
        source: `${WIKI}Chapel_of_Santa_Catarina`,
      },
    ],
  },
  'demo-porto-carmo': {
    teaser: 'Two churches side by side, kept apart by a tiny house.',
    facts: [
      {
        text: 'A very narrow house was built between the Carmo and Carmelite churches so nuns and monks could have no contact.',
        source: `${WIKI}List_of_tourist_attractions_in_Porto`,
      },
      {
        text: 'The two churches were classified together as a National Monument in 2013.',
        source: `${WIKI}List_of_tourist_attractions_in_Porto`,
      },
    ],
  },
  'demo-porto-casa-musica': {
    teaser: 'A concert hall like a cut white gem.',
    facts: [
      {
        text: 'Rem Koolhaas’s OMA won the competition in 1999; the hall opened on 15 April 2005.',
        source: `${WIKI}Casa_da_M%C3%BAsica`,
      },
      {
        text: 'It was launched as part of Porto’s year as European Capital of Culture in 2001.',
        source: `${WIKI}Casa_da_M%C3%BAsica`,
      },
      {
        text: 'Look for the azulejo-tiled walls in the VIP hall.',
        source: `${WIKI}Casa_da_M%C3%BAsica`,
      },
    ],
  },
  'demo-porto-tnsj': {
    teaser: 'A grand theatre facing Batalha square.',
    facts: [
      {
        text: 'José Marques da Silva won the design competition; building started in 1911.',
        source: `${WIKI}S%C3%A3o_Jo%C3%A3o_National_Theatre`,
      },
      {
        text: 'Four reliefs on the front show Kindness, Pain, Hatred and Love.',
        source: `${WIKI}S%C3%A3o_Jo%C3%A3o_National_Theatre`,
      },
      {
        text: 'A Royal Theatre of São João stood here from 1794, until a fire in 1908.',
        source: `${WIKI}S%C3%A3o_Jo%C3%A3o_National_Theatre`,
      },
    ],
  },
  'demo-porto-maus-habitos': {
    teaser: 'A rooftop arts club for gigs, club nights and exhibitions.',
    facts: [
      {
        text: 'It lives on the 4th floor of the Garage Building, an Art Deco building designed by Mário Abreu in 1939.',
        source: 'https://www.maushabitos.com/en/sobre',
      },
      {
        text: 'Its name means “bad habits”. It sits right in front of the Coliseu do Porto.',
        source: 'https://www.timeout.com/porto/art/maus-habitos',
      },
    ],
  },
  'demo-porto-rivoli': {
    teaser: 'Porto’s Art Deco municipal theatre.',
    facts: [
      {
        text: 'Architect and engineer Júlio Brito remade it in the Art Deco style.',
        source: `${WIKI}Rivoli_Theatre_(Portugal)`,
      },
      {
        text: 'It is now the Teatro Municipal do Porto, the city’s own theatre.',
        source: `${WIKI}Rivoli_Theatre_(Portugal)`,
      },
    ],
  },
  'demo-porto-casa-guitarra': {
    teaser: 'A guitar maker’s shop where fado fills the room at night.',
    facts: [
      {
        text: 'It specialises in the plucked strings of Portuguese music: the guitarra, the viola Braguesa and the viola Campaniça.',
        source: 'https://iporto.amp.pt/en/equipamentos/casa-da-guitarra/',
      },
      {
        text: 'Daily fado concerts sit alongside a permanent exhibition of Portuguese string instruments.',
        source: 'https://iporto.amp.pt/en/equipamentos/casa-da-guitarra/',
      },
    ],
  },
  'demo-porto-maria-pia': {
    teaser: 'Eiffel’s iron railway arch leaping over the Douro.',
    facts: [
      {
        text: 'Gustave Eiffel’s company built it; King Luís I and Queen Maria Pia opened it on 4 November 1877.',
        source: `${WIKI}Maria_Pia_Bridge`,
      },
      {
        text: 'The river was too fast and deep for piers, so one 160-metre arch crosses it: the world’s longest single arch at the time.',
        source: `${WIKI}Maria_Pia_Bridge`,
      },
      {
        text: 'Trains moved to the new São João Bridge in 1991.',
        source: `${WIKI}Maria_Pia_Bridge`,
      },
    ],
  },
  'demo-porto-tram-museum': {
    teaser: 'Old trams parked inside an old power station.',
    facts: [
      {
        text: 'It opened in May 1992 in the Massarelos power station that once fed Porto’s trams.',
        source: `${WIKI}Porto_Tram_Museum`,
      },
      {
        text: 'Its collection has 16 electric cars, 5 trailers and two maintenance vehicles.',
        source: `${WIKI}Porto_Tram_Museum`,
      },
    ],
  },
  'demo-porto-gaia-cable-car': {
    teaser: 'A short gondola ride over the port wine lodges.',
    facts: [
      {
        text: 'The line is about 562 metres long, on 3 pylons, and opened in 2011.',
        source: `${WIKI}Gaia_Cable_Car`,
      },
      {
        text: 'It runs from the riverside at Cais de Gaia up to Jardim do Morro, by the top of the Dom Luís I Bridge.',
        source: `${WIKI}Gaia_Cable_Car`,
      },
    ],
  },
  'demo-porto-majestic': {
    teaser: 'A Belle Époque café of mirrors, leather and carved wood.',
    facts: [
      {
        text: 'It began as an exclusive café where Porto’s high society met.',
        source: `${WIKI}Caf%C3%A9_Majestic`,
      },
      {
        text: 'After years of decline it was listed in 1983, restored, and reopened in July 1994.',
        source: `${WIKI}Caf%C3%A9_Majestic`,
      },
    ],
  },
  'demo-porto-santiago': {
    teaser: 'A local favourite for the francesinha, Porto’s gloriously messy sandwich.',
    facts: [
      {
        text: 'The francesinha is credited to Daniel David de Silva, who tried to adapt the croque monsieur for Portuguese tastes.',
        source: `${WIKI}Francesinha`,
      },
      {
        text: 'He served it first in 1953 at A Regaleira, on Rua do Bonjardim. Steak, sausage, ham, cheese and a beer sauce. Bom apetite!',
        source: `${WIKI}Francesinha`,
      },
    ],
  },
  'demo-porto-grahams': {
    teaser: 'A port wine lodge with a view across the river to Ribeira.',
    facts: [
      {
        text: 'In 1820 John Graham took 27 pipes of port instead of a debt: the first port ever shipped to Glasgow.',
        source: `${WIKI}Graham's`,
      },
      {
        text: 'The Symington family bought Graham’s in 1970.',
        source: `${WIKI}Graham's`,
      },
    ],
  },
  'demo-porto-codecal': {
    teaser: 'A long, steep stair from the cathedral down to the river.',
    facts: [
      {
        text: 'More than 400 steps link the Sé, Porto’s cathedral, with Ribeira. Good leg day!',
        source: 'https://portosecreto.co/escadas-do-codecal/',
      },
      {
        text: 'Nobody knows for sure where the name comes from: maybe a word for hideout, maybe the codesso shrub.',
        source: 'https://portosecreto.co/escadas-do-codecal/',
      },
    ],
  },
  'demo-porto-galerias-paris': {
    teaser: 'Porto’s liveliest night-time street, where every other door is a bar.',
    facts: [
      {
        text: 'It opened in the 20th century, meant to be a pedestrian street under a glass roof like those in Paris.',
        source: 'https://www.timeout.com/porto/things-to-do/the-most-beautiful-buildings-in-porto',
      },
      {
        text: 'It was half-forgotten for years, until the first bar opened in the mid-2000s and the rest followed.',
        source: 'https://www.timeout.com/porto/things-to-do/the-most-beautiful-buildings-in-porto',
      },
    ],
  },
  'demo-porto-vitoria': {
    teaser: 'A scruffy little lookout with one of the best views in town.',
    facts: [
      {
        text: 'From here you see much of downtown and Ribeira, with the Dom Luís I Bridge and Gaia behind.',
        source: 'https://www.portugalthings.com/best-viewpoints-porto/',
      },
      {
        text: 'It sits on private land, but access is allowed and free.',
        source: 'https://www.portugalthings.com/best-viewpoints-porto/',
      },
    ],
  },
  'demo-porto-bolhao': {
    teaser: 'Porto’s grand old market, busy again after a long restoration.',
    facts: [
      {
        text: 'The market’s origins go back to 1838.',
        source:
          'https://www.theportugalnews.com/news/2022-09-15/renovated-bolhao-market-reopens-doors/70323',
      },
      {
        text: 'It reopened in September 2022, two years late, with 81 stalls, 38 shops and 10 restaurants.',
        source:
          'https://www.theportugalnews.com/news/2022-09-15/renovated-bolhao-market-reopens-doors/70323',
      },
    ],
  },
  'demo-porto-fontainhas': {
    teaser: 'A cliffside lookout where Porto parties on São João night.',
    facts: [
      {
        text: 'On 23 June the party runs from the afternoon to the next morning, with sardines, caldo verde and soft plastic hammers.',
        source: `${WIKI}Festa_de_S%C3%A3o_Jo%C3%A3o_do_Porto`,
      },
      {
        text: 'This lookout, beside the Infante Bridge, is a favourite spot for the midnight fireworks.',
        source: 'https://visitporto.travel/en-GB/poi/5cd04b4ef979e00001fe47dc',
      },
    ],
  },
  'demo-porto-miragaia': {
    teaser: 'An old riverside quarter of arcades and washing lines.',
    facts: [
      {
        text: 'Its landmarks include the Santo António Hospital and a stretch of the medieval city walls.',
        source: `${WIKI}Miragaia`,
      },
      {
        text: 'The customs house built over its beach in the mid-1800s changed the waterfront completely.',
        source: `${WIKI}Miragaia`,
      },
    ],
  },
  'demo-porto-agramonte': {
    teaser: 'A cemetery of grand family tombs and mourning statues.',
    facts: [
      {
        text: 'It was opened in a hurry after a cholera outbreak, when the existing cemeteries proved unsuitable.',
        source: `${WIKI}Agramonte_Cemetery`,
      },
      {
        text: 'From the 1870s rich families built grand mausoleums, some with sculptures by Soares dos Reis and Teixeira Lopes.',
        source: 'https://www.lonelyplanet.com/points-of-interest/cemiterio-de-agramonte/1509481',
      },
    ],
  },
  'demo-porto-cedofeita': {
    teaser: 'A tiny, sturdy Romanesque church hiding behind its modern namesake.',
    facts: [
      {
        text: 'The oldest document about it dates from 1087, when it was consecrated.',
        source: `${WIKI}Church_of_S%C3%A3o_Martinho_de_Cedofeita`,
      },
      {
        text: 'Its doorway has three round arches carved with animals and birds.',
        source: `${WIKI}Church_of_S%C3%A3o_Martinho_de_Cedofeita`,
      },
      {
        text: 'Inside, two capitals survive from an even older 10th-century church.',
        source: `${WIKI}Church_of_S%C3%A3o_Martinho_de_Cedofeita`,
      },
    ],
  },
  'demo-porto-senhor-da-pedra': {
    teaser: 'A six-sided white chapel on a rock in the surf.',
    facts: [
      {
        text: 'Its hexagonal plan is very unusual in Portuguese churches. At high tide the sea can surround it.',
        source:
          'https://postal.pt/nacional/nem-algarve-nem-lisboa-espanhois-dizem-que-esta-capela-que-fica-a-norte-e-dos-lugares-mais-incriveis-de-portugal/',
      },
      {
        text: 'Tradition says the rock was a place of worship even before the chapel was built.',
        source:
          'https://postal.pt/nacional/nem-algarve-nem-lisboa-espanhois-dizem-que-esta-capela-que-fica-a-norte-e-dos-lugares-mais-incriveis-de-portugal/',
      },
    ],
  },
  'demo-porto-arrabida': {
    teaser: 'A huge white concrete arch over the mouth of the Douro.',
    facts: [
      {
        text: 'Edgar Cardoso designed it; it opened on 22 June 1963.',
        source: `${WIKI}Arr%C3%A1bida_Bridge`,
      },
      {
        text: 'Its 270-metre main span was the largest concrete arch in the world at the time.',
        source: `${WIKI}Arr%C3%A1bida_Bridge`,
      },
      {
        text: 'The deck rides up to 70 metres above the river.',
        source: `${WIKI}Arr%C3%A1bida_Bridge`,
      },
    ],
  },
});
