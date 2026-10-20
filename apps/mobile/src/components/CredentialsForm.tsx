import { Ionicons } from '@expo/vector-icons';
import { useRef, useState, type ReactNode, type Ref } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { AuthForm, useSubmitAuthForm } from '@/components/AuthForm';
import { t } from '@/i18n';
import { radius, space, useColors } from '@/theme';

interface Props {
  /** 'login' fills a saved password; 'create' asks the password manager for a new one. */
  mode: 'login' | 'create';
  email: string;
  onEmailChange: (email: string) => void;
  password: string;
  onPasswordChange: (password: string) => void;
  submitLabel: string;
  canSubmit: boolean;
  busy?: boolean;
  onSubmit: () => void;
  /** Shown under the button, inside the form (e.g. "Forgot password?"). */
  children?: ReactNode;
}

/**
 * Email + password fields marked up so password managers (Brave, iCloud Keychain, Google
 * Password Manager, 1Password) can fill and save them. Wandro itself never stores the password.
 */
export function CredentialsForm(props: Props) {
  return (
    <AuthForm onSubmit={() => props.canSubmit && !props.busy && props.onSubmit()}>
      <Fields {...props} />
    </AuthForm>
  );
}

function Fields({
  mode,
  email,
  onEmailChange,
  password,
  onPasswordChange,
  submitLabel,
  canSubmit,
  busy,
  children,
}: Props) {
  const c = useColors();
  const submit = useSubmitAuthForm();
  const passwordRef = useRef<TextInput>(null);
  const input = [styles.input, { borderColor: c.border, color: c.text, backgroundColor: c.card }];
  const disabled = !canSubmit || !!busy;

  return (
    <>
      <View style={{ gap: 6 }}>
        <Text style={[styles.label, { color: c.text }]} nativeID="email-label">
          {t('register.email')}
        </Text>
        <TextInput
          style={input}
          value={email}
          onChangeText={onEmailChange}
          nativeID="email"
          // The password manager files the login under this field, so it is the "username".
          autoComplete="username"
          textContentType="username"
          importantForAutofill="yes"
          keyboardType="email-address"
          inputMode="email"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
          placeholder="you@example.com"
          placeholderTextColor={c.textMuted}
          accessibilityLabel={t('register.email')}
          testID="email"
        />
      </View>
      <View style={{ gap: 6 }}>
        <Text style={[styles.label, { color: c.text }]}>{t('register.password')}</Text>
        <PasswordField
          ref={passwordRef}
          value={password}
          onChangeText={onPasswordChange}
          kind={mode === 'login' ? 'current' : 'new'}
          onSubmitEditing={submit}
          label={t('register.password')}
          testID="password"
        />
        {mode === 'create' && (
          <Text style={{ color: c.textMuted, fontSize: 13 }}>{t('login.passwordHint')}</Text>
        )}
      </View>
      <Pressable
        onPress={submit}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityState={{ disabled, busy: !!busy }}
        style={[styles.primary, { backgroundColor: disabled ? c.border : c.accent }]}
        testID="submit-login"
      >
        <Text
          style={{ color: disabled ? c.textMuted : c.accentOn, fontWeight: '800', fontSize: 16 }}
        >
          {busy ? t('login.busy') : submitLabel}
        </Text>
      </Pressable>
      {children}
      <View style={[styles.note, { backgroundColor: c.surface }]}>
        <Ionicons name="key-outline" size={18} color={c.accent} />
        <Text style={{ color: c.textMuted, flex: 1, fontSize: 13 }}>
          {t('login.passwordManager')}
        </Text>
      </View>
    </>
  );
}

/** A password box with a show / hide toggle, marked up for password managers. */
export function PasswordField({
  ref,
  value,
  onChangeText,
  kind,
  onSubmitEditing,
  label,
  testID,
}: {
  ref?: Ref<TextInput>;
  value: string;
  onChangeText: (v: string) => void;
  /** 'current' fills the saved password; 'new' lets the manager suggest and save one. */
  kind: 'current' | 'new';
  onSubmitEditing?: () => void;
  label: string;
  testID: string;
}) {
  const c = useColors();
  const [show, setShow] = useState(false);
  return (
    <View style={styles.passwordRow}>
      <TextInput
        ref={ref}
        style={[
          styles.input,
          { borderColor: c.border, color: c.text, backgroundColor: c.card },
          { flex: 1, paddingRight: 52 },
        ]}
        value={value}
        onChangeText={onChangeText}
        nativeID={testID}
        secureTextEntry={!show}
        autoComplete={kind === 'current' ? 'current-password' : 'new-password'}
        textContentType={kind === 'current' ? 'password' : 'newPassword'}
        // iOS uses this to suggest a strong password when creating one.
        passwordRules="minlength: 12; required: lower; required: upper; required: digit;"
        importantForAutofill="yes"
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="go"
        onSubmitEditing={onSubmitEditing}
        accessibilityLabel={label}
        testID={testID}
      />
      <Pressable
        onPress={() => setShow((s) => !s)}
        accessibilityRole="button"
        accessibilityLabel={show ? t('login.hidePassword') : t('login.showPassword')}
        hitSlop={8}
        style={styles.eye}
        testID={`toggle-${testID}`}
      >
        <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={22} color={c.textMuted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    minHeight: 50,
    fontSize: 16,
  },
  passwordRow: { flexDirection: 'row', alignItems: 'center' },
  eye: {
    position: 'absolute',
    right: 4,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    borderRadius: radius.pill,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: space.xs,
  },
  note: {
    flexDirection: 'row',
    gap: space.sm,
    alignItems: 'center',
    borderRadius: radius.md,
    padding: space.md,
  },
});
