import { Text } from 'react-native';
import type { UsernameStatus } from '@/data/account';
import { t } from '@/i18n';
import { useColors } from '@/theme';

/** The rule under a username box, or "available" / "already taken" once it's been checked. */
export function UsernameHint({ status }: { status: UsernameStatus }) {
  const c = useColors();
  const [text, color] =
    status === 'taken'
      ? [t('register.usernameTaken'), c.danger]
      : status === 'available'
        ? [t('register.usernameAvailable'), c.accent]
        : status === 'checking'
          ? [t('register.usernameChecking'), c.textMuted]
          : [t('register.usernameHint'), status === 'invalid' ? c.danger : c.textMuted];
  return (
    <Text
      style={{ color, fontSize: 13, fontWeight: status === 'taken' ? '700' : '400' }}
      accessibilityLiveRegion="polite"
      testID="username-status"
    >
      {text}
    </Text>
  );
}
