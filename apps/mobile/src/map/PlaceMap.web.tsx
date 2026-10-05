import 'maplibre-gl/dist/maplibre-gl.css';
import * as maplibregl from 'maplibre-gl';
import type { GeoJSONSource, Map as MLMap, MapLayerMouseEvent } from 'maplibre-gl';
import { useEffect, useMemo, useRef } from 'react';
import { View } from 'react-native';
import { CATEGORIES } from '@wandro/shared';
import { shopItem, skinColor } from '@wandro/shared';
import { Asset } from 'expo-asset';
import { lightColors, useIsDark } from '@/theme';
import { ADVENTURE, hatchPattern } from './adventure';
import { MARKERS, markerName } from './markers';
import type { PlaceMapProps } from './types';
import { accuracyGeoJson, guidanceGeoJson, placesGeoJson, useFog } from './useFog';

export type { PlaceMapProps } from './types';

// Served from public/maplibre (see scripts/copy-maplibre-worker.mjs).
maplibregl.setWorkerUrl(
  `${process.env.EXPO_PUBLIC_BASE_URL ?? ''}/maplibre/maplibre-gl-worker.mjs`,
);

// Free OpenStreetMap raster tiles for the web and desktop apps (with attribution).
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
  // Adventure map: sepia tiles on old paper (see map/adventure.ts). Roads and labels stay legible.
  layers: [
    { id: 'paper', type: 'background', paint: { 'background-color': ADVENTURE.light.paper } },
    {
      id: 'osm',
      type: 'raster',
      source: 'osm',
      paint: {
        'raster-opacity': ADVENTURE.light.tiles.opacity,
        'raster-saturation': ADVENTURE.light.tiles.saturation,
        'raster-contrast': ADVENTURE.light.tiles.contrast,
      },
    },
  ],
};

// Spread pairs don't fit MapLibre's tuple types, hence the cast.
/** Loads the round category pins (see map/markers.ts); 84 px images shown at 42 pt. */
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
      if (!m.hasImage('hatch'))
        m.addImage('hatch', { width: 16, height: 16, data: hatchPattern(ADVENTURE.light) });
      m.addSource('fog', { type: 'geojson', data: d.fog });
      m.addLayer({
        id: 'fog',
        type: 'fill',
        source: 'fog',
        // Uncharted land: hatched parchment.
        paint: { 'fill-pattern': 'hatch', 'fill-opacity': 0.82 },
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
          'icon-image': [
            'concat',
            'marker-',
            ['get', 'category'],
            ['case', ['get', 'unlocked'], '', '-locked'],
          ],
          'icon-size': compact ? 0.45 : 1,
          'icon-allow-overlap': true,
          'icon-ignore-placement': true,
          // Discovered places sit on top of locked ones.
          'symbol-sort-key': ['case', ['get', 'unlocked'], 1, 0],
        },
      });
      loadMarkerImages(m);
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
      m.setPaintProperty('osm', 'raster-opacity', p.tiles.opacity);
      m.setPaintProperty('osm', 'raster-saturation', p.tiles.saturation);
      m.setPaintProperty('osm', 'raster-brightness-max', p.tiles.brightnessMax);
      const hatch = { width: 16, height: 16, data: hatchPattern(p) };
      if (m.hasImage('hatch')) m.updateImage('hatch', hatch);
      else m.addImage('hatch', hatch);
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
