import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CATEGORIES } from '@wandro/shared';
import { CATEGORY_META } from '@/categories';
import { usePlaces, useUnlockedIds } from '@/data/places';
import { t } from '@/i18n';
import { useLocation } from '@/lib/useLocation';
import { radius, shadow, space, useColors } from '@/theme';

/** All interests at a glance; each opens its colour-coded category page. */
export default function DiscoverHub() {
  const c = useColors();
  const loc = useLocation();
  const places = usePlaces(loc.position).data ?? [];
  const { ids } = useUnlockedIds();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t('discover.back')}
          style={[styles.back, shadow, { backgroundColor: c.card }]}
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={22} color={c.text} />
        </Pressable>
        <Text style={[styles.title, { color: c.text }]} accessibilityRole="header">
          {t('discover.title')}
        </Text>
        <Text style={{ color: c.textMuted, fontSize: 16 }}>{t('discover.subtitle')}</Text>

        <View style={styles.grid}>
          {CATEGORIES.map((cat) => {
            const inCat = places.filter((p) => p.category === cat);
            const found = inCat.filter((p) => ids.has(p.id)).length;
            return (
              <Pressable
                key={cat}
                onPress={() =>
                  router.push({ pathname: '/discover/[category]', params: { category: cat } })
                }
                accessibilityRole="button"
                accessibilityLabel={`${t(`category.${cat}`)}, ${t('discover.placeCount', { count: inCat.length })}`}
                style={[styles.tile, shadow, { backgroundColor: c.card }]}
                testID={`discover-${cat}`}
              >
                <Image
                  source={CATEGORY_META[cat].art}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  accessible={false}
                />
                <View style={[styles.label, { backgroundColor: c.card }]}>
                  <Text style={[styles.name, { color: c.category[cat] }]} numberOfLines={1}>
                    {t(`category.${cat}`)}
                  </Text>
                  <Text style={{ color: c.textMuted, fontSize: 12, fontWeight: '700' }}>
                    {found}/{inCat.length}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: space.lg, gap: space.lg, paddingBottom: space.xxl },
  back: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 30, fontWeight: '900' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  tile: {
    flexGrow: 1,
    flexBasis: '45%',
    aspectRatio: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    padding: space.sm,
  },
  label: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    borderRadius: radius.pill,
    paddingHorizontal: space.md,
    minHeight: 34,
  },
  name: { flex: 1, fontSize: 14, fontWeight: '900' },
});
