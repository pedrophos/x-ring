import type { Ring } from './target-face';

export type ArrowPosition =
  | { isMiss: true }
  | { isMiss: false; xMm: number; yMm: number };

export type ArrowScore = {
  value: number;
  isX: boolean;
  /** Rótulo para exibir: 'X', '10'…'1' ou 'M'. */
  label: string;
};

const MISS: ArrowScore = { value: 0, isX: false, label: 'M' };

/**
 * Pontua uma flecha a partir da posição do centro da haste (mm, relativa ao
 * centro do spot). Regra da linha: se a haste toca a linha, vale o anel maior,
 * então a borda mais próxima do centro (distância − raio da haste) decide.
 */
export function scoreArrow(
  pos: ArrowPosition,
  rings: readonly Ring[],
  arrowDiameterMm: number,
): ArrowScore {
  if (pos.isMiss) return MISS;

  const edge = Math.max(0, Math.hypot(pos.xMm, pos.yMm) - arrowDiameterMm / 2);
  const sorted = [...rings].sort((a, b) => a.radiusMm - b.radiusMm);
  const ring = sorted.find((r) => edge <= r.radiusMm);
  if (!ring) return MISS;

  const isX = ring.isX === true;
  return { value: ring.value, isX, label: isX ? 'X' : String(ring.value) };
}
