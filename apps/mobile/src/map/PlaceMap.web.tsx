import 'maplibre-gl/dist/maplibre-gl.css';
import * as maplibregl from 'maplibre-gl';
import type { GeoJSONSource, Map as MLMap, MapLayerMouseEvent } from 'maplibre-gl';
import { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { lightColors } from '@/theme';
import type { PlaceMapProps } from './types';
import { placesGeoJson, useFog } from './useFog';

export type { PlaceMapProps } from './types';

// Served from public/maplibre (see scripts/copy-maplibre-worker.mjs).
maplibregl.setWorkerUrl('/maplibre/maplibre-gl-worker.mjs');

// Free OpenStreetMap raster tiles for the web preview (with attribution).
// Native builds use Mapbox (PlaceMap.native.tsx).
const STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
      maxzoom: 19,
    },
  },
  layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
};

const categoryColor: maplibregl.ExpressionSpecification = [
  'match',
  ['get', 'category'],
  'culture',
  lightColors.category.culture,
  'heritage',
  lightColors.category.heritage,
  'nature',
  lightColors.category.nature,
  'music_events',
  lightColors.category.music_events,
  lightColors.category.other,
];

export function PlaceMap({
  places,
  unlockedIds,
  userPosition,
  onSelect,
  compact,
  recenterSignal,
}: PlaceMapProps) {
  const container = useRef<HTMLDivElement | null>(null);
  const map = useRef<MLMap | null>(null);
  const ready = useRef(false);
  const fog = useFog(places, unlockedIds);
  const placesData = placesGeoJson(places, unlockedIds);
  const latest = useRef({ places, onSelect });
  latest.current = { places, onSelect };

  useEffect(() => {
    if (!container.current) return;
    const m = new maplibregl.Map({
      container: container.current,
      style: STYLE,
      center: [userPosition.lng, userPosition.lat],
      zoom: compact ? 11 : 13,
      interactive: !compact,
      attributionControl: { compact: true },
    });
    map.current = m;
    m.on('load', () => {
      m.addSource('fog', { type: 'geojson', data: fog });
      m.addLayer({
        id: 'fog',
        type: 'fill',
        source: 'fog',
        paint: { 'fill-color': '#ECE9E0', 'fill-opacity': 0.78 },
      });
      m.addSource('places', { type: 'geojson', data: placesData });
      m.addLayer({
        id: 'places',
        type: 'circle',
        source: 'places',
        paint: {
          'circle-radius': compact ? 5 : 10,
          'circle-color': ['case', ['get', 'unlocked'], categoryColor, lightColors.locked],
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2.5,
        },
      });
      m.addSource('me', {
        type: 'geojson',
        data: { type: 'Point', coordinates: [userPosition.lng, userPosition.lat] },
      });
      m.addLayer({
        id: 'me',
        type: 'circle',
        source: 'me',
        paint: {
          'circle-radius': 7,
          'circle-color': '#2B6CB0',
          'circle-stroke-color': '#fff',
          'circle-stroke-width': 3,
        },
      });
      m.on('click', 'places', (e: MapLayerMouseEvent) => {
        const id = e.features?.[0]?.properties?.id as string | undefined;
        const p = latest.current.places.find((x) => x.id === id);
        if (p) latest.current.onSelect?.(p);
      });
      m.on('mouseenter', 'places', () => (m.getCanvas().style.cursor = 'pointer'));
      m.on('mouseleave', 'places', () => (m.getCanvas().style.cursor = ''));
      ready.current = true;
    });
    return () => {
      ready.current = false;
      m.remove();
    };
    // Map is created once; data updates are pushed by the effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (ready.current) (map.current?.getSource('fog') as GeoJSONSource | undefined)?.setData(fog);
  }, [fog]);

  useEffect(() => {
    if (ready.current)
      (map.current?.getSource('places') as GeoJSONSource | undefined)?.setData(placesData);
  }, [placesData]);

  useEffect(() => {
    if (!ready.current) return;
    (map.current?.getSource('me') as GeoJSONSource | undefined)?.setData({
      type: 'Point',
      coordinates: [userPosition.lng, userPosition.lat],
    });
  }, [userPosition.lat, userPosition.lng]);

  useEffect(() => {
    if (recenterSignal)
      map.current?.flyTo({ center: [userPosition.lng, userPosition.lat], zoom: 15 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recenterSignal]);

  return (
    <View style={{ flex: 1 }}>
      <div ref={container} style={{ position: 'absolute', inset: 0 }} aria-label="Map of places" />
    </View>
  );
}
