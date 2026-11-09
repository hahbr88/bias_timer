import { useEffect, useMemo, useState } from 'react';
import { Plus, Sparkles } from 'lucide-react';
import { Countdown } from '../../components/Countdown';
import { IdolCard } from '../../components/IdolCard';
import { IdolForm, type IdolDraft } from '../../components/IdolForm';
import { deletePhoto, savePhoto } from '../../lib/images';
import { getIdols, notifyDataChanged, saveIdols } from '../../lib/storage';
import { getFavoriteTimes, getNextFavorite } from '../../lib/time';
import type { Idol } from '../../types/idol';

export default function App() {
  const [idols, setIdols] = useState<Idol[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Idol | 'new' | null>(null);
  useEffect(() => { void getIdols().then(setIdols).finally(() => setLoading(false)); }, []);
  const next = useMemo(() => getNextFavorite(idols), [idols]);
  async function persist(nextIdols: Idol[]) { setIdols(nextIdols); await saveIdols(nextIdols); await notifyDataChanged(); }
  async function save(draft: IdolDraft) {
    if (editing === 'new' && idols.length >= 10) throw new Error('최애는 최대 10명까지 등록할 수 있어요.');
    const now = Date.now();
    let photoId = editing !== 'new' ? editing?.photoId ?? null : null;
    if (draft.photo) { const previous = photoId; photoId = await savePhoto(draft.photo); await deletePhoto(previous); }
    const idol: Idol = { ...draft, photoId, id: editing !== 'new' && editing ? editing.id : crypto.randomUUID(), createdAt: editing !== 'new' && editing ? editing.createdAt : now, updatedAt: now };
    delete (idol as Idol & { photo?: File }).photo;
    await persist(editing !== 'new' && editing ? idols.map((item) => item.id === editing.id ? idol : item) : [...idols, idol]);
    setEditing(null);
  }
  async function remove(idol: Idol) {
    if (!confirm(`${idol.name}님을 삭제할까요?`)) return;
    await persist(idols.filter((item) => item.id !== idol.id)); await deletePhoto(idol.photoId);
  }
  if (loading) return <div className="grid h-[560px] place-items-center text-sm text-rose-400">불러오는 중…</div>;
  if (editing) return <IdolForm initial={editing === 'new' ? undefined : editing} onCancel={() => setEditing(null)} onSave={save} />;
  return <main className="p-4">
    <header className="mb-4 flex items-center justify-between"><div><div className="flex items-center gap-1.5 text-xl font-black"><Sparkles size={19} className="text-rose-400" /> 최애시 타이머</div><p className="mt-0.5 text-xs text-slate-400">당신의 최애를 위한 특별한 순간</p></div><div className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-400">{idols.length} / 10</div></header>
    {next ? <section className="card mb-5 overflow-hidden p-4 text-center"><div className="text-[11px] font-bold tracking-[.18em] text-rose-400">NEXT 최애시</div><div className="mt-2 text-lg font-bold">{next.idols.map((idol) => idol.name).join(', ')}</div><div className="text-xs text-slate-400">{next.idols[0]?.groupName || '솔로'} · {getFavoriteTimes(next.idols[0]!.birthMonth, next.idols[0]!.birthDay).join(' / ')}</div><Countdown target={next.at} /></section> : <section className="card mb-5 p-7 text-center"><div className="text-sm font-semibold">첫 최애를 등록해 보세요</div><div className="mt-1 text-xs text-slate-400">생일로 계산한 특별한 시간을 알려드릴게요.</div></section>}
    <div className="mb-2 flex items-center justify-between"><h2 className="text-sm font-bold">등록한 최애</h2><button disabled={idols.length >= 10} onClick={() => setEditing('new')} className="flex items-center gap-1 rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white disabled:bg-slate-200"><Plus size={14} /> 등록</button></div>
    <div className="space-y-2">{idols.map((idol) => <IdolCard key={idol.id} idol={idol} onEdit={() => setEditing(idol)} onDelete={() => void remove(idol)} onToggle={() => void persist(idols.map((item) => item.id === idol.id ? { ...item, notificationEnabled: !item.notificationEnabled, updatedAt: Date.now() } : item))} />)}</div>
    {idols.length >= 10 && <p className="mt-3 text-center text-xs text-slate-400">최대 10명까지 등록할 수 있어요.</p>}
  </main>;
}
