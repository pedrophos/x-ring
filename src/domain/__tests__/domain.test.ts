import { describe, expect, it } from '@jest/globals';

import { BUILTIN_FACES } from '../builtin-faces';
import { arrowToDrawing, drawingToArrow, faceViewBox, pxToDrawing, ringWidth } from '../geometry';
import { readGroup } from '../group-analysis';
import { handicapBonus, headToHead, rankEntries } from '../ranking';
import { summarize, type ScoredArrow } from '../stats';
import { nextElement } from '../technique';
import { currentStreak, dateKey, lastWeekKeys, weekStartKey } from '../weeks';

const wa40 = BUILTIN_FACES.find((f) => f.builtinKey === 'wa40')!;
const triple = BUILTIN_FACES.find((f) => f.builtinKey === 'wa40_triple_vertical')!;

describe('geometria', () => {
  it('converte pixel do centro da área para o centro do alvo', () => {
    const vb = faceViewBox(wa40);
    const p = pxToDrawing(150, 150, { width: 300, height: 300 }, vb);
    expect(p.x).toBeCloseTo(0);
    expect(p.y).toBeCloseTo(0);
  });

  it('y da flecha é para cima (inverso do desenho)', () => {
    expect(drawingToArrow(wa40, 10, -30)).toEqual({ spotIndex: 0, xMm: 10, yMm: 30 });
  });

  it('triplo: escolhe o spot mais próximo e devolve coordenada relativa a ele', () => {
    const a = drawingToArrow(triple, 5, 215); // spot de baixo
    expect(a.spotIndex).toBe(2);
    expect(a.xMm).toBeCloseTo(5);
    expect(a.yMm).toBeCloseTo(5);
    expect(arrowToDrawing(triple, a)).toEqual({ x: 5, y: 215 });
  });

  it('largura do anel do WA 40 é 20 mm', () => {
    expect(ringWidth(wa40)).toBe(20);
  });
});

describe('leitura do grupo', () => {
  it('menos de 3 flechas: sem leitura', () => {
    expect(readGroup([{ xMm: 0, yMm: 0 }], 20)).toBeNull();
  });

  it('grupo fechado alto à direita: problema de mira', () => {
    const r = readGroup(
      [
        { xMm: 48, yMm: 52 },
        { xMm: 52, yMm: 48 },
        { xMm: 50, yMm: 50 },
      ],
      20,
    )!;
    expect(r.offCenter).toBe(true);
    expect(r.sight).toEqual({ horizontal: 'right', vertical: 'up' });
    expect(r.causes).toEqual([]);
  });

  it('grupo alongado na vertical: causas verticais', () => {
    const r = readGroup(
      [
        { xMm: 0, yMm: 40 },
        { xMm: 3, yMm: 0 },
        { xMm: -2, yMm: -40 },
        { xMm: 1, yMm: 20 },
      ],
      20,
    )!;
    expect(r.pattern).toBe('vertical');
    expect(r.offCenter).toBe(false);
    expect(r.causes[0]).toMatch(/Ancoragem/);
  });

  it('grupo alongado na horizontal', () => {
    const r = readGroup(
      [
        { xMm: -40, yMm: 2 },
        { xMm: 40, yMm: -2 },
        { xMm: 0, yMm: 0 },
      ],
      20,
    )!;
    expect(r.pattern).toBe('horizontal');
  });
});

const arrow = (value: number, x: number | null = 0, y: number | null = 0, isX = false): ScoredArrow => ({
  value,
  isX,
  label: isX ? 'X' : value ? String(value) : 'M',
  isMiss: x == null,
  xMm: x,
  yMm: y,
});

describe('resumo', () => {
  it('média, 10s, X e primeira vs. última série', () => {
    const s = summarize([
      { arrows: [arrow(10, 0, 0, true), arrow(10), arrow(8)] },
      { arrows: [arrow(6), arrow(0, null, null), arrow(6)] },
    ]);
    expect(s.total).toBe(40);
    expect(s.average).toBeCloseTo(40 / 6);
    expect(s.tens).toBe(2);
    expect(s.xs).toBe(1);
    expect(s.misses).toBe(1);
    expect(s.firstEndAverage).toBeCloseTo(28 / 3);
    expect(s.lastEndAverage).toBe(4);
  });

  it('dispersão ignora séries com menos de 3 flechas no alvo', () => {
    const s = summarize([{ arrows: [arrow(10, 0, 10), arrow(10, 0, -10), arrow(10, 10, 0), arrow(10, -10, 0)] }, { arrows: [arrow(5, 90, 0)] }]);
    expect(s.dispersionMm).toBeCloseTo(10);
  });
});

describe('ranking', () => {
  it('ordena por final, desempata por 10s e depois X', () => {
    const r = rankEntries([
      { participantId: 'a', total: 250, handicap: 0, tens: 5, xs: 1 },
      { participantId: 'b', total: 240, handicap: 10, tens: 7, xs: 0 },
      { participantId: 'c', total: 260, handicap: 0, tens: 2, xs: 0 },
    ]);
    expect(r.map((e) => [e.participantId, e.rank])).toEqual([
      ['c', 1],
      ['b', 2],
      ['a', 3],
    ]);
  });

  it('empate total divide a posição', () => {
    const r = rankEntries([
      { participantId: 'a', total: 100, handicap: 0, tens: 2, xs: 1 },
      { participantId: 'b', total: 100, handicap: 0, tens: 2, xs: 1 },
      { participantId: 'c', total: 90, handicap: 0, tens: 0, xs: 0 },
    ]);
    expect(r.map((e) => e.rank)).toEqual([1, 1, 3]);
  });

  it('handicap em pontos soma por série; distância e alvo não somam', () => {
    expect(handicapBonus('points', 3, 6)).toBe(18);
    expect(handicapBonus('distance', 3, 6)).toBe(0);
  });

  it('confronto direto', () => {
    const res = [
      [
        { archerId: 'me', rank: 1, score: 200 },
        { archerId: 'f', rank: 2, score: 180 },
      ],
      [
        { archerId: 'me', rank: 2, score: 170 },
        { archerId: 'f', rank: 1, score: 190 },
      ],
      [{ archerId: 'me', rank: 1, score: 150 }],
    ];
    expect(headToHead(res, 'me', 'f')).toEqual({ wins: 1, losses: 1, draws: 0 });
  });
});

describe('semanas', () => {
  it('semana começa na segunda', () => {
    expect(weekStartKey(new Date(2026, 10, 29))).toBe('2026-11-23'); // domingo
    expect(weekStartKey(new Date(2026, 10, 23))).toBe('2026-11-23'); // segunda
  });

  it('últimas semanas terminam na atual', () => {
    expect(lastWeekKeys(3, new Date(2026, 10, 25))).toEqual(['2026-11-09', '2026-11-16', '2026-11-23']);
  });

  it('sequência não quebra pela semana atual ainda sem treino', () => {
    const weeks = ['a', 'b', 'c', 'd'];
    expect(currentStreak(weeks, new Set(['b', 'c']))).toBe(2);
    expect(currentStreak(weeks, new Set(['b', 'c', 'd']))).toBe(3);
    expect(currentStreak(weeks, new Set(['a', 'c']))).toBe(1);
  });

  it('dateKey usa data local', () => {
    expect(dateKey(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});

describe('foco técnico', () => {
  it('rotação volta ao início', () => {
    expect(nextElement(null)).toBe('stance');
    expect(nextElement('follow_through')).toBe('stance');
    expect(nextElement('grip')).toBe('hook');
  });
});
