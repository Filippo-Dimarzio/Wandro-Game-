import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useSearchProfiles } from '@/data/social';
import { t } from '@/i18n';
import { radius, space, useColors } from '@/theme';

export default function Search() {
  const c = useColors();
  const [q, setQ] = useState('');
  const results = useSearchProfiles(q);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenHeader title={t('search.title')} />
      <View style={{ paddingHorizontal: space.lg }}>
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder={t('search.placeholder')}
          placeholderTextColor={c.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel={t('search.placeholder')}
          style={[styles.input, { color: c.text, borderColor: c.border, backgroundColor: c.card }]}
        />
      </View>
      <FlatList
        data={results}
        keyExtractor={(u) => u.id}
        contentContainerStyle={{ padding: space.lg, gap: space.sm }}
        ListEmptyComponent={<Text style={{ color: c.textMuted }}>{t('search.empty')}</Text>}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push({ pathname: '/user/[id]', params: { id: item.id } })}
            accessibilityRole="link"
            style={[styles.row, { backgroundColor: c.surface }]}
          >
            <View style={[styles.avatar, { backgroundColor: c.accent }]}>
              <Text style={{ color: '#fff', fontWeight: '900' }}>
                {item.username.slice(0, 1).toUpperCase()}
              </Text>
            </View>
            <Text style={{ color: c.text, fontWeight: '700', flex: 1 }}>{item.username}</Text>
            {item.isPrivate && <Text accessibilityLabel="private">🔒</Text>}
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderRadius: radius.pill,
    minHeight: 46,
    paddingHorizontal: space.lg,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    borderRadius: radius.md,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
