import { migrateIdols, migrateSettings } from './migrations';
import type { AppSettings, Idol } from '../types/idol';
import { t } from './i18n';

export const BACKUP_VERSION = 1;
const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

export interface BackupFile {
  app: 'bias-timer';
  version: number;
  exportedAt: string;
  idols: Idol[];
  settings: AppSettings;
  photos: Record<string, string>;
}

export interface ValidatedBackup {
  idols: Idol[];
  settings: AppSettings;
  photos: Record<string, Blob>;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

export function dataUrlToImageBlob(dataUrl: string): Blob {
  const match = /^data:(image\/(?:webp|png|jpeg));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!match) throw new Error(t('invalidBackupImage'));
  const mimeType = match[1]!;
  const binary = atob(match[2]!);
  if (binary.length > MAX_PHOTO_BYTES) throw new Error(t('backupImageTooLarge'));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return new Blob([bytes], { type: mimeType });
}

export function parseBackupText(text: string): ValidatedBackup {
  let parsed: unknown;
  try { parsed = JSON.parse(text); } catch { throw new Error(t('invalidBackupJson')); }
  const source = asRecord(parsed);
  if (!source || source.app !== 'bias-timer') throw new Error(t('invalidBackupApp'));
  if (typeof source.version !== 'number' || source.version > BACKUP_VERSION) throw new Error(t('unsupportedBackupVersion'));

  const rawPhotos = asRecord(source.photos) ?? {};
  const photos: Record<string, Blob> = {};
  const idols = migrateIdols(source.idols).map((idol) => {
    if (!idol.photoId) return idol;
    const photo = rawPhotos[idol.photoId];
    if (typeof photo !== 'string') return { ...idol, photoId: null };
    photos[idol.photoId] = dataUrlToImageBlob(photo);
    return idol;
  });
  return { idols, settings: migrateSettings(source.settings), photos };
}
