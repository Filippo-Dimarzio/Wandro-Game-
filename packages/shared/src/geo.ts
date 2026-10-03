const EARTH_RADIUS_M = 6371008.8;

export interface LatLng {
  lat: number;
  lng: number;
}

export function haversineMeters(a: LatLng, b: LatLng): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters / 10) * 10} m`;
  return `${(meters / 1000).toFixed(meters < 10000 ? 1 : 0)} km`;
}

/** Inside the geofence if the reported position is within the radius. Accuracy is validated separately. */
export function isWithinGeofence(position: LatLng, place: LatLng, radiusM: number): boolean {
  return haversineMeters(position, place) <= radiusM;
}
