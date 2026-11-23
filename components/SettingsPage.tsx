import { useEffect, useState } from 'react';
import { ArrowLeft, BellRing, Download, Languages, RefreshCw, Send, Upload } from 'lucide-react';
import { browser } from 'wxt/browser';
import { createBackup, restoreBackup } from '../lib/backup';
import { currentLocale, getLanguagePreference, setLanguagePreference, t, type LanguagePreference } from '../lib/i18n';
import { parseAlarm, showTestNotification } from '../lib/scheduler';
import type { Idol } from '../types/idol';

interface NotificationDiagnostics {
  permission: 'granted' | 'denied';
  nextScheduledAt: number | null;
  timezone: string;
}

interface SettingsPageProps {
  onBack: () => void;
  onRestored: (idols: Idol[]) => void;
}

export function SettingsPage({ onBack, onRestored }: SettingsPageProps) {
  const [language, setLanguage] = useState<LanguagePreference>(() => getLanguagePreference());
  const [diagnostics, setDiagnostics] = useState<NotificationDiagnostics | null>(null);
  const [diagnosticsLoading, setDiagnosticsLoading] = useState(true);
  const [testStatus, setTestStatus] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');
  const [backupBusy, setBackupBusy] = useState(false);
  const [backupMessage, setBackupMessage] = useState('');

  async function loadDiagnostics() {
    setDiagnosticsLoading(true);
    try {
      await browser.runtime.sendMessage({ type: 'CHECK_SCHEDULE' }).catch(() => undefined);
      const [permission, alarms] = await Promise.all([
        browser.notifications.getPermissionLevel(),
        browser.alarms.getAll(),
      ]);
      const nextScheduledAt = alarms
        .map((alarm) => ({ alarm, parsed: parseAlarm(alarm.name) }))
        .filter((item): item is { alarm: typeof item.alarm; parsed: NonNullable<typeof item.parsed> } => item.parsed !== null)
        .map(({ alarm, parsed }) => alarm.scheduledTime ?? parsed.at)
        .filter((at) => at >= Date.now())
        .sort((a, b) => a - b)[0] ?? null;
      setDiagnostics({ permission, nextScheduledAt, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC' });
    } finally {
      setDiagnosticsLoading(false);
    }
  }

  useEffect(() => { void loadDiagnostics(); }, []);

  async function sendTestNotification() {
    setTestStatus('sending');
    try {
      await showTestNotification();
      setTestStatus('sent');
      window.setTimeout(() => setTestStatus('idle'), 3000);
    } catch (error) {
      console.error('테스트 알림을 보내지 못했습니다.', error);
      setTestStatus('failed');
    }
    await loadDiagnostics().catch(() => undefined);
  }

  async function exportBackup() {
    setBackupBusy(true);
    setBackupMessage('');
    try {
      const backup = await createBackup();
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `bias-timer-backup-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      setBackupMessage(t('backupSaved'));
    } catch (error) {
      setBackupMessage(error instanceof Error ? error.message : t('backupCreateFailed'));
    } finally {
      setBackupBusy(false);
    }
  }

  async function importBackup(file?: File) {
    if (!file || !confirm(t('restoreConfirm'))) return;
    setBackupBusy(true);
    setBackupMessage('');
    try {
      if (file.size > 25 * 1024 * 1024) throw new Error(t('backupTooLarge'));
      const restoredIdols = await restoreBackup(await file.text());
      onRestored(restoredIdols);
      setBackupMessage(t('restoredCount', String(restoredIdols.length)));
      await loadDiagnostics();
    } catch (error) {
      setBackupMessage(error instanceof Error ? error.message : t('restoreFailed'));
    } finally {
      setBackupBusy(false);
    }
  }

  return <main className="p-4">
    <header className="mb-4 flex items-center gap-3">
      <button type="button" onClick={onBack} aria-label={t('back')} title={t('back')} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-slate-500 shadow-sm ring-1 ring-rose-100 transition hover:bg-rose-50 hover:text-rose-500"><ArrowLeft size={18} /></button>
      <div><h1 className="text-lg font-black">{t('settings')}</h1><p className="text-xs text-slate-400">{t('settingsHelp')}</p></div>
    </header>

    <section className="card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-bold"><BellRing size={16} className="text-rose-400" />{t('notificationDiagnostics')}</h2>
        <button type="button" onClick={() => void loadDiagnostics()} disabled={diagnosticsLoading} aria-label={t('refreshDiagnostics')} title={t('refreshDiagnostics')} className="grid h-8 w-8 place-items-center rounded-lg bg-slate-50 text-slate-400 transition hover:bg-rose-50 hover:text-rose-500 disabled:opacity-50"><RefreshCw size={14} className={diagnosticsLoading ? 'animate-spin' : ''} /></button>
      </div>
      {diagnostics ? <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-[11px]">
        <dt className="text-slate-400">{t('notificationPermission')}</dt><dd className={`text-right font-semibold ${diagnostics.permission === 'granted' ? 'text-emerald-500' : 'text-rose-500'}`}>{diagnostics.permission === 'granted' ? t('permissionGranted') : t('permissionDenied')}</dd>
        <dt className="text-slate-400">{t('nextSchedule')}</dt><dd className="text-right font-semibold text-slate-600">{diagnostics.nextScheduledAt ? new Intl.DateTimeFormat(currentLocale() === 'ko' ? 'ko-KR' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(diagnostics.nextScheduledAt) : t('noSchedule')}</dd>
        <dt className="text-slate-400">{t('timezone')}</dt><dd className="text-right font-semibold text-slate-600">{diagnostics.timezone}</dd>
        <dt className="text-slate-400">{t('currentLanguage')}</dt><dd className="text-right font-semibold text-slate-600">{currentLocale() === 'ko' ? t('korean') : t('english')}</dd>
      </dl> : <p className="py-2 text-center text-[11px] text-slate-400">{t('loading')}</p>}
      <button disabled={testStatus === 'sending' || testStatus === 'sent'} onClick={() => void sendTestNotification()} className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg bg-rose-500 py-2.5 text-xs font-semibold text-white disabled:bg-rose-300"><Send size={14} />{testStatus === 'sending' ? t('sendingTestNotification') : testStatus === 'sent' ? t('testNotificationSent') : t('sendTestNotification')}</button>
      {testStatus === 'failed' && <p className="mt-2 text-center text-[11px] text-rose-500">{t('testNotificationFailed')}</p>}
      <p className="mt-2 text-center text-[10px] leading-4 text-slate-400">{t('testNotificationHelp')}</p>
    </section>

    <section className="card mt-3 p-4">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-bold"><Languages size={16} className="text-rose-400" />{t('languageSettings')}</h2>
      <label className="flex items-center justify-between text-xs font-semibold text-slate-500"><span>{t('language')}</span><select value={language} onChange={(event) => { const value = event.target.value as LanguagePreference; setLanguage(value); void setLanguagePreference(value).then(() => location.reload()); }} className="rounded-lg border border-rose-100 bg-white px-2 py-1.5 text-xs outline-none"><option value="browser">{t('browserLanguage')}</option><option value="ko">{t('korean')}</option><option value="en">{t('english')}</option></select></label>
    </section>

    <section className="card mt-3 p-4">
      <h2 className="mb-3 text-sm font-bold">{t('dataSettings')}</h2>
      <p className="mb-3 rounded-xl bg-rose-50 px-3 py-2 text-[10px] leading-4 text-rose-400">{t('syncNotice')}</p>
      <div className="flex gap-2">
        <button disabled={backupBusy} onClick={() => void exportBackup()} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-rose-50 py-2.5 text-xs font-semibold text-rose-500 disabled:opacity-50"><Download size={15} /> {t('backupSave')}</button>
        <label className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-slate-100 py-2.5 text-xs font-semibold text-slate-500 ${backupBusy ? 'pointer-events-none opacity-50' : ''}`}><Upload size={15} /> {t('backupRestore')}<input type="file" accept="application/json,.json" className="hidden" onChange={(event) => { void importBackup(event.target.files?.[0]); event.target.value = ''; }} /></label>
      </div>
      {backupMessage && <p className="mt-2 text-center text-[11px] text-slate-500">{backupMessage}</p>}
      <p className="mt-2 text-center text-[10px] text-slate-400">{t('backupHelp')}</p>
    </section>

    <p className="mt-4 text-center text-[10px] text-slate-400">{t('version')} {browser.runtime.getManifest().version}</p>
  </main>;
}
