import { describe, expect, it } from 'vitest';
import { CURRENT_SCHEMA_VERSION, migrateIdol, migrateIdols, migrateRegistrationDraft, migrateSettings } from '../lib/migrations';

describe('storage migrations', () => {
  it('현재 스키마 버전을 명시한다', () => {
    expect(CURRENT_SCHEMA_VERSION).toBe(1);
  });

  it('초기 MVP 데이터를 현재 Idol 구조로 보완한다', () => {
    const migrated = migrateIdol({
      id: 'old-id', name: '김채원', groupName: 'LE SSERAFIM', birthMonth: 8, birthDay: 1,
      photoId: null, notificationEnabled: true, createdAt: 100, updatedAt: 200,
    });
    expect(migrated).toMatchObject({
      id: 'old-id', name: '김채원', nickname: '', postUrl: '',
      preNotificationEnabled: true, exactNotificationEnabled: true, notificationLeadMinutes: 5,
    });
  });

  it('알림 시간과 존재하지 않는 생일을 유효 범위로 보정한다', () => {
    const migrated = migrateIdol({ name: '테스트', birthMonth: 2, birthDay: 31, notificationLeadMinutes: 99 });
    expect(migrated).toMatchObject({ birthMonth: 2, birthDay: 29, notificationLeadMinutes: 30 });
  });

  it('손상된 항목을 제거하고 최대 10명과 기존 순서를 유지한다', () => {
    const source = [{ name: '' }, ...Array.from({ length: 12 }, (_, index) => ({ id: String(index), name: `최애 ${index}` }))];
    const migrated = migrateIdols(source);
    expect(migrated).toHaveLength(10);
    expect(migrated.map((item) => item.id)).toEqual(Array.from({ length: 10 }, (_, index) => String(index)));
  });

  it('이전 임시저장 데이터에 새 입력 필드 기본값을 적용한다', () => {
    expect(migrateRegistrationDraft({ name: '작성 중', birthMonth: 12, birthDay: 25 })).toMatchObject({
      name: '작성 중', nickname: '', postUrl: '', notificationLeadMinutes: 5,
      preNotificationEnabled: true, exactNotificationEnabled: true,
    });
  });

  it('잘못된 설정 값을 기본값과 유효 범위로 보정한다', () => {
    expect(migrateSettings({ notificationLeadMinutes: -5, notificationsEnabled: 'yes', timezone: 'UTC' })).toEqual({
      notificationLeadMinutes: 1,
      notificationsEnabled: true,
      timezone: 'local',
    });
  });
});
