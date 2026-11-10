import type { AppSettings, Idol, RegistrationDraft } from '../types/idol';

export const CURRENT_SCHEMA_VERSION = 1;

function record(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function text(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function bool(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback;
}

function boundedInteger(value: unknown, minimum: number, maximum: number, fallback: number) {
  const number = typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : fallback;
  return Math.min(maximum, Math.max(minimum, number));
}

function dateParts(value: Record<string, unknown>) {
  const birthMonth = boundedInteger(value.birthMonth, 1, 12, 1);
  const maximumDay = new Date(2000, birthMonth, 0).getDate();
  const birthDay = boundedInteger(value.birthDay, 1, maximumDay, 1);
  return { birthMonth, birthDay };
}

export function migrateIdol(value: unknown, now = Date.now()): Idol | null {
  const source = record(value);
  if (!source || !text(source.name).trim()) return null;
  const createdAt = typeof source.createdAt === 'number' && Number.isFinite(source.createdAt) ? source.createdAt : now;
  return {
    id: text(source.id) || crypto.randomUUID(),
    name: text(source.name).trim(),
    nickname: text(source.nickname).trim(),
    groupName: text(source.groupName).trim(),
    postUrl: text(source.postUrl).trim(),
    ...dateParts(source),
    photoId: typeof source.photoId === 'string' ? source.photoId : null,
    notificationEnabled: bool(source.notificationEnabled, true),
    preNotificationEnabled: bool(source.preNotificationEnabled, true),
    exactNotificationEnabled: bool(source.exactNotificationEnabled, true),
    notificationLeadMinutes: boundedInteger(source.notificationLeadMinutes, 1, 30, 5),
    createdAt,
    updatedAt: typeof source.updatedAt === 'number' && Number.isFinite(source.updatedAt) ? source.updatedAt : createdAt,
  };
}

export function migrateIdols(value: unknown, now = Date.now()): Idol[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => migrateIdol(item, now)).filter((item): item is Idol => item !== null).slice(0, 10);
}

export function migrateRegistrationDraft(value: unknown): RegistrationDraft | null {
  const source = record(value);
  if (!source) return null;
  return {
    name: text(source.name),
    nickname: text(source.nickname),
    groupName: text(source.groupName),
    postUrl: text(source.postUrl),
    ...dateParts(source),
    notificationEnabled: bool(source.notificationEnabled, true),
    preNotificationEnabled: bool(source.preNotificationEnabled, true),
    exactNotificationEnabled: bool(source.exactNotificationEnabled, true),
    notificationLeadMinutes: boundedInteger(source.notificationLeadMinutes, 1, 30, 5),
    photoId: typeof source.photoId === 'string' ? source.photoId : null,
  };
}

export function migrateSettings(value: unknown): AppSettings {
  const source = record(value);
  return {
    notificationLeadMinutes: boundedInteger(source?.notificationLeadMinutes, 1, 30, 5),
    notificationsEnabled: bool(source?.notificationsEnabled, true),
    timezone: 'local',
  };
}
