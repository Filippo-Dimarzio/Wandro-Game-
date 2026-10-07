import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import { t } from '@/i18n';

/**
 * A live photo's selfie in the top corner of the main photo, BeReal style, with a small LIVE tag.
 * `size` is the inset's width; it keeps a portrait 3:4 shape.
 */
export function LiveInset({ uri, size }: { uri: string; size: number }) {
  const small = size < 40;
  return (
    <View
      style={[styles.wrap, { width: size, height: size * 1.33, borderRadius: size * 0.16 }]}
      pointerEvents="none"
      testID="live-inset"
    >
      <Image
        source={{ uri }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        accessibilityLabel={t('photo.selfie')}
      />
      {!small && (
        <View style={styles.tag}>
          <Text style={styles.tagText}>{t('photo.liveTag')}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 8,
    left: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: '#000',
  },
  tag: {
    position: 'absolute',
    bottom: 3,
    alignSelf: 'center',
    backgroundColor: '#E53E3E',
    borderRadius: 4,
    paddingHorizontal: 4,
  },
  tagText: { color: '#fff', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
});
