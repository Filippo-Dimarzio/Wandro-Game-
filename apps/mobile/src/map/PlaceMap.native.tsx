import Constants, { ExecutionEnvironment } from 'expo-constants';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ExplorerAvatar } from '@/components/ExplorerAvatar';
import { env } from '@/lib/env';
import { CATEGORIES } from '@wandro/shared';
import { lightColors, useIsDark } from '@/theme';
import { ADVENTURE } from './adventure';
import { STORYBOOK, storybookStyle } from './storybook';
import { FallbackMap } from './FallbackMap';
import {
  LANDMARK_MARKERS,
  landmarkName,
  MARKERS,
  markerName,
  PIN_IMAGE,
  PIN_SORT,
} from './markers';
import type { PlaceMapProps } from './types';

// 84 px pins at scale 2 (42 pt on screen).
const MARKER_IMAGES = Object.fromEntries([
  ...CATEGORIES.flatMap((cat) => [
    [markerName(cat, false), { image: MARKERS[cat].found, scale: 2 }],
    [markerName(cat, true), { image: MARKERS[cat].locked, scale: 2 }],
  ]),
  ...Object.entries(LANDMARK_MARKERS).flatMap(([city, art]) => [
    [landmarkName(city, false), { image: art.found, scale: 2 }],
    [landmarkName(city, true), { image: art.locked, scale: 2 }],
  ]),
]);
import { accuracyGeoJson, guidanceGeoJson, placesGeoJson, useFog } from './useFog';

export type { PlaceMapProps } from './types';

// The Mapbox native module is missing in Expo Go, so load it lazily.
const canUseMapbox =
  Constants.executionEnvironment !== ExecutionEnvironment.StoreClient && env.mapboxToken.length > 0;
const Mapbox: typeof import('@rnmapbox/maps') | null = canUseMapbox
  ? // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('@rnmapbox/maps')
  : null;
Mapbox?.default.setAccessToken(env.mapboxToken);

export function PlaceMap(props: PlaceMapProps) {
  if (!Mapbox) return <FallbackMap {...props} />;
  return <MapboxPlaceMap {...props} mb={Mapbox} />;
}

function MapboxPlaceMap({
  places,
  unlockedIds,
  userPosition,
  onSelect,
  compact,
  recenterSignal,
  onLongPress,
  accuracyM,
  target,
  trail = false,
  avatar,
  follow,
  focus,
  mb,
}: PlaceMapProps & { mb: typeof import('@rnmapbox/maps') }) {
  const {
    MapView,
    Camera,
    ShapeSource,
    FillLayer,
    LineLayer,
    SymbolLayer,
    Images,
    MarkerView,
    StyleURL,
  } = mb;
  const camera = useRef<import('@rnmapbox/maps').Camera>(null);
  const fog = useFog(places, unlockedIds);
  const dark = useIsDark();
  const chart = dark ? ADVENTURE.dark : ADVENTURE.light;
  // The storybook map (same style as the web); Mapbox's own style if its tiles fail to load.
  const [fallback, setFallback] = useState(false);
  const styleJSON = useMemo(
    () => JSON.stringify(storybookStyle(dark ? STORYBOOK.dark : STORYBOOK.light)),
    [dark],
  );
  const accuracy = useMemo(
    () => accuracyGeoJson(userPosition, accuracyM),
    [userPosition, accuracyM],
  );
  const guidance = useMemo(
    () => guidanceGeoJson(userPosition, target, trail),
    [userPosition, target, trail],
  );

  useEffect(() => {
    if (follow)
      camera.current?.setCamera({
        centerCoordinate: [userPosition.lng, userPosition.lat],
        animationDuration: 250,
      });
  }, [follow, userPosition.lat, userPosition.lng]);

  useEffect(() => {
    if (focus)
      camera.current?.setCamera({
        centerCoordinate: [focus.lng, focus.lat],
        zoomLevel: 13,
        animationDuration: 1200,
      });
  }, [focus?.lat, focus?.lng]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (recenterSignal)
      camera.current?.setCamera({
        centerCoordinate: [userPosition.lng, userPosition.lat],
        zoomLevel: 15,
        animationDuration: 800,
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recenterSignal]);

  return (
    <MapView
      style={{ flex: 1 }}
      {...(fallback ? { styleURL: StyleURL.Outdoors } : { styleJSON })}
      onMapLoadingError={() => setFallback(true)}
      scrollEnabled={!compact}
      zoomEnabled={!compact}
      rotateEnabled={false}
      pitchEnabled={false}
      scaleBarEnabled={false}
      accessibilityLabel="Map of places"
      onLongPress={(f) => {
        const [lng, lat] = (f.geometry as GeoJSON.Point).coordinates;
        onLongPress?.({ lat, lng });
      }}
    >
      <Camera
        ref={camera}
        defaultSettings={{
          centerCoordinate: [userPosition.lng, userPosition.lat],
          zoomLevel: compact ? 11 : 13,
        }}
      />
      <ShapeSource id="fog" shape={fog}>
        <FillLayer id="fog-fill" style={{ fillColor: chart.fog, fillOpacity: chart.fogOpacity }} />
      </ShapeSource>
      <Images images={MARKER_IMAGES} />
      <ShapeSource
        id="places"
        shape={placesGeoJson(places, unlockedIds)}
        onPress={(e) => {
          const id = e.features[0]?.properties?.id as string | undefined;
          const p = places.find((x) => x.id === id);
          if (p) onSelect?.(p);
        }}
      >
        <SymbolLayer
          id="places-pins"
          style={{
            // Expression arrays don't fit the style prop's types, hence the casts.
            iconImage: PIN_IMAGE as unknown as string,
            iconAnchor: 'bottom',
            iconSize: compact ? 0.5 : 1,
            iconAllowOverlap: true,
            iconIgnorePlacement: true,
            symbolSortKey: PIN_SORT as unknown as number,
          }}
        />
      </ShapeSource>
      <ShapeSource id="accuracy" shape={accuracy}>
        <FillLayer id="accuracy-fill" style={{ fillColor: lightColors.me, fillOpacity: 0.12 }} />
        <LineLayer
          id="accuracy-edge"
          style={{ lineColor: lightColors.me, lineOpacity: 0.45, lineWidth: 1.5 }}
        />
      </ShapeSource>
      <ShapeSource id="target-ring" shape={guidance.ring}>
        <LineLayer
          id="target-ring-line"
          style={{ lineColor: lightColors.gold, lineWidth: 3, lineDasharray: [2, 1.5] }}
        />
      </ShapeSource>
      <ShapeSource id="trail" shape={guidance.line}>
        <LineLayer
          id="trail-glow"
          style={{ lineColor: '#F6AD55', lineWidth: 10, lineOpacity: 0.35, lineBlur: 4 }}
        />
        <LineLayer
          id="trail-line"
          style={{ lineColor: '#DD6B20', lineWidth: 4, lineCap: 'round', lineDasharray: [0.5, 2] }}
        />
      </ShapeSource>
      <MarkerView coordinate={[userPosition.lng, userPosition.lat]} allowOverlap>
        <ExplorerAvatar
          explorer={avatar?.explorer}
          size={compact ? 24 : 36}
          skin={avatar?.skin}
          hat={avatar?.hat}
          glow={trail}
          accessibilityLabel="You"
        />
      </MarkerView>
    </MapView>
  );
}
