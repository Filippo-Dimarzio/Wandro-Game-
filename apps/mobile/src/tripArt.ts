import type { ImageSource } from 'expo-image';
import type { TripMode } from '@wandro/shared';

/* eslint-disable @typescript-eslint/no-require-imports -- static asset requires for Metro */
/**
 * Cut-paper artwork for the arrival screen, drawn by scripts/render-trip.mjs. Each scene is a
 * 1000 x 620 landscape; the numbers below are where things sit in it, as fractions of its size,
 * so the vehicle stays on the rails or road at any screen width.
 */
export const SCENE_RATIO = 620 / 1000;

export const TRIP_SCENE: Record<
  TripMode,
  { src: ImageSource; ground: number; cityBase: number; dot: string }
> = {
  // ground: where the vehicle's wheels sit; cityBase: where each city's landmark stands.
  train: { src: require('../assets/trip/scene-train.webp'), ground: 0.8, cityBase: 0.785, dot: '' },
  bus: { src: require('../assets/trip/scene-bus.webp'), ground: 0.835, cityBase: 0.775, dot: '' },
  plane: {
    src: require('../assets/trip/scene-plane.webp'),
    ground: 0,
    cityBase: 0.93,
    dot: '#FBF4E4',
  },
};

/** Vehicles face right; width is a fraction of the scene's width, ratio is width / height. */
export const TRIP_VEHICLE: Record<TripMode, { src: ImageSource; width: number; ratio: number }> = {
  train: { src: require('../assets/trip/vehicle-train.webp'), width: 0.38, ratio: 700 / 200 },
  bus: { src: require('../assets/trip/vehicle-coach.webp'), width: 0.25, ratio: 420 / 170 },
  plane: { src: require('../assets/trip/vehicle-plane.webp'), width: 0.2, ratio: 360 / 180 },
};

/** Each launch city's landmark, standing at either end of the trip. */
const CITIES: Record<string, ImageSource> = {
  sintra: require('../assets/trip/city-sintra.webp'),
  lisbon: require('../assets/trip/city-lisbon.webp'),
  porto: require('../assets/trip/city-porto.webp'),
  evora: require('../assets/trip/city-evora.webp'),
  aveiro: require('../assets/trip/city-aveiro.webp'),
  algarve: require('../assets/trip/city-algarve.webp'),
};
/* eslint-enable @typescript-eslint/no-require-imports */

export const tripCity = (slug: string): ImageSource => CITIES[slug] ?? CITIES.lisbon!;
