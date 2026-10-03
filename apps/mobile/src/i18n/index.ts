import { en, type TranslationKey } from './en';

const dictionaries = { en } as const;
const locale: keyof typeof dictionaries = 'en';

/** Translate a key, interpolating {placeholders}. */
export function t(key: TranslationKey, params?: Record<string, string | number>): string {
  const template = dictionaries[locale][key] ?? key;
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, k: string) => String(params[k] ?? `{${k}}`));
}

export type { TranslationKey };
