/** Datas locais como 'YYYY-MM-DD'; semanas começam na segunda. */

const pad = (n: number) => String(n).padStart(2, '0');

export const dateKey = (d: Date): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(d: Date, days: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + days);
  return r;
}

/** Segunda-feira da semana de `d`. */
export function weekStart(d: Date): Date {
  const r = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = (r.getDay() + 6) % 7; // segunda = 0
  return addDays(r, -dow);
}

export const weekStartKey = (d: Date): string => dateKey(weekStart(d));

/** As últimas `n` semanas (mais antiga primeiro), terminando na semana de `today`. */
export function lastWeekKeys(n: number, today: Date): string[] {
  const current = weekStart(today);
  return Array.from({ length: n }, (_, i) => dateKey(addDays(current, -7 * (n - 1 - i))));
}

/** Semanas consecutivas com treino, contando a atual só se já houve treino nela. */
export function currentStreak(weeks: readonly string[], trained: ReadonlySet<string>): number {
  let streak = 0;
  for (let i = weeks.length - 1; i >= 0; i--) {
    if (trained.has(weeks[i])) streak++;
    else if (i === weeks.length - 1) continue; // semana atual ainda em aberto
    else break;
  }
  return streak;
}
