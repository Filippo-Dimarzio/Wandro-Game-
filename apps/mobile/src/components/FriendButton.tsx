import { Pressable, StyleSheet, Text } from 'react-native';
import {
  useFriendStatus,
  useRemoveFriend,
  useRespondFriendRequest,
  useSendFriendRequest,
} from '@/data/friends';
import { t } from '@/i18n';
import { radius, useColors } from '@/theme';

/** Add friend → Requested → Friends, or Accept when they asked first. */
export function FriendButton({ userId, compact }: { userId: string; compact?: boolean }) {
  const c = useColors();
  const status = useFriendStatus(userId);
  const send = useSendFriendRequest();
  const respond = useRespondFriendRequest();
  const remove = useRemoveFriend();
  const busy = send.isPending || respond.isPending || remove.isPending;

  const { label, onPress, filled } =
    status === 'friends'
      ? { label: `✓ ${t('friends.isFriend')}`, onPress: undefined, filled: false }
      : status === 'outgoing'
        ? { label: t('friends.requested'), onPress: () => remove.mutate(userId), filled: false }
        : status === 'incoming'
          ? {
              label: t('friends.accept'),
              onPress: () => respond.mutate({ userId, accept: true }),
              filled: true,
            }
          : { label: t('friends.add'), onPress: () => send.mutate(userId), filled: true };

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress || busy}
      accessibilityRole="button"
      accessibilityHint={status === 'outgoing' ? t('friends.cancelHint') : undefined}
      style={[
        styles.button,
        compact && styles.compact,
        filled ? { backgroundColor: c.accent } : { borderColor: c.border, borderWidth: 1 },
      ]}
      testID={`friend-button-${userId}`}
    >
      <Text style={{ color: filled ? c.accentOn : c.text, fontWeight: '800' }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: radius.pill,
    minHeight: 48,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compact: { minHeight: 40, paddingHorizontal: 14 },
});
