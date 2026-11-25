import { describe, expect, it } from '@jest/globals';

import {
  clampDistance,
  DISTANCE_MAX_M,
  DISTANCE_MIN_M,
  distanceToFraction,
  fractionToDistance,
  STANDARD_DISTANCES_M,
} from '../distance-scale';

describe('escala de distância', () => {
  it('vai de 0 no mínimo a 1 no máximo, com 30 m em 60%', () => {
    expect(distanceToFraction(DISTANCE_MIN_M)).toBe(0);
    expect(distanceToFraction(DISTANCE_MAX_M)).toBe(1);
    expect(distanceToFraction(30)).toBeCloseTo(0.6);
  });

  it('ida e volta devolve o mesmo metro em todo o intervalo', () => {
    for (let m = DISTANCE_MIN_M; m <= DISTANCE_MAX_M; m++) {
      expect(fractionToDistance(distanceToFraction(m))).toBe(m);
    }
  });

  it('dá mais espaço por metro no trecho curto', () => {
    const short = distanceToFraction(9) - distanceToFraction(8);
    const long = distanceToFraction(71) - distanceToFraction(70);
    expect(short).toBeGreaterThan(long * 2);
  });

  it('limita e arredonda', () => {
    expect(fractionToDistance(-0.2)).toBe(DISTANCE_MIN_M);
    expect(fractionToDistance(1.4)).toBe(DISTANCE_MAX_M);
    expect(clampDistance(8.4)).toBe(8);
    expect(clampDistance(120)).toBe(DISTANCE_MAX_M);
  });

  it('as distâncias padrão ficam em ordem e separadas no trilho', () => {
    const xs = STANDARD_DISTANCES_M.map(distanceToFraction);
    for (let i = 1; i < xs.length; i++) expect(xs[i] - xs[i - 1]).toBeGreaterThan(0.1);
  });
});
