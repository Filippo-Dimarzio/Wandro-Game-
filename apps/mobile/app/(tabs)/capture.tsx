import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatDistance } from '@wandro/shared';
import { HoldToConfirm } from '@/components/HoldToConfirm';
import { RewardCard } from '@/components/RewardCard';
import { useCheckin } from '@/data/checkin';
import { nearestLocked } from '@/data/discovery';
import { usePlaces, useUnlockedIds } from '@/data/places';
import { t, type TranslationKey } from '@/i18n';
import { DEMO_DWELL_SECONDS, isDemo } from '@/lib/env';
import { useLocation } from '@/lib/useLocation';
import { radius, space, useColors } from '@/theme';

export default function Capture() {
  const c = useColors();
  const loc = useLocation();
  const places = usePlaces(loc.position);
  const { ids } = useUnlockedIds();
  const list = places.data ?? [];
  const nearest = nearestLocked(loc.position, loc.accuracy, list, ids);
  const { phase, start, reset } = useCheckin(loc, list);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={[styles.title, { color: c.text }]} accessibilityRole="header">
          {t('capture.title')}
        </Text>

        {!isDemo && loc.permission !== 'granted' && (
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

        {phase.kind === 'done' && (
          <RewardCard
            placeName={phase.place.name}
            outcome={phase.outcome}
            onDone={reset}
            onShare={
              phase.outcome.status === 'verified'
                ? () => router.push({ pathname: '/post/new', params: { place: phase.place.id } })
                : undefined
            }
          />
        )}

        {phase.kind === 'error' && (
          <View
            style={[styles.card, { backgroundColor: c.surface }]}
            accessibilityLiveRegion="polite"
          >
            <Text style={{ color: c.danger, fontWeight: '700' }}>
              {t(`checkin.error.${phase.code}` as TranslationKey)}
            </Text>
            <Pressable
              onPress={reset}
              accessibilityRole="button"
              style={[styles.button, { backgroundColor: c.accent }]}
            >
              <Text style={{ color: c.accentOn, fontWeight: '800' }}>{t('checkin.tryAgain')}</Text>
            </Pressable>
          </View>
        )}

        {phase.kind !== 'done' && phase.kind !== 'error' && nearest && (
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

            {phase.kind === 'dwelling' && (
              <View style={styles.dwell} accessibilityLiveRegion="polite" testID="dwell">
                <View style={[styles.ring, { borderColor: c.accent }]}>
                  <Text style={{ color: c.text, fontSize: 28, fontWeight: '900' }}>
                    {phase.secondsLeft}
                  </Text>
                </View>
                <Text style={{ color: c.text }}>
                  {t('capture.dwell', { seconds: phase.secondsLeft })}
                </Text>
                <Pressable onPress={reset} accessibilityRole="button">
                  <Text style={{ color: c.textMuted, textDecorationLine: 'underline' }}>
                    {t('checkin.cancel')}
                  </Text>
                </Pressable>
              </View>
            )}
            {(phase.kind === 'starting' || phase.kind === 'completing') && (
              <Text style={{ color: c.textMuted }} accessibilityLiveRegion="polite">
                <Ionicons name="cloud-upload" /> {t('checkin.verifying')}
              </Text>
            )}
            {phase.kind === 'idle' && (
              <HoldToConfirm
                testID="start-discovery"
                label={t('capture.start')}
                accessibilityLabel={t('capture.startA11y')}
                disabled={!nearest.inRange}
                onConfirm={() => start(nearest.place)}
              />
            )}
          </View>
        )}

        {isDemo && (
          <Text style={{ color: c.textMuted, fontSize: 13 }}>
            {t('capture.demoNote', { seconds: DEMO_DWELL_SECONDS })}
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: space.lg, gap: space.lg },
  title: { fontSize: 28, fontWeight: '900' },
  card: { borderRadius: radius.lg, padding: space.lg, gap: space.md },
  place: { fontSize: 22, fontWeight: '800' },
  dwell: { alignItems: 'center', gap: space.sm },
  ring: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    borderRadius: radius.pill,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
