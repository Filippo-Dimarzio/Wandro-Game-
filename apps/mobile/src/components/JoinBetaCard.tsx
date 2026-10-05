import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { t } from '@/i18n';
import { isDemo } from '@/lib/env';
import { radius, space } from '@/theme';
import { WandroLogo } from './WandroLogo';

const BRAND = '#0E7C66';
const CREAM = '#FBF1E4';

/** On the demo site only: invites people who like the demo to join the beta waitlist. */
export function JoinBetaCard() {
  if (!isDemo) return null;
  return (
    <View style={styles.card} testID="join-beta-card">
      <View style={styles.row}>
        <WandroLogo size={36} />
        <Text style={styles.title} accessibilityRole="header">
          {t('joinCard.title')}
        </Text>
      </View>
      <Text style={styles.body}>{t('joinCard.body')}</Text>
      <Pressable
        onPress={() => router.push('/join?src=demo')}
        accessibilityRole="link"
        style={styles.cta}
        testID="join-beta-cta"
      >
        <Text style={styles.ctaText}>{t('joinCard.cta')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: BRAND, borderRadius: radius.lg, padding: space.lg, gap: space.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  title: { color: CREAM, fontSize: 18, fontWeight: '900', flex: 1 },
  body: { color: CREAM, fontSize: 15, opacity: 0.92 },
  cta: {
    alignSelf: 'flex-start',
    backgroundColor: CREAM,
    borderRadius: radius.pill,
    paddingHorizontal: space.lg,
    minHeight: 44,
    justifyContent: 'center',
    marginTop: space.xs,
  },
  ctaText: { color: BRAND, fontWeight: '900' },
});
