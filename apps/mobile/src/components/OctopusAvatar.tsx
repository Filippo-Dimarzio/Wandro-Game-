import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { shopItem, skinColor } from '@wandro/shared';

interface Props {
  size?: number;
  skin?: string;
  hat?: string;
  /** Incense trail glow. */
  glow?: boolean;
  accessibilityLabel?: string;
}

/** The player's octopus: skin colour, optional hat, optional incense glow. */
export function OctopusAvatar({ size = 64, skin, hat, glow, accessibilityLabel }: Props) {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!glow) return;
    const loop = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 1800,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [glow, pulse]);
  const hatEmoji = shopItem(hat)?.emoji;

  return (
    <View
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
      accessible={!!accessibilityLabel}
      accessibilityLabel={accessibilityLabel}
    >
      {glow && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.glow,
            {
              width: size * 1.8,
              height: size * 1.8,
              borderRadius: size,
              opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] }),
              transform: [
                { scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.15] }) },
              ],
            },
          ]}
        />
      )}
      <View
        style={[
          styles.body,
          { width: size, height: size, borderRadius: size / 2, backgroundColor: skinColor(skin) },
        ]}
      >
        {/* The hat sits on the octopus's head: stacked on top of it, overlapping its crown. */}
        <View style={{ alignItems: 'center', marginTop: hatEmoji ? size * 0.1 : 0 }}>
          {hatEmoji && (
            <Text
              style={[styles.hat, { fontSize: size * 0.3, marginBottom: -size * 0.2 }]}
              testID="avatar-hat"
            >
              {hatEmoji}
            </Text>
          )}
          <Text style={{ fontSize: size * (hatEmoji ? 0.5 : 0.58) }}>🐙</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  glow: { position: 'absolute', backgroundColor: '#F6AD55' },
  body: { alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#fff' },
  hat: { zIndex: 1 },
});
