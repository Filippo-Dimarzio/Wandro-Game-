import 'maplibre-gl/dist/maplibre-gl.css';
import * as maplibregl from 'maplibre-gl';
import type { GeoJSONSource, Map as MLMap, MapLayerMouseEvent } from 'maplibre-gl';
import { useEffect, useMemo, useRef } from 'react';
import { View } from 'react-native';
import { CATEGORIES } from '@wandro/shared';
import { shopItem, skinColor } from '@wandro/shared';
import { Asset } from 'expo-asset';
import { lightColors, useIsDark } from '@/theme';
import { ADVENTURE, LABEL } from './adventure';
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

// A clean, colourful street map (CARTO Voyager, built on OpenStreetMap data, with attribution) for
// the web and desktop apps. Native builds use Mapbox (PlaceMap.native.tsx).
const STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    streets: {
      type: 'raster',
      tiles: ['a', 'b', 'c', 'd'].map(
        (s) => `https://${s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png`,
      ),
      tileSize: 256,
      attribution: '© OpenStreetMap contributors © CARTO',
      maxzoom: 20,
    },
  },
  layers: [
    { id: 'paper', type: 'background', paint: { 'background-color': ADVENTURE.light.paper } },
    {
      id: 'streets',
      type: 'raster',
      source: 'streets',
      paint: {
        'raster-saturation': ADVENTURE.light.tiles.saturation,
        'raster-contrast': ADVENTURE.light.tiles.contrast,
      },
    },
  ],
};

/** Draws a place's name as a little white label (no font server needed for map text). */
function labelImage(name: string) {
  const c = document.createElement('canvas');
  const g = c.getContext('2d')!;
  g.font = LABEL.font;
  const text = name.length > 26 ? `${name.slice(0, 25)}…` : name;
  const w = Math.ceil(g.measureText(text).width) + LABEL.padX * 2;
  c.width = w;
  c.height = LABEL.height;
  g.font = LABEL.font;
  g.fillStyle = 'rgba(255,255,255,0.94)';
  g.strokeStyle = 'rgba(26,34,56,0.25)';
  g.lineWidth = 2;
  g.beginPath();
  g.roundRect(1, 1, w - 2, LABEL.height - 2, 12);
  g.fill();
  g.stroke();
  g.fillStyle = '#1A2238';
  g.textBaseline = 'middle';
  g.fillText(text, LABEL.padX, LABEL.height / 2 + 1);
  return g.getImageData(0, 0, w, LABEL.height);
}

// Spread pairs don't fit MapLibre's tuple types, hence the cast.
/** Loads the category pins and landmark badges (see map/markers.ts), drawn at pixel ratio 2. */
function loadMarkerImages(m: MLMap) {
  for (const cat of CATEGORIES)
    for (const locked of [false, true]) {
      const name = markerName(cat, locked);
      const uri = Asset.fromModule(locked ? MARKERS[cat].locked : MARKERS[cat].found).uri;
      m.loadImage(uri)
        .then(({ data }) => {
          if (!m.hasImage(name)) m.addImage(name, data, { pixelRatio: 2 });
        })
        .catch(() => undefined);
    }
  for (const [city, art] of Object.entries(LANDMARK_MARKERS))
    for (const locked of [false, true]) {
      const name = landmarkName(city, locked);
      m.loadImage(Asset.fromModule(locked ? art.locked : art.found).uri)
        .then(({ data }) => {
          if (!m.hasImage(name)) m.addImage(name, data, { pixelRatio: 2 });
        })
        .catch(() => undefined);
    }
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
      // Names under the pins, like a tourist map; ones that would overlap are left out.
      m.addLayer({
        id: 'place-labels',
        type: 'symbol',
        source: 'places',
        minzoom: compact ? 24 : 12.5,
        layout: {
          'icon-image': ['concat', 'label-', ['get', 'id']],
          'icon-anchor': 'top',
          'icon-offset': [0, 2],
          'icon-padding': 2,
          'symbol-sort-key': PIN_SORT as maplibregl.ExpressionSpecification,
        },
      });
      m.on('styleimagemissing', (e: { id: string }) => {
        if (!e.id.startsWith('label-') || m.hasImage(e.id)) return;
        const p = latest.current.places.find((x) => `label-${x.id}` === e.id);
        if (p) m.addImage(e.id, labelImage(p.name), { pixelRatio: 2 });
      });
      loadMarkerImages(m);
      m.on('click', 'place-labels', (e: MapLayerMouseEvent) => {
        const id = e.features?.[0]?.properties?.id as string | undefined;
        const p = latest.current.places.find((x) => x.id === id);
        if (p) latest.current.onSelect?.(p);
      });
      m.on('click', 'places', (e: MapLayerMouseEvent) => {
        const id = e.features?.[0]?.properties?.id as string | undefined;
        const p = latest.current.places.find((x) => x.id === id);
        if (p) latest.current.onSelect?.(p);
      });
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

  // The same chart by lamplight in dark mode.
  const dark = useIsDark();
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    const apply = () => {
      const p = dark ? ADVENTURE.dark : ADVENTURE.light;
      m.setPaintProperty('paper', 'background-color', p.paper);
      m.setPaintProperty('streets', 'raster-saturation', p.tiles.saturation);
      m.setPaintProperty('streets', 'raster-brightness-max', p.tiles.brightnessMax);
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
