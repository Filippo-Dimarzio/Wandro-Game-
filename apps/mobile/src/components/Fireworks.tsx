import { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';

const native = Platform.OS !== 'web';
const COLORS = ['#FFD54A', '#FF6B6B', '#5BC0FF', '#7CE38B', '#FF9F43', '#C792EA'];
const SPARKS = 14;

/** Deterministic spread, so bursts land in the same places on every render. */
const spread = (i: number, salt: number) => ((i * 9301 + salt * 49297) % 233280) / 233280;

/** Bursts of sparks going off across the screen, a few at a time, then fading out. */
export function Fireworks({ bursts = 7, testID }: { bursts?: number; testID?: string }) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" testID={testID}>
      {Array.from({ length: bursts }, (_, i) => (
        <Burst key={i} index={i} />
      ))}
    </View>
  );
}

function Burst({ index }: { index: number }) {
  const t = useRef(new Animated.Value(0)).current;
  const color = COLORS[index % COLORS.length];
  const radius = 60 + spread(index, 1) * 50;
  const left = `${10 + spread(index, 2) * 80}%` as const;
  const top = `${8 + spread(index, 3) * 45}%` as const;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(index * 380),
        Animated.timing(t, {
          toValue: 1,
          duration: 1300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: native,
        }),
        Animated.delay(600),
      ]),
      { iterations: 3 },
    );
    anim.start();
    return () => anim.stop();
  }, [t, index]);

  return (
    <View style={[styles.burst, { left, top }]}>
      {Array.from({ length: SPARKS }, (_, i) => {
        const a = (i / SPARKS) * Math.PI * 2;
        return (
          <Animated.View
            key={i}
            style={[
              styles.spark,
              {
                backgroundColor: i % 3 ? color : '#FFFFFF',
                opacity: t.interpolate({
                  inputRange: [0, 0.1, 0.7, 1],
                  outputRange: [0, 1, 0.9, 0],
                }),
                transform: [
                  {
                    translateX: t.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, Math.cos(a) * radius],
                    }),
                  },
                  {
                    // Sparks drop a little as they fade, like real ones.
                    translateY: t.interpolate({
                      inputRange: [0, 0.7, 1],
                      outputRange: [0, Math.sin(a) * radius, Math.sin(a) * radius + 24],
                    }),
                  },
                  {
                    scale: t.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0.4, 1.2, 0.5] }),
                  },
                ],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  burst: { position: 'absolute', width: 0, height: 0 },
  spark: { position: 'absolute', width: 6, height: 6, borderRadius: 3, left: -3, top: -3 },
});
