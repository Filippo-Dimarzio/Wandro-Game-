import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useIsDark } from '@/theme';
import { ADVENTURE } from './adventure';

const native = Platform.OS !== 'web';
const LEAVES = 9;
const LEAF_COLORS = ['#5FA83A', '#7DBB3F', '#A7C43D', '#D9A23A', '#4E9A47'];

/** Deterministic spread so leaves don't all fall in a line (no Math.random: stable renders). */
const spread = (i: number, salt: number) => ((i * 9301 + salt * 49297) % 233280) / 233280;

/**
 * The map dressing on top of the storybook map: soft painted edges, a compass rose, and leaves
 * drifting across by day (fireflies at night). Small, see-through and untouchable so places stay legible and
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
      <Vignette dark={dark} />
      <Compass dark={dark} />
      {size.width > 0 &&
        !still &&
        Array.from({ length: LEAVES }, (_, i) =>
          dark ? <Firefly key={i} index={i} {...size} /> : <Leaf key={i} index={i} {...size} />,
        )}
    </View>
  );
}

/** Soft painted edges, like the margin of an illustrated map. */
function Vignette({ dark }: { dark: boolean }) {
  const edge = dark ? 'rgba(0,0,0,0.4)' : 'rgba(232,128,106,0.18)';
  const clear = 'rgba(0,0,0,0)';
  return (
    <>
      <LinearGradient colors={[edge, clear]} style={[styles.edge, styles.top]} />
      <LinearGradient colors={[clear, edge]} style={[styles.edge, styles.bottom]} />
      <LinearGradient
        colors={[edge, clear]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.side, { left: 0 }]}
      />
      <LinearGradient
        colors={[clear, edge]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.side, { right: 0 }]}
      />
    </>
  );
}

/** A compass rose in the corner of the chart. */
function Compass({ dark }: { dark: boolean }) {
  const ink = dark ? ADVENTURE.dark.ink : ADVENTURE.light.ink;
  const paper = dark ? ADVENTURE.dark.paper : ADVENTURE.light.paper;
  return (
    <View style={styles.compass} testID="compass">
      <View style={[styles.ring, { borderColor: ink, backgroundColor: paper }]} />
      {[0, 90, 180, 270].map((deg) => (
        <View
          key={deg}
          style={[
            styles.point,
            {
              backgroundColor: deg === 0 ? '#B3261E' : ink,
              transform: [{ rotate: `${deg}deg` }, { translateY: -13 }, { rotate: '45deg' }],
            },
          ]}
        />
      ))}
      {[45, 135, 225, 315].map((deg) => (
        <View
          key={deg}
          style={[
            styles.minor,
            {
              backgroundColor: ink,
              transform: [{ rotate: `${deg}deg` }, { translateY: -9 }, { rotate: '45deg' }],
            },
          ]}
        />
      ))}
      <View style={[styles.hub, { backgroundColor: ink }]} />
      <Animated.Text style={[styles.north, { color: ink }]}>N</Animated.Text>
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

const styles = StyleSheet.create({
  edge: { position: 'absolute', left: 0, right: 0, height: 70 },
  top: { top: 0 },
  bottom: { bottom: 0 },
  side: { position: 'absolute', top: 0, bottom: 0, width: 40 },
  compass: {
    position: 'absolute',
    right: 22,
    bottom: 120,
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.7,
    transform: [{ scale: 0.8 }],
  },
  ring: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    opacity: 0.9,
  },
  point: { position: 'absolute', width: 12, height: 12 },
  minor: { position: 'absolute', width: 7, height: 7, opacity: 0.8 },
  hub: { position: 'absolute', width: 6, height: 6, borderRadius: 3 },
  north: { position: 'absolute', top: -6, fontSize: 11, fontWeight: '900' },
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
});
