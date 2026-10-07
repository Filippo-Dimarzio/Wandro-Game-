import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GameBackdrop } from '@/components/GameBackdrop';
import { ScreenHeader } from '@/components/ScreenHeader';
import { t, type TranslationKey } from '@/i18n';
import { radius, space, useColors } from '@/theme';

const PRIVACY: TranslationKey[] = [
  'privacy.location',
  'privacy.pings',
  'privacy.live',
  'privacy.photos',
  'privacy.control',
];
const GUIDELINES: TranslationKey[] = ['privacy.g1', 'privacy.g2', 'privacy.g3', 'privacy.g4'];

export default function Privacy() {
  const c = useColors();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <GameBackdrop />
      <ScreenHeader title={t('privacy.title')} />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={[styles.card, { backgroundColor: c.surface }]}>
          {PRIVACY.map((k) => (
            <Text key={k} style={{ color: c.text, lineHeight: 22 }}>
              • {t(k)}
            </Text>
          ))}
        </View>
        <Text style={{ color: c.text, fontSize: 18, fontWeight: '800' }} accessibilityRole="header">
          {t('privacy.guidelinesTitle')}
        </Text>
        <View style={[styles.card, { backgroundColor: c.surface }]}>
          {GUIDELINES.map((k) => (
            <Text key={k} style={{ color: c.text, lineHeight: 22 }}>
              • {t(k)}
            </Text>
          ))}
        </View>
        <Text style={{ color: c.textMuted, fontSize: 13 }}>{t('privacy.attribution')}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: space.lg, gap: space.lg },
  card: { borderRadius: radius.md, padding: space.lg, gap: space.md },
});
