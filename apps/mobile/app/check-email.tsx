import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GameBackdrop } from '@/components/GameBackdrop';
import { t } from '@/i18n';
import { appLink } from '@/lib/auth';
import { mailboxFor, maskEmail } from '@/lib/mailbox';
import { supabase } from '@/lib/supabase';
import { column, radius, space, useColors } from '@/theme';

const RESEND_SECONDS = 60;

/**
 * "Check your email", like Google's: Wandro Support has sent a password reset (or a sign-up
 * confirmation) link; open your inbox straight from here, or send it again.
 */
export default function CheckEmail() {
  const c = useColors();
  const { email = '', kind = 'reset' } = useLocalSearchParams<{
    email?: string;
    kind?: 'reset' | 'confirm';
  }>();
  const mailbox = mailboxFor(email);
  const [wait, setWait] = useState(RESEND_SECONDS);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (wait <= 0) return;
    const id = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(id);
  }, [wait]);

  const resend = async () => {
    if (!supabase || wait > 0) return;
    if (kind === 'confirm')
      await supabase.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: appLink('/register') },
      });
    else
      await supabase.auth.resetPasswordForEmail(email, { redirectTo: appLink('/reset-password') });
    setSent(true);
    setWait(RESEND_SECONDS);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <GameBackdrop />
      <ScrollView contentContainerStyle={[styles.container, column]}>
        <View style={[styles.icon, { backgroundColor: c.surface }]}>
          <Ionicons name="mail-unread-outline" size={44} color={c.accent} />
        </View>
        <Text style={[styles.title, { color: c.text }]} accessibilityRole="header">
          {t('checkEmail.title')}
        </Text>
        <Text style={{ color: c.text, textAlign: 'center', fontSize: 16 }}>
          {t(kind === 'confirm' ? 'checkEmail.confirmBody' : 'checkEmail.resetBody', {
            email: maskEmail(email),
          })}
        </Text>
        <Text style={{ color: c.textMuted, textAlign: 'center' }}>{t('checkEmail.spam')}</Text>

        {mailbox && (
          <Pressable
            onPress={() => Linking.openURL(mailbox.url)}
            accessibilityRole="link"
            style={[styles.primary, { backgroundColor: c.accent }]}
            testID="open-mailbox"
          >
            <Text style={{ color: c.accentOn, fontWeight: '800', fontSize: 16 }}>
              {t('checkEmail.open', { mailbox: mailbox.name })}
            </Text>
          </Pressable>
        )}
        <Pressable
          onPress={resend}
          disabled={wait > 0}
          accessibilityRole="button"
          accessibilityState={{ disabled: wait > 0 }}
          style={[styles.secondary, { borderColor: c.border }]}
          testID="resend-email"
        >
          <Text style={{ color: wait > 0 ? c.textMuted : c.text, fontWeight: '700' }}>
            {wait > 0 ? t('checkEmail.resendIn', { seconds: wait }) : t('checkEmail.resend')}
          </Text>
        </Pressable>
        {sent && (
          <Text
            style={{ color: c.textMuted, textAlign: 'center' }}
            accessibilityLiveRegion="polite"
          >
            {t('checkEmail.sentAgain')}
          </Text>
        )}
        <Pressable
          onPress={() => router.replace('/login')}
          accessibilityRole="link"
          style={styles.link}
          testID="back-to-login"
        >
          <Text style={{ color: c.accent, fontWeight: '800' }}>{t('checkEmail.back')}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: space.xl, gap: space.lg, alignItems: 'stretch', paddingTop: space.xxl * 2 },
  icon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  title: { fontSize: 28, fontWeight: '900', textAlign: 'center' },
  primary: {
    borderRadius: radius.pill,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondary: {
    borderRadius: radius.pill,
    minHeight: 50,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  link: { alignItems: 'center', padding: space.sm },
});
