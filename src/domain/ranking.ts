export type HandicapType = 'none' | 'distance' | 'target' | 'points';

/**
 * Pontos de handicap somados ao total. Handicap por distância ou por alvo é
 * dado na montagem (atira mais perto / alvo maior) e não soma pontos.
 */
export const handicapBonus = (type: HandicapType, pointsPerEnd: number, endsShot: number): number =>
  type === 'points' ? pointsPerEnd * endsShot : 0;

export type RankInput = {
  participantId: string;
  total: number;
  handicap: number;
  /** 10s (inclui X): primeiro desempate. */
  tens: number;
  /** X: segundo desempate. */
  xs: number;
};

export type RankedEntry = RankInput & { final: number; rank: number };

const compare = (a: RankedEntry, b: RankedEntry) => b.final - a.final || b.tens - a.tens || b.xs - a.xs;

/** Ordena por final, depois 10s, depois X. Empate total divide a posição. */
export function rankEntries(entries: readonly RankInput[]): RankedEntry[] {
  const sorted = entries.map((e) => ({ ...e, final: e.total + e.handicap, rank: 0 })).sort(compare);
  sorted.forEach((e, i) => {
    e.rank = i > 0 && compare(sorted[i - 1], e) === 0 ? sorted[i - 1].rank : i + 1;
  });
  return sorted;
}

export type CompetitionResult = { archerId: string; rank: number; score: number }[];

/** Confronto direto: em quantas competições cada um ficou à frente do outro. */
export function headToHead(
  results: readonly CompetitionResult[],
  a: string,
  b: string,
): { wins: number; losses: number; draws: number } {
  const r = { wins: 0, losses: 0, draws: 0 };
  for (const comp of results) {
    const ra = comp.find((x) => x.archerId === a);
    const rb = comp.find((x) => x.archerId === b);
    if (!ra || !rb) continue;
    if (ra.rank < rb.rank) r.wins++;
    else if (ra.rank > rb.rank) r.losses++;
    else r.draws++;
  }
  return r;
}
