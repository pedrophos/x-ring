/**
 * Escala do seletor de distância. Não é linear: o trecho curto (onde fica o
 * tiro casual, em casa ou no quintal) ganha mais espaço para o dedo acertar o
 * metro; as distâncias longas, quase sempre oficiais, vão pelos atalhos.
 */
export const DISTANCE_MIN_M = 3;
export const DISTANCE_MAX_M = 90;
/** Distâncias oficiais mais comuns no recurvo (sala e campo aberto). */
export const STANDARD_DISTANCES_M = [10, 18, 30, 50, 70, 90] as const;

const KNEE_M = 30;
const KNEE_AT = 0.6; // 3–30 m ocupa 60% do trilho

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function clampDistance(m: number): number {
  return clamp(Math.round(m), DISTANCE_MIN_M, DISTANCE_MAX_M);
}

/** Distância (m) → posição no trilho, de 0 a 1. */
export function distanceToFraction(m: number): number {
  const d = clamp(m, DISTANCE_MIN_M, DISTANCE_MAX_M);
  if (d <= KNEE_M) return ((d - DISTANCE_MIN_M) / (KNEE_M - DISTANCE_MIN_M)) * KNEE_AT;
  return KNEE_AT + ((d - KNEE_M) / (DISTANCE_MAX_M - KNEE_M)) * (1 - KNEE_AT);
}

/** Posição no trilho (0 a 1) → distância inteira em metros. */
export function fractionToDistance(f: number): number {
  const x = clamp(f, 0, 1);
  const m =
    x <= KNEE_AT
      ? DISTANCE_MIN_M + (x / KNEE_AT) * (KNEE_M - DISTANCE_MIN_M)
      : KNEE_M + ((x - KNEE_AT) / (1 - KNEE_AT)) * (DISTANCE_MAX_M - KNEE_M);
  return clampDistance(m);
}
