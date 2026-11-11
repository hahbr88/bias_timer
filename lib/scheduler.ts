import { browser } from 'wxt/browser';
import { getUpcomingEvents, isNotificationWithinDeliveryWindow } from './time';
import { getIdols, getSettings } from './storage';
import { getPhotoDataUrl } from './images';
import type { AlarmType, FavoriteEvent } from '../types/idol';
import { initializeI18n, t } from './i18n';

const PREFIX = 'bias-timer:';
const TEST_NOTIFICATION_PREFIX = `${PREFIX}test:`;
export const MAINTENANCE_ALARM_NAME = `${PREFIX}maintenance`;
const MAINTENANCE_INTERVAL_MINUTES = 15;
let schedulingQueue: Promise<void> = Promise.resolve();

export function alarmName(event: FavoriteEvent) {
  return `${PREFIX}${event.type}:${event.at.getTime()}`;
}

async function scheduleNextAlarmNow() {
  const alarms = await browser.alarms.getAll();
  await Promise.all(alarms.filter((alarm) => parseAlarm(alarm.name) !== null).map((alarm) => browser.alarms.clear(alarm.name)));
  if (!alarms.some((alarm) => alarm.name === MAINTENANCE_ALARM_NAME)) {
    await browser.alarms.create(MAINTENANCE_ALARM_NAME, {
      delayInMinutes: MAINTENANCE_INTERVAL_MINUTES,
      periodInMinutes: MAINTENANCE_INTERVAL_MINUTES,
    });
  }
  const [idols, settings] = await Promise.all([getIdols(), getSettings()]);
  if (!settings.notificationsEnabled) return;
  const next = getUpcomingEvents(idols, new Date(), settings.notificationLeadMinutes)[0];
  if (next) await browser.alarms.create(alarmName(next), { when: next.at.getTime() });
}

export function scheduleNextAlarm() {
  const scheduled = schedulingQueue.then(scheduleNextAlarmNow, scheduleNextAlarmNow);
  schedulingQueue = scheduled.catch(() => undefined);
  return scheduled;
}

export function parseAlarm(name: string): { type: AlarmType; at: number } | null {
  if (!name.startsWith(PREFIX)) return null;
  const [, type, at] = name.split(':');
  if ((type !== 'pre' && type !== 'exact') || !Number.isFinite(Number(at))) return null;
  return { type, at: Number(at) };
}

export async function showAlarmNotification(name: string) {
  await initializeI18n();
  const parsed = parseAlarm(name);
  if (!parsed) return;
  if (!isNotificationWithinDeliveryWindow(parsed.at)) return;
  const [idols, settings] = await Promise.all([getIdols(), getSettings()]);
  const event = getUpcomingEvents(idols, new Date(parsed.at - 1000), settings.notificationLeadMinutes)
    .find((item) => item.type === parsed.type && item.at.getTime() === parsed.at);
  if (!event) return;
  const names = event.idols.map((idol) => idol.nickname || idol.name).join(', ');
  const groups = [...new Set(event.idols.map((idol) => idol.groupName).filter(Boolean))].join(', ');
  const leads = [...new Set(event.idols.map((idol) => idol.notificationLeadMinutes ?? settings.notificationLeadMinutes))];
  const title = parsed.type === 'pre'
    ? leads.length === 1 ? t('preNotificationTitle', [names, String(leads[0])]) : t('preNotificationMixedTitle', names)
    : t('exactNotificationTitle', names);
  const message = parsed.type === 'pre' && leads.length > 1
    ? event.idols.map((idol) => t('preNotificationItem', [idol.nickname || idol.name, String(idol.notificationLeadMinutes ?? settings.notificationLeadMinutes)])).join(' · ')
    : groups || (parsed.type === 'pre' ? t('preNotificationBody') : t('exactNotificationBody'));
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

export async function showTestNotification() {
  await initializeI18n();
  const idols = await getIdols();
  const idol = idols[0];
  const displayName = idol ? idol.nickname || idol.name : '';
  let profileIcon: string | null = null;
  if (idol?.photoId) {
    try {
      profileIcon = await getPhotoDataUrl(idol.photoId);
    } catch (error) {
      console.warn('테스트 알림용 프로필 사진을 불러오지 못했습니다.', error);
    }
  }
  const idolId = idol?.id ?? 'default';
  await browser.notifications.create(`${TEST_NOTIFICATION_PREFIX}${idolId}:${Date.now()}`, {
    type: 'basic',
    iconUrl: profileIcon ?? browser.runtime.getURL('/icon/128.png'),
    title: displayName ? t('testNotificationTitle', displayName) : t('testNotificationTitleDefault'),
    message: t('testNotificationBody'),
  });
}

export async function openNotificationLink(notificationId: string) {
  if (notificationId.startsWith(TEST_NOTIFICATION_PREFIX)) {
    const idolId = notificationId.slice(TEST_NOTIFICATION_PREFIX.length).split(':')[0];
    const idol = (await getIdols()).find((item) => item.id === idolId);
    if (idol?.postUrl && /^https?:\/\//i.test(idol.postUrl)) await browser.tabs.create({ url: idol.postUrl });
    return;
  }
  const parsed = parseAlarm(notificationId);
  if (!parsed) return;
  const [idols, settings] = await Promise.all([getIdols(), getSettings()]);
  const event = getUpcomingEvents(idols, new Date(parsed.at - 1000), settings.notificationLeadMinutes)
    .find((item) => item.type === parsed.type && item.at.getTime() === parsed.at);
  const url = event?.idols.find((idol) => idol.postUrl)?.postUrl;
  if (url && /^https?:\/\//i.test(url)) await browser.tabs.create({ url });
}
