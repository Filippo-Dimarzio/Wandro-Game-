import * as Haptics from 'expo-haptics';
import { useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { radius, useColors } from '@/theme';

interface Props {
  label: string;
  accessibilityLabel: string;
  onConfirm: () => void;
  durationMs?: number;
  disabled?: boolean;
  testID?: string;
}

/**
 * "Touch to confirm": the user presses and holds while a bar fills. Releasing early cancels,
 * which prevents accidental taps. Screen-reader users get a normal activate action instead,
 * because holding is not possible with VoiceOver/TalkBack.
 */
export function HoldToConfirm({
  label,
  accessibilityLabel,
  onConfirm,
  durationMs = 900,
  disabled,
  testID,
}: Props) {
  const c = useColors();
  const progress = useRef(new Animated.Value(0)).current;
  const [holding, setHolding] = useState(false);

  const fire = () => {
    if (Platform.OS !== 'web')
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    onConfirm();
  };

  const start = () => {
    if (disabled) return;
    setHolding(true);
    if (Platform.OS !== 'web')
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    Animated.timing(progress, {
      toValue: 1,
      duration: durationMs,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start(({ finished }) => {
      setHolding(false);
      progress.setValue(0);
      if (finished) fire();
    });
  };

  const cancel = () => {
    progress.stopAnimation();
    progress.setValue(0);
    setHolding(false);
  };

  const width = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <Pressable
      testID={testID}
      onPressIn={start}
      onPressOut={cancel}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled, busy: holding }}
      accessibilityActions={[{ name: 'activate' }]}
      onAccessibilityAction={(e) => e.nativeEvent.actionName === 'activate' && !disabled && fire()}
      style={[styles.button, { backgroundColor: disabled ? c.border : c.accent }]}
    >
      <Animated.View style={[styles.fill, { width, backgroundColor: 'rgba(255,255,255,0.28)' }]} />
      <View style={styles.labelWrap}>
        <Text style={[styles.label, { color: disabled ? c.textMuted : c.accentOn }]}>{label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: radius.pill,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  fill: { position: 'absolute', left: 0, top: 0, bottom: 0 },
  labelWrap: { paddingHorizontal: 20, alignItems: 'center' },
  label: { fontSize: 16, fontWeight: '700' },
});
