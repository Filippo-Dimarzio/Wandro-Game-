import { Platform } from 'react-native';

interface PasswordCredentialCtor {
  new (data: { id: string; password: string; name?: string }): Credential;
}

/**
 * Ask the browser's password manager (Brave, Chrome, Edge) to save the login. Safari, Firefox
 * and the phone keychains pick it up from the form submit instead, so this is a bonus, never
 * required. The password goes to the password manager only; Wandro doesn't keep it.
 */
export async function offerToSavePassword(login: {
  email: string;
  password: string;
  name?: string;
}): Promise<void> {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  const Ctor = (window as unknown as { PasswordCredential?: PasswordCredentialCtor })
    .PasswordCredential;
  if (!Ctor || !navigator.credentials?.store) return;
  try {
    await navigator.credentials.store(
      new Ctor({ id: login.email, password: login.password, name: login.name }),
    );
  } catch {
    // The player said no, or the browser blocked it: the login itself already worked.
  }
}
