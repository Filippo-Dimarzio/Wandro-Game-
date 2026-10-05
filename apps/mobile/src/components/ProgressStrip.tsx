import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CHALLENGE_XP, levelProgress, octopusStage } from '@wandro/shared';
import type { Wallet } from '@/data/wallet';
import { CoinAmount } from '@/components/CoinIcon';
import { t } from '@/i18n';
import { radius, space, useColors } from '@/theme';

export function ProgressStrip({ wallet }: { wallet: Wallet }) {
  const c = useColors();
  const lp = levelProgress(wallet.xp);
  return (
    <Pressable
      onPress={() => router.push('/leaderboard')}
      style={[styles.strip, { backgroundColor: c.surface }]}
      accessibilityRole="button"
      accessibilityLabel={`${t('home.level', { level: lp.level })}, ${octopusStage(lp.level)}, ${t('coins.a11y', { coins: wallet.coins })}, ${t('home.streak', { days: wallet.streak })}`}
      testID="progress-strip"
    >
      <View style={styles.row}>
        <Text style={[styles.level, { color: c.text }]}>
          {'🐙 '}
          {t('home.level', { level: lp.level })} · {octopusStage(lp.level)}
        </Text>
        <CoinAmount amount={wallet.coins} color={c.gold} size={18} />
      </View>
      <View style={[styles.track, { backgroundColor: c.border }]}>
        <View
          style={[
            styles.bar,
            { width: `${Math.round(lp.fraction * 100)}%`, backgroundColor: c.accent },
          ]}
        />
      </View>
      <Text style={{ color: c.textMuted, fontSize: 12 }}>
        {lp.xpIntoLevel}/{lp.xpForNext} XP ·{' '}
        {t(wallet.discoveries === 1 ? 'home.discoveryOne' : 'home.discoveryMany', {
          count: wallet.discoveries,
        })}
        {wallet.streak > 0 ? ` · 🔥 ${t('home.streak', { days: wallet.streak })}` : ''}
      </Text>
      <Text style={{ color: c.textMuted, fontSize: 12 }} testID="xp-explainer">
        {t('home.xpExplainer', { xp: CHALLENGE_XP })}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  strip: { borderRadius: radius.md, padding: space.md, gap: space.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  level: { fontWeight: '700', fontSize: 15 },
  points: { fontWeight: '900', fontSize: 16 },
  track: { height: 6, borderRadius: 3, overflow: 'hidden' },
  bar: { height: 6, borderRadius: 3 },
});
