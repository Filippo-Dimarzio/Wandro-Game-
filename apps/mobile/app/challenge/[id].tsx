import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  FRIEND_NOTE_MAX,
  formatDistance,
  haversineMeters,
  REGIONS,
  type LatLng,
} from '@wandro/shared';
import { placeImage } from '@/categories';
import { CategoryPill } from '@/components/PlaceBits';
import { ScreenHeader } from '@/components/ScreenHeader';
import { FRIEND_CHALLENGE_ERRORS, useChallengeFriend, useFriends } from '@/data/friends';
import { usePlaces } from '@/data/places';
import { t, type TranslationKey } from '@/i18n';
import { useLocation } from '@/lib/useLocation';
import { radius, space, useColors } from '@/theme';

/** Pick a place (near you or in any launch city) and send a friend a challenge with an idea. */
export default function ChallengeFriend() {
  const c = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { friends } = useFriends();
  const friend = friends.find((f) => f.id === id);
  const loc = useLocation();
  const [city, setCity] = useState<string | null>(null);
  const center: LatLng = city
    ? (REGIONS.find((r) => r.slug === city)?.center ?? loc.position)
    : loc.position;
  const places = usePlaces(center);
  const [placeId, setPlaceId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const send = useChallengeFriend();

  const list = useMemo(
    () =>
      (places.data ?? [])
        .filter((p) => !p.hidden)
        .map((p) => ({ p, d: haversineMeters(center, p) }))
        .sort((a, b) => a.d - b.d)
        .slice(0, 24),
    [places.data, center],
  );

  const submit = () => {
    if (!placeId || !friend) return;
    setError(null);
    send.mutate(
      { friendId: friend.id, placeId, note },
      {
        onSuccess: () => router.back(),
        onError: (e) => {
          const code = FRIEND_CHALLENGE_ERRORS.find((k) => e.message.includes(k)) ?? 'unknown';
          setError(t(`friends.error.${code}` as TranslationKey));
        },
      },
    );
  };

  if (!friend) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
        <ScreenHeader title={t('friends.challenge')} />
        <Text style={{ color: c.textMuted, padding: space.lg }}>{t('friends.notFriends')}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenHeader title={t('friends.challengeTitle', { name: friend.username })} />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={{ color: c.textMuted }}>{t('friends.challengeIntro')}</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          <Chip label={`📍 ${t('travel.nearMe')}`} selected={!city} onPress={() => setCity(null)} />
          {REGIONS.map((r) => (
            <Chip
              key={r.slug}
              label={`${r.flag} ${r.name}`}
              selected={city === r.slug}
              onPress={() => {
                setCity(r.slug);
                setPlaceId(null);
              }}
            />
          ))}
        </ScrollView>

        <View style={{ gap: space.sm }} accessibilityRole="radiogroup">
          {list.length === 0 && (
            <Text style={{ color: c.textMuted }}>{t('friends.noPlacesHere')}</Text>
          )}
          {list.map(({ p, d }) => {
            const selected = placeId === p.id;
            return (
              <Pressable
                key={p.id}
                onPress={() => setPlaceId(p.id)}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                accessibilityLabel={`${p.name}, ${formatDistance(d)}`}
                style={[
                  styles.place,
                  {
                    backgroundColor: c.card,
                    borderColor: selected ? c.accent : c.border,
                    borderWidth: selected ? 2 : StyleSheet.hairlineWidth,
                  },
                ]}
                testID={`pick-${p.id}`}
              >
                <Image
                  source={placeImage(p)}
                  style={styles.thumb}
                  contentFit="cover"
                  accessible={false}
                />
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={{ color: c.text, fontWeight: '800' }} numberOfLines={1}>
                    {p.name}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <CategoryPill category={p.category} />
                    <Text style={{ color: c.textMuted, fontSize: 12 }}>{formatDistance(d)}</Text>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={{ gap: 6 }}>
          <Text style={{ color: c.text, fontWeight: '800' }}>{t('friends.noteLabel')}</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            maxLength={FRIEND_NOTE_MAX}
            multiline
            placeholder={t('friends.notePlaceholder')}
            placeholderTextColor={c.textMuted}
            style={[styles.note, { color: c.text, backgroundColor: c.surface }]}
            accessibilityLabel={t('friends.noteLabel')}
            testID="challenge-note"
          />
          <Text style={{ color: c.textMuted, fontSize: 12, alignSelf: 'flex-end' }}>
            {note.length}/{FRIEND_NOTE_MAX}
          </Text>
        </View>

        {error && (
          <Text style={{ color: c.danger, fontWeight: '700' }} accessibilityLiveRegion="polite">
            {error}
          </Text>
        )}
        <Pressable
          onPress={submit}
          disabled={!placeId || send.isPending}
          accessibilityRole="button"
          accessibilityState={{ disabled: !placeId || send.isPending }}
          style={[styles.send, { backgroundColor: placeId ? c.accent : c.border }]}
          testID="send-challenge"
        >
          <Text
            style={{ color: placeId ? c.accentOn : c.textMuted, fontWeight: '800', fontSize: 16 }}
          >
            🎯 {t('friends.send')}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const c = useColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[styles.chip, { backgroundColor: selected ? c.accent : c.surface }]}
    >
      <Text style={{ color: selected ? c.accentOn : c.text, fontWeight: '700' }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { padding: space.lg, gap: space.lg },
  chips: { gap: space.sm, paddingRight: space.lg },
  chip: {
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    minHeight: 40,
    justifyContent: 'center',
  },
  place: {
    flexDirection: 'row',
    gap: space.md,
    alignItems: 'center',
    borderRadius: radius.md,
    padding: space.sm,
  },
  thumb: { width: 56, height: 56, borderRadius: radius.sm },
  note: {
    borderRadius: radius.md,
    padding: space.md,
    minHeight: 88,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  send: {
    borderRadius: radius.pill,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
