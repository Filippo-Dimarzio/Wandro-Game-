import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { t } from '@/i18n';

const DAILY_ID = 'wandro-daily-challenge';

/**
 * Local daily reminder at 17:00 (no server, no location). Push notifications for friend
 * activity need a push service and arrive with the backend rollout.
 */
export async function setDailyReminder(enabled: boolean): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  await Notifications.cancelScheduledNotificationAsync(DAILY_ID).catch(() => undefined);
  if (!enabled) return true;
  const perm = await Notifications.requestPermissionsAsync();
  if (!perm.granted) return false;
  await Notifications.scheduleNotificationAsync({
    identifier: DAILY_ID,
    content: { title: t('notify.dailyTitle'), body: t('notify.dailyBody') },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: 17, minute: 0 },
  });
  return true;
}
