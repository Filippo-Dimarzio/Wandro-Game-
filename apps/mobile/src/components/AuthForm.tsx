import { createContext, useContext, type ReactNode } from 'react';
import { View } from 'react-native';

const SubmitContext = createContext<() => void>(() => {});

/**
 * Wraps login fields. On phones the keychain (iCloud Keychain, Google Password Manager) reads
 * the fields' textContentType / autoComplete, so a plain View is enough; the web version is a
 * real <form>, which browser password managers need to offer saving.
 */
export function AuthForm({ onSubmit, children }: { onSubmit: () => void; children: ReactNode }) {
  return (
    <SubmitContext.Provider value={onSubmit}>
      <View style={{ gap: 12 }}>{children}</View>
    </SubmitContext.Provider>
  );
}

/** Submit the surrounding AuthForm (the web form fires a real submit event). */
export const useSubmitAuthForm = () => useContext(SubmitContext);
