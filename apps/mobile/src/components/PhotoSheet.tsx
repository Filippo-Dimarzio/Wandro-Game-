import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { Place } from '@wandro/shared';
import { useUnlockedIds } from '@/data/places';
import { useCreatePost } from '@/data/social';
import { t, type TranslationKey } from '@/i18n';
import {
  BlankPhotoError,
  pickCleanPhoto,
  takeLivePhoto,
  type LivePhoto,
  type PhotoSource,
} from '@/lib/photo';
import { useCheckinPhoto } from '@/state/checkinPhoto';
import { radius, shadow, space, useColors } from '@/theme';

type Pick = PhotoSource | 'live';
const SOURCES: { key: Pick; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { key: 'camera', icon: 'camera' },
  { key: 'live', icon: 'flash' },
  { key: 'library', icon: 'images' },
  { key: 'files', icon: 'folder-open' },
];

/**
 * A small photo box (never more than about a third of the screen): take a photo, a live photo
 * (BeReal style: what you see, then you), or pick one from the camera roll or your files. For a
 * place you've discovered it posts straight to today's moments; for one you haven't, it rides
 * along with your check-in and posts the moment you check in.
 */
export function PhotoSheet({
  place,
  onClose,
  attachOnly = false,
}: {
  place: Place | null;
  onClose: () => void;
  /** From the Check in tab: just attach the photo to the check-in. */
  attachOnly?: boolean;
}) {
  const c = useColors();
  const { ids } = useUnlockedIds();
  const create = useCreatePost();
  const attach = useCheckinPhoto((s) => s.attach);
  const [shot, setShot] = useState<LivePhoto | null>(null);
  const [caption, setCaption] = useState('');
  const [error, setError] = useState<TranslationKey | null>(null);
  useEffect(() => {
    setShot(null);
    setCaption('');
    setError(null);
  }, [place?.id]);
  if (!place) return null;
  const discovered = ids.has(place.id);

  const pick = (key: Pick) => {
    setError(null);
    const p = key === 'live' ? takeLivePhoto() : pickCleanPhoto(key).then((u) => u && { photo: u });
    p.then((r) => r && setShot(r)).catch((e) =>
      setError(e instanceof BlankPhotoError ? 'post.blankPhoto' : 'common.error'),
    );
  };

  const submit = () => {
    if (!shot) return;
    if (discovered && !attachOnly) {
      create.mutate(
        {
          placeId: place.id,
          caption: caption.trim(),
          photoUri: shot.photo,
          selfieUri: shot.selfie,
        },
        { onSuccess: onClose, onError: () => setError('common.error') },
      );
      return;
    }
    attach({ placeId: place.id, photo: shot.photo, selfie: shot.selfie, caption: caption.trim() });
    onClose();
    if (!attachOnly) router.push({ pathname: '/(tabs)/capture', params: { place: place.id } });
  };

  const action = attachOnly ? 'photo.attach' : discovered ? 'photo.post' : 'photo.forCheckin';
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable
          style={[StyleSheet.absoluteFill, styles.scrim]}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={t('photo.close')}
        />
        <View style={[styles.sheet, shadow, { backgroundColor: c.card }]} testID="photo-sheet">
          <View style={styles.head}>
            <Text style={[styles.title, { color: c.text }]} numberOfLines={1}>
              📸 {place.name}
            </Text>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={t('photo.close')}
              hitSlop={10}
            >
              <Ionicons name="close" size={22} color={c.textMuted} />
            </Pressable>
          </View>

          {shot ? (
            <View style={styles.picked}>
              <View>
                <Image
                  source={{ uri: shot.photo }}
                  style={styles.thumb}
                  contentFit="cover"
                  accessibilityLabel={t('photo.preview')}
                  testID="photo-preview"
                />
                {shot.selfie && (
                  <Image
                    source={{ uri: shot.selfie }}
                    style={[styles.selfie, { borderColor: c.card }]}
                    contentFit="cover"
                    accessible={false}
                  />
                )}
              </View>
              <TextInput
                value={caption}
                onChangeText={setCaption}
                placeholder={t('post.caption')}
                placeholderTextColor={c.textMuted}
                maxLength={500}
                accessibilityLabel={t('post.caption')}
                style={[styles.input, { color: c.text, borderColor: c.border }]}
              />
              <Pressable
                onPress={() => setShot(null)}
                accessibilityRole="button"
                accessibilityLabel={t('photo.remove')}
                hitSlop={8}
              >
                <Ionicons name="trash-outline" size={20} color={c.textMuted} />
              </Pressable>
            </View>
          ) : (
            <View style={styles.sources}>
              {SOURCES.map((s) => (
                <Pressable
                  key={s.key}
                  onPress={() => pick(s.key)}
                  accessibilityRole="button"
                  accessibilityLabel={t(`photo.${s.key}` as TranslationKey)}
                  style={[styles.source, { backgroundColor: c.surface }]}
                  testID={`photo-source-${s.key}`}
                >
                  <Ionicons name={s.icon} size={22} color={s.key === 'live' ? c.gold : c.accent} />
                  <Text style={[styles.sourceText, { color: c.text }]} numberOfLines={1}>
                    {t(`photo.${s.key}` as TranslationKey)}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          {error && (
            <Text style={{ color: c.danger, fontWeight: '700' }} accessibilityLiveRegion="polite">
              {t(error)}
            </Text>
          )}
          {!shot && <Text style={{ color: c.textMuted, fontSize: 12 }}>{t('photo.liveHint')}</Text>}
          {shot && (
            <Pressable
              onPress={submit}
              disabled={create.isPending}
              accessibilityRole="button"
              style={[
                styles.go,
                { backgroundColor: c.accent, opacity: create.isPending ? 0.6 : 1 },
              ]}
              testID="photo-submit"
            >
              <Text style={{ color: c.accentOn, fontWeight: '900' }}>{t(action)}</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}

/** The little camera on every challenge: opens the photo box for that place. */
export function PhotoButton({ place, size = 30 }: { place: Place; size?: number }) {
  const c = useColors();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={t('photo.icon', { place: place.name })}
        hitSlop={6}
        style={[
          styles.icon,
          { width: size, height: size, borderRadius: size / 2, backgroundColor: c.card },
        ]}
        testID={`photo-button-${place.id}`}
      >
        <Ionicons name="camera" size={size * 0.55} color={c.accent} />
      </Pressable>
      {open && <PhotoSheet place={place} onClose={() => setOpen(false)} />}
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  scrim: { backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    width: '100%',
    maxWidth: 520,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: space.lg,
    paddingBottom: space.xl,
    gap: space.md,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  title: { flex: 1, fontSize: 16, fontWeight: '900' },
  sources: { flexDirection: 'row', gap: space.sm },
  source: {
    flex: 1,
    height: 64,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  sourceText: { fontSize: 11, fontWeight: '800' },
  picked: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  thumb: { width: 64, height: 64, borderRadius: radius.sm },
  selfie: {
    position: 'absolute',
    left: -6,
    top: -6,
    width: 26,
    height: 34,
    borderRadius: 6,
    borderWidth: 2,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    minHeight: 44,
    fontSize: 15,
  },
  go: { borderRadius: radius.pill, minHeight: 46, alignItems: 'center', justifyContent: 'center' },
  icon: { alignItems: 'center', justifyContent: 'center', ...shadow },
});
