import type { Ionicons } from '@expo/vector-icons';
import type { ImageSource } from 'expo-image';
import type { Category, Place } from '@wandro/shared';
import type { TranslationKey } from '@/i18n';

interface CategoryMeta {
  icon: keyof typeof Ionicons.glyphMap;
  /** Illustrated cover for cards and category pages, and the fallback when a place has no photo. */
  art: ImageSource;
}

/* eslint-disable @typescript-eslint/no-require-imports -- static asset requires for Metro */
export const CATEGORY_META: Record<Category, CategoryMeta> = {
  coast: { icon: 'water', art: require('../assets/art/coast.webp') },
  nature: { icon: 'leaf', art: require('../assets/art/nature.webp') },
  heritage: { icon: 'business', art: require('../assets/art/heritage.webp') },
  culture: { icon: 'color-palette', art: require('../assets/art/culture.webp') },
  art: { icon: 'brush', art: require('../assets/art/art.webp') },
  music_events: { icon: 'musical-notes', art: require('../assets/art/music_events.webp') },
  other: { icon: 'compass', art: require('../assets/art/other.webp') },
};

/* eslint-enable @typescript-eslint/no-require-imports */

export function categoryIcon(cat: Category): CategoryMeta['icon'] {
  return CATEGORY_META[cat].icon;
}

/** Real photo when we have one (Wikimedia Commons / moderated uploads), else the category art. */
export function placeImage(place: Place): ImageSource {
  return place.photoUrl ? { uri: place.photoUrl } : CATEGORY_META[place.category].art;
}

export function learnKey(cat: Category, part: 'intro' | 'fact1' | 'fact2' | 'fact3' | 'tip') {
  return `learn.${cat}.${part}` as TranslationKey;
}
