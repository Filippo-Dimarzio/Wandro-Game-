import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatDistance } from '@wandro/shared';
import { HoldToConfirm } from '@/components/HoldToConfirm';
import { demoVisitPoints, nearestLocked } from '@/data/discovery';
import { usePlaces, useUnlockedIds } from '@/data/places';
import { t } from '@/i18n';
import { DEMO_DWELL_SECONDS, isDemo } from '@/lib/env';
import { useLocation } from '@/lib/useLocation';
import { useSession } from '@/state/session';
import { radius, space, useColors } from '@/theme';

export default function Capture() {
  const c = useColors();
  const loc = useLocation();
  const places = usePlaces(loc.position);
  const { ids } = useUnlockedIds();
  const unlock = useSession((s) => s.unlock);
  const nearest = nearestLocked(loc.position, loc.accuracy, places.data ?? [], ids);

  const [dwellLeft, setDwellLeft] = useState<number | null>(null);
  const [success, setSuccess] = useState<{ name: string; points: number } | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const inRangeRef = useRef(false);
  inRangeRef.current = !!nearest?.inRange;

  useEffect(
    () => () => {
      if (timer.current) clearInterval(timer.current);
    },
    [],
  );

  const startDiscovery = () => {
    if (!nearest || !isDemo) return;
    const place = nearest.place;
    setSuccess(null);
    setDwellLeft(DEMO_DWELL_SECONDS);
    timer.current = setInterval(() => {
      // Leaving the geofence cancels the dwell, like the server rule.
      if (!inRangeRef.current) {
        clearInterval(timer.current!);
        setDwellLeft(null);
        return;
      }
      setDwellLeft((s) => {
        if (s === null) return null;
        if (s <= 1) {
          clearInterval(timer.current!);
          const points = demoVisitPoints(place);
          unlock(place.id, points);
          setSuccess({ name: place.name, points });
          return null;
        }
        return s - 1;
      });
    }, 1000);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={styles.container}>
        <Text style={[styles.title, { color: c.text }]} accessibilityRole="header">
          {t('capture.title')}
        </Text>

        {loc.permission !== 'granted' && (
          <View style={[styles.card, { backgroundColor: c.surface }]}>
            <Text style={{ color: c.text }}>{t('capture.locationOff')}</Text>
            <Pressable
              onPress={loc.request}
              accessibilityRole="button"
              style={[styles.button, { backgroundColor: c.accent }]}
            >
              <Text style={{ color: c.accentOn, fontWeight: '800' }}>{t('capture.enable')}</Text>
            </Pressable>
          </View>
        )}

        {success && (
          <View
            style={[styles.card, { backgroundColor: c.accent }]}
            accessibilityLiveRegion="assertive"
          >
            <Ionicons name="sparkles" size={28} color={c.accentOn} />
            <Text style={{ color: c.accentOn, fontSize: 20, fontWeight: '800' }}>
              {t('capture.success', { points: success.points })}
            </Text>
            <Text style={{ color: c.accentOn }}>{success.name}</Text>
            <Text
              style={{ color: c.accentOn, textDecorationLine: 'underline' }}
              onPress={() => router.push('/(tabs)/explore')}
              accessibilityRole="link"
            >
              {t('tabs.explore')} →
            </Text>
          </View>
        )}

        {nearest && (
          <View
            style={[
              styles.card,
              { backgroundColor: c.card, borderColor: c.border, borderWidth: 1 },
            ]}
          >
            <Text style={{ color: c.textMuted, fontWeight: '700' }}>{t('capture.nearest')}</Text>
            <Text style={[styles.place, { color: c.text }]}>
              {nearest.inRange
                ? t('capture.atPlace', { name: nearest.place.name })
                : nearest.place.name}
            </Text>
            {!nearest.inRange && (
              <Text style={{ color: c.textMuted }}>
                {t('capture.tooFar', {
                  distance: formatDistance(nearest.distanceM),
                  radius: nearest.place.geofenceRadiusM,
                })}
              </Text>
            )}

            {dwellLeft !== null ? (
              <View style={styles.dwell} accessibilityLiveRegion="polite">
                <View style={[styles.ring, { borderColor: c.accent }]}>
                  <Text style={{ color: c.text, fontSize: 28, fontWeight: '900' }}>
                    {dwellLeft}
                  </Text>
                </View>
                <Text style={{ color: c.text }}>{t('capture.dwell', { seconds: dwellLeft })}</Text>
              </View>
            ) : isDemo ? (
              <HoldToConfirm
                testID="start-discovery"
                label={t('capture.start')}
                accessibilityLabel={t('capture.startA11y')}
                disabled={!nearest.inRange}
                onConfirm={startDiscovery}
              />
            ) : (
              <Text style={{ color: c.textMuted }}>{t('capture.serverSoon')}</Text>
            )}
          </View>
        )}

        {isDemo && (
          <Text style={{ color: c.textMuted, fontSize: 13 }}>
            {t('capture.demoNote', { seconds: DEMO_DWELL_SECONDS })}
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: space.lg, gap: space.lg },
  title: { fontSize: 28, fontWeight: '900' },
  card: { borderRadius: radius.lg, padding: space.lg, gap: space.md },
  place: { fontSize: 22, fontWeight: '800' },
  dwell: { alignItems: 'center', gap: space.sm },
  button: { borderRadius: 999, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  ring: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
