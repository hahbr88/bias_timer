import { useEffect, useState } from 'react';
import { formatCountdown } from '../lib/time';
import { t } from '../lib/i18n';

export function Countdown({ target }: { target: Date }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [target]);
  const value = formatCountdown(target.getTime() - now);
  return <div className="flex items-end justify-center gap-2 py-3">
    {([[t('hours'), value.hours], [t('minuteUnit'), value.minutes], [t('seconds'), value.seconds]] as const).map(([label, number]) =>
      <div className="text-center" key={label}><div className="min-w-16 rounded-xl bg-rose-50 px-3 py-2 text-2xl font-bold text-rose-500">{number}</div><div className="mt-1 text-[11px] text-slate-400">{label}</div></div>)}
  </div>;
}
