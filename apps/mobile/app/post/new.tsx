import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/components/ScreenHeader';
import { usePlaces } from '@/data/places';
import { useCreatePost } from '@/data/social';
import { t } from '@/i18n';
import { BlankPhotoError, pickCleanPhoto } from '@/lib/photo';
import { useLocation } from '@/lib/useLocation';
import { radius, space, useColors } from '@/theme';

export default function NewPost() {
  const c = useColors();
  const { place: placeId } = useLocalSearchParams<{ place: string }>();
  const loc = useLocation();
  const place = (usePlaces(loc.position).data ?? []).find((p) => p.id === placeId);
  const create = useCreatePost();
  const [caption, setCaption] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [blank, setBlank] = useState(false);

  const pick = (source: 'camera' | 'library') => {
    setBlank(false);
    return pickCleanPhoto(source)
      .then((uri) => uri && setPhoto(uri))
      .catch((e) => setBlank(e instanceof BlankPhotoError));
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenHeader title={t('post.title')} />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={{ color: c.text, fontSize: 18, fontWeight: '800' }}>{place?.name}</Text>
        {photo ? (
          <View>
            <Image
              source={{ uri: photo }}
              style={styles.photo}
              contentFit="cover"
              accessibilityLabel={place?.name}
            />
            <Pressable
              onPress={() => setPhoto(null)}
              accessibilityRole="button"
              style={styles.remove}
            >
              <Text style={{ color: '#fff', fontWeight: '700' }}>{t('post.removePhoto')}</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.row}>
            {Platform.OS !== 'web' && (
              <PickButton icon="camera" label={t('post.camera')} onPress={() => pick('camera')} />
            )}
            <PickButton icon="images" label={t('post.library')} onPress={() => pick('library')} />
          </View>
        )}
        {blank && (
          <Text
            style={{ color: c.danger, fontWeight: '700' }}
            accessibilityLiveRegion="polite"
            testID="blank-photo"
          >
            {t('post.blankPhoto')}
          </Text>
        )}
        <Text style={{ color: c.textMuted, fontSize: 13 }}>🔒 {t('post.privacy')}</Text>
        <TextInput
          value={caption}
          onChangeText={setCaption}
          placeholder={t('post.caption')}
          placeholderTextColor={c.textMuted}
          maxLength={500}
          multiline
          accessibilityLabel={t('post.caption')}
          style={[styles.input, { color: c.text, borderColor: c.border, backgroundColor: c.card }]}
        />
        <Text style={{ color: c.textMuted }}>{t('post.optional')}</Text>
        <Pressable
          disabled={!place || create.isPending}
          onPress={() =>
            create.mutate(
              { placeId: placeId!, caption: caption.trim(), photoUri: photo ?? undefined },
              { onSuccess: () => router.replace('/(tabs)/capture') },
            )
          }
          accessibilityRole="button"
          style={[styles.share, { backgroundColor: c.accent, opacity: create.isPending ? 0.6 : 1 }]}
          testID="share-post"
        >
          <Text style={{ color: c.accentOn, fontWeight: '900', fontSize: 16 }}>
            {t('post.share')}
          </Text>
        </Pressable>
        {create.isError && <Text style={{ color: c.danger }}>{t('common.error')}</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}

function PickButton({
  icon,
  label,
  onPress,
}: {
  icon: 'camera' | 'images';
  label: string;
  onPress: () => void;
}) {
  const c = useColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={[styles.pick, { borderColor: c.border, backgroundColor: c.surface }]}
    >
      <Ionicons name={icon} size={28} color={c.accent} />
      <Text style={{ color: c.text, fontWeight: '700' }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { padding: space.lg, gap: space.md },
  row: { flexDirection: 'row', gap: space.md },
  pick: {
    flex: 1,
    aspectRatio: 1.4,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
  },
  photo: { width: '100%', aspectRatio: 1, borderRadius: radius.md },
  remove: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    minHeight: 90,
    padding: space.md,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  share: {
    borderRadius: radius.pill,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
