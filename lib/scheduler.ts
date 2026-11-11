import { browser } from 'wxt/browser';
import { getUpcomingEvents, isNotificationWithinDeliveryWindow } from './time';
import { getIdols, getSettings } from './storage';
import { getPhotoDataUrl } from './images';
import type { AlarmType, FavoriteEvent } from '../types/idol';
import { initializeI18n, t } from './i18n';

const PREFIX = 'bias-timer:';
const TEST_NOTIFICATION_PREFIX = `${PREFIX}test:`;
const NOTIFICATION_TARGETS_KEY = 'notificationClickTargets';
const NOTIFICATION_TARGET_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_NOTIFICATION_TARGETS = 50;
export const MAINTENANCE_ALARM_NAME = `${PREFIX}maintenance`;
const MAINTENANCE_INTERVAL_MINUTES = 15;
let schedulingQueue: Promise<void> = Promise.resolve();

interface NotificationTarget {
  url: string;
  createdAt: number;
}

type NotificationTargets = Record<string, NotificationTarget>;

function isWebUrl(value: string | undefined): value is string {
  return typeof value === 'string' && /^https?:\/\//i.test(value);
}

async function getNotificationTargets() {
  const stored = await browser.storage.local.get(NOTIFICATION_TARGETS_KEY);
  return (stored[NOTIFICATION_TARGETS_KEY] ?? {}) as NotificationTargets;
}

async function rememberNotificationTarget(notificationId: string, url: string | undefined) {
  if (!isWebUrl(url)) return;
  const cutoff = Date.now() - NOTIFICATION_TARGET_TTL_MS;
  const targets = Object.entries(await getNotificationTargets())
    .filter(([, target]) => target.createdAt >= cutoff)
    .sort(([, a], [, b]) => b.createdAt - a.createdAt)
    .slice(0, MAX_NOTIFICATION_TARGETS - 1);
  await browser.storage.local.set({
    [NOTIFICATION_TARGETS_KEY]: Object.fromEntries([[notificationId, { url, createdAt: Date.now() }], ...targets]),
  });
}

async function forgetNotificationTarget(notificationId: string) {
  const targets = await getNotificationTargets();
  if (!(notificationId in targets)) return;
  delete targets[notificationId];
  await browser.storage.local.set({ [NOTIFICATION_TARGETS_KEY]: targets });
}

async function openUrlReliably(url: string) {
  const windows = await browser.windows.getAll();
  const targetWindow = windows.find((item) => item.focused && item.type === 'normal')
    ?? windows.find((item) => item.type === 'normal');
  if (targetWindow?.id !== undefined) {
    try {
      await browser.tabs.create({ windowId: targetWindow.id, url, active: true });
      await browser.windows.update(targetWindow.id, { focused: true });
      return;
    } catch (error) {
      console.warn('기존 Chrome 창에서 링크를 열지 못해 새 창으로 다시 시도합니다.', error);
    }
  }
  await browser.windows.create({ url, focused: true });
}

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
  const notificationId = `${name}:${Date.now()}`;
  const targetUrl = event.idols.find((idol) => isWebUrl(idol.postUrl))?.postUrl;
  await rememberNotificationTarget(notificationId, targetUrl);
  try {
    await browser.notifications.create(notificationId, {
      type: 'basic',
      iconUrl: profileIcon ?? browser.runtime.getURL('/icon/128.png'),
      title,
      message,
    });
  } catch (error) {
    await forgetNotificationTarget(notificationId);
    throw error;
  }
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
  const notificationId = `${TEST_NOTIFICATION_PREFIX}${idolId}:${Date.now()}`;
  await rememberNotificationTarget(notificationId, idol?.postUrl);
  try {
    await browser.notifications.create(notificationId, {
      type: 'basic',
      iconUrl: profileIcon ?? browser.runtime.getURL('/icon/128.png'),
      title: displayName ? t('testNotificationTitle', displayName) : t('testNotificationTitleDefault'),
      message: t('testNotificationBody'),
    });
  } catch (error) {
    await forgetNotificationTarget(notificationId);
    throw error;
  }
}

export async function openNotificationLink(notificationId: string) {
  const storedTarget = (await getNotificationTargets())[notificationId];
  if (storedTarget && isWebUrl(storedTarget.url)) {
    await openUrlReliably(storedTarget.url);
    await forgetNotificationTarget(notificationId);
    return;
  }
  if (notificationId.startsWith(TEST_NOTIFICATION_PREFIX)) {
    const idolId = notificationId.slice(TEST_NOTIFICATION_PREFIX.length).split(':')[0];
    const idol = (await getIdols()).find((item) => item.id === idolId);
    if (isWebUrl(idol?.postUrl)) await openUrlReliably(idol.postUrl);
    return;
  }
  const parsed = parseAlarm(notificationId);
  if (!parsed) return;
  const [idols, settings] = await Promise.all([getIdols(), getSettings()]);
  const event = getUpcomingEvents(idols, new Date(parsed.at - 1000), settings.notificationLeadMinutes)
    .find((item) => item.type === parsed.type && item.at.getTime() === parsed.at);
  const url = event?.idols.find((idol) => idol.postUrl)?.postUrl;
  if (isWebUrl(url)) await openUrlReliably(url);
}
