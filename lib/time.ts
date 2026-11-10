import type { AlarmType, FavoriteEvent, Idol } from '../types/idol';

export function getFavoriteTimes(month: number, day: number): [string, string] {
  const hour = month % 12;
  const minute = String(day).padStart(2, '0');
  return [
    `${String(hour).padStart(2, '0')}:${minute}`,
    `${String(hour + 12).padStart(2, '0')}:${minute}`,
  ];
}

function occurrences(idol: Idol, from: Date, leadMinutes: number) {
  const times = getFavoriteTimes(idol.birthMonth, idol.birthDay);
  const result: Array<{ at: Date; type: AlarmType; idol: Idol }> = [];
  for (let offset = -1; offset <= 2; offset += 1) {
    for (const time of times) {
      const [hour, minute] = time.split(':').map(Number) as [number, number];
      const exact = new Date(from);
      exact.setDate(from.getDate() + offset);
      exact.setHours(hour, minute, 0, 0);
      result.push({ at: exact, type: 'exact', idol });
      result.push({ at: new Date(exact.getTime() - leadMinutes * 60_000), type: 'pre', idol });
    }
  }
  return result;
}

export function getUpcomingEvents(idols: Idol[], from = new Date(), fallbackLeadMinutes = 5): FavoriteEvent[] {
  const grouped = new Map<string, FavoriteEvent>();
  for (const idol of idols.filter((item) => item.notificationEnabled)) {
    const leadMinutes = idol.notificationLeadMinutes ?? fallbackLeadMinutes;
    for (const item of occurrences(idol, from, leadMinutes)) {
      if (item.type === 'pre' && idol.preNotificationEnabled === false) continue;
      if (item.type === 'exact' && idol.exactNotificationEnabled === false) continue;
      if (item.at.getTime() < from.getTime()) continue;
      const key = `${item.type}:${item.at.getTime()}`;
      const existing = grouped.get(key);
      if (existing) existing.idols.push(idol);
      else grouped.set(key, { at: item.at, type: item.type, idols: [idol] });
    }
  }
  return [...grouped.values()].sort((a, b) => a.at.getTime() - b.at.getTime());
}

export function getNextFavorite(idols: Idol[], from = new Date()) {
  const enabled = idols.filter((idol) => idol.notificationEnabled);
  let next: { at: Date; idols: Idol[] } | null = null;
  for (const idol of enabled) {
    const event = occurrences(idol, from, 5)
      .filter((item) => item.type === 'exact' && item.at.getTime() >= from.getTime())
      .sort((a, b) => a.at.getTime() - b.at.getTime())[0];
    if (!event) continue;
    if (!next || event.at.getTime() < next.at.getTime()) next = { at: event.at, idols: [idol] };
    else if (event.at.getTime() === next.at.getTime()) next.idols.push(idol);
  }
  return next;
}

export function formatCountdown(ms: number) {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  return {
    hours: String(Math.floor(seconds / 3600)).padStart(2, '0'),
    minutes: String(Math.floor((seconds % 3600) / 60)).padStart(2, '0'),
    seconds: String(seconds % 60).padStart(2, '0'),
  };
}
