import { describe, it, expect } from 'vitest';
import { getInstallmentInfo } from './installments';

describe('installments utility - getInstallmentInfo', () => {
  it('deve extrair baseName, current e total de um título padrão', () => {
    const result = getInstallmentInfo('Notebook Dell (2/10)');
    expect(result).toEqual({
      baseName: 'Notebook Dell',
      current: 2,
      total: 10
    });
  });

  it('deve lidar com títulos que possuem parênteses adicionais no nome', () => {
    const result = getInstallmentInfo('Curso Online (Design) (3/12)');
    expect(result).toEqual({
      baseName: 'Curso Online (Design)',
      current: 3,
      total: 12
    });
  });

  it('deve retornar null quando o título não contiver padrão de parcelas', () => {
    expect(getInstallmentInfo('Supermercado Extra')).toBeNull();
    expect(getInstallmentInfo('Aluguel')).toBeNull();
    expect(getInstallmentInfo('12345')).toBeNull();
  });

  it('deve retornar null para valores vazios ou nulos', () => {
    expect(getInstallmentInfo('')).toBeNull();
    expect(getInstallmentInfo(null)).toBeNull();
    expect(getInstallmentInfo(undefined)).toBeNull();
  });
});
