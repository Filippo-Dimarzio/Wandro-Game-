import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DEMO_PLACES, regionBySlug, tripMode, type TripMode } from '@wandro/shared';
import { t, type TranslationKey } from '@/i18n';
import { isDemo } from '@/lib/env';
import { useSession } from '@/state/session';
import { radius, space } from '@/theme';

const ARC_HEIGHT = 56;
const STEPS = [0, 0.25, 0.5, 0.75, 1];
// A parabola through the steps: the plane climbs, cruises and descends. Trains and coaches
// stay on the ground.
const arcY = (p: number) => -ARC_HEIGHT * 4 * p * (1 - p);
const GROUND_Y = ARC_HEIGHT;

/** Each way of travelling has its own sky: all dark enough for white text (WCAG AA). */
const THEMES: Record<TripMode, { colors: [string, string, string]; icon: string; accent: string }> =
  {
    plane: { colors: ['#082A45', '#0B3A5E', '#0A5A96'], icon: '✈️', accent: '#0B6FB8' },
    train: { colors: ['#1B1F3B', '#26305C', '#33407A'], icon: '🚆', accent: '#33407A' },
    bus: { colors: ['#06301F', '#0B4A30', '#0E6040'], icon: '', accent: '#0B6B43' },
  };

export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return t('trip.min', { m });
  return m ? t('trip.hmin', { h, m }) : t('trip.h', { h });
}

/**
 * Full-screen "you've arrived" moment: a plane flies between airports, or a train or a green
 * coach drives from the old city to the new one, whichever is how you'd really get there.
 */
export function FlightOverlay() {
  const flight = useSession((s) => s.flight);
  const endFlight = useSession((s) => s.endFlight);
  const progress = useRef(new Animated.Value(0)).current;
  const [width, setWidth] = useState(0);
  const [landed, setLanded] = useState(false);

  useEffect(() => {
    if (!flight) return;
    setLanded(false);
    progress.setValue(0);
    let cancelled = false;
    const to = regionBySlug(flight.to);
    AccessibilityInfo.announceForAccessibility?.(t('flight.welcome', { city: to?.name ?? '' }));
    const run = async () => {
      const reduce = await AccessibilityInfo.isReduceMotionEnabled?.().catch(() => false);
      if (cancelled) return;
      if (reduce) {
        progress.setValue(1);
        setLanded(true);
        return;
      }
      Animated.timing(progress, {
        toValue: 1,
        duration: 2600,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: Platform.OS !== 'web',
      }).start(({ finished }) => finished && !cancelled && setLanded(true));
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [flight, progress]);

  if (!flight) return null;
  const from = regionBySlug(flight.from);
  const to = regionBySlug(flight.to);
  if (!from || !to) return null;
  const { mode, minutes } = tripMode(from, to);
  const theme = THEMES[mode];
  const flying = mode === 'plane';
  const yAt = (p: number) => (flying ? ARC_HEIGHT + arcY(p) : GROUND_Y);
  const endLabel = (r: typeof from) => (flying ? r.airport.code : r.name);
  // Half the vehicle's width, so it starts and stops centred on each end.
  const half = mode === 'bus' ? 23 : 15;
  const placeCount = isDemo
    ? DEMO_PLACES.filter((p) => p.region === to.slug && !p.hidden).length
    : null;
  const track = Math.max(width - 2 * space.lg, 0);

  return (
    <View
      style={StyleSheet.absoluteFill}
      accessibilityViewIsModal
      importantForAccessibility="yes"
      testID="flight-overlay"
    >
      <LinearGradient
        colors={theme.colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.content}>
        <Text style={styles.kicker}>
          {flying ? '✈️' : mode === 'train' ? '🚆' : '🚌'} {t('flight.kicker')}
        </Text>
        <Text style={styles.title} accessibilityRole="header">
          {landed
            ? t('flight.welcome', { city: to.name })
            : t(`trip.going.${mode}` as TranslationKey, { city: to.name })}
        </Text>
        <Text style={styles.mode} testID="trip-mode">
          {t(`trip.by.${mode}` as TranslationKey, { time: formatMinutes(minutes) })}
        </Text>

        <View
          style={styles.route}
          onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
          accessible
          accessibilityLabel={t(`trip.routeA11y.${mode}` as TranslationKey, {
            from: flying ? `${from.name} (${from.airport.code})` : from.name,
            to: flying ? `${to.name} (${to.airport.code})` : to.name,
            km: Math.round(flight.km),
          })}
        >
          <View style={[styles.arc, { width: track }]} pointerEvents="none">
            {flying &&
              Array.from({ length: 13 }, (_, i) => i / 12).map((p) => (
                <View key={p} style={[styles.dot, { left: p * track - 3, top: yAt(p) - 3 }]} />
              ))}
            {mode === 'train' && <Rails width={track} />}
            {mode === 'bus' && <Road width={track} />}
            <Animated.View
              style={[
                styles.plane,
                {
                  transform: [
                    {
                      translateX: progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-half, track - half],
                      }),
                    },
                    {
                      translateY: progress.interpolate({
                        inputRange: STEPS,
                        outputRange: STEPS.map((p) => yAt(p) - (flying ? 16 : 26)),
                      }),
                    },
                    {
                      rotate: flying
                        ? progress.interpolate({
                            inputRange: [0, 0.5, 1],
                            outputRange: ['-25deg', '0deg', '25deg'],
                          })
                        : '0deg',
                    },
                  ],
                },
              ]}
              accessible={false}
              testID={`trip-vehicle-${mode}`}
            >
              {mode === 'bus' ? <Coach /> : <Text style={styles.vehicle}>{theme.icon}</Text>}
            </Animated.View>
          </View>
          <View style={styles.ends}>
            <Airport
              flag={from.flag}
              code={endLabel(from)}
              city={flying ? from.name : stop(mode)}
            />
            <Airport flag={to.flag} code={endLabel(to)} city={flying ? to.name : stop(mode)} />
          </View>
        </View>

        <Text style={styles.meta}>
          {t('flight.distance', { km: Math.round(flight.km).toLocaleString('en') })}
        </Text>

        <View style={[styles.card, { opacity: landed ? 1 : 0.6 }]}>
          <Text style={styles.cardTitle}>
            {to.flag} {t('flight.newCity', { city: to.name })}
          </Text>
          <Text style={styles.cardText}>
            {placeCount ? `${t('travel.placeCount', { count: placeCount })} · ` : ''}
            {t('flight.gems')}
          </Text>
        </View>

        <Pressable
          onPress={endFlight}
          accessibilityRole="button"
          style={styles.cta}
          testID="flight-done"
        >
          <Text style={[styles.ctaText, { color: theme.accent }]}>
            {t('flight.explore', { city: to.name })}
          </Text>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

const stop = (mode: TripMode) => t(mode === 'train' ? 'trip.station' : 'trip.coachStop');

/** Two rails with sleepers, for the train. */
function Rails({ width }: { width: number }) {
  return (
    <View style={[styles.rails, { width, top: GROUND_Y - 2 }]}>
      <View style={styles.rail} />
      <View style={styles.sleepers}>
        {Array.from({ length: Math.max(2, Math.floor(width / 14)) }, (_, i) => (
          <View key={i} style={styles.sleeper} />
        ))}
      </View>
      <View style={styles.rail} />
    </View>
  );
}

/** A road with a dashed centre line, for the coach. */
function Road({ width }: { width: number }) {
  return (
    <View style={[styles.road, { width, top: GROUND_Y - 6 }]}>
      {Array.from({ length: Math.max(2, Math.floor(width / 22)) }, (_, i) => (
        <View key={i} style={styles.dash} />
      ))}
    </View>
  );
}

/** A long-distance green coach, drawn so it isn't any real company's livery. */
function Coach() {
  return (
    <View style={styles.coach}>
      <View style={styles.coachBody}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={styles.coachWindow} />
        ))}
        <View style={styles.coachWindscreen} />
      </View>
      <View style={styles.coachWheels}>
        <View style={styles.wheel} />
        <View style={styles.wheel} />
      </View>
    </View>
  );
}

function Airport({ flag, code, city }: { flag: string; code: string; city: string }) {
  return (
    <View style={{ alignItems: 'center', gap: 2 }}>
      <Text style={{ fontSize: 26 }} accessible={false}>
        {flag}
      </Text>
      <Text style={styles.code}>{code}</Text>
      <Text style={styles.city}>{city}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, padding: space.lg, justifyContent: 'center', gap: space.lg },
  kicker: { color: '#DDEEFF', fontWeight: '800', textAlign: 'center', letterSpacing: 1 },
  title: { color: '#fff', fontSize: 30, fontWeight: '900', textAlign: 'center' },
  route: { paddingHorizontal: space.lg, gap: space.sm },
  arc: { height: ARC_HEIGHT + 24, alignSelf: 'center' },
  dot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  plane: { position: 'absolute', left: 0, top: 0 },
  vehicle: { fontSize: 30 },
  mode: { color: '#fff', fontWeight: '800', textAlign: 'center', fontSize: 16 },
  rails: { position: 'absolute', left: 0, height: 10, justifyContent: 'space-between' },
  rail: { height: 2, backgroundColor: 'rgba(255,255,255,0.8)' },
  sleepers: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sleeper: { width: 3, backgroundColor: 'rgba(255,255,255,0.35)' },
  road: {
    position: 'absolute',
    left: 0,
    height: 14,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.35)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  dash: { width: 10, height: 2, backgroundColor: 'rgba(255,255,255,0.8)' },
  coach: { width: 46, alignItems: 'center' },
  coachBody: {
    width: 46,
    height: 22,
    borderRadius: 5,
    borderTopRightRadius: 10,
    backgroundColor: '#5BC236',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 3,
    gap: 2,
  },
  coachWindow: { width: 7, height: 8, borderRadius: 1.5, backgroundColor: '#D8F5FF' },
  coachWindscreen: {
    width: 6,
    height: 12,
    borderRadius: 2,
    borderTopRightRadius: 6,
    backgroundColor: '#D8F5FF',
    marginLeft: 'auto',
  },
  coachWheels: { flexDirection: 'row', justifyContent: 'space-between', width: 34, marginTop: -4 },
  wheel: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#1A1A1A',
    borderWidth: 2,
    borderColor: '#999',
  },
  ends: { flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: -space.sm },
  code: { color: '#fff', fontSize: 28, fontWeight: '900', letterSpacing: 1 },
  city: { color: '#DDEEFF', fontWeight: '700' },
  meta: { color: '#DDEEFF', textAlign: 'center', fontWeight: '700' },
  card: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: radius.lg,
    padding: space.lg,
    gap: 4,
  },
  cardTitle: { color: '#fff', fontWeight: '900', fontSize: 18 },
  cardText: { color: '#fff' },
  cta: {
    backgroundColor: '#fff',
    borderRadius: radius.pill,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: { color: '#0B6FB8', fontWeight: '900', fontSize: 17 },
});
