import { browser } from 'wxt/browser';
import type { AppSettings, Idol } from '../types/idol';

const IDOLS_KEY = 'idols';
const SETTINGS_KEY = 'settings';
export const defaultSettings: AppSettings = {
  notificationLeadMinutes: 5,
  notificationsEnabled: true,
  timezone: 'local',
};

export async function getIdols(): Promise<Idol[]> {
  const data = await browser.storage.local.get(IDOLS_KEY);
  return Array.isArray(data[IDOLS_KEY]) ? (data[IDOLS_KEY] as Idol[]) : [];
}

export async function saveIdols(idols: Idol[]) {
  await browser.storage.local.set({ [IDOLS_KEY]: idols });
}

export async function getSettings(): Promise<AppSettings> {
  const data = await browser.storage.local.get(SETTINGS_KEY);
  return { ...defaultSettings, ...(data[SETTINGS_KEY] as Partial<AppSettings> | undefined) };
}

export async function notifyDataChanged() {
  try { await browser.runtime.sendMessage({ type: 'DATA_CHANGED' }); } catch { /* background wakes later */ }
}
