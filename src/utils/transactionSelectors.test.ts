import { describe, it, expect } from 'vitest';
import {
  consolidateMonthlyTransactions,
  selectBankTransactions,
  selectPlannedBills,
  selectPlannedIncomes,
  selectPlannedTransactions,
  computeBankSummary,
  computePlannedSummary
} from './transactionSelectors';
import type { DisplayTransaction, TransactionRow } from '../types/models';

describe('transactionSelectors - consolidateMonthlyTransactions', () => {
  it('deve descartar movimentações de cofrinho e consolidar rendimentos', () => {
    const raw: Partial<TransactionRow>[] = [
      { id: 1, name: 'Dinheiro retirado', amount: 10000, type: 'income', created_at: '2026-10-01T10:00:00Z' },
      { id: 2, name: 'Saldo reservado', amount: 5000, type: 'expense', created_at: '2026-10-02T10:00:00Z' },
      { id: 3, name: 'Dinheiro reservado Dinheiro', amount: 239976, type: 'variable', created_at: '2026-10-02T11:00:00Z' },
      { id: 4, name: 'Dinheiro reservado Cofrinho com meu amorzinho', amount: 20000, type: 'variable', created_at: '2026-10-02T12:00:00Z' },
      { id: 5, name: 'Reserva programada Cofrinho com meu amorzinho', amount: 20000, type: 'variable', created_at: '2026-10-02T13:00:00Z' },
      { id: 6, name: 'Dinheiro guardado Reserva', amount: 15000, type: 'variable', created_at: '2026-10-02T14:00:00Z' },
      { id: 7, name: 'Rendimento Nubank', amount: 150, type: 'income', created_at: '2026-10-03T10:00:00Z' },
      { id: 8, name: 'Rendimento Inter', amount: 250, type: 'income', created_at: '2026-10-04T10:00:00Z' },
      { id: 9, name: 'Supermercado', amount: 20000, type: 'expense', created_at: '2026-10-05T10:00:00Z' },
    ];

    const result = consolidateMonthlyTransactions(raw as TransactionRow[], '2026-9');
    
    // Deve conter apenas 2 itens: Supermercado e Rendimentos consolidado (todos os 6 de cofrinho descartados)
    expect(result).toHaveLength(2);
    
    const consolidatedYield = result.find(t => t.is_consolidated);
    expect(consolidatedYield).toBeDefined();
    expect(consolidatedYield?.name).toBe('Rendimentos');
    expect(consolidatedYield?.amount).toBe(400); // 150 + 250
    expect(consolidatedYield?.yield_count).toBe(2);
    expect(consolidatedYield?.id).toBe('consolidated-yield-2026-9');
  });

  it('deve lidar com lista vazia sem quebrar', () => {
    expect(consolidateMonthlyTransactions([], '2026-9')).toEqual([]);
  });
});

describe('transactionSelectors - filtros de extrato vs planejamento', () => {
  const transactions: DisplayTransaction[] = [
    {
      id: 1,
      user_id: 'u1',
      name: 'Pix Banco',
      amount: 5000,
      type: 'expense',
      category: 'food',
      is_paid: true,
      created_at: '2026-10-01T10:00:00Z',
      pluggy_transaction_id: 'plg-1',
      bank_name: 'Nubank',
      bank_logo_url: null,
      installment_group_id: null,
      receipt_url: null
    },
    {
      id: 'consolidated-yield-2026-9',
      user_id: 'u1',
      name: 'Rendimentos',
      amount: 400,
      type: 'income',
      category: 'others',
      is_paid: true,
      created_at: '2026-10-02T10:00:00Z',
      pluggy_transaction_id: 'consolidated-yield',
      is_consolidated: true,
      bank_name: null,
      bank_logo_url: null,
      installment_group_id: null,
      receipt_url: null
    },
    {
      id: 2,
      user_id: 'u1',
      name: 'Conta de Luz',
      amount: 15000,
      type: 'expense',
      category: 'bills',
      is_paid: false,
      created_at: '2026-10-03T10:00:00Z',
      pluggy_transaction_id: null,
      bank_name: null,
      bank_logo_url: null,
      installment_group_id: null,
      receipt_url: null
    },
    {
      id: 3,
      user_id: 'u1',
      name: 'Salário Manual',
      amount: 500000,
      type: 'income',
      category: 'salary',
      is_paid: true,
      created_at: '2026-10-05T10:00:00Z',
      pluggy_transaction_id: null,
      bank_name: null,
      bank_logo_url: null,
      installment_group_id: null,
      receipt_url: null
    }
  ];

  it('selectBankTransactions deve trazer apenas transações bancárias e rendimentos consolidados', () => {
    const bank = selectBankTransactions(transactions);
    expect(bank).toHaveLength(2);
    expect(bank.map(b => b.name)).toEqual(['Pix Banco', 'Rendimentos']);
  });

  it('selectPlannedBills deve trazer despesas sem pluggy_id', () => {
    const planned = selectPlannedBills(transactions);
    expect(planned).toHaveLength(1);
    expect(planned[0].name).toBe('Conta de Luz');
  });

  it('selectPlannedIncomes deve trazer receitas manuais', () => {
    const incomes = selectPlannedIncomes(transactions);
    expect(incomes).toHaveLength(1);
    expect(incomes[0].name).toBe('Salário Manual');
  });

  it('selectPlannedTransactions deve trazer todas as não bancárias', () => {
    const planned = selectPlannedTransactions(transactions);
    expect(planned).toHaveLength(2);
  });
});

describe('transactionSelectors - compute summaries', () => {
  it('computeBankSummary deve calcular saldo corretamente em centavos e reais', () => {
    const bank: Partial<DisplayTransaction>[] = [
      { amount: 10000, type: 'income' },
      { amount: 3500, type: 'expense' }
    ];
    const summary = computeBankSummary(bank as DisplayTransaction[]);
    expect(summary.incomeCents).toBe(10000);
    expect(summary.expenseCents).toBe(3500);
    expect(summary.balanceCents).toBe(6500);
    expect(summary.income).toBe(100.0);
    expect(summary.expense).toBe(35.0);
    expect(summary.balance).toBe(65.0);
    expect(summary.count).toBe(2);
  });

  it('computePlannedSummary deve calcular pendentes e pagos corretamente', () => {
    const bills: Partial<DisplayTransaction>[] = [
      { amount: 5000, is_paid: true },
      { amount: 3000, is_paid: false },
      { amount: 2000, is_paid: false }
    ];
    const summary = computePlannedSummary(bills as DisplayTransaction[]);
    expect(summary.totalCents).toBe(10000);
    expect(summary.paidCents).toBe(5000);
    expect(summary.pendingCents).toBe(5000);
    expect(summary.totalCount).toBe(3);
    expect(summary.paidCount).toBe(1);
    expect(summary.pendingCount).toBe(2);
    expect(summary.total).toBe(100.0);
    expect(summary.paid).toBe(50.0);
    expect(summary.pending).toBe(50.0);
  });
});
