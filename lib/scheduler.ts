import { browser } from 'wxt/browser';
import { getUpcomingEvents } from './time';
import { getIdols, getSettings } from './storage';
import type { AlarmType, FavoriteEvent } from '../types/idol';

const PREFIX = 'bias-timer:';

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
  const [idols, settings] = await Promise.all([getIdols(), getSettings()]);
  const event = getUpcomingEvents(idols, new Date(parsed.at - 1000), settings.notificationLeadMinutes)
    .find((item) => item.type === parsed.type && item.at.getTime() === parsed.at);
  if (!event) return;
  const names = event.idols.map((idol) => idol.name).join(', ');
  const title = parsed.type === 'pre' ? `${names} 최애시 5분 전!` : `${names} 최애시 💖`;
  const message = parsed.type === 'pre' ? '곧 특별한 시간이 찾아와요.' : '지금이 바로 최애시예요!';
  await browser.notifications.create(`${name}:${Date.now()}`, {
    type: 'basic', iconUrl: browser.runtime.getURL('/icon/128.svg'), title, message,
  });
}
