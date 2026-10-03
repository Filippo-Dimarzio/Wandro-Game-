import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CATEGORIES } from '@wandro/shared';
import { CATEGORY_META, learnKey } from '@/categories';
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

        {CATEGORIES.map((cat) => {
          const inCat = places.filter((p) => p.category === cat);
          const found = inCat.filter((p) => ids.has(p.id)).length;
          const color = c.category[cat];
          return (
            <Pressable
              key={cat}
              onPress={() =>
                router.push({ pathname: '/discover/[category]', params: { category: cat } })
              }
              accessibilityRole="button"
              accessibilityLabel={`${t(`category.${cat}`)}, ${t('discover.placeCount', { count: inCat.length })}`}
              style={[styles.card, shadow, { backgroundColor: c.card }]}
              testID={`discover-${cat}`}
            >
              <Image
                source={CATEGORY_META[cat].art}
                style={styles.cover}
                contentFit="cover"
                accessible={false}
              />
              <View style={[styles.body, { backgroundColor: c.categoryTint[cat] }]}>
                <View style={styles.row}>
                  <Ionicons name={CATEGORY_META[cat].icon} size={20} color={color} />
                  <Text style={[styles.cardTitle, { color }]}>{t(`category.${cat}`)}</Text>
                  <Text style={{ color: c.text, fontWeight: '700' }}>
                    {found}/{inCat.length}
                  </Text>
                </View>
                <Text style={{ color: c.text, lineHeight: 20 }} numberOfLines={2}>
                  {t(learnKey(cat, 'intro'))}
                </Text>
              </View>
            </Pressable>
          );
        })}
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
  card: { borderRadius: radius.lg, overflow: 'hidden' },
  cover: { height: 130 },
  body: { padding: space.md, gap: space.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  cardTitle: { fontSize: 18, fontWeight: '900', flex: 1 },
});
