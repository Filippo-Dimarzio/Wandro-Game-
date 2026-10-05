import 'maplibre-gl/dist/maplibre-gl.css';
import * as maplibregl from 'maplibre-gl';
import type { GeoJSONSource, Map as MLMap, MapLayerMouseEvent } from 'maplibre-gl';
import { useEffect, useMemo, useRef } from 'react';
import { View } from 'react-native';
import { CATEGORIES } from '@wandro/shared';
import { shopItem, skinColor } from '@wandro/shared';
import { Asset } from 'expo-asset';
import { lightColors, useIsDark } from '@/theme';
import { ADVENTURE } from './adventure';
import {
  BASE_SOURCE,
  STORYBOOK,
  STORYBOOK_HOST,
  storybookPaint,
  storybookStyle,
} from './storybook';
import {
  LANDMARK_MARKERS,
  landmarkName,
  MARKERS,
  markerName,
  PIN_IMAGE,
  PIN_SORT,
} from './markers';
import type { PlaceMapProps } from './types';
import { accuracyGeoJson, guidanceGeoJson, placesGeoJson, useFog } from './useFog';

export type { PlaceMapProps } from './types';

// Served from public/maplibre (see scripts/copy-maplibre-worker.mjs).
maplibregl.setWorkerUrl(
  `${process.env.EXPO_PUBLIC_BASE_URL ?? ''}/maplibre/maplibre-gl-worker.mjs`,
);

// The storybook map (map/storybook.ts) from OpenFreeMap vector tiles, same as the native apps.
// The cast bridges our loose JSON style to MapLibre's StyleSpecification.
const STYLE = storybookStyle(STORYBOOK.light) as unknown as maplibregl.StyleSpecification;

/** Plain OpenStreetMap raster tiles on the storybook ground, for when the storybook source is down. */
const FALLBACK_STYLE: maplibregl.StyleSpecification = {
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
  layers: [
    { id: 'paper', type: 'background', paint: { 'background-color': ADVENTURE.light.paper } },
    {
      id: 'osm',
      type: 'raster',
      source: 'osm',
      paint: {
        'raster-saturation': ADVENTURE.light.tiles.saturation,
        'raster-contrast': ADVENTURE.light.tiles.contrast,
      },
    },
  ],
};

/** If the vector tiles can't load, fall back to plain OpenStreetMap raster tiles under the game layers. */
function addRasterFallback(m: MLMap) {
  if (m.getSource('osm')) return;
  m.addSource('osm', {
    type: 'raster',
    tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
    tileSize: 256,
    attribution: '© OpenStreetMap contributors',
    maxzoom: 19,
  });
  const p = ADVENTURE.light.tiles;
  m.addLayer(
    {
      id: 'osm',
      type: 'raster',
      source: 'osm',
      paint: { 'raster-saturation': p.saturation, 'raster-contrast': p.contrast },
    },
    m.getLayer('fog') ? 'fog' : undefined,
  );
}

/** Loads the category pins and landmark badges (see map/markers.ts), drawn at pixel ratio 2. */
function loadMarkerImages(m: MLMap) {
  const load = (name: string, module: number) =>
    m
      .loadImage(Asset.fromModule(module).uri)
      .then(({ data }) => {
        if (!m.hasImage(name)) m.addImage(name, data, { pixelRatio: 2 });
      })
      .catch(() => undefined);
  for (const cat of CATEGORIES)
    for (const locked of [false, true])
      load(markerName(cat, locked), locked ? MARKERS[cat].locked : MARKERS[cat].found);
  for (const [city, art] of Object.entries(LANDMARK_MARKERS))
    for (const locked of [false, true])
      load(landmarkName(city, locked), locked ? art.locked : art.found);
}

// Find-My-style pulse and incense glow for the octopus marker.
const MARKER_CSS = `
.wandro-me { position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; pointer-events: none; }
.wandro-me .pulse { position: absolute; width: 44px; height: 44px; border-radius: 50%; background: rgba(43,108,176,.35); animation: wandro-pulse 2s ease-out infinite; }
.wandro-me .glow { position: absolute; width: 96px; height: 96px; border-radius: 50%; background: radial-gradient(circle, rgba(246,173,85,.75), rgba(246,173,85,0) 70%); animation: wandro-glow 1.8s ease-in-out infinite; }
.wandro-me .body { position: relative; width: 36px; height: 36px; border-radius: 50%; border: 3px solid #fff; box-shadow: 0 2px 6px rgba(0,0,0,.35); display: flex; align-items: center; justify-content: center; font-size: 22px; line-height: 1; }
.wandro-me .hat { position: absolute; top: -14px; font-size: 18px; line-height: 1; }
@keyframes wandro-pulse { 0% { transform: scale(.6); opacity: .9 } 100% { transform: scale(2.2); opacity: 0 } }
@keyframes wandro-glow { 0%,100% { transform: scale(.85); opacity: .7 } 50% { transform: scale(1.1); opacity: 1 } }
@media (prefers-reduced-motion: reduce) { .wandro-me .pulse, .wandro-me .glow { animation: none } }
`;

function ensureMarkerCss() {
  if (document.getElementById('wandro-marker-css')) return;
  const style = document.createElement('style');
  style.id = 'wandro-marker-css';
  style.textContent = MARKER_CSS;
  document.head.appendChild(style);
}

function markerHtml(skin: string | undefined, hat: string | undefined, glow: boolean): string {
  const hatEmoji = shopItem(hat)?.emoji;
  return `${glow ? '<div class="glow"></div>' : ''}<div class="pulse"></div><div class="body" style="background:${skinColor(skin)}">🐙</div>${hatEmoji ? `<div class="hat">${hatEmoji}</div>` : ''}`;
}

function setSourceData(m: MLMap | null, ready: boolean, id: string, data: GeoJSON.GeoJSON) {
  if (ready) (m?.getSource(id) as GeoJSONSource | undefined)?.setData(data);
}

export function PlaceMap({
  places,
  unlockedIds,
  userPosition,
  onSelect,
  compact,
  recenterSignal,
  focus,
  onLongPress,
  accuracyM,
  target,
  trail = false,
  avatar,
  follow,
}: PlaceMapProps) {
  const container = useRef<HTMLDivElement | null>(null);
  const map = useRef<MLMap | null>(null);
  const marker = useRef<maplibregl.Marker | null>(null);
  const ready = useRef(false);
  const fog = useFog(places, unlockedIds);
  const placesData = useMemo(() => placesGeoJson(places, unlockedIds), [places, unlockedIds]);
  const accuracy = useMemo(
    () => accuracyGeoJson(userPosition, accuracyM),
    [userPosition, accuracyM],
  );
  const guidance = useMemo(
    () => guidanceGeoJson(userPosition, target, trail),
    [userPosition, target, trail],
  );
  const latest = useRef({ places, onSelect, onLongPress, fog, placesData, accuracy, guidance });
  latest.current = { places, onSelect, onLongPress, fog, placesData, accuracy, guidance };

  useEffect(() => {
    if (!container.current) return;
    ensureMarkerCss();
    const m = new maplibregl.Map({
      container: container.current,
      style: STYLE,
      center: [userPosition.lng, userPosition.lat],
      zoom: compact ? 11 : 14,
      interactive: !compact,
      attributionControl: { compact: true },
    });
    map.current = m;
    const el = document.createElement('div');
    el.className = 'wandro-me';
    el.setAttribute('aria-label', 'You');
    marker.current = new maplibregl.Marker({ element: el })
      .setLngLat([userPosition.lng, userPosition.lat])
      .addTo(m);

    // Tile errors on the storybook source (e.g. the tile host is down): switch to OSM raster.
    // If the storybook source can't even be reached, the style never finishes loading and the
    // game layers would never appear: swap to the plain raster style instead (also after 8 s).
    let fellBack = false;
    const fallBack = () => {
      if (fellBack || ready.current) return;
      fellBack = true;
      m.setStyle(FALLBACK_STYLE);
    };
    const slow = setTimeout(fallBack, 8000);
    m.on('error', (e) => {
      // Tile errors carry the failing source's id (not in MapLibre's ErrorEvent type).
      // Before the style has loaded, the only thing being fetched is the storybook source itself.
      if (!m.isStyleLoaded()) return fallBack();
      const { sourceId, error } = e as { sourceId?: string; error?: { url?: string } };
      if (sourceId === BASE_SOURCE || error?.url?.includes(STORYBOOK_HOST)) addRasterFallback(m);
    });

    m.on('load', () => {
      const d = latest.current;
      m.addSource('fog', { type: 'geojson', data: d.fog });
      m.addLayer({
        id: 'fog',
        type: 'fill',
        source: 'fog',
        // A light mist over unexplored ground: it never hides a place or its name.
        paint: { 'fill-color': ADVENTURE.light.fog, 'fill-opacity': ADVENTURE.light.fogOpacity },
      });
      m.addSource('accuracy', { type: 'geojson', data: d.accuracy });
      m.addLayer({
        id: 'accuracy',
        type: 'fill',
        source: 'accuracy',
        paint: { 'fill-color': lightColors.me, 'fill-opacity': 0.12 },
      });
      m.addLayer({
        id: 'accuracy-edge',
        type: 'line',
        source: 'accuracy',
        paint: { 'line-color': lightColors.me, 'line-opacity': 0.45, 'line-width': 1.5 },
      });
      m.addSource('target-ring', { type: 'geojson', data: d.guidance.ring });
      m.addLayer({
        id: 'target-ring',
        type: 'line',
        source: 'target-ring',
        paint: { 'line-color': lightColors.gold, 'line-width': 3, 'line-dasharray': [2, 1.5] },
      });
      m.addSource('trail', { type: 'geojson', data: d.guidance.line });
      m.addLayer({
        id: 'trail-glow',
        type: 'line',
        source: 'trail',
        paint: { 'line-color': '#F6AD55', 'line-width': 10, 'line-opacity': 0.35, 'line-blur': 4 },
      });
      m.addLayer({
        id: 'trail',
        type: 'line',
        source: 'trail',
        layout: { 'line-cap': 'round' },
        paint: { 'line-color': '#DD6B20', 'line-width': 4, 'line-dasharray': [0.5, 2] },
      });
      m.addSource('places', { type: 'geojson', data: d.placesData });
      m.addLayer({
        id: 'places',
        type: 'symbol',
        source: 'places',
        layout: {
          // Spread pairs don't fit MapLibre's expression types, hence the casts.
          'icon-image': PIN_IMAGE as maplibregl.ExpressionSpecification,
          'icon-anchor': 'bottom',
          'icon-size': compact ? 0.5 : 1,
          'icon-allow-overlap': true,
          'icon-ignore-placement': true,
          'symbol-sort-key': PIN_SORT as maplibregl.ExpressionSpecification,
        },
      });
      loadMarkerImages(m);
      const select = (e: MapLayerMouseEvent) => {
        const id = e.features?.[0]?.properties?.id as string | undefined;
        const p = latest.current.places.find((x) => x.id === id);
        if (p) latest.current.onSelect?.(p);
      };
      m.on('click', 'places', select);
      m.on('contextmenu', (e) =>
        latest.current.onLongPress?.({ lat: e.lngLat.lat, lng: e.lngLat.lng }),
      );
      m.on('mouseenter', 'places', () => (m.getCanvas().style.cursor = 'pointer'));
      m.on('mouseleave', 'places', () => (m.getCanvas().style.cursor = ''));
      ready.current = true;
    });

    // Marching-ants animation on the incense trail.
    let frame = 0;
    let step = 0;
    const dashes: [number, number, number][] = [
      [0, 0.5, 2],
      [0.5, 0.5, 1.5],
      [1, 0.5, 1],
      [1.5, 0.5, 0.5],
    ];
    const animate = () => {
      step = (step + 1) % (dashes.length * 8);
      if (ready.current && step % 8 === 0 && m.getLayer('trail')) {
        m.setPaintProperty('trail', 'line-dasharray', dashes[step / 8]);
      }
      frame = requestAnimationFrame(animate);
    };
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (!reduceMotion) frame = requestAnimationFrame(animate);

    return () => {
      clearTimeout(slow);
      cancelAnimationFrame(frame);
      ready.current = false;
      marker.current?.remove();
      m.remove();
    };
    // Map is created once; data updates are pushed by the effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => setSourceData(map.current, ready.current, 'fog', fog), [fog]);
  useEffect(() => setSourceData(map.current, ready.current, 'places', placesData), [placesData]);
  useEffect(() => setSourceData(map.current, ready.current, 'accuracy', accuracy), [accuracy]);
  useEffect(() => {
    setSourceData(map.current, ready.current, 'target-ring', guidance.ring);
    setSourceData(map.current, ready.current, 'trail', guidance.line);
  }, [guidance]);

  useEffect(() => {
    marker.current?.setLngLat([userPosition.lng, userPosition.lat]);
    if (follow)
      map.current?.easeTo({ center: [userPosition.lng, userPosition.lat], duration: 250 });
  }, [userPosition.lat, userPosition.lng, follow]);

  useEffect(() => {
    const el = marker.current?.getElement();
    if (el) el.innerHTML = markerHtml(avatar?.skin, avatar?.hat, trail);
  }, [avatar?.skin, avatar?.hat, trail]);

  // The night palette in dark mode.
  const dark = useIsDark();
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    const apply = () => {
      const p = dark ? ADVENTURE.dark : ADVENTURE.light;
      for (const [layer, prop, value] of storybookPaint(dark ? STORYBOOK.dark : STORYBOOK.light))
        // Our layer table is loosely typed; MapLibre wants its own property keys.
        if (m.getLayer(layer)) m.setPaintProperty(layer, prop as 'fill-color', value);
      if (m.getLayer('osm')) {
        m.setPaintProperty('osm', 'raster-saturation', p.tiles.saturation);
        m.setPaintProperty('osm', 'raster-brightness-max', p.tiles.brightnessMax);
      }
      if (m.getLayer('fog')) {
        m.setPaintProperty('fog', 'fill-color', p.fog);
        m.setPaintProperty('fog', 'fill-opacity', p.fogOpacity);
      }
    };
    if (m.isStyleLoaded()) apply();
    else m.once('load', apply);
  }, [dark]);

  useEffect(() => {
    if (focus) map.current?.flyTo({ center: [focus.lng, focus.lat], zoom: 13, duration: 1500 });
  }, [focus?.lat, focus?.lng]); // eslint-disable-line react-hooks/exhaustive-deps

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
