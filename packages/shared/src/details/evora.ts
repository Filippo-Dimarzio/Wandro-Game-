import type { PlaceDetails } from '../types';
import { flagForReview } from './review';

const WIKI = 'https://en.wikipedia.org/wiki/';

/** Learn content for Évora, keyed by place id; each fact keeps the page it was checked against. */
export const EVORA_DETAILS: Record<string, PlaceDetails> = flagForReview({
  'demo-evora-divor': {
    teaser: 'A quiet Alentejo reservoir, rich in birdlife.',
    facts: [
      {
        text: 'It lies about 20 km north of Évora, little visited but rich in birds: herons, waders, birds of prey and larks.',
        source: 'https://birdingplaces.eu/birdingplaces/portugal/albufeira-do-divor',
      },
    ],
  },
  'demo-evora-monte-novo': {
    teaser: 'The lake that keeps Évora’s taps running.',
    facts: [
      {
        text: 'The dam, about 30 metres high, was finished in 1982 on the Degebe river.',
        source: 'https://cnpgb.apambiente.pt/gr_barragens/gbingles/FichasIng/MonteNovofichaIng.htm',
      },
      {
        text: 'Its reservoir holds about 15.3 million cubic metres of water for the city and for farming.',
        source: 'https://cnpgb.apambiente.pt/gr_barragens/gbingles/FichasIng/MonteNovofichaIng.htm',
      },
    ],
  },
  'demo-evora-portas-moura-fountain': {
    teaser: 'A Renaissance fountain topped with a marble globe.',
    facts: [
      {
        text: 'It was built in 1556; Cardinal Henrique called it one of the finest things in the city.',
        source: 'https://www.cm-evora.pt/en/locais/largo-da-porta-de-moura/',
      },
      {
        text: 'Its sphere may reflect the conquests of Portugal’s empire.',
        source: 'https://www.cm-evora.pt/en/locais/largo-da-porta-de-moura/',
      },
    ],
  },
  'demo-evora-giraldo-fountain': {
    teaser: 'The marble fountain at the heart of Évora’s main square.',
    facts: [
      {
        text: 'The Henriquina fountain dates from 1570. Its eight jets stand for the eight streets that meet here.',
        source: `${WIKI}%C3%89vora`,
      },
      {
        text: 'This square also saw many autos-da-fé during the Inquisition.',
        source: `${WIKI}%C3%89vora`,
      },
    ],
  },
  'demo-evora-valverde': {
    teaser: 'A Renaissance convent church in the countryside south of the city.',
    facts: [
      {
        text: 'Cardinal Henrique founded the convent in 1540.',
        source: 'https://arqm.cm-evora.pt/pt-afcme-edn-3343',
      },
      {
        text: 'Diogo de Torralva is credited with designing the church in 1544, though scholars debate who drew it.',
        source: 'https://www.infopedia.pt/artigos/$diogo-de-torralva',
      },
    ],
  },
  'demo-evora-jardim-publico': {
    teaser: 'A Romantic garden of fake ruins, labyrinths and peacocks.',
    facts: [
      {
        text: 'Work began in 1863 under the Italian Giuseppe Cinatti, an architect and stage designer.',
        source: 'https://www.cm-evora.pt/wp-content/uploads/2020/07/Poster-Jardim.pdf',
      },
      {
        text: 'He laid it out like stage sets; the “false ruins” are the best example. Peacocks often strut across them.',
        source: 'https://www.cm-evora.pt/wp-content/uploads/2020/07/Poster-Jardim.pdf',
      },
      {
        text: 'Next to them stands the Galeria das Damas, part of King Manuel’s old palace.',
        source: 'https://www.cm-evora.pt/wp-content/uploads/2020/07/Poster-Jardim.pdf',
      },
    ],
  },
  'demo-evora-alto-sao-bento': {
    teaser: 'Windmills on a granite hill with Évora spread out below.',
    facts: [
      {
        text: 'People lived on this granite hill in the Neolithic and Copper Ages.',
        source: 'https://www.visitalentejo.pt/en/alentejo/nature/transalentejo/evora/',
      },
      {
        text: 'Quarries on its slopes supplied stone to build Évora, probably from Roman times.',
        source: 'https://www.visitalentejo.pt/en/alentejo/nature/transalentejo/evora/',
      },
      {
        text: 'Four windmills stand here, from ruins to fully restored; one is a small museum.',
        source: 'https://www.visitalentejo.pt/en/alentejo/nature/transalentejo/evora/',
      },
    ],
  },
  'demo-evora-ecopista': {
    teaser: 'An old railway line turned into a path through the cork oaks.',
    facts: [
      {
        text: 'It follows the old Ramal de Mora railway, which ran 60 km from Évora to Mora.',
        source: `${WIKI}Ramal_de_Mora`,
      },
    ],
  },
  'demo-evora-mitra': {
    teaser: 'Cork and holm oak country, the classic Alentejo montado.',
    facts: [
      {
        text: 'The University of Évora runs research on the montado here, at its Mitra campus.',
        source: 'https://www.med.uevora.pt/?p=39568',
      },
      {
        text: 'The montado is a farmed savanna of cork and holm oaks, covering most of the Alentejo.',
        source: 'https://www.med.uevora.pt/?p=39568',
      },
    ],
  },
  'demo-evora-roman-temple': {
    teaser: 'Roman columns standing in the middle of the old town.',
    facts: [
      {
        text: 'It was most likely built in the 1st century, for the cult of Emperor Augustus.',
        source: `${WIKI}Roman_Temple_of_%C3%89vora`,
      },
      {
        text: 'It was used as a butcher’s shop from the 14th century until 1836, which helped it survive.',
        source: `${WIKI}Roman_Temple_of_%C3%89vora`,
      },
      {
        text: 'The “Temple of Diana” name comes from a 17th-century legend, not from archaeology.',
        source: `${WIKI}Roman_Temple_of_%C3%89vora`,
      },
    ],
  },
  'demo-evora-almendres': {
    teaser: 'Nearly a hundred standing stones on a hillside of cork oaks.',
    facts: [
      {
        text: 'Its first stones go back to the 6th millennium BC.',
        source: `${WIKI}Almendres_Cromlech`,
      },
      {
        text: 'Nearly 100 menhirs stand in two oval rings: the largest group of its kind in Iberia.',
        source: `${WIKI}Almendres_Cromlech`,
      },
      {
        text: 'Henrique Leonor Pina rediscovered it in 1966 while mapping the area’s geology.',
        source: `${WIKI}Almendres_Cromlech`,
      },
    ],
  },
  'demo-evora-zambujeiro': {
    teaser: 'A giant stone tomb, one of the biggest in Iberia.',
    facts: [
      {
        text: 'Its chamber is ringed by seven pillars about 8 metres high, reached by a 12-metre corridor.',
        source: `${WIKI}Great_Dolmen_of_Zambujeiro`,
      },
      {
        text: 'The roof slab, about 7 metres across, has broken and now rests on the burial mound.',
        source: `${WIKI}Great_Dolmen_of_Zambujeiro`,
      },
      {
        text: 'It has been a national monument since 1971.',
        source: `${WIKI}Great_Dolmen_of_Zambujeiro`,
      },
    ],
  },
  'demo-evora-dom-manuel': {
    teaser: 'The graceful gallery that is all that remains of a royal palace.',
    facts: [
      {
        text: 'Some chroniclers say Vasco da Gama was given command of his India fleet here, in 1497.',
        source: `${WIKI}Royal_Palace_of_%C3%89vora`,
      },
      {
        text: 'The Gallery of Dames is the only part of the palace still standing.',
        source: `${WIKI}Royal_Palace_of_%C3%89vora`,
      },
    ],
  },
  'demo-evora-aqueduct': {
    teaser: 'A Renaissance aqueduct striding into town, with homes between its arches.',
    facts: [
      {
        text: 'King John III ordered it in 1531–1532; the royal architect Francisco de Arruda directed the work.',
        source: `${WIKI}%C3%81gua_de_Prata_Aqueduct`,
      },
      {
        text: 'It carries water about 18 km from springs near Divor.',
        source: `${WIKI}%C3%81gua_de_Prata_Aqueduct`,
      },
      {
        text: 'Houses, shops and cafés were built between its arches, around Rua do Cano.',
        source: `${WIKI}%C3%81gua_de_Prata_Aqueduct`,
      },
    ],
  },
  'demo-evora-se': {
    teaser: 'A fortress-like Gothic cathedral with towers of different spires.',
    facts: [
      {
        text: 'It is the largest medieval cathedral in Portugal.',
        source: `${WIKI}Cathedral_of_%C3%89vora`,
      },
      {
        text: 'The first building went up from 1186; the Gothic cloister followed between 1317 and 1340.',
        source: `${WIKI}Cathedral_of_%C3%89vora`,
      },
      {
        text: 'Its two towers have different spires, one covered in medieval coloured tiles.',
        source: `${WIKI}Cathedral_of_%C3%89vora`,
      },
    ],
  },
  'demo-evora-cartuxa': {
    teaser: 'Vineyards around a monastery where silent monks lived.',
    facts: [
      {
        text: 'The winery is named after the Carthusian monastery (cartuxa) right next to it.',
        source: 'https://farehamwinecellar.co.uk/Products/wine/red/cartuxa-colheita-tinto-evora/',
      },
      {
        text: 'It belongs to the Eugénio de Almeida Foundation, set up in 1963 to support social and cultural life in the region.',
        source: 'https://farehamwinecellar.co.uk/Products/wine/red/cartuxa-colheita-tinto-evora/',
      },
    ],
  },
  'demo-evora-university': {
    teaser: 'A Jesuit college whose classrooms are lined with tiles.',
    facts: [
      {
        text: 'Cardinal Henry founded it in 1559, Portugal’s second university, and gave it to the Jesuits to run.',
        source: `${WIKI}University_of_%C3%89vora`,
      },
      {
        text: 'Cavalry surrounded it on 8 February 1759, when Pombal expelled the Jesuits. It reopened only in 1973.',
        source: `${WIKI}University_of_%C3%89vora`,
      },
      {
        text: 'The classroom tiles show scenes like “Aristotle teaching Alexander the Great”.',
        source: `${WIKI}University_of_%C3%89vora`,
      },
    ],
  },
  'demo-evora-museu-evora': {
    teaser: 'Évora’s treasure chest of paintings, sculpture and Roman finds.',
    facts: [
      {
        text: 'Founded in 1915, it holds more than 20,000 pieces.',
        source: `${WIKI}Frei_Manuel_do_Cen%C3%A1culo_National_Museum`,
      },
      {
        text: 'It is named after Frei Manuel do Cenáculo, an archbishop who opened his collection to the public.',
        source: `${WIKI}Frei_Manuel_do_Cen%C3%A1culo_National_Museum`,
      },
      {
        text: 'Look for the 13-panel altarpiece from the cathedral’s old high altar.',
        source: `${WIKI}Frei_Manuel_do_Cen%C3%A1culo_National_Museum`,
      },
    ],
  },
  'demo-evora-artesanato': {
    teaser: 'Alentejo crafts, from cork to clay, side by side with modern design.',
    facts: [
      {
        text: 'It opened in November 2011, built around the Paulo Parra collection of traditional Alentejo crafts.',
        source:
          'https://lifecooler.com/artigo/comer/made-museu-de-artesanato-e-design-de-vora/404527',
      },
    ],
  },
  'demo-evora-biblioteca': {
    teaser: 'A historic public library founded by a book-loving archbishop.',
    facts: [
      {
        text: 'Archbishop Frei Manuel do Cenáculo founded it in 1805, giving his own books and collections.',
        source: 'https://www.redalyc.org/pdf/635/63524088003.pdf',
      },
      {
        text: 'French troops looted it in 1808 and destroyed much of the collection.',
        source: 'https://www.redalyc.org/pdf/635/63524088003.pdf',
      },
    ],
  },
  'demo-evora-fea': {
    teaser: 'Contemporary art in the old palace of the Inquisition.',
    facts: [
      {
        text: 'The palace was the first in Portugal built to house the Inquisition, in 1536.',
        source: 'https://lifecooler.com/artigo/dormir/palcio-da-inquisio/325586',
      },
      {
        text: 'Its Casas Pintadas hold a rare example of mid-16th-century palace wall painting.',
        source: 'https://www.cm-evora.pt/en/locais/centro-de-arte-e-cultura/',
      },
    ],
  },
  'demo-evora-sao-bras': {
    teaser: 'A little chapel dressed up as a castle.',
    facts: [
      {
        text: 'It dates from about 1480, built on the grounds of a small leper hospital.',
        source:
          'https://www.lonelyplanet.com/portugal/central-portugal/evora/attractions/ermida-de-sao-bras/a/poi-sig/1541202/360364',
      },
      {
        text: 'Crenellations and round towers with conical tops make it look like a fortress.',
        source: 'https://www.infopedia.pt/artigos/$ermida-de-s.-bras-(evora)',
      },
      {
        text: 'Artillery fire badly damaged it during the Restoration wars in 1663.',
        source: 'https://www.infopedia.pt/artigos/$ermida-de-s.-bras-(evora)',
      },
    ],
  },
  'demo-evora-station-tiles': {
    teaser: 'A railway station decorated with tile pictures of the Alentejo.',
    facts: [
      {
        text: 'A long row of tile murals shows Évora’s buildings and the countryside: donkeys and old windmills.',
        source: 'https://www.komoot.com/highlight/6570057',
      },
    ],
  },
  'demo-evora-santa-clara': {
    teaser: 'A convent church lined with 17th-century tiles.',
    facts: [
      {
        text: 'The convent was founded between 1452 and 1459; its church and Renaissance cloister survive.',
        source: 'https://www.infopedia.pt/artigos/$mosteiro-de-santa-clara-(evora)',
      },
      {
        text: 'Inside, patterned 17th-century azulejos line the single nave.',
        source: 'https://www.infopedia.pt/artigos/$mosteiro-de-santa-clara-(evora)',
      },
    ],
  },
  'demo-evora-merces': {
    teaser: 'A small church with a tiled corner under its choir.',
    facts: [
      {
        text: 'A tile panel under the choir shows scenes from the life of the Virgin Mary.',
        source: 'https://arqm.cm-evora.pt/index.php/pt-afcme-dft-68-4346',
      },
    ],
  },
  'demo-evora-garcia-resende': {
    teaser: 'A jewel-box theatre with an Italian-style auditorium.',
    facts: [
      {
        text: 'It opened on 1 June 1892, after its promoter died during construction.',
        source: 'https://www.geocaching.com/geocache/GC9ZF50',
      },
      {
        text: 'It is part of the European Route of Historic Theatres.',
        source: 'https://www.cm-evora.pt/?p=36498',
      },
    ],
  },
  'demo-evora-sao-joao-fair': {
    teaser: 'Eleven days of rides, music and food stalls every June.',
    facts: [
      {
        text: 'The first fair was held on 24 June 1569, under a royal charter from King Sebastião.',
        source: 'https://www.theportugalnews.com/news/2025-06-18/centuries-old-fair-returns/98715',
      },
      {
        text: 'It takes over the Rossio de São Brás, outside the old walls; the tasquinhas (food stalls) are a must.',
        source: 'https://www.theportugalnews.com/news/2025-06-18/centuries-old-fair-returns/98715',
      },
    ],
  },
  'demo-evora-arena': {
    teaser: 'An old bullring that now hosts concerts and fairs.',
    facts: [
      {
        text: 'It opened on 19 May 1889, with King Luís and his court there.',
        source: 'https://www.cm-evora.pt/en/locais/arena-devora/',
      },
      {
        text: 'It held about 5,000 people; in 2007 it reopened as a multipurpose hall, the Arena d’Évora.',
        source: 'https://www.cm-evora.pt/en/locais/arena-devora/',
      },
    ],
  },
  'demo-evora-harmonia': {
    teaser: 'A 19th-century society for music, balls and theatre on the main square.',
    facts: [
      {
        text: 'It was founded in 1849, after the fighting between liberals and absolutists; its name stands for harmony between people.',
        source: 'https://arqm.cm-evora.pt/index.php/sociedade-harmonia-eborense-2',
      },
      {
        text: 'Music, balls, plays and lectures were part of its life from the start.',
        source: 'https://www.rdpc.uevora.pt/rdpc/handle/10174/27893',
      },
    ],
  },
  'demo-evora-soror-mariana': {
    teaser: 'A small auditorium in the historic centre.',
    facts: [
      {
        text: 'It seats just over 50 people and hosted alternative cinema sessions for years.',
        source:
          'https://www.rtp.pt/noticias/cultura/cinema-alternativo-suspenso-em-evora-por-falta-de-condicoes-do-espaco_n1723777',
      },
    ],
  },
  'demo-evora-bones': {
    teaser: 'A chapel whose walls are built from human bones.',
    facts: [
      {
        text: 'Franciscan friars lined it with the bones of an estimated 5,000 people from the city’s old cemeteries.',
        source: `${WIKI}Capela_dos_Ossos`,
      },
      {
        text: 'The words over the door read: “We bones, lying here bare, await yours.”',
        source: `${WIKI}Capela_dos_Ossos`,
      },
      {
        text: 'It is a small chapel beside the entrance of the Church of St Francis.',
        source: `${WIKI}Capela_dos_Ossos`,
      },
    ],
  },
  'demo-evora-mercado': {
    teaser: 'Évora’s market hall of cheese, sausages and Saturday farmers.',
    facts: [
      {
        text: 'The market moved here to Praça 1º de Maio in 1880, into a wrought-iron hall.',
        source: 'https://wetravelportugal.com/evora-portugal/',
      },
      {
        text: 'On Saturdays, farmers gather outside to sell their produce.',
        source: 'https://wetravelportugal.com/evora-portugal/',
      },
      {
        text: 'Queijo de Évora is a protected (PDO) cheese.',
        source: `${WIKI}List_of_Portuguese_food_and_drink_products_with_protected_status`,
      },
    ],
  },
  'demo-evora-rua-do-cano': {
    teaser: 'A lane where homes are tucked under the arches of the aqueduct.',
    facts: [
      {
        text: 'Houses, shops and cafés were built between the aqueduct’s arches here.',
        source: `${WIKI}%C3%81gua_de_Prata_Aqueduct`,
      },
      {
        text: 'The arches shrink as the ground rises, until the aqueduct disappears underground.',
        source: 'https://ourworldforyou.com/9-reasons-to-visit-evora-in-portugal/',
      },
    ],
  },
  'demo-evora-pao-de-rala': {
    teaser: 'Convent sweets made to the nuns’ old recipes.',
    facts: [
      {
        text: 'Pão de rala comes from the Convent of Santa Helena do Monte Calvário in Évora.',
        source: 'https://www.portugalthings.com/best-sweets-alentejo',
      },
      {
        text: 'It is made with sugar, almonds and egg yolks, and filled with sweet gila squash. Delicioso!',
        source: 'https://www.portugalthings.com/best-sweets-alentejo',
      },
    ],
  },
  'demo-evora-menhir': {
    teaser: 'A lone standing stone among the cork oaks.',
    facts: [
      {
        text: 'It is a single stone about 4 metres high, with faint carvings near the top.',
        source: 'https://www.lonelyplanet.com/pois/1531009',
      },
      {
        text: 'It stands about two and a half kilometres before the Almendres Cromlech.',
        source: 'https://www.lonelyplanet.com/pois/1531009',
      },
    ],
  },
  'demo-evora-sao-miguel': {
    teaser: 'A hidden courtyard on the hilltop where Évora’s castle once stood.',
    facts: [
      {
        text: 'The Counts of Basto palace here stands where a Moorish fortress once stood.',
        source: 'https://www.ancient-history-sites.com/?p=121975',
      },
      {
        text: 'King Ferdinand I stayed here on his visits to Évora; John I later gave it to Nuno Álvares Pereira.',
        source: 'https://www.ancient-history-sites.com/?p=121975',
      },
    ],
  },
  'demo-evora-cinco-quinas': {
    teaser: 'A five-sided tower from the old city walls.',
    facts: [
      {
        text: 'It is a pentagonal medieval tower, part of the Palace of the Dukes of Cadaval.',
        source: 'https://whichmuseum.com/museum/cadaval-palace-evora-46863',
      },
      {
        text: 'It has been a National Monument since 1920.',
        source: 'https://whichmuseum.com/museum/cadaval-palace-evora-46863',
      },
    ],
  },
  'demo-evora-quarta-feira': {
    teaser: 'A tiny tavern where the kitchen decides what you eat.',
    facts: [
      {
        text: 'There is no menu: you trust the house and go with the flow.',
        source: 'https://saltofportugal.com/2016/02/29/a-tavern-called-wednesday/',
      },
      {
        text: 'Its name comes from the owner’s home village in Beira Alta, called Quarta Feira (Wednesday).',
        source: 'https://saltofportugal.com/2016/02/29/a-tavern-called-wednesday/',
      },
    ],
  },
  'demo-evora-scala-coeli': {
    teaser: 'A Carthusian monastery where monks kept silence for centuries.',
    facts: [
      {
        text: 'Archbishop Teotónio de Bragança had it built for Carthusian monks between 1587 and 1598.',
        source: 'https://www.fea.pt/fileadmin/user_upload/BROCHURA_saudades.pdf',
      },
      {
        text: 'Its bells have marked the hours of prayer since 1598.',
        source: 'https://www.fea.pt/fileadmin/user_upload/BROCHURA_saudades.pdf',
      },
    ],
  },
  'demo-evora-judiaria': {
    teaser: 'Quiet lanes of the city’s old Jewish quarter.',
    facts: [
      {
        text: 'Évora was home to one of Portugal’s important Jewish communities in the 15th century.',
        source: `${WIKI}History_of_the_Jews_in_Portugal`,
      },
      {
        text: 'In 1496 King Manuel I ordered Jews to leave; in 1497 this became forced conversion.',
        source: `${WIKI}History_of_the_Jews_in_Portugal`,
      },
    ],
  },
  'demo-evora-arco-isabel': {
    teaser: 'A Roman city gate still in daily use.',
    facts: [
      {
        text: 'It was built in the late 2nd or early 3rd century, when Évora was Ebora Liberalitas Julia.',
        source: 'https://www.ancient-history-sites.com/sites/roman-arch-of-dona-isabel/',
      },
      {
        text: 'Its granite blocks were laid without mortar.',
        source: 'https://www.ancient-history-sites.com/sites/roman-arch-of-dona-isabel/',
      },
      {
        text: 'It is named after Queen Isabel, wife of King Denis I.',
        source: 'https://www.ancient-history-sites.com/sites/roman-arch-of-dona-isabel/',
      },
    ],
  },
  'demo-evora-graca': {
    teaser: 'A church front guarded by four stone giants.',
    facts: [
      {
        text: 'Work on the convent began in 1524; it is called the city’s first Renaissance monument.',
        source: 'https://www.geocaching.com/geocache/GC6XBFR',
      },
      {
        text: 'Above each group of giants is a stone sphere with a flame.',
        source:
          'https://www.frommers.com/destinations/evora/attractions/igreja-de-nossa-senhora-de-graa',
      },
      {
        text: 'For centuries locals have called the giants the “Meninos da Graça”, the Graça boys.',
        source: 'https://expatinportugal.substack.com/p/the-stuff-of-legend',
      },
    ],
  },
});
