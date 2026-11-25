import { dateKey, lastWeekKeys, weekStartKey } from '@/domain/weeks';

import type { Db } from './client';
import { getMe, getWeekPlan, listFocus, loadSessions, openSession } from './repo';

export const WEEKS_SHOWN = 12;

/** Semanas (segunda 'YYYY-MM-DD') em que o atirador principal atirou alguma série. */
export function trainedWeeks(sessions: Awaited<ReturnType<typeof loadSessions>>, meId: string): Set<string> {
  const set = new Set<string>();
  for (const s of sessions) {
    if (s.participants.some((p) => p.archerId === meId && p.ends.length > 0)) set.add(weekStartKey(s.startedAt));
  }
  return set;
}

export async function loadOverview(db: Db, today = new Date()) {
  const me = await getMe(db);
  const week = weekStartKey(today);
  const [sessions, open, plan, focusList] = await Promise.all([
    loadSessions(db),
    openSession(db),
    getWeekPlan(db, me.id, week),
    listFocus(db, me.id),
  ]);
  const weeks = lastWeekKeys(WEEKS_SHOWN, today);
  return {
    me,
    week,
    today: dateKey(today),
    weeks,
    trained: trainedWeeks(sessions, me.id),
    open,
    plan,
    focus: focusList.find((f) => f.weekStart === week) ?? null,
    previousFocus: focusList.find((f) => f.weekStart < week) ?? null,
    sessionsThisWeek: sessions.filter((s) => weekStartKey(s.startedAt) === week),
  };
}
