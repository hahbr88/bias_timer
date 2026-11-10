export function t(key: string, substitutions?: string | string[]) {
  try {
    const runtime = globalThis as typeof globalThis & { chrome?: { i18n?: { getMessage: (name: string, substitutions?: string | string[]) => string } } };
    return runtime.chrome?.i18n?.getMessage(key, substitutions) || key;
  } catch {
    return key;
  }
}

export function currentLocale() {
  return t('localeCode') || 'ko';
}
