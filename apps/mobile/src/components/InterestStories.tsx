import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CATEGORIES, type Category, type Place } from '@wandro/shared';
import { CategoryMark } from '@/components/CategoryMark';
import { t } from '@/i18n';
import { space, useColors } from '@/theme';

const STORY = 64;
const RING = 3;

/**
 * Interests as a row of stories at the top of Home, Instagram style. A bright ring means there's
 * still something to discover in that interest; a grey one means you've found it all. Tapping
 * opens the map showing only that interest's challenges.
 */
export function InterestStories({ places, unlocked }: { places: Place[]; unlocked: Set<string> }) {
  const c = useColors();
  const left = (cat: Category) =>
    places.filter((p) => p.category === cat && !unlocked.has(p.id)).length;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      testID="interest-stories"
    >
      {CATEGORIES.map((cat) => {
        const fresh = left(cat) > 0;
        return (
          <Pressable
            key={cat}
            onPress={() =>
              router.push({
                pathname: '/(tabs)/explore',
                // `at` makes a second tap on the same interest still re-apply the filter.
                params: { category: cat, at: String(Date.now()) },
              })
            }
            accessibilityRole="button"
            accessibilityLabel={`${t(`category.${cat}`)}, ${
              fresh ? t('home.storyLeft', { count: left(cat) }) : t('home.storyDone')
            }`}
            style={styles.story}
            testID={`interest-${cat}`}
          >
            <LinearGradient
              colors={fresh ? [c.category[cat], '#F6AD55', '#E53E8C'] : [c.border, c.border]}
              start={{ x: 0, y: 1 }}
              end={{ x: 1, y: 0 }}
              style={styles.ring}
            >
              <View style={[styles.gap, { backgroundColor: c.bg }]}>
                <CategoryMark category={cat} size={STORY - RING * 2 - 4} />
              </View>
            </LinearGradient>
            <Text style={[styles.label, { color: c.text }]} numberOfLines={2}>
              {t(`category.${cat}`)}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: space.md, paddingRight: space.lg },
  story: { width: STORY + 8, alignItems: 'center', gap: 4 },
  ring: {
    width: STORY,
    height: STORY,
    borderRadius: STORY / 2,
    padding: RING,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gap: {
    width: STORY - RING * 2,
    height: STORY - RING * 2,
    borderRadius: STORY / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
});
