import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { t } from '@/i18n';
import {
  canPromptInstall,
  isInstalled,
  isWeb,
  onInstallAvailabilityChange,
  promptInstall,
  RELEASES_URL,
} from '@/lib/pwa';
import { useSession } from '@/state/session';
import { radius, space, useColors } from '@/theme';

/** "Get Wandro on your desktop": install the web app, or download the desktop installer. */
export function InstallBanner({ always = false }: { always?: boolean }) {
  const c = useColors();
  const dismissed = useSession((s) => s.installPromptDismissed);
  const dismiss = useSession((s) => s.dismissInstallPrompt);
  const [canInstall, setCanInstall] = useState(canPromptInstall());
  useEffect(() => onInstallAvailabilityChange(() => setCanInstall(canPromptInstall())), []);

  if (!isWeb || isInstalled || (dismissed && !always)) return null;

  return (
    <View
      style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}
      testID="install-banner"
    >
      <View style={styles.row}>
        <Text style={{ fontSize: 28 }}>🖥️</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ color: c.text, fontWeight: '800' }}>{t('install.title')}</Text>
          <Text style={{ color: c.textMuted, fontSize: 13 }}>{t('install.body')}</Text>
        </View>
        {!always && (
          <Pressable
            onPress={dismiss}
            accessibilityRole="button"
            accessibilityLabel={t('install.dismiss')}
            hitSlop={10}
          >
            <Ionicons name="close" size={20} color={c.textMuted} />
          </Pressable>
        )}
      </View>
      <View style={styles.row}>
        {canInstall && (
          <Pressable
            onPress={() => promptInstall()}
            accessibilityRole="button"
            style={[styles.button, { backgroundColor: c.accent }]}
          >
            <Text style={{ color: c.accentOn, fontWeight: '800' }}>{t('install.install')}</Text>
          </Pressable>
        )}
        <Pressable
          onPress={() => Linking.openURL(RELEASES_URL)}
          accessibilityRole="link"
          style={[styles.button, { borderColor: c.accent, borderWidth: 1.5 }]}
        >
          <Text style={{ color: c.accent, fontWeight: '800' }}>{t('install.download')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: space.md,
    gap: space.sm,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, flexWrap: 'wrap' },
  button: {
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    minHeight: 40,
    justifyContent: 'center',
  },
});
