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
  const [localData, syncData] = await Promise.all([
    browser.storage.local.get(IDOLS_KEY),
    browser.storage.sync.get(IDOLS_KEY),
  ]);
  const localIdols = Array.isArray(localData[IDOLS_KEY]) ? migrateIdols(localData[IDOLS_KEY]) : [];
  if (!Array.isArray(syncData[IDOLS_KEY])) {
    await browser.storage.sync.set({ [IDOLS_KEY]: withoutLocalPhotos(localIdols) });
    return localIdols;
  }
  const localPhotoIds = new Map(localIdols.map((idol) => [idol.id, idol.photoId]));
  const idols = migrateIdols(syncData[IDOLS_KEY]).map((idol) => ({
    ...idol,
    photoId: localPhotoIds.get(idol.id) ?? null,
  }));
  await browser.storage.local.set({ [IDOLS_KEY]: idols });
  return idols;
}

export async function saveIdols(idols: Idol[]) {
  await ensureStorageMigrated();
  await Promise.all([
    browser.storage.local.set({ [IDOLS_KEY]: idols }),
    browser.storage.sync.set({ [IDOLS_KEY]: withoutLocalPhotos(idols) }),
  ]);
}

function withoutLocalPhotos(idols: Idol[]) {
  return idols.map((idol) => ({ ...idol, photoId: null }));
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
  const [localData, syncData] = await Promise.all([
    browser.storage.local.get(SETTINGS_KEY),
    browser.storage.sync.get(SETTINGS_KEY),
  ]);
  if (syncData[SETTINGS_KEY] === undefined) {
    const settings = migrateSettings(localData[SETTINGS_KEY]);
    await browser.storage.sync.set({ [SETTINGS_KEY]: settings });
    return settings;
  }
  const settings = migrateSettings(syncData[SETTINGS_KEY]);
  await browser.storage.local.set({ [SETTINGS_KEY]: settings });
  return settings;
}

export async function saveSettings(settings: AppSettings) {
  await ensureStorageMigrated();
  await Promise.all([
    browser.storage.local.set({ [SETTINGS_KEY]: settings }),
    browser.storage.sync.set({ [SETTINGS_KEY]: settings }),
  ]);
}

export async function notifyDataChanged() {
  try { await browser.runtime.sendMessage({ type: 'DATA_CHANGED' }); } catch { /* background wakes later */ }
}
