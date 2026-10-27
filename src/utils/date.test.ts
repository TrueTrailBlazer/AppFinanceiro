import { describe, it, expect } from 'vitest';
import { getLocalDateString, parseLocalDate, addMonthsPreservingDay, formatLocalDate, toStoredTimestamp } from './date';

describe('date - getLocalDateString', () => {
  it('deve formatar data local como YYYY-MM-DD', () => {
    const d = new Date(2026, 9, 13); // 13 de outubro de 2026
    expect(getLocalDateString(d)).toBe('2026-10-13');
  });

  it('deve lidar com meses e dias com 1 dígito', () => {
    const d = new Date(2026, 0, 5); // 05 de janeiro de 2026
    expect(getLocalDateString(d)).toBe('2026-01-05');
  });

  it('deve preservar a data exata quando receber string YYYY-MM-DD sem recuar fuso', () => {
    expect(getLocalDateString('2026-10-13')).toBe('2026-10-13');
    expect(getLocalDateString('2026-01-01')).toBe('2026-01-01');
  });
});

describe('date - parseLocalDate', () => {
  it('deve converter string YYYY-MM-DD preservando horas da referencia', () => {
    const ref = new Date(2026, 9, 13, 14, 30, 45, 123);
    const parsed = parseLocalDate('2026-10-13', ref);
    expect(parsed.getFullYear()).toBe(2026);
    expect(parsed.getMonth()).toBe(9);
    expect(parsed.getDate()).toBe(13);
    expect(parsed.getHours()).toBe(14);
    expect(parsed.getMinutes()).toBe(30);
    expect(parsed.getSeconds()).toBe(45);
  });

  it('deve conseguir extrair a data mesmo se receber ISO string com timestamp', () => {
    const parsed = parseLocalDate('2026-10-13T18:00:00.000Z');
    expect(parsed.getFullYear()).toBe(2026);
    expect(parsed.getMonth()).toBe(9);
    expect(parsed.getDate()).toBe(13);
  });

  it('deve retornar Date atual para input invalido ou vazio', () => {
    expect(parseLocalDate('')).toBeInstanceOf(Date);
    expect(parseLocalDate(null)).toBeInstanceOf(Date);
    expect(parseLocalDate('invalido')).toBeInstanceOf(Date);
  });
});

describe('date - addMonthsPreservingDay', () => {
  it('deve somar meses preservando o dia', () => {
    const base = new Date(2026, 0, 15); // 15 de janeiro
    const result = addMonthsPreservingDay(base, 2);
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(2); // Março
    expect(result.getDate()).toBe(15);
  });

  it('deve funcionar quando baseDate for uma string YYYY-MM-DD', () => {
    const result = addMonthsPreservingDay('2026-01-31', 1);
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(1); // Fevereiro
    expect(result.getDate()).toBe(28); // 2026 não é bissexto
  });

  it('deve ajustar para o ultimo dia do mes ao transbordar (ex: 31 de janeiro para fevereiro)', () => {
    const base = new Date(2026, 0, 31); // 31 de janeiro de 2026 (ano não bissexto)
    const result = addMonthsPreservingDay(base, 1);
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(1); // Fevereiro
    expect(result.getDate()).toBe(28); // Fevereiro tem 28 dias em 2026
  });

  it('deve lidar corretamente com 29 de fevereiro em ano bissexto por ate 72 parcelas', () => {
    const leapBase = new Date(2024, 1, 29); // 29 de fevereiro de 2024 (bissexto)

    // +1 mês -> 29 de março de 2024
    const m1 = addMonthsPreservingDay(leapBase, 1);
    expect(m1.getFullYear()).toBe(2024);
    expect(m1.getMonth()).toBe(2);
    expect(m1.getDate()).toBe(29);

    // +12 meses -> 28 de fevereiro de 2025 (não bissexto, ajusta para 28)
    const m12 = addMonthsPreservingDay(leapBase, 12);
    expect(m12.getFullYear()).toBe(2025);
    expect(m12.getMonth()).toBe(1);
    expect(m12.getDate()).toBe(28);

    // +13 meses -> 29 de março de 2025 (restaura o dia 29)
    const m13 = addMonthsPreservingDay(leapBase, 13);
    expect(m13.getFullYear()).toBe(2025);
    expect(m13.getMonth()).toBe(2);
    expect(m13.getDate()).toBe(29);

    // +48 meses -> 29 de fevereiro de 2028 (próximo ano bissexto, 29 dias)
    const m48 = addMonthsPreservingDay(leapBase, 48);
    expect(m48.getFullYear()).toBe(2028);
    expect(m48.getMonth()).toBe(1);
    expect(m48.getDate()).toBe(29);

    // +72 meses -> 28 de fevereiro de 2030 (não bissexto)
    const m72 = addMonthsPreservingDay(leapBase, 72);
    expect(m72.getFullYear()).toBe(2030);
    expect(m72.getMonth()).toBe(1);
    expect(m72.getDate()).toBe(28);
  });
});

describe('date - formatLocalDate', () => {
  it('deve retornar string vazia para entrada vazia', () => {
    expect(formatLocalDate(null)).toBe('');
    expect(formatLocalDate(undefined)).toBe('');
  });

  it('deve formatar data valida (Date)', () => {
    const d = new Date(2026, 9, 13);
    const formatted = formatLocalDate(d, { day: '2-digit', month: '2-digit', year: 'numeric' });
    expect(formatted).toBe('13/10/2026');
  });

  it('deve formatar string YYYY-MM-DD sem subtrair dia por fuso horario', () => {
    const formatted = formatLocalDate('2026-10-13', { day: '2-digit', month: '2-digit', year: 'numeric' });
    expect(formatted).toBe('13/10/2026');
  });

  it('deve extrair ano e mês corretos para 1º de janeiro em UTC midnight sem regredir para ano anterior', () => {
    const parsed = parseLocalDate('2026-01-01T00:00:00.000Z');
    expect(parsed.getFullYear()).toBe(2026);
    expect(parsed.getMonth()).toBe(0);
    expect(parsed.getDate()).toBe(1);
  });

  it('deve extrair ano e mês corretos para 1º de maio em UTC midnight sem regredir para abril', () => {
    const parsed = parseLocalDate('2026-05-01T00:00:00.000Z');
    expect(parsed.getFullYear()).toBe(2026);
    expect(parsed.getMonth()).toBe(4);
    expect(parsed.getDate()).toBe(1);
  });
});

describe('date - toStoredTimestamp', () => {
  it('deve fixar meia-noite/meio-dia local evitando recuo de dia no fuso brasileiro UTC-3', () => {
    const timestamp = toStoredTimestamp('2026-11-05');
    const parsed = new Date(timestamp);
    // No fuso local, o dia tem que ser rigorosamente 05
    expect(parsed.getDate()).toBe(5);
    expect(parsed.getMonth()).toBe(10); // Novembro = 10
    expect(parsed.getFullYear()).toBe(2026);
    expect(getLocalDateString(timestamp)).toBe('2026-11-05');
  });

  it('deve converter Date para ISO string', () => {
    const d = new Date(2026, 9, 15, 12, 0, 0);
    const timestamp = toStoredTimestamp(d);
    expect(typeof timestamp).toBe('string');
    expect(getLocalDateString(timestamp)).toBe('2026-10-15');
  });

  it('deve retornar ISO string atual caso o input seja nulo ou indefinido', () => {
    expect(typeof toStoredTimestamp(null)).toBe('string');
    expect(typeof toStoredTimestamp(undefined)).toBe('string');
  });
});
