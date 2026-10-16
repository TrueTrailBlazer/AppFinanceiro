import { describe, it, expect } from 'vitest';
import {
  normalizeCSVHeader,
  guessCSVMapping,
  detectCSVInstallments,
  parseDateBR,
  parseCSVAmount,
  categorizeCSVDescription,
  transformCSVRowToTransactions
} from './csv';

describe('csv utility - normalizeCSVHeader', () => {
  it('deve remover acentos, converter para minúsculas e dar trim', () => {
    expect(normalizeCSVHeader('  Descrição do Lançamento  ')).toBe('descricao do lancamento');
    expect(normalizeCSVHeader('DATA_TRANSAÇÃO')).toBe('data_transacao');
    expect(normalizeCSVHeader('')).toBe('');
    expect(normalizeCSVHeader(undefined)).toBe('');
  });
});

describe('csv utility - guessCSVMapping', () => {
  it('deve adivinhar corretamente as colunas comuns de bancos brasileiros', () => {
    const headers = ['Data do Lançamento', 'Histórico', 'Valor (R$)'];
    const mapping = guessCSVMapping(headers);
    expect(mapping.date).toBe('Data do Lançamento');
    expect(mapping.name).toBe('Histórico');
    expect(mapping.amount).toBe('Valor (R$)');
  });

  it('deve adivinhar colunas no padrão Nubank / C6', () => {
    const headers = ['date', 'title', 'amount'];
    const mapping = guessCSVMapping(headers);
    expect(mapping.date).toBe('date');
    expect(mapping.name).toBe('title');
    expect(mapping.amount).toBe('amount');
  });

  it('deve lidar com colunas não identificadas', () => {
    const headers = ['coluna_a', 'coluna_b'];
    const mapping = guessCSVMapping(headers);
    expect(mapping.date).toBe('');
    expect(mapping.name).toBe('');
    expect(mapping.amount).toBe('');
  });
});

describe('csv utility - detectCSVInstallments', () => {
  it('deve detectar parcelas no formato (1/10)', () => {
    expect(detectCSVInstallments('Mercado Livre (3/10)')).toEqual({ current: 3, total: 10 });
  });

  it('deve detectar parcelas no formato [2/5]', () => {
    expect(detectCSVInstallments('Amazon Marketplace [2/5]')).toEqual({ current: 2, total: 5 });
  });

  it('deve detectar parcelas no formato "parcela 4 de 12"', () => {
    expect(detectCSVInstallments('Loja X parcela 4 de 12')).toEqual({ current: 4, total: 12 });
  });

  it('deve retornar null para nomes sem parcelas ou valores absurdos', () => {
    expect(detectCSVInstallments('Uber Trip')).toBeNull();
    expect(detectCSVInstallments('Compra (100/1000)')).toBeNull(); // total >= 100 descartado
  });
});

describe('csv utility - parseDateBR', () => {
  it('deve interpretar formato DD/MM/YYYY', () => {
    const d = parseDateBR('15/08/2026');
    expect(d.getDate()).toBe(15);
    expect(d.getMonth()).toBe(7); // agosto = 7
    expect(d.getFullYear()).toBe(2026);
  });

  it('deve interpretar formato ISO YYYY-MM-DD', () => {
    const d = parseDateBR('2026-10-25');
    expect(d.getDate()).toBe(25);
    expect(d.getMonth()).toBe(9); // outubro = 9
    expect(d.getFullYear()).toBe(2026);
  });

  it('deve interpretar ano com 2 dígitos DD/MM/YY', () => {
    const d = parseDateBR('05/03/26');
    expect(d.getDate()).toBe(5);
    expect(d.getMonth()).toBe(2);
    expect(d.getFullYear()).toBe(2026);
  });

  it('deve retornar data válida se string for vazia ou inválida', () => {
    expect(parseDateBR('')).toBeInstanceOf(Date);
    expect(parseDateBR(undefined)).toBeInstanceOf(Date);
  });
});

describe('csv utility - parseCSVAmount', () => {
  it('deve tratar valor positivo padrão em reais', () => {
    const res = parseCSVAmount('150,50');
    expect(res.amountCents).toBe(15050);
    expect(res.isNegative).toBe(false);
  });

  it('deve tratar valor negativo com prefixo menos (-)', () => {
    const res = parseCSVAmount('-89,90');
    expect(res.amountCents).toBe(8990);
    expect(res.isNegative).toBe(true);
  });

  it('deve tratar valor negativo com sufixo menos (formato bancário como Itaú: 50,00-)', () => {
    const res = parseCSVAmount('50,00-');
    expect(res.amountCents).toBe(5000);
    expect(res.isNegative).toBe(true);
  });

  it('deve ignorar prefixo R$ e pontos de milhares', () => {
    const res = parseCSVAmount('R$ 1.250,99');
    expect(res.amountCents).toBe(125099);
    expect(res.isNegative).toBe(false);
  });

  it('deve reconhecer formato contabil de parenteses como valor negativo', () => {
    const res1 = parseCSVAmount('(150,50)');
    expect(res1.amountCents).toBe(15050);
    expect(res1.isNegative).toBe(true);

    const res2 = parseCSVAmount('(1.250,00)');
    expect(res2.amountCents).toBe(125000);
    expect(res2.isNegative).toBe(true);

    const res3 = parseCSVAmount('[45,00]');
    expect(res3.amountCents).toBe(4500);
    expect(res3.isNegative).toBe(true);
  });
});

describe('csv utility - categorizeCSVDescription', () => {
  it('deve categorizar restaurantes e comida', () => {
    expect(categorizeCSVDescription('Ifood *Pedido 1234', true)).toBe('food');
    expect(categorizeCSVDescription('Restaurante Bom Sabor', true)).toBe('food');
  });

  it('deve categorizar transporte', () => {
    expect(categorizeCSVDescription('Uber *Trip 999', true)).toBe('transport');
    expect(categorizeCSVDescription('Posto Shell', true)).toBe('transport');
  });

  it('deve categorizar compras', () => {
    expect(categorizeCSVDescription('Amazon Prime Video', true)).toBe('shopping');
    expect(categorizeCSVDescription('Mercado Central', true)).toBe('shopping');
  });

  it('deve categorizar lazer / entretenimento', () => {
    expect(categorizeCSVDescription('Netflix.com', true)).toBe('entertainment');
    expect(categorizeCSVDescription('Spotify Mensal', true)).toBe('entertainment');
  });

  it('deve categorizar Pix recebido como extra', () => {
    expect(categorizeCSVDescription('Transferência Pix Recebida', false)).toBe('extra');
    expect(categorizeCSVDescription('Pix enviado', true)).toBe('others');
  });

  it('deve retornar others para itens não mapeados', () => {
    expect(categorizeCSVDescription('Farmácia Central', true)).toBe('others');
  });
});

describe('csv utility - transformCSVRowToTransactions', () => {
  const mapping = {
    date: 'Data',
    name: 'Descricao',
    amount: 'Valor'
  };

  it('deve transformar uma linha simples em uma transação individual', () => {
    const row = {
      Data: '10/05/2026',
      Descricao: 'Uber Corrida',
      Valor: '-35,50'
    };

    const result = transformCSVRowToTransactions(row, mapping);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Uber Corrida');
    expect(result[0].amount).toBe(3550);
    expect(result[0].type).toBe('variable');
    expect(result[0].category).toBe('transport');
    expect(result[0].is_paid).toBe(true);
  });

  it('deve expandir compras parceladas em todas as parcelas com datas progressivas', () => {
    const row = {
      Data: '10/05/2026',
      Descricao: 'Smartphone (2/4)',
      Valor: '-250,00'
    };

    const result = transformCSVRowToTransactions(row, mapping);
    expect(result).toHaveLength(4);
    
    // Parcela 1
    expect(result[0].name).toBe('Smartphone (1/4)');
    expect(result[0].is_paid).toBe(true); // 1 <= 2

    // Parcela 2 (a que veio no CSV)
    expect(result[1].name).toBe('Smartphone (2/4)');
    expect(result[1].is_paid).toBe(true); // 2 <= 2

    // Parcela 3 (futura)
    expect(result[2].name).toBe('Smartphone (3/4)');
    expect(result[2].is_paid).toBe(false); // 3 > 2

    // Parcela 4 (futura)
    expect(result[3].name).toBe('Smartphone (4/4)');
    expect(result[3].is_paid).toBe(false); // 4 > 2

    // Todas devem ter o mesmo installment_group_id
    expect(result[0].installment_group_id).toBeDefined();
    expect(result[0].installment_group_id).toBe(result[1].installment_group_id);
    expect(result[1].installment_group_id).toBe(result[2].installment_group_id);
  });
});
