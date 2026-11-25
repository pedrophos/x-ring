/**
 * Definição de alvo como dado (não código). Todas as medidas em mm.
 * Sem dependências de Expo/React: reaproveitável no back-end futuro.
 */

export type Ring = {
  /** Raio externo do anel, em mm, a partir do centro do spot. */
  radiusMm: number;
  value: number;
  color: string;
  /** Anel interno do 10 (X): desempate e contagem de X. */
  isX?: boolean;
};

export type SpotCenter = {
  /** Posição do centro do spot no desenho do alvo, em mm (y para baixo, como no SVG). */
  x: number;
  y: number;
};

export type TargetFaceDef = {
  name: string;
  rings: Ring[];
  centers: SpotCenter[];
};
