import { useEffect, useRef } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { radius } from '@/theme';

const native = Platform.OS !== 'web';

/**
 * A card that slides in when it appears (staggered by `index`) and gives a soft press-down
 * when tapped. Without `onPress` it only animates in. Respects Reduce Motion.
 */
export function AnimatedCard({
  index = 0,
  style,
  contentStyle,
  children,
  onPress,
  ...pressable
}: Omit<PressableProps, 'style' | 'children'> & {
  index?: number;
  /** Card look: background, shadow, width, radius. */
  style?: StyleProp<ViewStyle>;
  /** Layout of what's inside (padding, alignment). */
  contentStyle?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}) {
  const enter = useRef(new Animated.Value(0)).current;
  const press = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then((reduce) => {
        if (cancelled) return;
        if (reduce) return enter.setValue(1);
        Animated.timing(enter, {
          toValue: 1,
          duration: 380,
          delay: Math.min(index, 6) * 60,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: native,
        }).start();
      });
    return () => {
      cancelled = true;
    };
  }, [enter, index]);

  const springTo = (toValue: number) =>
    Animated.spring(press, { toValue, speed: 40, bounciness: 6, useNativeDriver: native }).start();

  const flat = StyleSheet.flatten(style) ?? {};
  const animated = {
    opacity: enter,
    transform: [
      { translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) },
      { scale: press },
    ],
  };
  const inner = { borderRadius: flat.borderRadius ?? radius.lg, overflow: 'hidden' as const };

  return (
    <Animated.View style={[{ borderRadius: radius.lg }, style, animated]}>
      {onPress ? (
        <Pressable
          {...pressable}
          onPress={onPress}
          onPressIn={(e) => {
            springTo(0.97);
            pressable.onPressIn?.(e);
          }}
          onPressOut={(e) => {
            springTo(1);
            pressable.onPressOut?.(e);
          }}
          style={[inner, { flexGrow: 1 }, contentStyle]}
        >
          {children}
        </Pressable>
      ) : (
        <Animated.View style={[inner, contentStyle]} testID={pressable.testID ?? undefined}>
          {children}
        </Animated.View>
      )}
    </Animated.View>
  );
}
