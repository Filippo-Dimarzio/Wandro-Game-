// Fallback map used where no real map engine is available (Expo Go, tests).
// Platform builds use PlaceMap.web.tsx (MapLibre) or PlaceMap.native.tsx (Mapbox).
export { FallbackMap as PlaceMap } from './FallbackMap';
export type { PlaceMapProps } from './types';
