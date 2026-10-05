import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { t, type TranslationKey } from '@/i18n';
import { radius, space, useColors } from '@/theme';

const STEPS: TranslationKey[] = ['howto.step1', 'howto.step2', 'howto.step3', 'howto.step4'];

/** First-run guide, shown until the first discovery (or until dismissed). */
export function HowToPlay() {
  const c = useColors();
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;
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
      <Pressable
        onPress={() => setHidden(true)}
        accessibilityRole="button"
        style={{ alignSelf: 'flex-end' }}
      >
        <Text style={{ color: c.accent, fontWeight: '800' }}>{t('howto.dismiss')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, borderWidth: 2, padding: space.lg, gap: space.sm },
  step: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  num: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
});
