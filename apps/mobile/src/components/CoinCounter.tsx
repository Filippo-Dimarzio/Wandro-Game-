import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { CoinAmount } from '@/components/CoinIcon';
import { t } from '@/i18n';
import { useColors } from '@/theme';

/** Coin balance that counts up (or down) and flashes "+N" when coins land. */
export function CoinCounter({ coins, size = 16 }: { coins: number; size?: number }) {
  const c = useColors();
  const [shown, setShown] = useState(coins);
  const [delta, setDelta] = useState(0);
  const prev = useRef(coins);
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const from = prev.current;
    prev.current = coins;
    if (from === coins) return;
    setDelta(coins - from);
    fade.setValue(1);
    Animated.timing(fade, { toValue: 0, duration: 1400, useNativeDriver: true }).start();
    let frame = 0;
    const start = Date.now();
    const tick = () => {
      const k = Math.min(1, (Date.now() - start) / 700);
      setShown(Math.round(from + (coins - from) * k));
      if (k < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [coins, fade]);

  return (
    <View style={styles.row} accessible accessibilityLabel={t('coins.a11y', { coins })}>
      <CoinAmount amount={shown} color={c.gold} size={size} />
      {delta !== 0 && (
        <Animated.Text
          style={[
            styles.delta,
            { color: delta > 0 ? c.accent : c.danger, opacity: fade, fontSize: size * 0.8 },
          ]}
        >
          {delta > 0 ? `+${delta}` : delta}
        </Animated.Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  delta: { position: 'absolute', right: -6, top: -16, fontWeight: '900' },
});
