import { describe, expect, it } from 'vitest';
import { BACKUP_VERSION, parseBackupText } from '../lib/backup-format';

function backup(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({ app: 'bias-timer', version: BACKUP_VERSION, exportedAt: new Date(0).toISOString(), idols: [], settings: {}, photos: {}, ...overrides });
}

describe('backup format', () => {
  it('최애와 프로필 사진을 검증한다', async () => {
    const result = parseBackupText(backup({
      idols: [{ id: 'a', name: '꾸라', birthMonth: 3, birthDay: 19, photoId: 'photo-a' }],
      photos: { 'photo-a': 'data:image/webp;base64,AA==' },
    }));
    expect(result.idols[0]).toMatchObject({ name: '꾸라', photoId: 'photo-a' });
    expect(result.photos['photo-a']).toBeInstanceOf(Blob);
    expect((await result.photos['photo-a']?.arrayBuffer())?.byteLength).toBe(1);
  });

  it('사진이 없는 최애의 photoId를 제거한다', () => {
    const result = parseBackupText(backup({ idols: [{ name: '테스트', photoId: 'missing' }] }));
    expect(result.idols[0]?.photoId).toBeNull();
  });

  it('다른 앱과 미래 버전 백업을 거부한다', () => {
    expect(() => parseBackupText(backup({ app: 'other' }))).toThrow('invalidBackupApp');
    expect(() => parseBackupText(backup({ version: BACKUP_VERSION + 1 }))).toThrow('unsupportedBackupVersion');
  });

  it('이미지가 아닌 데이터 URL을 거부한다', () => {
    expect(() => parseBackupText(backup({ idols: [{ name: '테스트', photoId: 'x' }], photos: { x: 'data:text/plain;base64,AA==' } }))).toThrow('invalidBackupImage');
  });

  it('잘못된 JSON을 명확한 오류로 반환한다', () => {
    expect(() => parseBackupText('{broken')).toThrow('invalidBackupJson');
  });
});
