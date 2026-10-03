import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLLECTION_COMPLETION_BONUS, type Category, type Place } from '@wandro/shared';
import { CATEGORY_META } from '@/categories';
import { usePlaces, useUnlockedIds } from '@/data/places';
import { t, type TranslationKey } from '@/i18n';
import { useLocation } from '@/lib/useLocation';
import { radius, shadow, space, useColors } from '@/theme';

// Curated collections are server data from Phase 4b; these previews are derived on-device.
const COLLECTIONS: {
  key: TranslationKey;
  /** Colour and cover come from this category. */
  theme: Category;
  filter: (p: Place) => boolean;
}[] = [
  {
    key: 'collections.palaces',
    theme: 'heritage',
    filter: (p) => /palace|palácio|quinta|chalet|castle/i.test(p.name),
  },
  { key: 'collections.coast', theme: 'coast', filter: (p) => p.category === 'coast' },
  { key: 'collections.gems', theme: 'other', filter: (p) => p.uniqueVisitors < 20 },
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
              style={[styles.card, shadow, { backgroundColor: c.card }]}
              accessible
              accessibilityLabel={`${t(col.key)}, ${t('collections.progress', { done, total: items.length })}`}
            >
              <Image
                source={CATEGORY_META[col.theme].art}
                style={styles.cover}
                contentFit="cover"
                accessible={false}
              />
              <View style={[styles.coverText, { backgroundColor: c.categoryTint[col.theme] }]}>
                <Text style={[styles.coverTitle, { color: c.category[col.theme] }]}>
                  {t(col.key)}
                </Text>
                <Text style={{ color: c.text, fontWeight: '600' }}>
                  {t('challenge.bonus', { points: COLLECTION_COMPLETION_BONUS })}
                </Text>
              </View>
              <View style={{ padding: space.md, gap: space.sm }}>
                <Text style={{ color: c.text, fontWeight: '700' }}>
                  {t('collections.progress', { done, total: items.length })}
                </Text>
                <View style={[styles.track, { backgroundColor: c.border }]}>
                  <View
                    style={[
                      styles.bar,
                      { width: `${fraction * 100}%`, backgroundColor: c.category[col.theme] },
                    ]}
                  />
                </View>
                {items.map((p) => (
                  <View key={p.id} style={styles.item}>
                    <Ionicons
                      name={ids.has(p.id) ? 'checkmark-circle' : 'ellipse-outline'}
                      size={18}
                      color={ids.has(p.id) ? c.category[col.theme] : c.textMuted}
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
  card: { borderRadius: radius.lg, overflow: 'hidden' },
  cover: { height: 120 },
  coverText: { paddingHorizontal: space.lg, paddingVertical: space.md, gap: 2 },
  coverTitle: { fontSize: 22, fontWeight: '900' },
  track: { height: 6, borderRadius: 3, overflow: 'hidden' },
  bar: { height: 6 },
  item: { flexDirection: 'row', gap: space.sm, alignItems: 'center' },
});
