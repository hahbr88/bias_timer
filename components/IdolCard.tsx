import { useEffect, useState } from 'react';
import { Bell, BellOff, ChevronDown, ChevronUp, ExternalLink, GripVertical, Pencil, Trash2, UserRound } from 'lucide-react';
import type { Idol } from '../types/idol';
import { getFavoriteTimes } from '../lib/time';
import { getPhoto } from '../lib/images';

export function IdolCard({ idol, reorderMode = false, canMoveUp = false, canMoveDown = false, onEdit, onDelete, onToggle, onWrite, onMoveUp, onMoveDown }: { idol: Idol; reorderMode?: boolean; canMoveUp?: boolean; canMoveDown?: boolean; onEdit: () => void; onDelete: () => void; onToggle: () => void; onWrite: () => void; onMoveUp?: () => void; onMoveDown?: () => void }) {
  const [photo, setPhoto] = useState<string | null>(null);
  useEffect(() => {
    let active = true; let url: string | null = null;
    if (idol.photoId) void getPhoto(idol.photoId).then((value) => { url = value; if (active) setPhoto(value); });
    return () => { active = false; if (url) URL.revokeObjectURL(url); };
  }, [idol.photoId]);
  const times = getFavoriteTimes(idol.birthMonth, idol.birthDay);
  return <div className="card flex items-center gap-3 p-3">
    {reorderMode && <GripVertical size={18} className="shrink-0 cursor-grab text-rose-300 active:cursor-grabbing" aria-hidden="true" />}
    <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-rose-50 text-rose-300">{photo ? <img className="h-full w-full object-cover" src={photo} /> : <UserRound size={22} />}</div>
    <div className="min-w-0 flex-1"><div className="truncate font-semibold">{idol.name}{idol.nickname ? <span className="ml-1 font-normal text-rose-400">({idol.nickname})</span> : null}</div><div className="truncate text-xs text-slate-400">{idol.groupName || '솔로'} · {times.join(' · ')} · {idol.preNotificationEnabled === false ? '미리 알림 꺼짐' : `${idol.notificationLeadMinutes ?? 5}분 전`}</div></div>
    {reorderMode ? <div className="flex shrink-0 flex-col">
      <button disabled={!canMoveUp} className="rounded p-0.5 text-rose-400 disabled:text-slate-200" onClick={onMoveUp} title="위로 이동" aria-label={`${idol.name} 위로 이동`}><ChevronUp size={17} /></button>
      <button disabled={!canMoveDown} className="rounded p-0.5 text-rose-400 disabled:text-slate-200" onClick={onMoveDown} title="아래로 이동" aria-label={`${idol.name} 아래로 이동`}><ChevronDown size={17} /></button>
    </div> : <>
      <button className="p-1.5 text-rose-400" onClick={onToggle} title="알림 전환">{idol.notificationEnabled ? <Bell size={17} /> : <BellOff size={17} className="text-slate-300" />}</button>
      {idol.postUrl && <button className="p-1.5 text-rose-400" onClick={onWrite} title="글 쓰러 가기"><ExternalLink size={17} /></button>}
      <button className="p-1.5 text-slate-400" onClick={onEdit} title="수정"><Pencil size={16} /></button>
      <button className="p-1.5 text-slate-400 hover:text-red-500" onClick={onDelete} title="삭제"><Trash2 size={16} /></button>
    </>}
  </div>;
}
