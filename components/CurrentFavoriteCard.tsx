import { useEffect, useState } from 'react';
import { ExternalLink, UserRound } from 'lucide-react';
import { browser } from 'wxt/browser';
import { getPhoto } from '../lib/images';
import { currentLocale, t } from '../lib/i18n';
import type { Idol } from '../types/idol';

function CurrentPhoto({ idol }: { idol: Idol }) {
  const [photo, setPhoto] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    let url: string | null = null;
    if (idol.photoId) void getPhoto(idol.photoId).then((value) => {
      url = value;
      if (active) setPhoto(value);
    });
    return () => {
      active = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [idol.photoId]);
  return <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-white bg-white/70 text-rose-400 shadow-sm">{photo ? <img className="h-full w-full object-cover" src={photo} alt="" /> : <UserRound size={22} />}</div>;
}

export function CurrentFavoriteCard({ idols, at, now }: { idols: Idol[]; at: Date; now: number }) {
  const names = idols.map((idol) => idol.nickname || idol.name).join(', ');
  const endAt = at.getTime() + 60_000;
  const remaining = Math.max(0, Math.ceil((endAt - now) / 1000));
  const time = currentLocale() === 'ko'
    ? `${at.getHours() < 12 ? '오전' : '오후'} ${at.getHours() % 12 || 12}시 ${at.getMinutes()}분`
    : new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(at);
  return <section className="current-favorite-card card mb-5 overflow-hidden p-4 text-center">
    <div className="text-[11px] font-black tracking-[.18em] text-rose-500">{t('favoriteTimeNow')}</div>
    <div className="mt-2 text-xl font-black text-rose-600">{t('currentFavoriteTitle', names)}</div>
    <div className="mt-1 text-xs font-semibold text-rose-400">{t('currentFavoriteAt', time)}</div>
    <div className="my-3 flex justify-center -space-x-2">{idols.slice(0, 4).map((idol) => <CurrentPhoto key={idol.id} idol={idol} />)}{idols.length > 4 && <div className="grid h-12 w-12 place-items-center rounded-full border-2 border-white bg-rose-100 text-xs font-bold text-rose-500">+{idols.length - 4}</div>}</div>
    <div className="mb-3 text-xs font-semibold text-slate-500">{t('currentFavoriteRemaining', `00:${String(remaining).padStart(2, '0')}`)}</div>
    <div className="flex flex-wrap justify-center gap-2">{idols.filter((idol) => /^https?:\/\//i.test(idol.postUrl)).map((idol) => <button key={idol.id} onClick={() => void browser.tabs.create({ url: idol.postUrl })} className="flex items-center gap-1.5 rounded-xl bg-rose-500 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-rose-600"><ExternalLink size={14} />{idols.length > 1 ? t('writePostFor', idol.nickname || idol.name) : t('writePost')}</button>)}</div>
  </section>;
}
