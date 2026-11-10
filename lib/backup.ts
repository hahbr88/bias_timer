import { getPhotoDataUrl, replacePhotos } from './images';
import { clearRegistrationDraft, getIdols, getSettings, notifyDataChanged, saveIdols, saveSettings } from './storage';
import { BACKUP_VERSION, parseBackupText, type BackupFile } from './backup-format';

export async function createBackup(): Promise<BackupFile> {
  const [idols, settings] = await Promise.all([getIdols(), getSettings()]);
  const photos: Record<string, string> = {};
  await Promise.all(idols.map(async (idol) => {
    if (!idol.photoId || photos[idol.photoId]) return;
    const dataUrl = await getPhotoDataUrl(idol.photoId);
    if (dataUrl) photos[idol.photoId] = dataUrl;
  }));
  return { app: 'bias-timer', version: BACKUP_VERSION, exportedAt: new Date().toISOString(), idols, settings, photos };
}

export async function restoreBackup(text: string) {
  const backup = parseBackupText(text);
  await replacePhotos(backup.photos);
  await Promise.all([saveIdols(backup.idols), saveSettings(backup.settings), clearRegistrationDraft()]);
  await notifyDataChanged();
  return backup.idols;
}
