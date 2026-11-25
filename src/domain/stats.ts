import { meanRadius, MIN_ARROWS_FOR_READING, type Point } from './group-analysis';
import { type ArrowScore } from './scoring';

export type ScoredArrow = ArrowScore & { isMiss: boolean; xMm: number | null; yMm: number | null };
export type ScoredEnd = { arrows: ScoredArrow[] };

export const hits = (arrows: readonly ScoredArrow[]): Point[] =>
  arrows.filter((a) => !a.isMiss && a.xMm != null && a.yMm != null).map((a) => ({ xMm: a.xMm!, yMm: a.yMm! }));

export const endTotal = (e: ScoredEnd): number => e.arrows.reduce((s, a) => s + a.value, 0);

export type Summary = {
  ends: number;
  arrows: number;
  total: number;
  /** Média por flecha; null sem flechas. */
  average: number | null;
  tens: number;
  xs: number;
  misses: number;
  firstEndAverage: number | null;
  lastEndAverage: number | null;
  /** Média, entre as séries com 3+ flechas no alvo, da distância ao centroide da série (mm). */
  dispersionMm: number | null;
};

const avg = (e: ScoredEnd | undefined) =>
  e && e.arrows.length > 0 ? endTotal(e) / e.arrows.length : null;

export function summarize(ends: readonly ScoredEnd[]): Summary {
  const all = ends.flatMap((e) => e.arrows);
  const total = all.reduce((s, a) => s + a.value, 0);
  const radii = ends
    .map((e) => hits(e.arrows))
    .filter((pts) => pts.length >= MIN_ARROWS_FOR_READING)
    .map((pts) => meanRadius(pts));
  return {
    ends: ends.length,
    arrows: all.length,
    total,
    average: all.length ? total / all.length : null,
    tens: all.filter((a) => a.value === 10).length,
    xs: all.filter((a) => a.isX).length,
    misses: all.filter((a) => a.isMiss || a.value === 0).length,
    firstEndAverage: avg(ends[0]),
    lastEndAverage: ends.length > 1 ? avg(ends[ends.length - 1]) : null,
    dispersionMm: radii.length ? radii.reduce((s, r) => s + r, 0) / radii.length : null,
  };
}
