import Constants, { ExecutionEnvironment } from 'expo-constants';
import { useEffect, useRef } from 'react';
import { env } from '@/lib/env';
import { CATEGORIES } from '@wandro/shared';
import { lightColors } from '@/theme';
import { FallbackMap } from './FallbackMap';
import type { PlaceMapProps } from './types';
import { placesGeoJson, useFog } from './useFog';

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
  mb,
}: PlaceMapProps & { mb: typeof import('@rnmapbox/maps') }) {
  const { MapView, Camera, ShapeSource, FillLayer, CircleLayer, StyleURL } = mb;
  const camera = useRef<import('@rnmapbox/maps').Camera>(null);
  const fog = useFog(places, unlockedIds);

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
      styleURL={StyleURL.Outdoors}
      scrollEnabled={!compact}
      zoomEnabled={!compact}
      rotateEnabled={false}
      pitchEnabled={false}
      scaleBarEnabled={false}
      accessibilityLabel="Map of places"
    >
      <Camera
        ref={camera}
        defaultSettings={{
          centerCoordinate: [userPosition.lng, userPosition.lat],
          zoomLevel: compact ? 11 : 13,
        }}
      />
      <ShapeSource id="fog" shape={fog}>
        <FillLayer id="fog-fill" style={{ fillColor: lightColors.fogFill, fillOpacity: 0.78 }} />
      </ShapeSource>
      <ShapeSource
        id="places"
        shape={placesGeoJson(places, unlockedIds)}
        onPress={(e) => {
          const id = e.features[0]?.properties?.id as string | undefined;
          const p = places.find((x) => x.id === id);
          if (p) onSelect?.(p);
        }}
      >
        <CircleLayer
          id="places-circle"
          style={{
            circleRadius: compact ? 5 : 10,
            circleColor: [
              'case',
              ['get', 'unlocked'],
              [
                'match',
                ['get', 'category'],
                ...CATEGORIES.flatMap((cat) => [cat, lightColors.category[cat]]),
                lightColors.category.other,
              ],
              lightColors.locked,
            ],
            circleStrokeColor: '#ffffff',
            circleStrokeWidth: 2.5,
          }}
        />
      </ShapeSource>
      <ShapeSource
        id="me"
        shape={{ type: 'Point', coordinates: [userPosition.lng, userPosition.lat] }}
      >
        <CircleLayer
          id="me-dot"
          style={{
            circleRadius: 7,
            circleColor: lightColors.me,
            circleStrokeColor: '#fff',
            circleStrokeWidth: 3,
          }}
        />
      </ShapeSource>
    </MapView>
  );
}
