export type LanguagePreference = 'browser' | 'ko' | 'en';
interface LocaleMessage { message: string }
type MessageCatalog = Record<string, LocaleMessage>;

let catalog: MessageCatalog | null = null;
let preference: LanguagePreference = 'browser';
let activeLocale = 'ko';
let initialization: Promise<void> | null = null;

interface ChromeSubset {
  i18n?: { getUILanguage?: () => string; getMessage: (name: string, substitutions?: string | string[]) => string };
  runtime?: { getURL: (path: string) => string; sendMessage: (message: unknown) => Promise<unknown> };
  storage?: { local: { get: (key: string) => Promise<Record<string, unknown>>; set: (items: Record<string, unknown>) => Promise<void> } };
}

function chromeApi() {
  return (globalThis as typeof globalThis & { chrome?: ChromeSubset }).chrome;
}

function resolveBrowserLocale() {
  const locale = chromeApi()?.i18n?.getUILanguage?.() ?? 'ko';
  return locale.toLowerCase().startsWith('en') ? 'en' : 'ko';
}

export function initializeI18n() {
  if (initialization) return initialization;
  initialization = (async () => {
    const api = chromeApi();
    if (!api?.runtime?.getURL || !api.storage?.local) return;
    const stored = await api.storage.local.get('languagePreference');
    const value = stored.languagePreference;
    preference = value === 'ko' || value === 'en' ? value : 'browser';
    activeLocale = preference === 'browser' ? resolveBrowserLocale() : preference;
    const response = await fetch(api.runtime.getURL(`/_locales/${activeLocale}/messages.json`));
    if (!response.ok) throw new Error(`Could not load locale: ${activeLocale}`);
    catalog = await response.json() as MessageCatalog;
    if (typeof document !== 'undefined') document.documentElement.lang = activeLocale;
  })().catch((error) => { initialization = null; console.error('Failed to initialize localization.', error); });
  return initialization;
}

export function t(key: string, substitutions?: string | string[]) {
  let message = catalog?.[key]?.message;
  if (!message) {
    try { return chromeApi()?.i18n?.getMessage(key, substitutions) || key; }
    catch { return key; }
  }
  const values = typeof substitutions === 'string' ? [substitutions] : substitutions ?? [];
  values.forEach((value, index) => { message = message!.replaceAll(`$${index + 1}`, value); });
  return message;
}

export function currentLocale() { return activeLocale; }
export function getLanguagePreference() { return preference; }
export function resetI18n() { catalog = null; initialization = null; }
export async function setLanguagePreference(value: LanguagePreference) {
  const api = chromeApi();
  if (!api?.storage?.local || !api.runtime) return;
  await api.storage.local.set({ languagePreference: value });
  preference = value; resetI18n();
  try { await api.runtime.sendMessage({ type: 'LANGUAGE_CHANGED' }); } catch { /* background may be restarting */ }
}
