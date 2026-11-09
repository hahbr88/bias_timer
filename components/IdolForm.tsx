import { useState } from 'react';
import { ArrowLeft, Camera } from 'lucide-react';
import type { Idol } from '../types/idol';
import { getFavoriteTimes } from '../lib/time';

export type IdolDraft = Pick<Idol, 'name' | 'groupName' | 'birthMonth' | 'birthDay' | 'notificationEnabled'> & { photo?: File };

export function IdolForm({ initial, onCancel, onSave }: { initial?: Idol; onCancel: () => void; onSave: (draft: IdolDraft) => Promise<void> }) {
  const [name, setName] = useState(initial?.name ?? '');
  const [groupName, setGroupName] = useState(initial?.groupName ?? '');
  const [month, setMonth] = useState(initial?.birthMonth ?? 1);
  const [day, setDay] = useState(initial?.birthDay ?? 1);
  const [enabled, setEnabled] = useState(initial?.notificationEnabled ?? true);
  const [photo, setPhoto] = useState<File>();
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const times = getFavoriteTimes(month, day);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError('');
    if (!name.trim()) return setError('이름을 입력해 주세요.');
    const maxDay = new Date(2000, month, 0).getDate();
    if (day > maxDay) return setError(`${month}월은 ${maxDay}일까지 입력할 수 있어요.`);
    setSaving(true);
    try { await onSave({ name: name.trim(), groupName: groupName.trim(), birthMonth: month, birthDay: day, notificationEnabled: enabled, photo }); }
    catch (reason) { setError(reason instanceof Error ? reason.message : '저장하지 못했습니다.'); setSaving(false); }
  }
  return <form className="p-4" onSubmit={submit}>
    <button type="button" className="mb-4 flex items-center gap-1 text-sm text-slate-500" onClick={onCancel}><ArrowLeft size={16} /> 돌아가기</button>
    <h1 className="mb-5 text-xl font-bold">{initial ? '최애 수정' : '최애 등록'}</h1>
    <div className="space-y-3">
      <label className="block text-xs font-medium text-slate-500">이름 *<input className="input mt-1" value={name} maxLength={30} onChange={(e) => setName(e.target.value)} autoFocus /></label>
      <label className="block text-xs font-medium text-slate-500">그룹명<input className="input mt-1" value={groupName} maxLength={40} onChange={(e) => setGroupName(e.target.value)} /></label>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-xs font-medium text-slate-500">생일 (월) *<input className="input mt-1" type="number" min="1" max="12" value={month} onChange={(e) => setMonth(Math.min(12, Math.max(1, Number(e.target.value))))} /></label>
        <label className="text-xs font-medium text-slate-500">생일 (일) *<input className="input mt-1" type="number" min="1" max="31" value={day} onChange={(e) => setDay(Math.min(31, Math.max(1, Number(e.target.value))))} /></label>
      </div>
      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-rose-200 p-3 text-sm text-rose-400"><Camera size={17} />{photo ? photo.name : initial?.photoId ? '새 사진으로 변경' : '프로필 사진 선택'}<input type="file" accept="image/*" className="hidden" onChange={(e) => setPhoto(e.target.files?.[0])} /></label>
      <div className="rounded-2xl bg-rose-50 p-4"><div className="text-xs text-rose-400">자동 계산된 최애시</div><div className="mt-1 text-xl font-bold text-rose-500">{times[0]} / {times[1]}</div></div>
      <label className="flex items-center justify-between rounded-xl border border-rose-100 p-3 text-sm"><span>5분 전 + 정각 알림</span><input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="h-4 w-4 accent-rose-500" /></label>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <button disabled={saving} className="w-full rounded-xl bg-rose-500 py-3 font-semibold text-white disabled:opacity-50">{saving ? '저장 중…' : initial ? '수정 완료' : '등록하기'}</button>
    </div>
  </form>;
}
