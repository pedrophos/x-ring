import type { TargetFaceDef } from './target-face';

/**
 * Convenções de coordenadas:
 * - Desenho (SVG): mm, x para a direita, y para BAIXO. `centers` do alvo usam este sistema.
 * - Flecha: mm relativos ao centro do spot, x para a direita, y para CIMA.
 */

export type ViewBox = { minX: number; minY: number; width: number; height: number };
export type ArrowPoint = { spotIndex: number; xMm: number; yMm: number };

export const outerRadius = (face: Pick<TargetFaceDef, 'rings'>): number =>
  Math.max(...face.rings.map((r) => r.radiusMm));

/** Largura de um anel comum (o mais externo), usada como escala nas análises. */
export function ringWidth(face: Pick<TargetFaceDef, 'rings'>): number {
  const radii = [...new Set(face.rings.filter((r) => !r.isX).map((r) => r.radiusMm))].sort((a, b) => a - b);
  if (radii.length < 2) return radii[0] ?? 1;
  return radii[radii.length - 1] - radii[radii.length - 2];
}

/** Área do desenho: todos os spots com uma margem (fração do raio) para registrar flechas fora. */
export function faceViewBox(face: TargetFaceDef, marginRatio = 0.12): ViewBox {
  const r = outerRadius(face);
  const m = r * marginRatio;
  const xs = face.centers.map((c) => c.x);
  const ys = face.centers.map((c) => c.y);
  const minX = Math.min(...xs) - r - m;
  const minY = Math.min(...ys) - r - m;
  return {
    minX,
    minY,
    width: Math.max(...xs) + r + m - minX,
    height: Math.max(...ys) + r + m - minY,
  };
}

/** Pixel dentro da área tocável → coordenada de desenho (mm). */
export function pxToDrawing(
  px: number,
  py: number,
  sizePx: { width: number; height: number },
  vb: ViewBox,
): { x: number; y: number } {
  return {
    x: vb.minX + (px / sizePx.width) * vb.width,
    y: vb.minY + (py / sizePx.height) * vb.height,
  };
}

/** Coordenada de desenho → flecha relativa ao spot mais próximo. */
export function drawingToArrow(face: TargetFaceDef, x: number, y: number): ArrowPoint {
  let spotIndex = 0;
  let best = Infinity;
  face.centers.forEach((c, i) => {
    const d = Math.hypot(x - c.x, y - c.y);
    if (d < best) {
      best = d;
      spotIndex = i;
    }
  });
  const c = face.centers[spotIndex];
  return { spotIndex, xMm: x - c.x, yMm: c.y - y };
}

/** Flecha → coordenada de desenho. `spotIndex` fora do alvo cai no primeiro spot. */
export function arrowToDrawing(face: TargetFaceDef, a: ArrowPoint): { x: number; y: number } {
  const c = face.centers[a.spotIndex] ?? face.centers[0];
  return { x: c.x + a.xMm, y: c.y - a.yMm };
}
