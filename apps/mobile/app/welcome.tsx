import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import {
  AccessibilityInfo,
  useWindowDimensions,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WandroLogo } from '@/components/WandroLogo';
import { t } from '@/i18n';
import { isDemo } from '@/lib/env';
import { radius, space } from '@/theme';
import { FitImage } from '@/components/FitImage';

/**
 * Title screen, like a game's: Sintra's stamp at dawn, the fog drifts off it by itself, then one
 * big tap to start. There's no hold gesture: on phones a long press selects text instead.
 */
export default function Welcome() {
  const { width, height } = useWindowDimensions();
  // The stamp fits between the title and the buttons, even on a small phone.
  const stampWidth = Math.min(250, width * 0.62, height * 0.27);
  const fog = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled?.()
      .catch(() => false)
      .then((reduce) => {
        if (cancelled) return;
        if (reduce) {
          fog.setValue(1);
          rise.setValue(1);
          return;
        }
        Animated.sequence([
          Animated.delay(600),
          Animated.parallel([
            Animated.timing(fog, {
              toValue: 1,
              duration: 2000,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.timing(rise, {
              toValue: 1,
              duration: 900,
              delay: 700,
              easing: Easing.out(Easing.back(1.4)),
              useNativeDriver: true,
            }),
          ]),
        ]).start();
      });
    return () => {
      cancelled = true;
    };
  }, [fog, rise]);

  const drift = (dx: number) => ({
    opacity: fog.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
    transform: [{ translateX: fog.interpolate({ inputRange: [0, 1], outputRange: [0, dx] }) }],
  });
  const appear = {
    opacity: rise,
    transform: [{ translateY: rise.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#173A5E', '#3A6EA5', '#F0A35E', '#FBD9A6']}
        locations={[0, 0.35, 0.75, 1]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.content}>
        <View style={styles.brand}>
          <View style={styles.brandRow}>
            <WandroLogo size={52} />
            <Text style={styles.logo} accessibilityRole="header">
              Wandro
            </Text>
          </View>
          <Text style={styles.tagline}>{t('portal.tagline')}</Text>
        </View>

        <View style={styles.hero} accessibilityElementsHidden importantForAccessibility="no">
          <View style={[styles.stamp, { width: stampWidth }]}>
            <FitImage
              // eslint-disable-next-line @typescript-eslint/no-require-imports -- static asset for Metro
              source={require('../assets/stamps/sintra.jpg')}
              style={styles.stampArt}
            />
          </View>
          <Animated.View pointerEvents="none" style={[styles.fog, { top: -30 }, drift(-320)]}>
            <Cloud />
          </Animated.View>
          <Animated.View pointerEvents="none" style={[styles.fog, { top: 90 }, drift(320)]}>
            <Cloud flip />
          </Animated.View>
        </View>

        <Animated.View style={[styles.actions, appear]}>
          <Pressable
            style={({ pressed }) => [styles.cta, pressed && { transform: [{ scale: 0.97 }] }]}
            onPress={() => router.replace('/register')}
            accessibilityRole="button"
            testID="portal-start"
          >
            <Text style={styles.ctaText}>{t('portal.start')}</Text>
          </Pressable>
          <Pressable
            onPress={() => router.replace('/login')}
            accessibilityRole="link"
            style={styles.secondary}
            testID="portal-login"
          >
            <Text style={styles.secondaryText}>{t('portal.login')}</Text>
          </Pressable>
          {isDemo && (
            <Pressable
              onPress={() => router.push('/join?src=portal')}
              accessibilityRole="link"
              testID="portal-join"
            >
              <Text style={styles.joinLink}>{t('portal.join')}</Text>
            </Pressable>
          )}
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

/** A soft fog bank made of overlapping puffs. */
function Cloud({ flip }: { flip?: boolean }) {
  const puffs = [
    { size: 150, left: 0, top: 50 },
    { size: 190, left: 70, top: 0 },
    { size: 160, left: 190, top: 40 },
    { size: 120, left: 280, top: 80 },
  ];
  return (
    <View style={{ width: 400, height: 220, transform: [{ scaleX: flip ? -1 : 1 }] }}>
      {puffs.map((p, i) => (
        <View
          key={i}
          style={[
            styles.puff,
            { width: p.size, height: p.size, borderRadius: p.size / 2, left: p.left, top: p.top },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden' },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: space.xl,
    paddingVertical: space.lg,
  },
  brand: { alignItems: 'center', gap: space.sm, marginTop: space.xl },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  logo: { fontSize: 44, fontWeight: '900', color: '#fff', letterSpacing: -1 },
  tagline: {
    fontSize: 17,
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
    maxWidth: 320,
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowRadius: 6,
  },
  hero: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 1,
    marginVertical: space.lg,
  },
  stamp: {
    aspectRatio: 500 / 560,
    backgroundColor: '#FFF8EC',
    padding: 10,
    borderRadius: radius.sm,
    transform: [{ rotate: '-3deg' }],
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  stampArt: { width: '100%', height: '100%', borderRadius: 4 },
  // Two fog banks start over the stamp and drift apart.
  fog: { position: 'absolute', left: '50%', marginLeft: -200 },
  puff: { position: 'absolute', backgroundColor: 'rgba(240,244,248,0.96)' },
  actions: { width: '100%', maxWidth: 420, alignItems: 'center', gap: space.sm },
  cta: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: radius.pill,
    minHeight: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#7A3B12',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  ctaText: { fontSize: 18, fontWeight: '900', color: '#0B6FB8' },
  secondary: { minHeight: 48, justifyContent: 'center', paddingHorizontal: space.md },
  secondaryText: { color: '#2A1606', fontWeight: '800', fontSize: 16, textAlign: 'center' },
  joinLink: {
    color: '#2A1606',
    fontWeight: '700',
    fontSize: 14,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
});
