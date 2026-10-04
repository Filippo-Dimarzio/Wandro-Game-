import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import { COIN_MASCOT } from '@/coin';

/** A gold coin with the mascot on its face. Decorative: pair it with a labelled amount. */
export function CoinIcon({ size = 18 }: { size?: number }) {
  const face = size * 0.78;
  return (
    <View
      style={[styles.rim, { width: size, height: size, borderRadius: size / 2 }]}
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      testID="coin-icon"
    >
      <LinearGradient
        colors={['#FFE89A', '#F7C431', '#D99A0B']}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: size / 2 }]}
      />
      <View
        style={[
          styles.face,
          {
            width: face,
            height: face,
            borderRadius: face / 2,
            borderWidth: Math.max(1, size / 18),
          },
        ]}
      >
        {COIN_MASCOT ? (
          <Image source={COIN_MASCOT} style={{ width: face * 0.86, height: face * 0.86 }} />
        ) : (
          <Text style={[styles.mark, { fontSize: face * 0.62, lineHeight: face * 0.8 }]}>✦</Text>
        )}
      </View>
    </View>
  );
}

/** Coin + amount on one line, the way prices and rewards are shown everywhere. */
export function CoinAmount({
  amount,
  size = 16,
  color,
  prefix = '',
}: {
  amount: number | string;
  size?: number;
  color: string;
  prefix?: string;
}) {
  return (
    <View style={styles.row}>
      <CoinIcon size={size * 1.15} />
      <Text style={{ color, fontWeight: '900', fontSize: size }}>
        {prefix}
        {amount}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  rim: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#A86B00',
  },
  face: {
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: 'rgba(168,107,0,0.55)',
  },
  mark: { color: '#A86B00', fontWeight: '900', textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
