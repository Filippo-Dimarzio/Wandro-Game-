import { Image } from 'expo-image';
import { View } from 'react-native';
import type { Category } from '@wandro/shared';
import { CATEGORY_META } from '@/categories';
import { useColors } from '@/theme';

/**
 * How far the illustration is zoomed inside the circle. The cards have their own painted frame and
 * paper margin near the edges; zooming crops those off so the artwork fills the circle.
 */
export const MARK_ZOOM = 1.3;

/** A category's brand mark: a round crop of its illustration, ringed in the category colour. */
export function CategoryMark({ category, size }: { category: Category; size: number }) {
  const c = useColors();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: Math.max(2, Math.round(size / 20)),
        borderColor: c.category[category],
        overflow: 'hidden',
        backgroundColor: c.categoryTint[category],
      }}
      accessible={false}
      testID={`mark-${category}`}
    >
      <Image
        source={CATEGORY_META[category].art}
        style={{
          position: 'absolute',
          width: `${MARK_ZOOM * 100}%`,
          height: `${MARK_ZOOM * 100}%`,
          left: `${((1 - MARK_ZOOM) / 2) * 100}%`,
          top: `${((1 - MARK_ZOOM) / 2) * 100}%`,
        }}
        contentFit="cover"
        accessible={false}
      />
    </View>
  );
}
