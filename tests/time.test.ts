import { describe, expect, it } from 'vitest';
import { getCurrentFavorite, getFavoriteTimes, getNextFavorite, getUpcomingEvents, isNotificationWithinDeliveryWindow } from '../lib/time';
import type { Idol } from '../types/idol';

function idol(overrides: Partial<Idol> = {}): Idol {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    name: '테스트',
    nickname: '',
    groupName: '테스트 그룹',
    postUrl: '',
    birthMonth: 8,
    birthDay: 1,
    photoId: null,
    notificationEnabled: true,
    preNotificationEnabled: true,
    exactNotificationEnabled: true,
    notificationLeadMinutes: 5,
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  };
}

describe('getFavoriteTimes', () => {
  it.each([
    [8, 1, ['08:01', '20:01']],
    [10, 8, ['10:08', '22:08']],
    [12, 25, ['00:25', '12:25']],
  ] as const)('%d월 %d일의 최애시를 계산한다', (month, day, expected) => {
    expect(getFavoriteTimes(month, day)).toEqual(expected);
  });
});

describe('getUpcomingEvents', () => {
  it('자정 최애시의 미리 알림을 전날에 예약한다', () => {
    const from = new Date(2026, 10, 9, 23, 50, 0);
    const events = getUpcomingEvents([idol({ birthMonth: 12, birthDay: 1 })], from);
    expect(events[0]?.type).toBe('pre');
    expect(events[0]?.at).toEqual(new Date(2026, 10, 9, 23, 56, 0));
    expect(events[1]?.type).toBe('exact');
    expect(events[1]?.at).toEqual(new Date(2026, 10, 10, 0, 1, 0));
  });

  it('같은 시각의 여러 최애를 하나의 이벤트로 통합한다', () => {
    const from = new Date(2026, 10, 9, 7, 0, 0);
    const events = getUpcomingEvents([
      idol({ id: 'a', name: '첫 번째' }),
      idol({ id: 'b', name: '두 번째' }),
    ], from);
    expect(events[0]?.idols.map((item) => item.id)).toEqual(['a', 'b']);
  });

  it('최애별 미리 알림 시간을 적용한다', () => {
    const from = new Date(2026, 10, 9, 7, 0, 0);
    const events = getUpcomingEvents([idol({ notificationLeadMinutes: 17 })], from);
    expect(events[0]?.at).toEqual(new Date(2026, 10, 9, 7, 44, 0));
  });

  it('미리 알림과 정각 알림을 개별적으로 제외한다', () => {
    const from = new Date(2026, 10, 9, 7, 0, 0);
    const preOnly = getUpcomingEvents([idol({ exactNotificationEnabled: false })], from);
    const exactOnly = getUpcomingEvents([idol({ preNotificationEnabled: false })], from);
    expect(preOnly.every((event) => event.type === 'pre')).toBe(true);
    expect(exactOnly.every((event) => event.type === 'exact')).toBe(true);
  });

  it('전체 알림이 꺼진 최애는 예약하지 않는다', () => {
    expect(getUpcomingEvents([idol({ notificationEnabled: false })], new Date(2026, 10, 9, 7, 0, 0))).toEqual([]);
  });
});

describe('getNextFavorite', () => {
  it('가장 가까운 정각 최애시를 선택한다', () => {
    const from = new Date(2026, 10, 9, 7, 0, 0);
    const next = getNextFavorite([
      idol({ id: 'later', birthMonth: 10, birthDay: 8 }),
      idol({ id: 'first', birthMonth: 8, birthDay: 1 }),
    ], from);
    expect(next?.idols[0]?.id).toBe('first');
    expect(next?.at).toEqual(new Date(2026, 10, 9, 8, 1, 0));
  });
});

describe('getCurrentFavorite', () => {
  it('정각부터 59초까지 현재 최애시를 반환한다', () => {
    const favorite = idol({ id: 'current', nickname: '꾸라', birthMonth: 8, birthDay: 1 });
    expect(getCurrentFavorite([favorite], new Date(2026, 10, 9, 8, 1, 0))?.idols[0]?.id).toBe('current');
    expect(getCurrentFavorite([favorite], new Date(2026, 10, 9, 8, 1, 59))?.idols[0]?.id).toBe('current');
  });

  it('다음 분이 되면 현재 최애시를 종료한다', () => {
    expect(getCurrentFavorite([idol()], new Date(2026, 10, 9, 8, 2, 0))).toBeNull();
  });

  it('같은 시각의 여러 최애를 함께 반환한다', () => {
    const current = getCurrentFavorite([idol({ id: 'a' }), idol({ id: 'b' })], new Date(2026, 10, 9, 20, 1, 30));
    expect(current?.idols.map((item) => item.id)).toEqual(['a', 'b']);
  });
});

describe('isNotificationWithinDeliveryWindow', () => {
  it('예약 후 59.999초까지 표시한다', () => {
    expect(isNotificationWithinDeliveryWindow(1_000, 60_999)).toBe(true);
  });

  it('예약 후 정확히 60초부터 표시하지 않는다', () => {
    expect(isNotificationWithinDeliveryWindow(1_000, 61_000)).toBe(false);
  });
});
