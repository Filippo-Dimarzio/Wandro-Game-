import { Ionicons } from '@expo/vector-icons';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { directionsUrl } from '@/lib/directions';
import {
  approachProgress,
  formatDistance,
  proximity,
  walkingMinutes,
  type Place,
} from '@wandro/shared';
import { t } from '@/i18n';
import { radius, space, useColors } from '@/theme';

interface Props {
  target: Place;
  distanceM: number;
  startDistanceM: number;
  trailActive: boolean;
  onDiscover: () => void;
  onStop: () => void;
}

/** Find-My-style guidance card: how close you are to your next adventure. */
export function ProximityHud({
  target,
  distanceM,
  startDistanceM,
  trailActive,
  onDiscover,
  onStop,
}: Props) {
  const c = useColors();
  const state = proximity(distanceM, target.geofenceRadiusM);
  const progress = approachProgress(startDistanceM, distanceM, target.geofenceRadiusM);
  const here = state === 'here';

  return (
    <View
      style={[styles.card, { backgroundColor: c.card }]}
      testID="proximity-hud"
      accessibilityLiveRegion="polite"
    >
      <View style={styles.row}>
        <Text style={{ fontSize: 24 }}>{here ? '📍' : trailActive ? '🪔' : '🧭'}</Text>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: c.textMuted,
              fontSize: 12,
              fontWeight: '700',
              textTransform: 'uppercase',
            }}
          >
            {t('hud.next')}
          </Text>
          <Text style={{ color: c.text, fontSize: 18, fontWeight: '900' }} numberOfLines={1}>
            {target.name}
          </Text>
        </View>
        <Pressable
          onPress={onStop}
          accessibilityRole="button"
          accessibilityLabel={t('hud.stop')}
          hitSlop={10}
        >
          <Ionicons name="close" size={22} color={c.textMuted} />
        </Pressable>
      </View>

      <Text
        style={{ color: here ? c.accent : c.text, fontWeight: '800', fontSize: 16 }}
        testID="hud-status"
      >
        {t(`hud.${state}`)}
        {!here &&
          ` · ${formatDistance(distanceM)} · ${t('hud.walk', { min: walkingMinutes(distanceM - target.geofenceRadiusM) })}`}
      </Text>
      <View
        style={[styles.track, { backgroundColor: c.border }]}
        accessible
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}
      >
        <View
          style={[
            styles.bar,
            { width: `${Math.round(progress * 100)}%`, backgroundColor: here ? c.accent : c.gold },
          ]}
        />
      </View>

      <View style={styles.row}>
        {here ? (
          <Pressable
            onPress={onDiscover}
            accessibilityRole="button"
            style={[styles.button, { backgroundColor: c.accent, flex: 1 }]}
            testID="hud-discover"
          >
            <Text style={{ color: c.accentOn, fontWeight: '900' }}>✨ {t('hud.discover')}</Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={() => Linking.openURL(directionsUrl(target, distanceM)).catch(() => undefined)}
            accessibilityRole="link"
            style={[styles.button, { backgroundColor: c.accent, flex: 1 }]}
          >
            <Ionicons name="navigate" size={16} color={c.accentOn} />
            <Text style={{ color: c.accentOn, fontWeight: '800' }}>{t('hud.directions')}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    left: space.md,
    right: space.md,
    bottom: space.md,
    borderRadius: radius.lg,
    padding: space.lg,
    gap: space.sm,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  track: { height: 8, borderRadius: 4, overflow: 'hidden' },
  bar: { height: 8, borderRadius: 4 },
  button: {
    flexDirection: 'row',
    gap: 6,
    borderRadius: radius.pill,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
