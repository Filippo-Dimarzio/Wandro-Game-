import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { CATEGORIES, type Category } from '@wandro/shared';
import { t } from '@/i18n';
import { radius, space, useColors } from '@/theme';

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
        return (
          <Pressable
            key={cat ?? 'all'}
            onPress={() => onChange(cat)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            style={[
              styles.chip,
              { borderColor: color, backgroundColor: selected ? color : c.card },
            ]}
          >
            <Text style={{ color: selected ? '#fff' : c.text, fontWeight: '600' }}>
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
    borderWidth: 1.5,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 40,
    justifyContent: 'center',
  },
});
