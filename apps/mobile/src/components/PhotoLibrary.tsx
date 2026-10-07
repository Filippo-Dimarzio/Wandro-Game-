import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CATEGORY_META } from '@/categories';
import { usePassport } from '@/data/social';
import { t } from '@/i18n';
import { radius, space, useColors } from '@/theme';
import { LiveInset } from '@/components/LiveInset';

/**
 * Every photo you've posted, kept here for good. Others see a post in Moments for 24 hours only;
 * your own library never expires. Tap to open the passport with the full photos.
 */
export function PhotoLibrary() {
  const c = useColors();
  const { stamps } = usePassport();
  return (
    <View style={{ gap: space.sm }} testID="photo-library">
      <View style={styles.header}>
        <Text style={[styles.title, { color: c.text }]} accessibilityRole="header">
          {t('library.title')}
        </Text>
        {stamps.length > 0 && (
          <Pressable onPress={() => router.push('/passport')} accessibilityRole="link" hitSlop={8}>
            <Text style={{ color: c.accent, fontWeight: '800' }}>{t('library.all')} →</Text>
          </Pressable>
        )}
      </View>
      <Text style={{ color: c.textMuted }}>{t('library.hint')}</Text>
      {stamps.length === 0 ? (
        <View style={[styles.empty, { backgroundColor: c.surface }]}>
          <Text style={{ color: c.textMuted, textAlign: 'center' }}>{t('library.empty')}</Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {stamps.map((s) => (
            <Pressable
              key={s.id}
              onPress={() => router.push('/passport')}
              accessibilityRole="button"
              accessibilityLabel={s.caption || s.placeName}
              style={styles.tile}
              testID="library-photo"
            >
              <Image
                source={s.photoUrl ? { uri: s.photoUrl } : CATEGORY_META[s.category].art}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                accessible={false}
              />
              {s.selfieUrl && <LiveInset uri={s.selfieUrl} size={26} />}
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 20, fontWeight: '800' },
  empty: { borderRadius: radius.md, padding: space.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  tile: { width: '32.5%', aspectRatio: 1, borderRadius: radius.sm, overflow: 'hidden' },
});
