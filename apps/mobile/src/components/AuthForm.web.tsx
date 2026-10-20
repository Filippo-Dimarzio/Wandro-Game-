import { createContext, createElement, useContext, useRef, type ReactNode } from 'react';

const SubmitContext = createContext<() => void>(() => {});

/**
 * A real <form>: browser password managers (Brave, Chrome, Safari, Firefox) watch form submits
 * to offer saving the login, and fill the username / current-password fields inside it.
 */
export function AuthForm({ onSubmit, children }: { onSubmit: () => void; children: ReactNode }) {
  const form = useRef<HTMLFormElement>(null);
  const submit = () => {
    const el = form.current;
    if (el && typeof el.requestSubmit === 'function') el.requestSubmit();
    else onSubmit();
  };
  return createElement(
    'form',
    {
      ref: form,
      method: 'post',
      action: '',
      noValidate: true,
      onSubmit: (e: { preventDefault: () => void }) => {
        e.preventDefault();
        onSubmit();
      },
      style: { display: 'flex', flexDirection: 'column', gap: 12 },
    },
    createElement(SubmitContext.Provider, { value: submit }, children),
  );
}

export const useSubmitAuthForm = () => useContext(SubmitContext);
