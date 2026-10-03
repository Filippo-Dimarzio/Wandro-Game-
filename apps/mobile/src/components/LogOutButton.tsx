import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';
import { t } from '@/i18n';
import { confirmAction } from '@/lib/confirm';
import { isDemo } from '@/lib/env';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/state/session';
import { radius, useColors } from '@/theme';

export function useLogOut() {
  const reset = useSession((s) => s.reset);
  const qc = useQueryClient();
  return async () => {
    const ok = await confirmAction(
      t('logout.title'),
      isDemo ? t('logout.demoBody') : t('logout.body'),
      t('logout.confirm'),
      t('common.cancel'),
    );
    if (!ok) return false;
    await supabase?.auth.signOut();
    reset();
    qc.clear();
    router.replace('/welcome');
    return true;
  };
}

export function LogOutButton() {
  const c = useColors();
  const logOut = useLogOut();
  return (
    <Pressable
      onPress={logOut}
      accessibilityRole="button"
      style={[styles.button, { borderColor: c.border }]}
      testID="log-out"
    >
      <Text style={{ color: c.danger, fontWeight: '700' }}>{t('logout.confirm')}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderWidth: 1,
    borderRadius: radius.pill,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
