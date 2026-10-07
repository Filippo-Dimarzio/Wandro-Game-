import { BASE_POINTS, DEFAULT_GEOFENCE_RADIUS_M } from './constants';
import { PLACE_DETAILS } from './details';
import { EUROPE_PLACES } from './europe-places';
import { PLACE_PHOTOS } from './place-photos';
import type { Category, OpeningSlot, Place } from './types';

function p(
  id: string,
  name: string,
  category: Category,
  lat: number,
  lng: number,
  uniqueVisitors: number,
  description: string,
  hours?: OpeningSlot[],
): Place {
  return {
    id,
    region: 'sintra',
    name,
    description,
    category,
    lat,
    lng,
    geofenceRadiusM: DEFAULT_GEOFENCE_RADIUS_M,
    basePoints: BASE_POINTS[category],
    uniqueVisitors,
    ...(hours && { hours }),
  };
}

/**
 * Demo data for running the app without a backend. Coordinates are approximate;
 * the real catalogue comes from the OSM importer (scripts/importer).
 */
const SINTRA_PLACES: Place[] = [
  p(
    'demo-pena',
    'Pena Palace',
    'heritage',
    38.7876,
    -9.3906,
    5000,
    'Colourful Romanticist palace on a hilltop above Sintra.',
  ),
  p(
    'demo-regaleira',
    'Quinta da Regaleira',
    'heritage',
    38.7967,
    -9.3958,
    3200,
    'Estate with gardens, grottoes and the famous initiation well.',
  ),
  p(
    'demo-mouros',
    'Castle of the Moors',
    'heritage',
    38.7917,
    -9.388,
    2800,
    'Medieval hilltop castle with walls that climb the ridge.',
  ),
  p(
    'demo-monserrate',
    'Monserrate Palace',
    'culture',
    38.7919,
    -9.4191,
    600,
    'Exotic palace surrounded by botanical gardens.',
  ),
  p(
    'demo-capuchos',
    'Convent of the Capuchos',
    'other',
    38.7777,
    -9.4469,
    120,
    'Tiny cork-lined convent hidden in the forest. Quest: find a cork-lined door, so low you have to bow.',
  ),
  p(
    'demo-seteais',
    'Seteais Palace Gardens',
    'culture',
    38.7938,
    -9.403,
    90,
    'Neoclassical arch with sweeping views of the coast.',
  ),
  p(
    'demo-cabo',
    'Cabo da Roca Viewpoint',
    'coast',
    38.7804,
    -9.4989,
    900,
    'The westernmost point of mainland Europe.',
  ),
  p(
    'demo-adraga',
    'Adraga Beach',
    'coast',
    38.8236,
    -9.4731,
    40,
    'Wild cove with rock arches and dramatic sunsets.',
  ),
  p(
    'demo-condessa',
    "Countess of Edla's Chalet",
    'culture',
    38.7845,
    -9.3917,
    15,
    'Alpine-style chalet in the Pena Park.',
  ),
  p(
    'demo-cruz-alta',
    'Cruz Alta Viewpoint',
    'nature',
    38.7861,
    -9.3897,
    8,
    'The highest point of the Sintra hills.',
  ),
  p(
    'demo-music',
    'Sintra Live Music Corner',
    'music_events',
    38.7985,
    -9.3875,
    0,
    'Small local venue with traditional fado nights.',
    [{ days: [4, 5, 6], open: '21:30', close: '00:30' }],
  ),
  p(
    'demo-praia-grande',
    'Praia Grande',
    'coast',
    38.816,
    -9.4785,
    260,
    'Surf beach where dinosaur footprints climb the cliff at the southern end.',
  ),
  p(
    'demo-azenhas',
    'Azenhas do Mar',
    'coast',
    38.8406,
    -9.4618,
    75,
    'White village tumbling down a cliff to a tide pool.',
  ),
];

function withPhoto(place: Place): Place {
  const photo = PLACE_PHOTOS[place.id];
  return photo
    ? {
        ...place,
        photoUrl: photo.url,
        photoCredit: photo.author,
        photoLicense: photo.license,
        photoSource: photo.source,
      }
    : place;
}

function withDetails(place: Place): Place {
  const details = PLACE_DETAILS[place.id];
  return details ? { ...place, details } : place;
}

export const DEMO_PLACES: Place[] = [...SINTRA_PLACES, ...EUROPE_PLACES]
  .map(withPhoto)
  .map(withDetails);
