export const DAY_MS = 86_400_000;

export function todayStr(offsetDays = 0): string {
  const d = new Date(Date.now() + offsetDays * DAY_MS);
  return d.toISOString().slice(0, 10);
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function diffDays(from: string, to: string): number {
  const a = new Date(`${from}T00:00:00.000Z`).getTime();
  const b = new Date(`${to}T00:00:00.000Z`).getTime();
  return Math.round((a - b) / DAY_MS);
}

export function weekStart(date: string): string {
  const d = new Date(`${date}T00:00:00.000Z`);
  const day = d.getUTCDay(); // 0 = Sunday
  const toMonday = (day + 6) % 7;
  d.setUTCDate(d.getUTCDate() - toMonday);
  return d.toISOString().slice(0, 10);
}

export interface BuildStats {
  currentStreak: number;
  weekly: {
    weekStart: string;
    weekEnd: string;
    completedDays: string[];
    totalDaysThisWeek: number;
    missedThisWeek: number;
  };
}

export function buildStats(completedDates: string[], today = todayStr()): BuildStats {
  const completed = new Set(completedDates);

  // Streak: consecutive days ending today; a not-yet-completed today does not break it.
  let cursor = today;
  if (!completed.has(cursor)) cursor = addDays(cursor, -1);
  let currentStreak = 0;
  while (completed.has(cursor)) {
    currentStreak += 1;
    cursor = addDays(cursor, -1);
  }

  const start = weekStart(today);
  const end = addDays(start, 6);
  const completedDays: string[] = [];
  for (let d = start; diffDays(end, d) >= 0 && diffDays(today, d) >= 0; d = addDays(d, 1)) {
    if (completed.has(d)) completedDays.push(d);
  }
  const totalDaysThisWeek = Math.min(diffDays(today, start) + 1, 7);
  const missedThisWeek = Math.max(0, totalDaysThisWeek - completedDays.length);

  return { currentStreak, weekly: { weekStart: start, weekEnd: end, completedDays, totalDaysThisWeek, missedThisWeek } };
}

export interface BreakStats {
  cleanStreak: number;
  lastRelapse: string | null;
  relapses: string[];
}

export function breakStats(
  relapseDates: string[],
  createdDate: string,
  today = todayStr(),
): BreakStats {
  const relapses = [...relapseDates].sort();
  const lastRelapse = relapses.length > 0 ? relapses[relapses.length - 1] : null;

  // Anchor = day after last relapse (first clean day), or creation day if never relapsed.
  const anchor = lastRelapse ? addDays(lastRelapse, 1) : createdDate;
  const cleanStreak = Math.max(0, diffDays(today, anchor) + 1);

  return { cleanStreak, lastRelapse, relapses };
}