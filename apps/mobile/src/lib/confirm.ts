import { Alert, Platform } from 'react-native';

/** Yes/no prompt that also works on web, where Alert.alert has no buttons. */
export function confirmAction(title: string, message: string, ok: string, cancel: string) {
  if (Platform.OS === 'web') {
    return Promise.resolve(
      typeof window !== 'undefined' && window.confirm(`${title}\n\n${message}`),
    );
  }
  return new Promise<boolean>((resolve) =>
    Alert.alert(title, message, [
      { text: cancel, style: 'cancel', onPress: () => resolve(false) },
      { text: ok, style: 'destructive', onPress: () => resolve(true) },
    ]),
  );
}
