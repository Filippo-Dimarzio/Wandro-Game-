import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CredentialsForm } from '@/components/CredentialsForm';
import { GameBackdrop } from '@/components/GameBackdrop';
import { ScreenHeader } from '@/components/ScreenHeader';
import { t } from '@/i18n';
import { hashPassword, looksLikeEmail, MIN_PASSWORD_LENGTH, normaliseEmail } from '@/lib/password';
import { offerToSavePassword } from '@/lib/passwordManager';
import { useSession } from '@/state/session';
import { column, space, useColors } from '@/theme';

/** Demo: give an explorer made before logins existed an email and password. */
export default function AddLogin() {
  const c = useColors();
  const setAccount = useSession((s) => s.setAccount);
  const username = useSession((s) => s.profile?.username);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    const login = normaliseEmail(email);
    setAccount({ email: login, ...(await hashPassword(password)) });
    await offerToSavePassword({ email: login, password, name: username });
    setBusy(false);
    router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <GameBackdrop />
      <ScreenHeader title={t('login.addTitle')} />
      <ScrollView
        contentContainerStyle={[styles.container, column]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={{ color: c.textMuted }}>{t('login.addBody')}</Text>
        <CredentialsForm
          mode="create"
          email={email}
          onEmailChange={setEmail}
          password={password}
          onPasswordChange={setPassword}
          submitLabel={t('login.addSubmit')}
          canSubmit={looksLikeEmail(email) && password.length >= MIN_PASSWORD_LENGTH}
          busy={busy}
          onSubmit={save}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: space.lg, gap: space.lg },
});
