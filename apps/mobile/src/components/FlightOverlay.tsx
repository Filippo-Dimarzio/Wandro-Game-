import { Shrikhand_400Regular, useFonts } from '@expo-google-fonts/shrikhand';
import { Image } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DEMO_PLACES, regionBySlug, tripMode, type TripMode } from '@wandro/shared';
import { t, type TranslationKey } from '@/i18n';
import { isDemo } from '@/lib/env';
import { useSession } from '@/state/session';
import { radius, space } from '@/theme';
import { SCENE_RATIO, TRIP_SCENE, TRIP_VEHICLE, tripCity } from '@/tripArt';

// Paper and inks from the cut-paper artwork; navy and brown on cream pass WCAG AA (8:1 and up).
const PAPER = '#F6EBD5';
const CARD = '#FBF4E4';
const NAVY = '#1F3F73';
const BROWN = '#6B3B2A';
const MUSTARD = '#F2C14E';
const CORAL = '#EE8C7E';

const MAX_SCENE = 560;
const CITY = 0.34; // each landmark is a third of the scene's width
const STEPS = [0, 0.25, 0.5, 0.75, 1];
/** The plane's flight path, as fractions of the scene's height: up from one city, down to the next. */
const flightY = (p: number) => 0.5 - 0.38 * 4 * p * (1 - p);

export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return t('trip.min', { m });
  return m ? t('trip.hmin', { h, m }) : t('trip.h', { h });
}

/**
 * Full-screen "you've arrived" postcard: a plane flies, or a train or a green coach drives,
 * across a cut-paper landscape from one city's landmark to the next, whichever is how you'd
 * really get there.
 */
export function FlightOverlay() {
  const flight = useSession((s) => s.flight);
  const endFlight = useSession((s) => s.endFlight);
  const progress = useRef(new Animated.Value(0)).current;
  const window = useWindowDimensions();
  // Until the postcard has been measured, assume it fills the column, so the scene draws at once.
  const [measured, setMeasured] = useState(0);
  const width = measured || Math.min(window.width - 2 * space.lg - 24, MAX_SCENE);
  const [landed, setLanded] = useState(false);
  const [fontLoaded] = useFonts({ Shrikhand_400Regular });
  const display = fontLoaded
    ? { fontFamily: 'Shrikhand_400Regular', fontWeight: 'normal' as const }
    : null;

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
        duration: 3200,
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
  const flying = mode === 'plane';
  const endLabel = (r: typeof from) => (flying ? r.airport.code : r.name);
  const placeCount = isDemo
    ? DEMO_PLACES.filter((p) => p.region === to.slug && !p.hidden).length
    : null;

  return (
    <View
      style={[StyleSheet.absoluteFill, { backgroundColor: PAPER }]}
      accessibilityViewIsModal
      importantForAccessibility="yes"
      testID="flight-overlay"
    >
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.kicker}>
            <Text style={styles.kickerText}>{t('flight.kicker')}</Text>
          </View>
          <Text style={[styles.title, display]} accessibilityRole="header">
            {landed
              ? t('flight.welcome', { city: to.name })
              : t(`trip.going.${mode}` as TranslationKey, { city: to.name })}
          </Text>
          <Text style={styles.mode} testID="trip-mode">
            {t(`trip.by.${mode}` as TranslationKey, { time: formatMinutes(minutes) })}
          </Text>

          <View
            style={styles.postcard}
            accessible
            accessibilityLabel={t(`trip.routeA11y.${mode}` as TranslationKey, {
              from: flying ? `${from.name} (${from.airport.code})` : from.name,
              to: flying ? `${to.name} (${to.airport.code})` : to.name,
              km: Math.round(flight.km),
            })}
          >
            <View
              style={styles.scene}
              onLayout={(e) => setMeasured(Math.min(e.nativeEvent.layout.width, MAX_SCENE))}
            >
              {width > 0 && (
                <Scene
                  width={width}
                  mode={mode}
                  fromSlug={from.slug}
                  toSlug={to.slug}
                  progress={progress}
                />
              )}
            </View>
            <View style={styles.ends}>
              <End code={endLabel(from)} city={flying ? from.name : stop(mode)} display={display} />
              <End code={endLabel(to)} city={flying ? to.name : stop(mode)} display={display} />
            </View>
          </View>

          <Text style={styles.meta}>
            {t('flight.distance', { km: Math.round(flight.km).toLocaleString('en') })}
          </Text>

          <View style={[styles.card, { opacity: landed ? 1 : 0.7 }]}>
            <Text style={styles.cardTitle}>{t('flight.newCity', { city: to.name })}</Text>
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
            <Text style={styles.ctaText}>{t('flight.explore', { city: to.name })}</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

/** The illustrated landscape with both cities' landmarks and the moving vehicle. */
function Scene({
  width,
  mode,
  fromSlug,
  toSlug,
  progress,
}: {
  width: number;
  mode: TripMode;
  fromSlug: string;
  toSlug: string;
  progress: Animated.Value;
}) {
  const height = width * SCENE_RATIO;
  const scene = TRIP_SCENE[mode];
  const vehicle = TRIP_VEHICLE[mode];
  const vw = width * vehicle.width;
  const vh = vw / vehicle.ratio;
  const city = width * CITY;
  const cityTop = height * scene.cityBase - city;
  const flying = mode === 'plane';
  const margin = width * 0.03;
  // Ground vehicles drive from the first landmark to the second; the plane takes off over one
  // city and lands over the other.
  const startX = flying ? city / 2 - vw / 2 : margin;
  const endX = flying ? width - city / 2 - vw / 2 : width - margin - vw;
  const yAt = (p: number) => (flying ? height * flightY(p) - vh / 2 : height * scene.ground - vh);

  return (
    <View style={{ width, height }}>
      <Image source={scene.src} style={StyleSheet.absoluteFill} contentFit="fill" />
      <Image
        source={tripCity(fromSlug)}
        style={{ position: 'absolute', left: 0, top: cityTop, width: city, height: city }}
      />
      <Image
        source={tripCity(toSlug)}
        style={{ position: 'absolute', right: 0, top: cityTop, width: city, height: city }}
      />
      {flying &&
        Array.from({ length: 15 }, (_, i) => i / 14).map((p) => (
          <View
            key={p}
            style={[
              styles.dot,
              {
                backgroundColor: scene.dot,
                left: startX + vw / 2 + p * (endX - startX) - 4,
                top: height * flightY(p) - 4,
              },
            ]}
          />
        ))}
      <Animated.View
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          transform: [
            {
              translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [startX, endX] }),
            },
            {
              translateY: progress.interpolate({
                inputRange: STEPS,
                outputRange: STEPS.map(yAt),
              }),
            },
            {
              rotate: flying
                ? progress.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: ['-18deg', '0deg', '18deg'],
                  })
                : '0deg',
            },
          ],
        }}
        accessible={false}
        testID={`trip-vehicle-${mode}`}
      >
        <Image source={vehicle.src} style={{ width: vw, height: vh }} />
      </Animated.View>
    </View>
  );
}

const stop = (mode: TripMode) => t(mode === 'train' ? 'trip.station' : 'trip.coachStop');

function End({
  code,
  city,
  display,
}: {
  code: string;
  city: string;
  display: { fontFamily: string; fontWeight: 'normal' } | null;
}) {
  return (
    <View style={styles.end}>
      <Text style={[styles.code, display]}>{code}</Text>
      <Text style={styles.city}>{city}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: {
    flexGrow: 1,
    padding: space.lg,
    justifyContent: 'center',
    gap: space.md,
    width: '100%',
    maxWidth: MAX_SCENE + 2 * space.lg + 24,
    alignSelf: 'center',
  },
  kicker: {
    alignSelf: 'center',
    backgroundColor: MUSTARD,
    borderRadius: radius.pill,
    paddingHorizontal: space.md,
    paddingVertical: 6,
  },
  kickerText: { color: NAVY, fontWeight: '900', letterSpacing: 1.2, fontSize: 13 },
  title: { color: NAVY, fontSize: 34, fontWeight: '900', textAlign: 'center' },
  mode: { color: BROWN, fontWeight: '800', textAlign: 'center', fontSize: 17 },
  postcard: {
    backgroundColor: CARD,
    borderRadius: 18,
    padding: 12,
    gap: space.sm,
    shadowColor: '#3C2814',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  scene: { width: '100%', alignItems: 'center', borderRadius: 10, overflow: 'hidden' },
  dot: { position: 'absolute', width: 8, height: 8, borderRadius: 4 },
  ends: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: space.xs },
  end: { alignItems: 'center', minWidth: 90 },
  code: { color: NAVY, fontSize: 24, fontWeight: '900', letterSpacing: 0.5 },
  city: { color: BROWN, fontWeight: '700' },
  meta: { color: BROWN, textAlign: 'center', fontWeight: '700' },
  card: {
    backgroundColor: CARD,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: CORAL,
    padding: space.lg,
    gap: 4,
  },
  cardTitle: { color: NAVY, fontWeight: '900', fontSize: 18 },
  cardText: { color: BROWN },
  cta: {
    backgroundColor: NAVY,
    borderRadius: radius.pill,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: { color: CARD, fontWeight: '900', fontSize: 17 },
});
