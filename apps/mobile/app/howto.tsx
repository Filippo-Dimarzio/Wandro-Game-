import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HowToPlay } from '@/components/HowToPlay';
import { ScreenHeader } from '@/components/ScreenHeader';
import { t } from '@/i18n';
import { column, space, useColors } from '@/theme';

/** The first-run guide, always reachable from Profile after the Home tip is closed. */
export default function HowTo() {
  const c = useColors();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenHeader title={t('howto.title')} />
      <ScrollView contentContainerStyle={[styles.container, column]}>
        <HowToPlay />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ container: { padding: space.lg } });
