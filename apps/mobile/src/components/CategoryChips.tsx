import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { CATEGORIES, type Category } from '@wandro/shared';
import { categoryIcon } from '@/categories';
import { t } from '@/i18n';
import { radius, shadow, space, useColors } from '@/theme';

interface Props {
  value: Category | null;
  onChange: (c: Category | null) => void;
}

export function CategoryChips({ value, onChange }: Props) {
  const c = useColors();
  const items: (Category | null)[] = [null, ...CATEGORIES];
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      accessibilityLabel={t('explore.filters')}
    >
      {items.map((cat) => {
        const selected = value === cat;
        const color = cat ? c.category[cat] : c.accent;
        const on = cat ? c.onCategory : c.accentOn;
        return (
          <Pressable
            key={cat ?? 'all'}
            onPress={() => onChange(cat)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            style={[styles.chip, shadow, { backgroundColor: selected ? color : c.card }]}
          >
            {cat && (
              <Ionicons
                name={categoryIcon(cat)}
                size={15}
                color={selected ? on : color}
                accessibilityElementsHidden
              />
            )}
            <Text style={{ color: selected ? on : c.text, fontWeight: '700' }}>
              {cat ? t(`category.${cat}`) : t('explore.all')}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: space.sm, paddingHorizontal: space.lg, paddingVertical: space.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 40,
  },
});
