/**
 * Leitura do grupo: o mais perto de um instrutor olhando o alvo.
 * Limiares fixos no MVP (decisão em docs/briefing.md); calibrar pelo histórico depois.
 */

export type Point = { xMm: number; yMm: number };

export const MIN_ARROWS_FOR_READING = 3;
/** Razão entre desvios (vertical/horizontal) a partir da qual o grupo é "alongado". */
export const ELONGATION_RATIO = 1.6;

export type GroupPattern = 'vertical' | 'horizontal' | 'round';

export type GroupReading = {
  count: number;
  centroid: Point;
  /** Distância do centroide ao centro do spot. */
  offsetMm: number;
  sdXMm: number;
  sdYMm: number;
  /** Distância média de cada flecha ao centroide: a medida de consistência. */
  meanRadiusMm: number;
  pattern: GroupPattern;
  /** Grupo fechado fora do centro: problema de mira, não de técnica. */
  offCenter: boolean;
  sight: { horizontal: 'left' | 'right' | null; vertical: 'up' | 'down' | null };
  causes: string[];
};

export function centroid(pts: readonly Point[]): Point {
  const n = pts.length;
  return {
    xMm: pts.reduce((s, p) => s + p.xMm, 0) / n,
    yMm: pts.reduce((s, p) => s + p.yMm, 0) / n,
  };
}

export function meanRadius(pts: readonly Point[], c: Point = centroid(pts)): number {
  return pts.reduce((s, p) => s + Math.hypot(p.xMm - c.xMm, p.yMm - c.yMm), 0) / pts.length;
}

const sd = (values: number[], mean: number) =>
  Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length);

export const VERTICAL_CAUSES = [
  'Ancoragem variando de altura entre as flechas',
  'Puxada inconsistente: nem sempre chega ao mesmo ponto',
  'Pressão da mão no punho do arco mudando (alta/baixa)',
  'Soltando em pontos diferentes da respiração',
];

export const HORIZONTAL_CAUSES = [
  'Torque na empunhadura: a mão gira o arco',
  'Soltura puxando para o lado ou dedos abrindo desiguais',
  'Alinhamento do ombro e braço do arco variando',
  'Imagem da corda (onde a corda aparece na visão) mudando',
];

export const ROUND_CAUSES = ['Dispersão em todas as direções: foque um elemento técnico por vez'];

/**
 * @param ringWidthMm largura de um anel do alvo, usada como escala.
 * @returns null com menos de 3 flechas no alvo.
 */
export function readGroup(pts: readonly Point[], ringWidthMm: number): GroupReading | null {
  if (pts.length < MIN_ARROWS_FOR_READING) return null;

  const c = centroid(pts);
  const sdXMm = sd(
    pts.map((p) => p.xMm),
    c.xMm,
  );
  const sdYMm = sd(
    pts.map((p) => p.yMm),
    c.yMm,
  );
  const radius = meanRadius(pts, c);
  const offsetMm = Math.hypot(c.xMm, c.yMm);

  const minSd = Math.max(Math.min(sdXMm, sdYMm), 0.5);
  let pattern: GroupPattern = 'round';
  if (sdYMm / minSd >= ELONGATION_RATIO && sdYMm > sdXMm) pattern = 'vertical';
  else if (sdXMm / minSd >= ELONGATION_RATIO && sdXMm > sdYMm) pattern = 'horizontal';

  // Grupo espalhado demais para concluir algo sobre técnica (menos de 1 anel) não gera causas.
  const spreadMatters = radius >= ringWidthMm * 0.5;
  const causes =
    !spreadMatters
      ? []
      : pattern === 'vertical'
        ? VERTICAL_CAUSES
        : pattern === 'horizontal'
          ? HORIZONTAL_CAUSES
          : radius >= ringWidthMm * 1.5
            ? ROUND_CAUSES
            : [];

  const offCenter = offsetMm >= ringWidthMm && offsetMm >= radius;
  const half = ringWidthMm / 2;
  // Mira segue a flecha: grupo alto → mira para cima.
  const sight: GroupReading['sight'] = offCenter
    ? {
        horizontal: Math.abs(c.xMm) >= half ? (c.xMm > 0 ? 'right' : 'left') : null,
        vertical: Math.abs(c.yMm) >= half ? (c.yMm > 0 ? 'up' : 'down') : null,
      }
    : { horizontal: null, vertical: null };

  return { count: pts.length, centroid: c, offsetMm, sdXMm, sdYMm, meanRadiusMm: radius, pattern, offCenter, sight, causes };
}
