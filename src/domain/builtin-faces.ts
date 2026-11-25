import type { Ring, TargetFaceDef } from './target-face';

/**
 * Alvos padrão da World Archery (recurvo).
 * Face WA de 10 zonas: cada zona tem largura = diâmetro / 20.
 * O X (10 interno) tem metade do raio do 10.
 * Fonte: livro de regras da World Archery (40 cm: 10 de 40 mm no recurvo).
 */

const ZONE_COLORS: Record<number, string> = {
  1: '#FFFFFF',
  2: '#FFFFFF',
  3: '#1A1A1A',
  4: '#1A1A1A',
  5: '#2F80ED',
  6: '#2F80ED',
  7: '#E53935',
  8: '#E53935',
  9: '#FFD21F',
  10: '#FFD21F',
};

/** Anéis de uma face WA de `diameterMm`, do valor `lowest` até 10, mais o X. */
export function waRings(diameterMm: number, lowest = 1): Ring[] {
  const zone = diameterMm / 20;
  const rings: Ring[] = [{ radiusMm: zone / 2, value: 10, color: ZONE_COLORS[10], isX: true }];
  for (let value = 10; value >= lowest; value--) {
    rings.push({ radiusMm: (11 - value) * zone, value, color: ZONE_COLORS[value] });
  }
  return rings;
}

/**
 * Distância entre centros no triplo vertical de 40 cm.
 * Só afeta o desenho: flechas são guardadas relativas ao centro do spot.
 * TODO: conferir no Book 2 vigente da World Archery.
 */
export const TRIPLE_SPOT_SPACING_MM = 220;

export const BUILTIN_FACES: (TargetFaceDef & { builtinKey: string })[] = [
  { builtinKey: 'wa40', name: 'WA 40 cm', rings: waRings(400), centers: [{ x: 0, y: 0 }] },
  {
    builtinKey: 'wa40_triple_vertical',
    name: 'Triplo vertical 40 cm',
    rings: waRings(400, 6),
    centers: [
      { x: 0, y: -TRIPLE_SPOT_SPACING_MM },
      { x: 0, y: 0 },
      { x: 0, y: TRIPLE_SPOT_SPACING_MM },
    ],
  },
  { builtinKey: 'wa80', name: 'WA 80 cm', rings: waRings(800), centers: [{ x: 0, y: 0 }] },
  { builtinKey: 'wa122', name: 'WA 122 cm', rings: waRings(1220), centers: [{ x: 0, y: 0 }] },
];
