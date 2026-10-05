import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';
import { ExplorerAvatar } from '@/components/ExplorerAvatar';
import { MARKERS } from './markers';
import { t } from '@/i18n';
import { useColors } from '@/theme';
import type { PlaceMapProps } from './types';

/**
 * A simple schematic map (no tiles): places are plotted around the user.
 * Used in Expo Go, where the native Mapbox module isn't available.
 */
export function FallbackMap({
  places,
  unlockedIds,
  userPosition,
  onSelect,
  compact,
  avatar,
  trail,
}: PlaceMapProps) {
  const c = useColors();
  const [size, setSize] = useState({ w: 1, h: 1 });
  const lats = places.map((p) => p.lat).concat(userPosition.lat);
  const lngs = places.map((p) => p.lng).concat(userPosition.lng);
  const [minLat, maxLat, minLng, maxLng] = [
    Math.min(...lats),
    Math.max(...lats),
    Math.min(...lngs),
    Math.max(...lngs),
  ];
  const pad = 0.12;
  const x = (lng: number) =>
    (pad + ((lng - minLng) / (maxLng - minLng || 1)) * (1 - 2 * pad)) * size.w;
  const y = (lat: number) =>
    (pad + ((maxLat - lat) / (maxLat - minLat || 1)) * (1 - 2 * pad)) * size.h;

  return (
    <View
      style={[styles.map, { backgroundColor: c.surface }]}
      onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
    >
      <View style={[StyleSheet.absoluteFill, { backgroundColor: c.fog }]} pointerEvents="none" />
      {places.map((p) => {
        const unlocked = unlockedIds.has(p.id);
        return (
          <Pressable
            key={p.id}
            disabled={compact}
            onPress={() => onSelect?.(p)}
            accessibilityRole="button"
            accessibilityLabel={`${p.name}, ${unlocked ? t('explore.unlocked') : t('explore.locked')}`}
            style={[styles.pin, { left: x(p.lng) - 20, top: y(p.lat) - 20 }]}
          >
            <Image
              source={unlocked ? MARKERS[p.category].found : MARKERS[p.category].locked}
              style={styles.pinImage}
              accessible={false}
            />
          </Pressable>
        );
      })}
      <View
        style={[styles.me, { left: x(userPosition.lng) - 18, top: y(userPosition.lat) - 18 }]}
        pointerEvents="none"
      >
        <ExplorerAvatar
          explorer={avatar?.explorer}
          size={36}
          skin={avatar?.skin}
          hat={avatar?.hat}
          glow={trail}
          accessibilityLabel="You"
        />
      </View>
      {!compact && (
        <Text style={[styles.note, { color: c.textMuted }]}>
          Schematic map · build the app to see the real map
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1, overflow: 'hidden' },
  pin: { position: 'absolute', width: 40, height: 40 },
  pinImage: { width: 40, height: 40 },
  me: { position: 'absolute' },
  note: { position: 'absolute', bottom: 8, alignSelf: 'center', fontSize: 11 },
});
