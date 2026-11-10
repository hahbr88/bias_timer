import { browser } from 'wxt/browser';
import type { AppSettings, Idol, RegistrationDraft } from '../types/idol';
import { CURRENT_SCHEMA_VERSION, migrateIdols, migrateRegistrationDraft, migrateSettings } from './migrations';

const IDOLS_KEY = 'idols';
const SETTINGS_KEY = 'settings';
const DRAFT_KEY = 'registrationDraft';
const SCHEMA_VERSION_KEY = 'schemaVersion';
export const defaultSettings: AppSettings = {
  notificationLeadMinutes: 5,
  notificationsEnabled: true,
  timezone: 'local',
};

let migrationPromise: Promise<void> | null = null;

export function ensureStorageMigrated() {
  if (migrationPromise) return migrationPromise;
  migrationPromise = (async () => {
    const data = await browser.storage.local.get([SCHEMA_VERSION_KEY, IDOLS_KEY, SETTINGS_KEY, DRAFT_KEY]);
    const storedVersion = typeof data[SCHEMA_VERSION_KEY] === 'number' ? data[SCHEMA_VERSION_KEY] : 0;
    if (storedVersion >= CURRENT_SCHEMA_VERSION) return;
    await browser.storage.local.set({
      [SCHEMA_VERSION_KEY]: CURRENT_SCHEMA_VERSION,
      [IDOLS_KEY]: migrateIdols(data[IDOLS_KEY]),
      [SETTINGS_KEY]: migrateSettings(data[SETTINGS_KEY]),
      [DRAFT_KEY]: migrateRegistrationDraft(data[DRAFT_KEY]),
    });
  })().catch((error) => {
    migrationPromise = null;
    throw error;
  });
  return migrationPromise;
}

export async function getIdols(): Promise<Idol[]> {
  await ensureStorageMigrated();
  const data = await browser.storage.local.get(IDOLS_KEY);
  return Array.isArray(data[IDOLS_KEY]) ? (data[IDOLS_KEY] as Idol[]) : [];
}

export async function saveIdols(idols: Idol[]) {
  await ensureStorageMigrated();
  await browser.storage.local.set({ [IDOLS_KEY]: idols });
}

export async function getRegistrationDraft(): Promise<RegistrationDraft | null> {
  await ensureStorageMigrated();
  const data = await browser.storage.local.get(DRAFT_KEY);
  return (data[DRAFT_KEY] as RegistrationDraft | undefined) ?? null;
}

export async function saveRegistrationDraft(draft: RegistrationDraft) {
  await ensureStorageMigrated();
  await browser.storage.local.set({ [DRAFT_KEY]: draft });
}

export async function clearRegistrationDraft() {
  await ensureStorageMigrated();
  await browser.storage.local.remove(DRAFT_KEY);
}

export async function getSettings(): Promise<AppSettings> {
  await ensureStorageMigrated();
  const data = await browser.storage.local.get(SETTINGS_KEY);
  return { ...defaultSettings, ...(data[SETTINGS_KEY] as Partial<AppSettings> | undefined) };
}

export async function saveSettings(settings: AppSettings) {
  await ensureStorageMigrated();
  await browser.storage.local.set({ [SETTINGS_KEY]: settings });
}

export async function notifyDataChanged() {
  try { await browser.runtime.sendMessage({ type: 'DATA_CHANGED' }); } catch { /* background wakes later */ }
}
