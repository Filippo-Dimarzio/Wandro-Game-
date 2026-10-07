import { Pressable, StyleSheet, Text, View } from 'react-native';
import { t, type TranslationKey } from '@/i18n';
import { radius, space, useColors } from '@/theme';

const STEPS: TranslationKey[] = ['howto.step1', 'howto.step2', 'howto.step3', 'howto.step4'];

/** The first-run guide: a Home tip until dismissed, and always on the How to play page. */
export function HowToPlay({ onDismiss }: { onDismiss?: () => void }) {
  const c = useColors();
  return (
    <View
      style={[styles.card, { backgroundColor: c.surface, borderColor: c.accent }]}
      testID="how-to-play"
    >
      <Text style={{ color: c.text, fontSize: 18, fontWeight: '900' }} accessibilityRole="header">
        {t('howto.title')}
      </Text>
      {STEPS.map((k, i) => (
        <View key={k} style={styles.step}>
          <View style={[styles.num, { backgroundColor: c.accent }]}>
            <Text style={{ color: c.accentOn, fontWeight: '900' }}>{i + 1}</Text>
          </View>
          <Text style={{ color: c.text, flex: 1 }}>{t(k)}</Text>
        </View>
      ))}
      {onDismiss && (
        <Pressable
          onPress={onDismiss}
          accessibilityRole="button"
          style={{ alignSelf: 'flex-end', minHeight: 44, justifyContent: 'center' }}
          testID="how-to-play-dismiss"
        >
          <Text style={{ color: c.accent, fontWeight: '800' }}>{t('howto.dismiss')}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, borderWidth: 2, padding: space.lg, gap: space.sm },
  step: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  num: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
});
