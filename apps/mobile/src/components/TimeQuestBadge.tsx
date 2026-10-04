import { router } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';
import {
  clockLabel,
  TIME_QUEST_BONUS,
  timeQuestOpen,
  timeQuestWindow,
  type Place,
} from '@wandro/shared';
import { useLoadout } from '@/data/loadout';
import { useTimeQuest } from '@/data/timeQuests';
import { t } from '@/i18n';
import { radius, useColors } from '@/theme';

/** A place's golden-hour or night quest: when it opens, and whether your key is ready. */
export function TimeQuestBadge({ place, now = new Date() }: { place: Place; now?: Date }) {
  const c = useColors();
  const quest = useTimeQuest(place.id);
  const { timeKeyActive } = useLoadout();
  if (!quest) return null;
  const { start, end } = timeQuestWindow(quest, now);
  const open = timeQuestOpen(quest, now);
  const title = t(quest === 'golden' ? 'timeQuest.golden' : 'timeQuest.night', {
    from: clockLabel(start),
    to: clockLabel(end),
  });
  const status = !timeKeyActive
    ? t('timeQuest.needsKey')
    : open
      ? t('timeQuest.openNow', { coins: TIME_QUEST_BONUS })
      : t('timeQuest.keyReady', { coins: TIME_QUEST_BONUS });
  return (
    <Pressable
      onPress={timeKeyActive ? undefined : () => router.push('/shop')}
      disabled={timeKeyActive}
      accessibilityRole={timeKeyActive ? 'text' : 'button'}
      accessibilityLabel={`${title}. ${status}`}
      style={[styles.badge, { backgroundColor: quest === 'golden' ? c.goldSoft : c.surface }]}
      testID="time-quest"
    >
      <Text style={{ color: c.text, fontWeight: '800' }}>
        {quest === 'golden' ? '🌅' : '🌙'} {title}
      </Text>
      <Text style={{ color: open && timeKeyActive ? c.accent : c.textMuted, fontWeight: '700' }}>
        🗝️ {status}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: { borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 8, gap: 2 },
});
