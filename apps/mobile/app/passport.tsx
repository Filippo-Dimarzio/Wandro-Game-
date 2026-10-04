import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { regionBySlug } from '@wandro/shared';
import { CATEGORY_META } from '@/categories';
import { ScreenHeader } from '@/components/ScreenHeader';
import { usePassport, type PassportStamp } from '@/data/social';
import { t } from '@/i18n';
import { column, radius, shadow, space, useColors } from '@/theme';

const TILT = ['-4deg', '3deg', '-2deg', '5deg', '-3deg'];

const stampDate = (iso: string) =>
  new Date(iso)
    .toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    .toUpperCase();

/**
 * Your passport: every moment you've shared, stamped onto the page of the city it was in.
 * Moments leave other people's feeds after 24 h; here they stay, for your eyes only.
 */
export default function Passport() {
  const c = useColors();
  const { stamps } = usePassport();
  const [open, setOpen] = useState<PassportStamp | null>(null);

  const pages = new Map<string, PassportStamp[]>();
  for (const s of stamps) {
    const key = s.region ?? '';
    pages.set(key, [...(pages.get(key) ?? []), s]);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenHeader title={t('passport.title')} />
      <ScrollView contentContainerStyle={[styles.container, column]}>
        <Text style={{ color: c.textMuted }}>{t('passport.subtitle')}</Text>
        {stamps.length === 0 && (
          <View style={[styles.empty, { backgroundColor: c.surface }]}>
            <Ionicons name="book-outline" size={40} color={c.textMuted} />
            <Text style={{ color: c.textMuted, textAlign: 'center' }}>{t('passport.empty')}</Text>
          </View>
        )}
        {[...pages.entries()].map(([slug, list]) => {
          const region = slug ? regionBySlug(slug) : undefined;
          return (
            <View
              key={slug || 'elsewhere'}
              style={[styles.page, shadow, { backgroundColor: c.goldSoft, borderColor: c.border }]}
              testID={`passport-page-${slug || 'elsewhere'}`}
            >
              <View style={styles.pageHeader}>
                <Text style={{ fontSize: 26 }} accessible={false}>
                  {region?.flag ?? '🌍'}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.city, { color: c.text }]} accessibilityRole="header">
                    {region?.name ?? t('passport.elsewhere')}
                  </Text>
                  <Text style={{ color: c.textMuted, fontSize: 12 }}>
                    {list.length === 1
                      ? t('passport.stampOne')
                      : t('passport.stamps', { count: list.length })}
                  </Text>
                </View>
              </View>
              <View style={styles.stamps}>
                {list.map((s, i) => (
                  <Pressable
                    key={s.id}
                    onPress={() => setOpen(s)}
                    accessibilityRole="button"
                    accessibilityLabel={`${s.placeName}, ${stampDate(s.createdAt)}`}
                    style={[styles.stamp, { transform: [{ rotate: TILT[i % TILT.length] }] }]}
                    testID="passport-stamp"
                  >
                    <View style={[styles.stampFrame, { borderColor: c.category[s.category] }]}>
                      <Image
                        source={s.photoUrl ? { uri: s.photoUrl } : CATEGORY_META[s.category].art}
                        style={styles.stampPhoto}
                        contentFit="cover"
                        accessible={false}
                      />
                    </View>
                    <Text
                      style={[styles.stampDate, { color: c.category[s.category] }]}
                      numberOfLines={1}
                    >
                      {stampDate(s.createdAt)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          );
        })}
      </ScrollView>

      <Modal visible={!!open} transparent animationType="fade" onRequestClose={() => setOpen(null)}>
        <Pressable
          style={styles.scrim}
          onPress={() => setOpen(null)}
          accessibilityRole="button"
          accessibilityLabel={t('moments.close')}
        >
          {open && (
            <View style={[styles.detail, { backgroundColor: c.card }]}>
              <Image
                source={open.photoUrl ? { uri: open.photoUrl } : CATEGORY_META[open.category].art}
                style={styles.detailPhoto}
                contentFit="cover"
                accessibilityLabel={open.caption || open.placeName}
              />
              <View style={{ padding: space.md, gap: 4 }}>
                <Text style={{ color: c.text, fontSize: 18, fontWeight: '900' }}>
                  {open.placeName}
                </Text>
                <Text style={{ color: c.textMuted, fontSize: 12, fontWeight: '700' }}>
                  {stampDate(open.createdAt)}
                </Text>
                {!!open.caption && <Text style={{ color: c.text }}>{open.caption}</Text>}
              </View>
            </View>
          )}
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: space.lg, paddingTop: 0, gap: space.lg, paddingBottom: space.xxl },
  empty: { borderRadius: radius.lg, padding: space.xl, gap: space.md, alignItems: 'center' },
  page: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: space.md,
    gap: space.md,
  },
  pageHeader: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  city: { fontSize: 20, fontWeight: '900', letterSpacing: 0.5 },
  stamps: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md, justifyContent: 'flex-start' },
  stamp: { width: 92, alignItems: 'center', gap: 4 },
  stampFrame: {
    width: 88,
    height: 88,
    borderRadius: radius.md,
    borderWidth: 3,
    borderStyle: 'dashed',
    padding: 4,
    backgroundColor: '#fff',
  },
  stampPhoto: { flex: 1, borderRadius: radius.sm },
  stampDate: { fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.lg,
  },
  detail: { width: '100%', maxWidth: 420, borderRadius: radius.lg, overflow: 'hidden' },
  detailPhoto: { width: '100%', aspectRatio: 1 },
});
