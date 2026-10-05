import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, StyleSheet, View } from 'react-native';
import { useIsDark } from '@/theme';

const native = Platform.OS !== 'web';
const LEAVES = 9;
const TUFTS = 14;
const LEAF_COLORS = ['#5FA83A', '#7DBB3F', '#A7C43D', '#D9A23A', '#4E9A47'];

/** Deterministic spread so leaves don't all fall in a line (no Math.random: stable renders). */
const spread = (i: number, salt: number) => ((i * 9301 + salt * 49297) % 233280) / 233280;

/**
 * RPG-style outdoors on top of the map: grass tufts swaying along the bottom and leaves drifting
 * across (fireflies at night). Small, see-through and untouchable so places stay legible and
 * tappable; switched off when the phone asks for reduced motion.
 */
export function MapAmbience() {
  const dark = useIsDark();
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [still, setStill] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled?.()
      .then((r) => setStill(!!r))
      .catch(() => undefined);
  }, []);

  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      onLayout={(e) => setSize(e.nativeEvent.layout)}
      testID="map-ambience"
    >
      {size.width > 0 &&
        !still &&
        Array.from({ length: LEAVES }, (_, i) =>
          dark ? <Firefly key={i} index={i} {...size} /> : <Leaf key={i} index={i} {...size} />,
        )}
      <View style={styles.grass}>
        {Array.from({ length: TUFTS }, (_, i) => (
          <Tuft key={i} index={i} still={still} dark={dark} />
        ))}
      </View>
    </View>
  );
}

function useLoop(duration: number, delay: number) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(v, {
          toValue: 1,
          duration,
          easing: Easing.linear,
          useNativeDriver: native,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [v, duration, delay]);
  return v;
}

/** A leaf blowing in from the top right, tumbling down and to the left. */
function Leaf({ index, width, height }: { index: number; width: number; height: number }) {
  const duration = 9000 + spread(index, 1) * 7000;
  const t = useLoop(duration, spread(index, 2) * 8000);
  const size = 10 + spread(index, 3) * 8;
  const startX = width * (0.2 + spread(index, 4) * 0.9);
  const drift = width * (0.35 + spread(index, 5) * 0.4);
  return (
    <Animated.View
      testID="leaf"
      style={[
        styles.leaf,
        {
          width: size,
          height: size * 0.6,
          backgroundColor: LEAF_COLORS[index % LEAF_COLORS.length],
          left: startX,
          opacity: t.interpolate({ inputRange: [0, 0.1, 0.85, 1], outputRange: [0, 0.8, 0.8, 0] }),
          transform: [
            {
              translateX: t.interpolate({
                inputRange: [0, 0.25, 0.5, 0.75, 1],
                outputRange: [0, -drift * 0.3, -drift * 0.45, -drift * 0.8, -drift],
              }),
            },
            { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [-20, height + 20] }) },
            {
              rotate: t.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', `${index % 2 ? 540 : -540}deg`],
              }),
            },
          ],
        },
      ]}
    />
  );
}

/** A firefly floating and blinking in the dark. */
function Firefly({ index, width, height }: { index: number; width: number; height: number }) {
  const t = useLoop(5000 + spread(index, 1) * 4000, spread(index, 2) * 3000);
  const x = width * spread(index, 4);
  const y = height * (0.15 + spread(index, 5) * 0.7);
  return (
    <Animated.View
      testID="firefly"
      style={[
        styles.firefly,
        {
          left: x,
          top: y,
          opacity: t.interpolate({
            inputRange: [0, 0.3, 0.5, 0.7, 1],
            outputRange: [0, 0.9, 0.3, 0.9, 0],
          }),
          transform: [
            {
              translateX: t.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 18, -6] }),
            },
            {
              translateY: t.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -14, -30] }),
            },
          ],
        },
      ]}
    />
  );
}

/** Three blades of grass that sway in the wind. */
function Tuft({ index, still, dark }: { index: number; still: boolean; dark: boolean }) {
  const t = useLoop(2400 + spread(index, 6) * 1600, 0);
  const sway = still
    ? '0deg'
    : t.interpolate({ inputRange: [0, 0.5, 1], outputRange: ['-7deg', '7deg', '-7deg'] });
  const green = dark ? ['#2F5E2A', '#3B7034', '#28502A'] : ['#4E9A3A', '#6DB548', '#3F8A34'];
  const tall = 14 + spread(index, 7) * 12;
  return (
    <Animated.View style={[styles.tuft, { transform: [{ rotate: sway }] }]}>
      {[-1, 0, 1].map((b, i) => (
        <View
          key={b}
          style={[
            styles.blade,
            {
              height: tall * (i === 1 ? 1 : 0.75),
              backgroundColor: green[i],
              transform: [{ rotate: `${b * 14}deg` }],
            },
          ]}
        />
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  leaf: { position: 'absolute', top: 0, borderRadius: 999, borderTopRightRadius: 2 },
  firefly: {
    position: 'absolute',
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#F5E46B',
    shadowColor: '#F5E46B',
    shadowOpacity: 1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  grass: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 6,
  },
  tuft: { flexDirection: 'row', alignItems: 'flex-end', gap: 1, transformOrigin: 'bottom' },
  blade: { width: 4, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
});
