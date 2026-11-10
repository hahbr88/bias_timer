import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Download, ListRestart, Plus, Sparkles, Upload } from 'lucide-react';
import { browser } from 'wxt/browser';
import { Countdown } from '../../components/Countdown';
import { IdolCard } from '../../components/IdolCard';
import { IdolForm, type IdolDraft } from '../../components/IdolForm';
import { deletePhoto, savePhoto } from '../../lib/images';
import { clearRegistrationDraft, getIdols, getRegistrationDraft, notifyDataChanged, saveIdols, saveRegistrationDraft } from '../../lib/storage';
import { getFavoriteTimes, getNextFavorite } from '../../lib/time';
import type { Idol, RegistrationDraft } from '../../types/idol';
import { createBackup, restoreBackup } from '../../lib/backup';
import { getLanguagePreference, setLanguagePreference, t, type LanguagePreference } from '../../lib/i18n';

export default function App() {
  const [idols, setIdols] = useState<Idol[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Idol | 'new' | null>(null);
  const [registrationDraft, setRegistrationDraft] = useState<RegistrationDraft | null>(null);
  const [reorderMode, setReorderMode] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [backupBusy, setBackupBusy] = useState(false);
  const [backupMessage, setBackupMessage] = useState('');
  const [language, setLanguage] = useState<LanguagePreference>(() => getLanguagePreference());
  useEffect(() => {
    void browser.runtime.sendMessage({ type: 'CHECK_SCHEDULE' }).catch(() => undefined);
    void Promise.all([getIdols(), getRegistrationDraft()]).then(([savedIdols, draft]) => { setIdols(savedIdols); setRegistrationDraft(draft); }).finally(() => setLoading(false));
  }, []);
  const next = useMemo(() => getNextFavorite(idols), [idols]);
  async function persist(nextIdols: Idol[]) { setIdols(nextIdols); await saveIdols(nextIdols); await notifyDataChanged(); }
  async function save(draft: IdolDraft) {
    if (editing === 'new' && idols.length >= 10) throw new Error(t('maxIdols'));
    const now = Date.now();
    let photoId = editing !== 'new' ? editing?.photoId ?? null : draft.photoId ?? null;
    if (draft.photo) { const previous = photoId; photoId = await savePhoto(draft.photo); await deletePhoto(previous); }
    const idol: Idol = { ...draft, photoId, id: editing !== 'new' && editing ? editing.id : crypto.randomUUID(), createdAt: editing !== 'new' && editing ? editing.createdAt : now, updatedAt: now };
    delete (idol as Idol & { photo?: File }).photo;
    await persist(editing !== 'new' && editing ? idols.map((item) => item.id === editing.id ? idol : item) : [...idols, idol]);
    if (editing === 'new') { setRegistrationDraft(null); await clearRegistrationDraft(); }
    setEditing(null);
  }
  async function remove(idol: Idol) {
    if (!confirm(t('deleteConfirm', idol.name))) return;
    await persist(idols.filter((item) => item.id !== idol.id)); await deletePhoto(idol.photoId);
  }
  async function toggleNotifications(idol: Idol) {
    const enabling = !idol.notificationEnabled;
    const preEnabled = idol.preNotificationEnabled ?? true;
    const exactEnabled = idol.exactNotificationEnabled ?? true;
    const restoreDefaults = enabling && !preEnabled && !exactEnabled;
    await persist(idols.map((item) => item.id === idol.id ? {
      ...item,
      notificationEnabled: enabling,
      preNotificationEnabled: restoreDefaults ? true : preEnabled,
      exactNotificationEnabled: restoreDefaults ? true : exactEnabled,
      updatedAt: Date.now(),
    } : item));
  }
  async function moveId(id: string, targetIndex: number) {
    const fromIndex = idols.findIndex((item) => item.id === id);
    if (fromIndex < 0 || targetIndex < 0 || targetIndex >= idols.length || fromIndex === targetIndex) return;
    const reordered = [...idols];
    const [moved] = reordered.splice(fromIndex, 1);
    if (!moved) return;
    reordered.splice(targetIndex, 0, moved);
    await persist(reordered);
  }
  async function dropOn(targetId: string) {
    if (!draggedId || draggedId === targetId) return;
    const targetIndex = idols.findIndex((item) => item.id === targetId);
    await moveId(draggedId, targetIndex);
    setDraggedId(null);
    setDragOverId(null);
  }
  async function exportBackup() {
    setBackupBusy(true); setBackupMessage('');
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
    } catch (error) { setBackupMessage(error instanceof Error ? error.message : t('backupCreateFailed')); }
    finally { setBackupBusy(false); }
  }
  async function importBackup(file?: File) {
    if (!file) return;
    if (!confirm(t('restoreConfirm'))) return;
    setBackupBusy(true); setBackupMessage('');
    try {
      if (file.size > 25 * 1024 * 1024) throw new Error(t('backupTooLarge'));
      const restoredIdols = await restoreBackup(await file.text());
      setIdols(restoredIdols);
      setRegistrationDraft(null);
      setBackupMessage(t('restoredCount', String(restoredIdols.length)));
    } catch (error) { setBackupMessage(error instanceof Error ? error.message : t('restoreFailed')); }
    finally { setBackupBusy(false); }
  }
  async function cancelForm() {
    if (editing === 'new') {
      await deletePhoto(registrationDraft?.photoId ?? null);
      setRegistrationDraft(null);
      await clearRegistrationDraft();
    }
    setEditing(null);
  }
  const updateDraft = useCallback((draft: RegistrationDraft) => {
    setRegistrationDraft(draft);
    void saveRegistrationDraft(draft);
  }, []);
  if (loading) return <div className="grid h-[560px] place-items-center text-sm text-rose-400">{t('loading')}</div>;
  if (editing) return <IdolForm initial={editing === 'new' ? undefined : editing} initialDraft={editing === 'new' ? registrationDraft : undefined} onDraftChange={editing === 'new' ? updateDraft : undefined} onCancel={() => void cancelForm()} onSave={save} />;
  return <main className="p-4">
    <header className="mb-4 flex items-center justify-between"><div><div className="flex items-center gap-1.5 text-xl font-black"><Sparkles size={19} className="text-rose-400" /> {t('extName')}</div><p className="mt-0.5 text-xs text-slate-400">{t('appTagline')}</p></div><div className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-400">{idols.length} / 10</div></header>
    {next ? <section className="card mb-5 overflow-hidden p-4 text-center"><div className="text-[11px] font-bold tracking-[.18em] text-rose-400">{t('nextTime')}</div><div className="mt-2 text-lg font-bold">{next.idols.map((idol) => idol.name).join(', ')}</div><div className="text-xs text-slate-400">{next.idols[0]?.groupName || t('solo')} · {getFavoriteTimes(next.idols[0]!.birthMonth, next.idols[0]!.birthDay).join(' / ')}</div><Countdown target={next.at} /></section> : <section className="card mb-5 p-7 text-center"><div className="text-sm font-semibold">{t('firstIdol')}</div><div className="mt-1 text-xs text-slate-400">{t('firstIdolHelp')}</div></section>}
    <div className="mb-2 flex items-center justify-between"><h2 className="text-sm font-bold">등록한 최애</h2><div className="flex gap-1.5">{idols.length > 1 && <button onClick={() => { setReorderMode((value) => !value); setDraggedId(null); setDragOverId(null); }} className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold ${reorderMode ? 'bg-slate-700 text-white' : 'bg-rose-50 text-rose-400'}`}>{reorderMode ? <Check size={14} /> : <ListRestart size={14} />}{reorderMode ? '완료' : '순서 변경'}</button>}<button disabled={idols.length >= 10 || reorderMode} onClick={() => setEditing('new')} className="flex items-center gap-1 rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white disabled:bg-slate-200"><Plus size={14} /> {registrationDraft ? '계속 작성' : '등록'}</button></div></div>
    {reorderMode && <p className="mb-2 text-center text-[11px] text-slate-400">{t('reorderHelp')}</p>}
    <div className="space-y-2">{idols.map((idol, index) => <div key={idol.id} draggable={reorderMode} onDragStart={() => setDraggedId(idol.id)} onDragEnd={() => { setDraggedId(null); setDragOverId(null); }} onDragOver={(event) => { if (!reorderMode) return; event.preventDefault(); setDragOverId(idol.id); }} onDrop={(event) => { event.preventDefault(); void dropOn(idol.id); }} className={`rounded-2xl transition ${draggedId === idol.id ? 'opacity-40' : ''} ${dragOverId === idol.id && draggedId !== idol.id ? 'ring-2 ring-rose-300 ring-offset-2' : ''}`}><IdolCard idol={idol} reorderMode={reorderMode} canMoveUp={index > 0} canMoveDown={index < idols.length - 1} onMoveUp={() => void moveId(idol.id, index - 1)} onMoveDown={() => void moveId(idol.id, index + 1)} onEdit={() => setEditing(idol)} onDelete={() => void remove(idol)} onWrite={() => void browser.tabs.create({ url: idol.postUrl })} onToggle={() => void toggleNotifications(idol)} /></div>)}</div>
    {idols.length >= 10 && <p className="mt-3 text-center text-xs text-slate-400">{t('maxIdols')}</p>}
    <label className="mt-5 flex items-center justify-between border-t border-rose-100 pt-4 text-xs font-semibold text-slate-500"><span>{t('language')}</span><select value={language} onChange={(event) => { const value = event.target.value as LanguagePreference; setLanguage(value); void setLanguagePreference(value).then(() => location.reload()); }} className="rounded-lg border border-rose-100 bg-white px-2 py-1.5 text-xs outline-none"><option value="browser">{t('browserLanguage')}</option><option value="ko">{t('korean')}</option><option value="en">{t('english')}</option></select></label>
    <section className="mt-5 border-t border-rose-100 pt-4"><div className="flex gap-2"><button disabled={backupBusy} onClick={() => void exportBackup()} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-rose-50 py-2.5 text-xs font-semibold text-rose-500 disabled:opacity-50"><Download size={15} /> {t('backupSave')}</button><label className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-slate-100 py-2.5 text-xs font-semibold text-slate-500 ${backupBusy ? 'pointer-events-none opacity-50' : ''}`}><Upload size={15} /> {t('backupRestore')}<input type="file" accept="application/json,.json" className="hidden" onChange={(event) => { void importBackup(event.target.files?.[0]); event.target.value = ''; }} /></label></div>{backupMessage && <p className="mt-2 text-center text-[11px] text-slate-500">{backupMessage}</p>}<p className="mt-2 text-center text-[10px] text-slate-400">{t('backupHelp')}</p></section>
  </main>;
}
