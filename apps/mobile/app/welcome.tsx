import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  AccessibilityInfo,
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

/** Entry portal: hold to lift the fog over Sintra and reveal Wandro. */
export default function Welcome() {
  const fog = useRef(new Animated.Value(1)).current;
  const [revealed, setRevealed] = useState(false);
  // The CTA appears under the user's finger; ignore the release of the hold that revealed it.
  const revealedAt = useRef(0);

  const reveal = () => {
    revealedAt.current = Date.now();
    fog.setValue(0);
    setRevealed(true);
    AccessibilityInfo.announceForAccessibility?.(t('portal.tagline'));
  };

  const hold = () =>
    Animated.timing(fog, {
      toValue: 0,
      duration: 1200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => finished && reveal());
  const release = () => {
    // Read the ref, not state: this handler was created before the reveal re-rendered.
    if (revealedAt.current) return;
    fog.stopAnimation();
    Animated.timing(fog, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  };

  return (
    <View style={styles.root}>
      {/* Replace with a real photo of Sintra (assets/portal.jpg) once licensed. */}
      <LinearGradient
        colors={['#0B6FB8', '#2F8FE0', '#7CC4F2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.4, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, styles.fog, { opacity: fog }]}
      />
      <SafeAreaView style={styles.content}>
        <Animated.View
          style={{
            opacity: fog.interpolate({ inputRange: [0, 1], outputRange: [1, 0.15] }),
            alignItems: 'center',
            gap: space.md,
          }}
        >
          <View style={styles.brand}>
            <WandroLogo size={64} />
            <Text style={styles.logo} accessibilityRole="header">
              Wandro
            </Text>
          </View>
          <Text style={styles.tagline}>{t('portal.tagline')}</Text>
        </Animated.View>

        {revealed ? (
          <Pressable
            key="cta"
            style={styles.cta}
            onPress={() => Date.now() - revealedAt.current > 500 && router.replace('/register')}
            accessibilityRole="button"
          >
            <Text style={styles.ctaText}>{t('portal.start')}</Text>
          </Pressable>
        ) : (
          <Pressable
            key="hold"
            onPressIn={hold}
            onPressOut={release}
            accessibilityRole="button"
            accessibilityLabel={t('portal.holdA11y')}
            accessibilityActions={[{ name: 'activate' }]}
            onAccessibilityAction={reveal}
            style={styles.holdButton}
            testID="portal-hold"
          >
            <Text style={styles.holdText}>{t('portal.hold')}</Text>
          </Pressable>
        )}
        {revealed && isDemo && (
          <Pressable
            onPress={() => router.push('/join?src=portal')}
            accessibilityRole="link"
            testID="portal-join"
          >
            <Text style={styles.joinLink}>{t('portal.join')}</Text>
          </Pressable>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  fog: { backgroundColor: '#E3EEF7' },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: space.xl,
    paddingTop: 120,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  joinLink: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
    textAlign: 'center',
    marginTop: space.md,
    textDecorationLine: 'underline',
  },
  logo: { fontSize: 46, fontWeight: '900', color: '#fff', letterSpacing: -1 },
  tagline: { fontSize: 18, color: '#fff', textAlign: 'center', fontWeight: '600', maxWidth: 320 },
  holdButton: {
    borderWidth: 2,
    borderColor: '#0E1A24',
    borderRadius: radius.pill,
    paddingHorizontal: 28,
    minHeight: 56,
    justifyContent: 'center',
    marginBottom: space.xl,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  holdText: { fontSize: 17, fontWeight: '800', color: '#0E1A24' },
  cta: {
    backgroundColor: '#fff',
    borderRadius: radius.pill,
    paddingHorizontal: 32,
    minHeight: 56,
    justifyContent: 'center',
    marginBottom: space.xl,
  },
  ctaText: { fontSize: 17, fontWeight: '800', color: '#0B6FB8' },
});
