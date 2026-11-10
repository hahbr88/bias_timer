import { browser } from 'wxt/browser';
import { openNotificationLink, scheduleNextAlarm, showAlarmNotification } from '../lib/scheduler';

export default defineBackground(() => {
  async function rescheduleSafely() {
    try {
      await scheduleNextAlarm();
    } catch (error) {
      console.error('다음 최애시 알림을 예약하지 못했습니다.', error);
    }
  }

  browser.runtime.onInstalled.addListener(() => void rescheduleSafely());
  browser.runtime.onStartup.addListener(() => void rescheduleSafely());
  browser.runtime.onMessage.addListener((message: unknown) => {
    if ((message as { type?: string })?.type === 'DATA_CHANGED') void rescheduleSafely();
  });
  browser.alarms.onAlarm.addListener(async (alarm) => {
    try {
      await showAlarmNotification(alarm.name);
    } catch (error) {
      console.error('최애시 알림을 표시하지 못했습니다.', error);
    } finally {
      await rescheduleSafely();
    }
  });
  browser.notifications.onClicked.addListener((notificationId) => {
    void openNotificationLink(notificationId).catch((error) => console.error('글쓰기 링크를 열지 못했습니다.', error));
    void browser.notifications.clear(notificationId).catch((error) => console.warn('알림을 닫지 못했습니다.', error));
  });
  void rescheduleSafely();
});
