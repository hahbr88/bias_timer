import { migrateIdols, migrateSettings } from './migrations';
import type { AppSettings, Idol } from '../types/idol';

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
  if (!match) throw new Error('지원하지 않는 프로필 사진 형식입니다.');
  const mimeType = match[1]!;
  const binary = atob(match[2]!);
  if (binary.length > MAX_PHOTO_BYTES) throw new Error('프로필 사진의 용량이 너무 큽니다.');
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return new Blob([bytes], { type: mimeType });
}

export function parseBackupText(text: string): ValidatedBackup {
  let parsed: unknown;
  try { parsed = JSON.parse(text); } catch { throw new Error('올바른 JSON 백업 파일이 아닙니다.'); }
  const source = asRecord(parsed);
  if (!source || source.app !== 'bias-timer') throw new Error('최애시 타이머 백업 파일이 아닙니다.');
  if (typeof source.version !== 'number' || source.version > BACKUP_VERSION) throw new Error('현재 버전에서 지원하지 않는 백업 파일입니다.');

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
