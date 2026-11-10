import { browser } from 'wxt/browser';
import { getUpcomingEvents } from './time';
import { getIdols, getSettings } from './storage';
import { getPhotoDataUrl } from './images';
import type { AlarmType, FavoriteEvent } from '../types/idol';

const PREFIX = 'bias-timer:';
const MAX_NOTIFICATION_DELAY_MS = 60_000;

export function alarmName(event: FavoriteEvent) {
  return `${PREFIX}${event.type}:${event.at.getTime()}`;
}

export async function scheduleNextAlarm() {
  await browser.alarms.clearAll();
  const [idols, settings] = await Promise.all([getIdols(), getSettings()]);
  if (!settings.notificationsEnabled) return;
  const next = getUpcomingEvents(idols, new Date(), settings.notificationLeadMinutes)[0];
  if (next) await browser.alarms.create(alarmName(next), { when: next.at.getTime() });
}

export function parseAlarm(name: string): { type: AlarmType; at: number } | null {
  if (!name.startsWith(PREFIX)) return null;
  const [, type, at] = name.split(':');
  if ((type !== 'pre' && type !== 'exact') || !Number.isFinite(Number(at))) return null;
  return { type, at: Number(at) };
}

export async function showAlarmNotification(name: string) {
  const parsed = parseAlarm(name);
  if (!parsed) return;
  if (Date.now() - parsed.at >= MAX_NOTIFICATION_DELAY_MS) return;
  const [idols, settings] = await Promise.all([getIdols(), getSettings()]);
  const event = getUpcomingEvents(idols, new Date(parsed.at - 1000), settings.notificationLeadMinutes)
    .find((item) => item.type === parsed.type && item.at.getTime() === parsed.at);
  if (!event) return;
  const names = event.idols.map((idol) => idol.nickname || idol.name).join(', ');
  const groups = [...new Set(event.idols.map((idol) => idol.groupName).filter(Boolean))].join(', ');
  const leads = [...new Set(event.idols.map((idol) => idol.notificationLeadMinutes ?? settings.notificationLeadMinutes))];
  const title = parsed.type === 'pre'
    ? leads.length === 1 ? `${names}시 ${leads[0]}분 전입니다` : `${names}의 최애시가 곧 시작됩니다`
    : `${names}시!`;
  const message = parsed.type === 'pre' && leads.length > 1
    ? event.idols.map((idol) => `${idol.nickname || idol.name}시 ${(idol.notificationLeadMinutes ?? settings.notificationLeadMinutes)}분 전`).join(' · ')
    : groups || (parsed.type === 'pre' ? '곧 최애시가 찾아와요.' : '지금이 바로 최애시예요!');
  const onlyIdol = event.idols.length === 1 ? event.idols[0] : undefined;
  let profileIcon: string | null = null;
  if (onlyIdol?.photoId) {
    try {
      profileIcon = await getPhotoDataUrl(onlyIdol.photoId);
    } catch (error) {
      console.warn('프로필 사진을 알림 아이콘으로 불러오지 못했습니다.', error);
    }
  }
  await browser.notifications.create(`${name}:${Date.now()}`, {
    type: 'basic',
    iconUrl: profileIcon ?? browser.runtime.getURL('/icon/128.png'),
    title,
    message,
  });
}

export async function openNotificationLink(notificationId: string) {
  const parsed = parseAlarm(notificationId);
  if (!parsed) return;
  const [idols, settings] = await Promise.all([getIdols(), getSettings()]);
  const event = getUpcomingEvents(idols, new Date(parsed.at - 1000), settings.notificationLeadMinutes)
    .find((item) => item.type === parsed.type && item.at.getTime() === parsed.at);
  const url = event?.idols.find((idol) => idol.postUrl)?.postUrl;
  if (url && /^https?:\/\//i.test(url)) await browser.tabs.create({ url });
}
