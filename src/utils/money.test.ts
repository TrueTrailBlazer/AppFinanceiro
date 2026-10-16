import { describe, it, expect } from 'vitest';
import {
  parseCents,
  splitInstallments,
  toCents,
  fromCents,
  addCents,
  subtractCents
} from './money';

describe('money - parseCents', () => {
  it('deve converter string inteira (ex: "150") para 15000 centavos', () => {
    expect(parseCents("150")).toBe(15000);
    expect(parseCents("5000")).toBe(500000);
  });

  it('deve converter string com decimais US (ex: "150.50") para 15050 centavos', () => {
    expect(parseCents("150.50")).toBe(15050);
    expect(parseCents("150.5")).toBe(15050);
  });

  it('deve converter string com decimais BR (ex: "150,50") para 15050 centavos', () => {
    expect(parseCents("150,50")).toBe(15050);
    expect(parseCents("150,5")).toBe(15050);
  });

  it('deve lidar com milhares e decimais BR (ex: "1.250,50") para 125050 centavos', () => {
    expect(parseCents("1.250,50")).toBe(125050);
  });

  it('deve lidar com valor sujo do CSV (ex: "R$ 1.250,50") para 125050 centavos', () => {
    expect(parseCents("R$ 1.250,50")).toBe(125050);
  });

  it('deve manter centavos intactos caso o tipo seja inteiro (ex: 15000)', () => {
    expect(parseCents(15000)).toBe(15000);
  });

  it('deve converter float legado do banco (ex: 150.5) para 15050 centavos', () => {
    expect(parseCents(150.5)).toBe(15050);
  });

  it('deve lidar com valores negativos (strings e inteiros)', () => {
    expect(parseCents("-150")).toBe(-15000);
    expect(parseCents("-150.50")).toBe(-15050);
    expect(parseCents("-150,50")).toBe(-15050);
    expect(parseCents(-15000)).toBe(-15000);
  });

  it('deve retornar 0 para valores nulos, vazios ou invalidos', () => {
    expect(parseCents(null)).toBe(0);
    expect(parseCents(undefined)).toBe(0);
    expect(parseCents("")).toBe(0);
    expect(parseCents("   ")).toBe(0);
  });
});

describe('money - toCents & fromCents', () => {
  it('toCents deve converter floats, inteiros e strings', () => {
    expect(toCents(150.5)).toBe(15050);
    expect(toCents(15000)).toBe(15000);
    expect(toCents("150,50")).toBe(15050);
    expect(toCents(null)).toBe(0);
  });

  it('fromCents deve converter centavos para decimal', () => {
    expect(fromCents(15050)).toBe(150.5);
    expect(fromCents(100)).toBe(1.0);
    expect(fromCents(0)).toBe(0);
  });
});

describe('money - splitInstallments', () => {
  it('deve dividir 10000 (R$ 100,00) em 3 parcelas sem perder centavos', () => {
    const result = splitInstallments(10000, 3);
    expect(result).toEqual([3334, 3333, 3333]);
    expect(result.reduce((a, b) => a + b, 0)).toBe(10000);
  });

  it('deve lidar com 1 parcela ou parcelas invalidas', () => {
    expect(splitInstallments(5000, 1)).toEqual([5000]);
    expect(splitInstallments(5000, 0)).toEqual([5000]);
    expect(splitInstallments(5000, -2)).toEqual([5000]);
  });
});

describe('money - addCents & subtractCents', () => {
  it('addCents deve somar multiplos valores em centavos', () => {
    expect(addCents(1000, 2500, 500)).toBe(4000);
    expect(addCents(1000, "15,50")).toBe(2550);
  });

  it('subtractCents deve subtrair de forma exata', () => {
    expect(subtractCents(10000, 3500)).toBe(6500);
    expect(subtractCents("100,00", "35,00")).toBe(6500);
  });
});
