import { useEffect, useState } from 'react';
import { ArrowLeft, CalendarDays, Camera, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Idol, RegistrationDraft } from '../types/idol';
import { getFavoriteTimes } from '../lib/time';
import { deletePhoto, getPhoto, savePhoto } from '../lib/images';
import { PhotoCropper } from './PhotoCropper';
import { t } from '../lib/i18n';

export type IdolDraft = Pick<Idol, 'name' | 'nickname' | 'groupName' | 'postUrl' | 'birthMonth' | 'birthDay' | 'notificationEnabled' | 'preNotificationEnabled' | 'exactNotificationEnabled' | 'notificationLeadMinutes'> & { photo?: File; photoId?: string | null };

export function IdolForm({ initial, initialDraft, onDraftChange, onCancel, onSave }: { initial?: Idol; initialDraft?: RegistrationDraft | null; onDraftChange?: (draft: RegistrationDraft) => void; onCancel: () => void; onSave: (draft: IdolDraft) => Promise<void> }) {
  const seed = initial ?? initialDraft;
  const [name, setName] = useState(seed?.name ?? '');
  const [nickname, setNickname] = useState(seed?.nickname ?? '');
  const [groupName, setGroupName] = useState(seed?.groupName ?? '');
  const [postUrl, setPostUrl] = useState(seed?.postUrl ?? '');
  const [month, setMonth] = useState(seed?.birthMonth ?? 1);
  const [day, setDay] = useState(seed?.birthDay ?? 1);
  const [calendarMonth, setCalendarMonth] = useState(seed?.birthMonth ?? 1);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [preEnabled, setPreEnabled] = useState(seed?.preNotificationEnabled ?? true);
  const [exactEnabled, setExactEnabled] = useState(seed?.exactNotificationEnabled ?? true);
  const [leadMinutes, setLeadMinutes] = useState(seed?.notificationLeadMinutes ?? 5);
  const [photoId, setPhotoId] = useState(initialDraft?.photoId ?? null);
  const [photo, setPhoto] = useState<File>();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cropSource, setCropSource] = useState<File>();
  const [photoSaving, setPhotoSaving] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const times = getFavoriteTimes(month, day);
  const calendarDays = new Date(2000, calendarMonth, 0).getDate();
  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;
    async function loadPreview() {
      if (photo) objectUrl = URL.createObjectURL(photo);
      else {
        const savedPhotoId = photoId ?? initial?.photoId;
        if (savedPhotoId) objectUrl = await getPhoto(savedPhotoId);
      }
      if (active) setPreviewUrl(objectUrl);
      else if (objectUrl) URL.revokeObjectURL(objectUrl);
    }
    void loadPreview();
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [photo, photoId, initial?.photoId]);
  useEffect(() => {
    if (!initial) onDraftChange?.({ name, nickname, groupName, postUrl, birthMonth: month, birthDay: day, notificationEnabled: preEnabled || exactEnabled, preNotificationEnabled: preEnabled, exactNotificationEnabled: exactEnabled, notificationLeadMinutes: leadMinutes, photoId });
  }, [initial, name, nickname, groupName, postUrl, month, day, preEnabled, exactEnabled, leadMinutes, photoId, onDraftChange]);

  async function applyCroppedPhoto(file: File) {
    if (initial) { setPhoto(file); return; }
    setPhotoSaving(true);
    try {
      const nextPhotoId = await savePhoto(file);
      await deletePhoto(photoId);
      setPhotoId(nextPhotoId);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '사진을 저장하지 못했습니다.');
    } finally { setPhotoSaving(false); }
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError('');
    if (!name.trim()) return setError(t('requiredName'));
    const normalizedUrl = postUrl.trim() && !/^https?:\/\//i.test(postUrl.trim()) ? `https://${postUrl.trim()}` : postUrl.trim();
    if (normalizedUrl) {
      try { const parsedUrl = new URL(normalizedUrl); if (!['http:', 'https:'].includes(parsedUrl.protocol)) throw new Error(); }
      catch { return setError(t('invalidPostUrl')); }
    }
    const maxDay = new Date(2000, month, 0).getDate();
    if (day > maxDay) return setError(t('invalidDay', [String(month), String(maxDay)]));
    setSaving(true);
    try { await onSave({ name: name.trim(), nickname: nickname.trim(), groupName: groupName.trim(), postUrl: normalizedUrl, birthMonth: month, birthDay: day, notificationEnabled: preEnabled || exactEnabled, preNotificationEnabled: preEnabled, exactNotificationEnabled: exactEnabled, notificationLeadMinutes: leadMinutes, photo, photoId }); }
    catch (reason) { setError(reason instanceof Error ? reason.message : t('saveFailed')); setSaving(false); }
  }
  return <>{cropSource && <PhotoCropper file={cropSource} onCancel={() => setCropSource(undefined)} onApply={async (file) => { await applyCroppedPhoto(file); setCropSource(undefined); }} />}<form className="p-4" onSubmit={submit}>
    <button type="button" className="mb-4 flex items-center gap-1 text-sm text-slate-500" onClick={onCancel}><ArrowLeft size={16} /> {t('back')}</button>
    <h1 className="mb-5 text-xl font-bold">{initial ? t('editTitle') : t('registerTitle')}</h1>
    <div className="space-y-3">
      <label className="block text-xs font-medium text-slate-500">{t('name')} *<input className="input mt-1" value={name} maxLength={30} onChange={(e) => setName(e.target.value)} autoFocus /></label>
      <label className="block text-xs font-medium text-slate-500">{t('nickname')}<input className="input mt-1" value={nickname} maxLength={20} onChange={(e) => setNickname(e.target.value)} /></label>
      <label className="block text-xs font-medium text-slate-500">{t('groupName')}<input className="input mt-1" value={groupName} maxLength={40} onChange={(e) => setGroupName(e.target.value)} /></label>
      <label className="block text-xs font-medium text-slate-500">{t('postLink')}<input className="input mt-1" type="url" value={postUrl} maxLength={500} placeholder="https://weverse.io/..." onChange={(e) => setPostUrl(e.target.value)} /><span className="mt-1 block text-[10px] font-normal text-slate-400">{t('postLinkHelp')}</span></label>
      <div className="relative">
        <label className="block text-xs font-medium text-slate-500">{t('birthday')} *</label>
        <button type="button" onClick={() => { setCalendarMonth(month); setCalendarOpen((open) => !open); }} className="input mt-1 flex items-center justify-between text-left">
          <span className="font-medium">{t('dateMonthDay', [String(month), String(day)])}</span><CalendarDays size={18} className="text-rose-400" />
        </button>
        {calendarOpen && <div className="absolute left-0 right-0 z-20 mt-2 rounded-2xl border border-rose-100 bg-white p-3 shadow-xl">
          <div className="mb-3 flex items-center justify-between">
            <button type="button" aria-label="이전 달" className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50" onClick={() => setCalendarMonth((value) => value === 1 ? 12 : value - 1)}><ChevronLeft size={18} /></button>
            <div className="font-bold text-rose-500">{t('month', String(calendarMonth))}</div>
            <button type="button" aria-label="다음 달" className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50" onClick={() => setCalendarMonth((value) => value === 12 ? 1 : value + 1)}><ChevronRight size={18} /></button>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: calendarDays }, (_, index) => index + 1).map((date) => {
              const selected = calendarMonth === month && date === day;
              return <button key={date} type="button" onClick={() => { setMonth(calendarMonth); setDay(date); setCalendarOpen(false); }} className={`aspect-square rounded-lg text-xs font-medium transition ${selected ? 'bg-rose-500 text-white' : 'text-slate-600 hover:bg-rose-50 hover:text-rose-500'}`}>{date}</button>;
            })}
          </div>
          <p className="mt-2 text-center text-[10px] text-slate-400">{t('yearIgnored')}</p>
        </div>}
      </div>
      <div className="flex items-center gap-3">
        {previewUrl && <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full border-2 border-white bg-rose-50 shadow-sm"><img src={previewUrl} alt={t('photoPreview')} className="h-full w-full object-cover" /></div>}
        <label className="flex min-h-14 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-rose-200 p-3 text-sm text-rose-400"><Camera size={17} />{photoSaving ? t('photoSaving') : previewUrl ? t('changePhoto') : t('selectPhoto')}<input type="file" accept="image/*" className="hidden" disabled={photoSaving} onChange={(event) => { setCropSource(event.target.files?.[0]); event.target.value = ''; }} /></label>
      </div>
      <div className="rounded-2xl bg-rose-50 p-4"><div className="text-xs text-rose-400">{t('calculatedTime')}</div><div className="mt-1 text-xl font-bold text-rose-500">{times[0]} / {times[1]}</div></div>
      <div className="rounded-xl border border-rose-100 p-3">
        <label className="mb-3 flex items-center justify-between text-sm"><span className="font-medium">{t('earlyNotification')}</span><input type="checkbox" checked={preEnabled} onChange={(e) => setPreEnabled(e.target.checked)} className="h-4 w-4 accent-rose-500" /></label>
        <div className={`flex items-center gap-3 transition ${preEnabled ? '' : 'pointer-events-none opacity-40'}`}>
          <div className="min-w-0 flex-1"><input aria-label="미리 알림 시간" className="w-full accent-rose-500" type="range" min="1" max="30" step="1" value={leadMinutes} onChange={(e) => setLeadMinutes(Number(e.target.value))} /><div className="flex justify-between text-[9px] text-slate-400"><span>1분</span><span>15분</span><span>30분</span></div></div>
          <label className="flex items-center gap-1 whitespace-nowrap text-sm"><input aria-label="미리 알림 분" className="w-14 rounded-lg border border-rose-100 px-2 py-1.5 text-right font-semibold text-rose-500 outline-none focus:border-rose-300" type="number" min="1" max="30" value={leadMinutes} onChange={(e) => setLeadMinutes(Math.min(30, Math.max(1, Number(e.target.value) || 1)))} /><span>분 전</span></label>
        </div>
      </div>
      <label className="flex items-center justify-between rounded-xl border border-rose-100 p-3 text-sm"><span className="font-medium">{t('exactNotification')}</span><input type="checkbox" checked={exactEnabled} onChange={(e) => setExactEnabled(e.target.checked)} className="h-4 w-4 accent-rose-500" /></label>
      {error && <p className="text-sm text-red-500">{error}</p>}
      {!initial && <p className="text-center text-[11px] text-slate-400">{t('draftHelp')}</p>}
      <button disabled={saving || photoSaving} className="w-full rounded-xl bg-rose-500 py-3 font-semibold text-white disabled:opacity-50">{saving ? t('saving') : initial ? t('saveEdit') : t('register')}</button>
    </div>
  </form></>;
}
