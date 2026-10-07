import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useBlock, useReport, useToggleLike, type FeedItem } from '@/data/social';
import { t } from '@/i18n';
import { isDemo } from '@/lib/env';
import { timeAgo } from '@/lib/time';
import { radius, space, useColors } from '@/theme';
import { CATEGORY_META } from '@/categories';
import { LiveInset } from '@/components/LiveInset';

export function FeedCard({ item }: { item: FeedItem }) {
  const c = useColors();
  const like = useToggleLike();
  const report = useReport();
  const block = useBlock();
  const [menu, setMenu] = useState(false);
  const [reported, setReported] = useState(false);

  const openProfile = () =>
    !item.isMine && router.push({ pathname: '/user/[id]', params: { id: item.userId } });

  return (
    <View
      style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}
      testID="feed-card"
    >
      <View style={styles.header}>
        <Pressable
          onPress={openProfile}
          style={styles.author}
          accessibilityRole="link"
          accessibilityLabel={item.username}
        >
          <View style={[styles.avatar, { backgroundColor: c.category[item.category] }]}>
            <Text style={styles.avatarText}>{item.username.slice(0, 1).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: c.text, fontWeight: '800' }}>
              {item.username}
              {isDemo && !item.isMine ? (
                <Text style={{ color: c.textMuted, fontWeight: '400' }}>
                  {' '}
                  · {t('feed.demoBadge')}
                </Text>
              ) : null}
            </Text>
            <Text style={{ color: c.textMuted, fontSize: 13 }} numberOfLines={1}>
              {t('feed.at', { place: item.placeName })} · {timeAgo(item.createdAt)}
            </Text>
          </View>
        </Pressable>
        {!item.isMine && (
          <Pressable
            onPress={() => setMenu((m) => !m)}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={t('feed.menu')}
          >
            <Ionicons name="ellipsis-horizontal" size={22} color={c.text} />
          </Pressable>
        )}
      </View>

      {menu && (
        <View style={[styles.menu, { backgroundColor: c.surface }]}>
          <Pressable
            onPress={() => {
              report.mutate({
                targetType: 'post',
                targetId: item.id,
                reason: 'Reported from feed',
              });
              setReported(true);
              setMenu(false);
            }}
            accessibilityRole="button"
            style={styles.menuItem}
          >
            <Ionicons name="flag" size={16} color={c.danger} />
            <Text style={{ color: c.danger, fontWeight: '700' }}>{t('feed.report')}</Text>
          </Pressable>
          <Pressable
            onPress={() => block.mutate(item.userId)}
            accessibilityRole="button"
            style={styles.menuItem}
          >
            <Ionicons name="ban" size={16} color={c.text} />
            <Text style={{ color: c.text, fontWeight: '700' }}>
              {t('feed.block', { name: item.username })}
            </Text>
          </Pressable>
        </View>
      )}
      {reported && (
        <Text style={{ color: c.textMuted, paddingHorizontal: space.md }}>
          {t('feed.reported')}
        </Text>
      )}

      <Pressable
        onPress={() =>
          router.push({ pathname: '/(tabs)/explore', params: { place: item.placeId } })
        }
        accessibilityLabel={item.placeName}
      >
        {item.photoUrl ? (
          <View>
            <Image
              source={{ uri: item.photoUrl }}
              style={styles.photo}
              contentFit="cover"
              accessibilityLabel={item.caption || item.placeName}
            />
            {item.selfieUrl && <LiveInset uri={item.selfieUrl} size={96} />}
          </View>
        ) : (
          <View style={styles.photo}>
            <Image
              source={CATEGORY_META[item.category].art}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              accessible={false}
            />
            <View style={[styles.placeLabel, { backgroundColor: c.card }]}>
              <Text style={{ color: c.category[item.category], fontWeight: '800' }}>
                {item.placeName}
              </Text>
            </View>
          </View>
        )}
      </Pressable>

      <View style={styles.actions}>
        <Pressable
          onPress={() => like.mutate(item)}
          accessibilityRole="button"
          accessibilityLabel={item.likedByMe ? t('feed.unlike') : t('feed.like')}
          accessibilityState={{ selected: item.likedByMe }}
          hitSlop={8}
          testID="like-button"
        >
          <Ionicons
            name={item.likedByMe ? 'heart' : 'heart-outline'}
            size={26}
            color={item.likedByMe ? c.danger : c.text}
          />
        </Pressable>
        <Text style={{ color: c.text, fontWeight: '700' }}>
          {t('feed.likes', { count: item.likeCount })}
        </Text>
      </View>
      {!!item.caption && (
        <Text style={{ color: c.text, paddingHorizontal: space.md, paddingBottom: space.md }}>
          <Text style={{ fontWeight: '800' }}>{item.username} </Text>
          {item.caption}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.md, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth },
  header: { flexDirection: 'row', alignItems: 'center', padding: space.md, gap: space.sm },
  author: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.sm },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '900' },
  menu: { marginHorizontal: space.md, borderRadius: radius.sm, padding: space.xs },
  menuItem: {
    flexDirection: 'row',
    gap: space.sm,
    alignItems: 'center',
    padding: space.sm,
    minHeight: 44,
  },
  photo: { width: '100%', aspectRatio: 1 },
  placeLabel: {
    position: 'absolute',
    left: space.md,
    bottom: space.md,
    borderRadius: radius.pill,
    paddingHorizontal: space.md,
    paddingVertical: 6,
  },
  actions: { flexDirection: 'row', alignItems: 'center', gap: space.sm, padding: space.md },
});
