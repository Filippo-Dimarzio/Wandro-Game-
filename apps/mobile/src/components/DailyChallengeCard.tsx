import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Place } from '@wandro/shared';
import { useDailyChallenge } from '@/data/challenge';
import { t } from '@/i18n';
import { radius, space, useColors } from '@/theme';
import { HoldToConfirm } from './HoldToConfirm';

function formatRemaining(ms: number): string {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function DailyChallengeCard({ places }: { places: Place[] }) {
  const c = useColors();
  const { challenge, confirm } = useDailyChallenge(places);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  if (!challenge) {
    return (
      <View style={[styles.card, { backgroundColor: c.surface }]}>
        <Text style={{ color: c.textMuted }}>{t('challenge.none')}</Text>
      </View>
    );
  }

  const remaining = new Date(challenge.expiresAt).getTime() - now;
  const expired = remaining <= 0 && !challenge.completedAt;

  return (
    <View
      style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}
      testID="daily-challenge"
    >
      <View style={styles.row}>
        <Ionicons name="flash" size={18} color={c.gold} accessibilityElementsHidden />
        <Text style={[styles.kicker, { color: c.gold }]}>{t('challenge.title')}</Text>
        <Text style={[styles.bonus, { color: c.text }]}>
          {t('challenge.bonus', { points: challenge.bonusPoints })}
        </Text>
      </View>
      <Text style={[styles.title, { color: c.text }]} accessibilityRole="header">
        {challenge.title}
      </Text>
      <Text style={{ color: c.textMuted }}>{challenge.description}</Text>
      {!challenge.completedAt && !expired && (
        <Text style={[styles.timer, { color: c.textMuted }]}>
          {t('challenge.endsIn', { time: formatRemaining(remaining) })}
        </Text>
      )}

      <View style={{ marginTop: space.md }}>
        {challenge.completedAt ? (
          <View style={styles.row}>
            <Ionicons name="checkmark-circle" size={20} color={c.accent} />
            <Text style={{ color: c.accent, fontWeight: '700' }}>
              {t('challenge.done', { points: challenge.bonusPoints })}
            </Text>
          </View>
        ) : expired ? (
          <Text style={{ color: c.textMuted }}>{t('challenge.expired')}</Text>
        ) : (
          <>
            <HoldToConfirm
              testID="confirm-challenge"
              label={challenge.isReady ? t('challenge.hold') : t('challenge.notReady')}
              accessibilityLabel={t('challenge.holdA11y')}
              disabled={!challenge.isReady || confirm.isPending}
              onConfirm={() => confirm.mutate(challenge)}
            />
            {confirm.isError && (
              <Text style={{ color: c.danger, marginTop: space.sm }}>{t('common.error')}</Text>
            )}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    padding: space.lg,
    gap: space.xs,
    borderWidth: StyleSheet.hairlineWidth,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  kicker: {
    fontWeight: '800',
    textTransform: 'uppercase',
    fontSize: 12,
    letterSpacing: 0.8,
    flex: 1,
  },
  bonus: { fontWeight: '700' },
  title: { fontSize: 20, fontWeight: '800' },
  timer: { fontSize: 13, marginTop: space.xs },
});
