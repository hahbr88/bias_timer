import { browser } from 'wxt/browser';
import { scheduleNextAlarm, showAlarmNotification } from '../lib/scheduler';

export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(() => void scheduleNextAlarm());
  browser.runtime.onStartup.addListener(() => void scheduleNextAlarm());
  browser.runtime.onMessage.addListener((message: unknown) => {
    if ((message as { type?: string })?.type === 'DATA_CHANGED') void scheduleNextAlarm();
  });
  browser.alarms.onAlarm.addListener(async (alarm) => {
    await showAlarmNotification(alarm.name);
    await scheduleNextAlarm();
  });
  void scheduleNextAlarm();
});
