import type { LatLng } from './geo';

type Ring = [number, number][];

export interface FogHole extends LatLng {
  radiusM: number;
}

/** A closed ring approximating a circle (counter-clockwise when used as a hole: reversed). */
export function circleRing(center: LatLng, radiusM: number, steps = 48): Ring {
  const ring: Ring = [];
  const dLat = radiusM / 111_320;
  const dLng = radiusM / (111_320 * Math.cos((center.lat * Math.PI) / 180));
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * 2 * Math.PI;
    ring.push([center.lng + dLng * Math.cos(a), center.lat + dLat * Math.sin(a)]);
  }
  ring[steps] = ring[0];
  return ring;
}

/**
 * GeoJSON polygon covering the world, with a hole cleared around each unlocked place.
 * Holes are clockwise (opposite of the outer ring) per the GeoJSON right-hand rule.
 */
export function fogPolygon(holes: FogHole[]) {
  const outer: Ring = [
    [-180, -85],
    [180, -85],
    [180, 85],
    [-180, 85],
    [-180, -85],
  ];
  return {
    type: 'Feature' as const,
    properties: {},
    geometry: {
      type: 'Polygon' as const,
      coordinates: [outer, ...holes.map((h) => circleRing(h, h.radiusM).reverse())],
    },
  };
}

/** Radius cleared around an unlocked place; generous so the area feels discovered. */
export const FOG_CLEAR_RADIUS_M = 350;
