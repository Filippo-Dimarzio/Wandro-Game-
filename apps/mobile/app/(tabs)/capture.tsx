import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatDistance } from '@wandro/shared';
import { placeImage } from '@/categories';
import { AnimatedCard } from '@/components/AnimatedCard';
import { HoldToConfirm } from '@/components/HoldToConfirm';
import { Moments } from '@/components/Moments';
import { CategoryPill, HoursChip } from '@/components/PlaceBits';
import { CityCelebration } from '@/components/CityCelebration';
import { RewardCard } from '@/components/RewardCard';
import { useCheckin } from '@/data/checkin';
import { nearestLocked } from '@/data/discovery';
import { usePlaces, useUnlockedIds } from '@/data/places';
import { t, type TranslationKey } from '@/i18n';
import { DEMO_DWELL_SECONDS, isDemo } from '@/lib/env';
import { useLocation } from '@/lib/useLocation';
import { column, radius, shadow, space, useColors } from '@/theme';

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
      <ScrollView contentContainerStyle={[styles.container, column]}>
        <View style={{ gap: 2 }}>
          <Text style={[styles.title, { color: c.text }]} accessibilityRole="header">
            {t('capture.title')}
          </Text>
          <Text style={{ color: c.textMuted }}>{t('capture.subtitle')}</Text>
        </View>

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

        {phase.kind === 'done' && <CityCelebration place={phase.place} outcome={phase.outcome} />}
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
          <AnimatedCard
            style={[styles.checkin, shadow, { backgroundColor: c.card }]}
            testID="checkin-card"
          >
            <View style={styles.hero}>
              <Image
                source={placeImage(nearest.place)}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                accessible={false}
              />
              <LinearGradient
                colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.78)']}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.heroTop}>
                <CategoryPill category={nearest.place.category} solid />
                <View
                  style={[
                    styles.status,
                    { backgroundColor: nearest.inRange ? c.accent : 'rgba(14,26,36,0.7)' },
                  ]}
                  testID="checkin-status"
                >
                  <Ionicons
                    name={nearest.inRange ? 'location' : 'walk'}
                    size={14}
                    color={nearest.inRange ? c.accentOn : '#fff'}
                  />
                  <Text
                    style={[styles.statusText, { color: nearest.inRange ? c.accentOn : '#fff' }]}
                  >
                    {nearest.inRange
                      ? t('capture.here')
                      : t('capture.away', { distance: formatDistance(nearest.distanceM) })}
                  </Text>
                </View>
              </View>
              <View style={styles.heroBottom}>
                <Text style={styles.kicker}>{t('capture.nearest')}</Text>
                <Text style={styles.place} numberOfLines={2} accessibilityRole="header">
                  {nearest.place.name}
                </Text>
              </View>
            </View>

            <View style={styles.body}>
              <View style={styles.row}>
                <Ionicons
                  name={nearest.inRange ? 'checkmark-circle' : 'navigate-circle'}
                  size={20}
                  color={nearest.inRange ? c.accent : c.textMuted}
                />
                <Text style={{ color: c.text, flex: 1 }}>
                  {nearest.inRange
                    ? t('capture.ready')
                    : t('capture.getCloser', { radius: nearest.place.geofenceRadiusM })}
                </Text>
              </View>
              <HoursChip place={nearest.place} />

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
                  <Pressable onPress={reset} accessibilityRole="button" hitSlop={8}>
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
          </AnimatedCard>
        )}

        {isDemo && (
          <Text style={{ color: c.textMuted, fontSize: 13 }}>
            {t('capture.demoNote', { seconds: DEMO_DWELL_SECONDS })}
          </Text>
        )}

        <Moments />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: space.lg, gap: space.lg },
  title: { fontSize: 28, fontWeight: '900' },
  card: { borderRadius: radius.lg, padding: space.lg, gap: space.md },
  checkin: { borderRadius: radius.xl },
  hero: { height: 220, justifyContent: 'space-between' },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: space.md,
  },
  heroBottom: { padding: space.lg, gap: 2 },
  kicker: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  place: { color: '#fff', fontSize: 24, fontWeight: '900' },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusText: { fontWeight: '800', fontSize: 13 },
  body: { padding: space.lg, gap: space.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
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
