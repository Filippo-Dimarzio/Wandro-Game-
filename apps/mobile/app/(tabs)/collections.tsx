import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLLECTION_COMPLETION_BONUS, type Place } from '@wandro/shared';
import { usePlaces, useUnlockedIds } from '@/data/places';
import { t, type TranslationKey } from '@/i18n';
import { useLocation } from '@/lib/useLocation';
import { radius, space, useColors } from '@/theme';

// Curated collections are server data from Phase 4b; these previews are derived on-device.
const COLLECTIONS: {
  key: TranslationKey;
  colors: [string, string];
  filter: (p: Place) => boolean;
}[] = [
  {
    key: 'collections.palaces',
    colors: ['#B7791F', '#3C2A0A'],
    filter: (p) => /palace|palácio|quinta|chalet|castle/i.test(p.name),
  },
  {
    key: 'collections.coast',
    colors: ['#2B6CB0', '#0A2540'],
    filter: (p) => /beach|praia|cabo|roca/i.test(p.name),
  },
  { key: 'collections.gems', colors: ['#2F855A', '#0B2A24'], filter: (p) => p.uniqueVisitors < 20 },
];

export default function Collections() {
  const c = useColors();
  const loc = useLocation();
  const places = usePlaces(loc.position).data ?? [];
  const { ids } = useUnlockedIds();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={[styles.title, { color: c.text }]} accessibilityRole="header">
          {t('collections.title')}
        </Text>
        {COLLECTIONS.map((col) => {
          const items = places.filter(col.filter);
          const done = items.filter((p) => ids.has(p.id)).length;
          const fraction = items.length ? done / items.length : 0;
          return (
            <View
              key={col.key}
              style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}
              accessible
              accessibilityLabel={`${t(col.key)}, ${t('collections.progress', { done, total: items.length })}`}
            >
              <LinearGradient colors={col.colors} style={styles.cover}>
                <Text style={styles.coverTitle}>{t(col.key)}</Text>
                <Text style={styles.coverMeta}>+{COLLECTION_COMPLETION_BONUS} pts bonus</Text>
              </LinearGradient>
              <View style={{ padding: space.md, gap: space.sm }}>
                <Text style={{ color: c.text, fontWeight: '700' }}>
                  {t('collections.progress', { done, total: items.length })}
                </Text>
                <View style={[styles.track, { backgroundColor: c.border }]}>
                  <View
                    style={[styles.bar, { width: `${fraction * 100}%`, backgroundColor: c.accent }]}
                  />
                </View>
                {items.map((p) => (
                  <View key={p.id} style={styles.item}>
                    <Ionicons
                      name={ids.has(p.id) ? 'checkmark-circle' : 'ellipse-outline'}
                      size={18}
                      color={ids.has(p.id) ? c.accent : c.textMuted}
                    />
                    <Text style={{ color: c.text }}>{p.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: space.lg, gap: space.lg },
  title: { fontSize: 28, fontWeight: '900' },
  card: { borderRadius: radius.lg, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth },
  cover: { height: 120, padding: space.lg, justifyContent: 'flex-end' },
  coverTitle: { color: '#fff', fontSize: 22, fontWeight: '900' },
  coverMeta: { color: 'rgba(255,255,255,0.9)', fontWeight: '600' },
  track: { height: 6, borderRadius: 3, overflow: 'hidden' },
  bar: { height: 6 },
  item: { flexDirection: 'row', gap: space.sm, alignItems: 'center' },
});
