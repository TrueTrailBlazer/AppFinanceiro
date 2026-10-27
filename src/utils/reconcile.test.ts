import { describe, it, expect } from 'vitest';
import {
  matchBillsToBankTransactions,
  namesSimilar,
  EXACT_TOLERANCE_CENTS,
  NAME_MATCH_TOLERANCE_CENTS,
  MAX_DAYS_DISTANCE,
} from '../../supabase/functions/_shared/reconcile';

describe('Intelligent & Safe Reconciliation (Conciliação Automática)', () => {
  describe('namesSimilar', () => {
    it('deve identificar nomes similares ignorando stopwords e acentuação', () => {
      expect(namesSimilar('Fatura Nubank', 'Pagamento Nubank')).toBe(true);
      expect(namesSimilar('Claro Fibra Internet', 'Pix Enviado Claro Telecom')).toBe(true);
      expect(namesSimilar('Aluguel Imobiliária', 'Pix Enviado')).toBe(false);
      expect(namesSimilar(null, 'Nubank')).toBe(false);
      expect(namesSimilar('Conta de Luz', null)).toBe(false);
    });
  });

  describe('matchBillsToBankTransactions', () => {
    it('deve casar conta com valor e data exatos', () => {
      const bankTxs = [
        {
          name: 'Pagamento Internet Claro',
          amount: 12000,
          type: 'variable',
          created_at: '2026-10-15T14:00:00Z',
        },
      ];
      const pendingBills = [
        {
          id: 'bill-1',
          name: 'Internet Claro',
          amount: 12000,
          created_at: '2026-10-01T12:00:00Z',
          due_date: '2026-10-15T12:00:00Z',
        },
      ];

      const matched = matchBillsToBankTransactions(bankTxs, pendingBills);
      expect(matched).toEqual(['bill-1']);
    });

    it('deve casar com pequena tolerância de centavos (juros/multa) quando o nome for similar', () => {
      // 45 centavos a mais por atraso
      const bankTxs = [
        {
          name: 'Pagamento Claro Fibra',
          amount: 12045,
          type: 'variable',
          created_at: '2026-10-15T14:00:00Z',
        },
      ];
      const pendingBills = [
        {
          id: 'bill-1',
          name: 'Claro Fibra',
          amount: 12000,
          created_at: '2026-10-01T12:00:00Z',
          due_date: '2026-10-15T12:00:00Z',
        },
      ];

      const matched = matchBillsToBankTransactions(bankTxs, pendingBills);
      expect(matched).toEqual(['bill-1']);
    });

    it('NÃO deve casar se houver diferença de centavos e o nome NÃO for similar', () => {
      const bankTxs = [
        {
          name: 'Padaria São José',
          amount: 12045,
          type: 'variable',
          created_at: '2026-10-15T14:00:00Z',
        },
      ];
      const pendingBills = [
        {
          id: 'bill-1',
          name: 'Internet Fibra',
          amount: 12000,
          created_at: '2026-10-01T12:00:00Z',
          due_date: '2026-10-15T12:00:00Z',
        },
      ];

      const matched = matchBillsToBankTransactions(bankTxs, pendingBills);
      expect(matched).toEqual([]);
    });

    it('NÃO deve dar baixa se houver ambiguidade de valores idênticos sem coincidência de nome', () => {
      // Duas contas com exatamente R$ 100,00, mas nomes diferentes
      const bankTxs = [
        {
          name: 'PIX Enviado Fulano',
          amount: 10000,
          type: 'variable',
          created_at: '2026-10-15T14:00:00Z',
        },
      ];
      const pendingBills = [
        {
          id: 'bill-1',
          name: 'Conta de Energia Elétrica',
          amount: 10000,
          created_at: '2026-10-01T12:00:00Z',
          due_date: '2026-10-15T12:00:00Z',
        },
        {
          id: 'bill-2',
          name: 'Plano de Saúde',
          amount: 10000,
          created_at: '2026-10-01T12:00:00Z',
          due_date: '2026-10-15T12:00:00Z',
        },
      ];

      // Proteção contra baixa indevida: como não dá para saber qual das duas foi paga, não baixa nenhuma
      const matched = matchBillsToBankTransactions(bankTxs, pendingBills);
      expect(matched).toEqual([]);
    });

    it('deve desambiguar contas de mesmo valor quando uma delas coincidir no nome', () => {
      const bankTxs = [
        {
          name: 'Pagamento Enel Distribuição',
          amount: 10000,
          type: 'variable',
          created_at: '2026-10-15T14:00:00Z',
        },
      ];
      const pendingBills = [
        {
          id: 'bill-1',
          name: 'Conta Enel Energia',
          amount: 10000,
          created_at: '2026-10-01T12:00:00Z',
          due_date: '2026-10-15T12:00:00Z',
        },
        {
          id: 'bill-2',
          name: 'Plano de Saúde',
          amount: 10000,
          created_at: '2026-10-01T12:00:00Z',
          due_date: '2026-10-15T12:00:00Z',
        },
      ];

      const matched = matchBillsToBankTransactions(bankTxs, pendingBills);
      expect(matched).toEqual(['bill-1']);
    });

    it('NÃO deve casar se a data estiver a mais de 4 dias de distância', () => {
      const bankTxs = [
        {
          name: 'Internet Claro',
          amount: 12000,
          type: 'variable',
          created_at: '2026-10-25T14:00:00Z', // 10 dias após o vencimento
        },
      ];
      const pendingBills = [
        {
          id: 'bill-1',
          name: 'Internet Claro',
          amount: 12000,
          created_at: '2026-10-01T12:00:00Z',
          due_date: '2026-10-15T12:00:00Z',
        },
      ];

      const matched = matchBillsToBankTransactions(bankTxs, pendingBills);
      expect(matched).toEqual([]);
    });

    it('NÃO deve casar transações bancárias de receita (income)', () => {
      const bankTxs = [
        {
          name: 'PIX Recebido Cliente',
          amount: 12000,
          type: 'income',
          created_at: '2026-10-15T14:00:00Z',
        },
      ];
      const pendingBills = [
        {
          id: 'bill-1',
          name: 'Cliente A',
          amount: 12000,
          created_at: '2026-10-01T12:00:00Z',
          due_date: '2026-10-15T12:00:00Z',
        },
      ];

      const matched = matchBillsToBankTransactions(bankTxs, pendingBills);
      expect(matched).toEqual([]);
    });

    it('cada conta a pagar deve ser baixada apenas uma única vez', () => {
      const bankTxs = [
        {
          name: 'Farmácia Raia',
          amount: 5000,
          type: 'variable',
          created_at: '2026-10-15T10:00:00Z',
        },
        {
          name: 'Farmácia Raia',
          amount: 5000,
          type: 'variable',
          created_at: '2026-10-15T16:00:00Z',
        },
      ];
      const pendingBills = [
        {
          id: 'bill-1',
          name: 'Remédios Raia',
          amount: 5000,
          created_at: '2026-10-01T12:00:00Z',
          due_date: '2026-10-15T12:00:00Z',
        },
      ];

      const matched = matchBillsToBankTransactions(bankTxs, pendingBills);
      expect(matched).toEqual(['bill-1']);
    });
  });
});
