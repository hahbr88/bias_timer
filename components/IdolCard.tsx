import { useEffect, useState } from 'react';
import { Bell, BellOff, Pencil, Trash2, UserRound } from 'lucide-react';
import type { Idol } from '../types/idol';
import { getFavoriteTimes } from '../lib/time';
import { getPhoto } from '../lib/images';

export function IdolCard({ idol, onEdit, onDelete, onToggle }: { idol: Idol; onEdit: () => void; onDelete: () => void; onToggle: () => void }) {
  const [photo, setPhoto] = useState<string | null>(null);
  useEffect(() => {
    let active = true; let url: string | null = null;
    if (idol.photoId) void getPhoto(idol.photoId).then((value) => { url = value; if (active) setPhoto(value); });
    return () => { active = false; if (url) URL.revokeObjectURL(url); };
  }, [idol.photoId]);
  const times = getFavoriteTimes(idol.birthMonth, idol.birthDay);
  return <div className="card flex items-center gap-3 p-3">
    <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-rose-50 text-rose-300">{photo ? <img className="h-full w-full object-cover" src={photo} /> : <UserRound size={22} />}</div>
    <div className="min-w-0 flex-1"><div className="truncate font-semibold">{idol.name}</div><div className="truncate text-xs text-slate-400">{idol.groupName || '솔로'} · {times.join(' · ')}</div></div>
    <button className="p-1.5 text-rose-400" onClick={onToggle} title="알림 전환">{idol.notificationEnabled ? <Bell size={17} /> : <BellOff size={17} className="text-slate-300" />}</button>
    <button className="p-1.5 text-slate-400" onClick={onEdit} title="수정"><Pencil size={16} /></button>
    <button className="p-1.5 text-slate-400 hover:text-red-500" onClick={onDelete} title="삭제"><Trash2 size={16} /></button>
  </div>;
}
