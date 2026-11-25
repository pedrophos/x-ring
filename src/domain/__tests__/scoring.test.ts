import { describe, expect, it } from '@jest/globals';

import { BUILTIN_FACES, waRings } from '../builtin-faces';
import { scoreArrow } from '../scoring';

const wa40 = waRings(400);
const triple = BUILTIN_FACES.find((f) => f.builtinKey === 'wa40_triple_vertical')!.rings;
const at = (xMm: number, yMm = 0) => ({ isMiss: false as const, xMm, yMm });

describe('waRings', () => {
  it('WA 40 cm: zonas de 20 mm, X com raio 10 mm, borda externa em 200 mm', () => {
    expect(wa40.find((r) => r.isX)?.radiusMm).toBe(10);
    expect(wa40.find((r) => r.value === 10 && !r.isX)?.radiusMm).toBe(20);
    expect(wa40.find((r) => r.value === 1)?.radiusMm).toBe(200);
  });

  it('WA 122 cm: zonas de 61 mm', () => {
    expect(waRings(1220).find((r) => r.value === 9)?.radiusMm).toBeCloseTo(122);
  });
});

describe('scoreArrow (haste de 5 mm)', () => {
  const d = 5;

  it('centro é X', () => {
    expect(scoreArrow(at(0), wa40, d)).toEqual({ value: 10, isX: true, label: 'X' });
  });

  it('haste tocando a linha do X conta X (regra da linha)', () => {
    expect(scoreArrow(at(12.5), wa40, d).label).toBe('X');
    expect(scoreArrow(at(12.6), wa40, d).label).toBe('10');
  });

  it('haste tocando a linha 9/10 vale 10', () => {
    expect(scoreArrow(at(0, 22.5), wa40, d).value).toBe(10);
    expect(scoreArrow(at(0, 22.6), wa40, d).value).toBe(9);
  });

  it('usa a distância radial (diagonal)', () => {
    expect(scoreArrow(at(30, 30), wa40, d).value).toBe(9); // 42.4 − 2.5 = 39.9 ≤ 40
    expect(scoreArrow(at(35, 35), wa40, d).value).toBe(8); // 49.5 − 2.5 = 47.0
  });

  it('fora do alvo é M', () => {
    expect(scoreArrow(at(203), wa40, d).label).toBe('M');
    expect(scoreArrow({ isMiss: true }, wa40, d)).toEqual({ value: 0, isX: false, label: 'M' });
  });

  it('triplo: abaixo do 6 é M', () => {
    expect(scoreArrow(at(95), triple, d).value).toBe(6);
    expect(scoreArrow(at(103), triple, d).label).toBe('M');
  });
});
