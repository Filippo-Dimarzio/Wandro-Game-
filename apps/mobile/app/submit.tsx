import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CATEGORIES, type Category } from '@wandro/shared';
import { Check } from '@/components/Check';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useSubmitPlace } from '@/data/moderation';
import { t } from '@/i18n';
import { useLocation } from '@/lib/useLocation';
import { radius, space, useColors } from '@/theme';

export default function Submit() {
  const c = useColors();
  const params = useLocalSearchParams<{ lat?: string; lng?: string }>();
  const loc = useLocation();
  const lat = params.lat ? Number(params.lat) : loc.position.lat;
  const lng = params.lng ? Number(params.lng) : loc.position.lng;
  const submit = useSubmitPlace();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('nature');
  const [isPublic, setPublic] = useState(false);
  const [isSafe, setSafe] = useState(false);

  const valid = name.trim().length >= 2 && isPublic && isSafe;
  const input = [styles.input, { color: c.text, borderColor: c.border, backgroundColor: c.card }];

  if (submit.isSuccess) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
        <ScreenHeader title={t('submit.title')} />
        <View style={styles.container}>
          <Text style={{ fontSize: 48, textAlign: 'center' }}>🐙</Text>
          <Text
            style={{ color: c.text, fontSize: 18, textAlign: 'center' }}
            accessibilityLiveRegion="polite"
          >
            {t('submit.sent')}
          </Text>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            style={[styles.send, { backgroundColor: c.accent }]}
          >
            <Text style={{ color: c.accentOn, fontWeight: '800' }}>{t('reward.done')}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenHeader title={t('submit.title')} />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={{ color: c.textMuted }}>{t('submit.intro')}</Text>
        <Text style={{ color: c.text }}>
          📍 {t('submit.location', { lat: lat.toFixed(5), lng: lng.toFixed(5) })}
        </Text>
        <TextInput
          style={input}
          value={name}
          onChangeText={setName}
          placeholder={t('submit.name')}
          placeholderTextColor={c.textMuted}
          accessibilityLabel={t('submit.name')}
          maxLength={120}
          testID="submit-name"
        />
        <TextInput
          style={[input, { minHeight: 90 }]}
          value={description}
          onChangeText={setDescription}
          placeholder={t('submit.description')}
          placeholderTextColor={c.textMuted}
          accessibilityLabel={t('submit.description')}
          multiline
          maxLength={1000}
        />
        <Text style={{ color: c.text, fontWeight: '700' }}>{t('submit.category')}</Text>
        <View style={styles.chips}>
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat}
              onPress={() => setCategory(cat)}
              accessibilityRole="radio"
              accessibilityState={{ checked: category === cat }}
              style={[
                styles.chip,
                {
                  borderColor: c.category[cat],
                  backgroundColor: category === cat ? c.category[cat] : c.card,
                },
              ]}
            >
              <Text style={{ color: category === cat ? '#fff' : c.text, fontWeight: '600' }}>
                {t(`category.${cat}`)}
              </Text>
            </Pressable>
          ))}
        </View>
        <Check
          label={t('submit.public')}
          value={isPublic}
          onChange={setPublic}
          testID="check-public"
        />
        <Check label={t('submit.safe')} value={isSafe} onChange={setSafe} testID="check-safe" />
        <Pressable
          disabled={!valid || submit.isPending}
          onPress={() =>
            submit.mutate({
              name: name.trim(),
              description: description.trim(),
              category,
              lat,
              lng,
              isPublicAccess: isPublic,
              isSafe,
            })
          }
          accessibilityRole="button"
          accessibilityState={{ disabled: !valid }}
          style={[styles.send, { backgroundColor: valid ? c.accent : c.border }]}
          testID="submit-send"
        >
          <Text style={{ color: valid ? c.accentOn : c.textMuted, fontWeight: '800' }}>
            {t('submit.send')}
          </Text>
        </Pressable>
        {submit.isError && <Text style={{ color: c.danger }}>{t('common.error')}</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: space.lg, gap: space.md },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    minHeight: 48,
    paddingHorizontal: space.md,
    fontSize: 16,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: {
    borderWidth: 1.5,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    minHeight: 40,
    justifyContent: 'center',
  },
  send: {
    borderRadius: radius.pill,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: space.sm,
  },
});
