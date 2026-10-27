import { parseCents, fromCents } from './money';
import type {
  TransactionRow,
  DisplayTransaction,
  BankSummary,
  PlannedSummary,
  OverallSummary
} from '../types/models';

export type { BankSummary, PlannedSummary, OverallSummary };

/**
 * Identifica movimentações internas de cofrinho / reserva bancária (ex: Mercado Pago)
 * que não devem ser contabilizadas como despesa nem como receita no fluxo de caixa.
 */
export function isInternalReserveTransaction(name: string = '', operationType: string = ''): boolean {
  const n = (name + ' ' + operationType).toLowerCase();
  return (
    n.includes('dinheiro retirado') ||
    n.includes('dinheiro reservado') ||
    n.includes('saldo reservado') ||
    n.includes('dinheiro guardado') ||
    n.includes('reserva programada') ||
    n.includes('saldo_reservado') ||
    n.includes('cofrinho')
  );
}

/**
 * Normaliza e consolida as transações do mês:
 * - Descarta transferências internas do cofrinho / reservas ("dinheiro reservado", "saldo reservado", "dinheiro retirado", etc.)
 * - Consolida múltiplos rendimentos ("rendimento") em um único lançamento somado
 * - Ordena cronologicamente por created_at decrescente
 */
export function consolidateMonthlyTransactions(
  rawTransactions: (TransactionRow | DisplayTransaction)[] = [],
  monthKey: string = ''
): DisplayTransaction[] {
  const yieldTxs: (TransactionRow | DisplayTransaction)[] = [];
  const otherTxs: (TransactionRow | DisplayTransaction)[] = [];

  for (const t of rawTransactions) {
    const name = t.name || '';
    // Não contabiliza movimentações internas de cofrinho / reservas vindas do banco (Open Finance)
    // Lançamentos manuais planejados pelo próprio usuário nunca devem ser descartados
    if (Boolean(t.pluggy_transaction_id) && isInternalReserveTransaction(name)) {
      continue;
    }
    if (name.toLowerCase().includes('rendimento')) {
      yieldTxs.push(t);
    } else {
      otherTxs.push(t);
    }
  }

  if (yieldTxs.length <= 1) {
    return ([...yieldTxs, ...otherTxs] as DisplayTransaction[]).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  // Soma os centavos de todos os rendimentos do mês
  const totalYieldCents = yieldTxs.reduce((sum, t) => sum + parseCents(t.amount), 0);
  const sortedYields = [...yieldTxs].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const latestYield = sortedYields[0];

  const consolidatedYield: DisplayTransaction = {
    ...latestYield,
    id: `consolidated-yield-${monthKey}`,
    name: 'Rendimentos',
    amount: totalYieldCents,
    type: 'income',
    category: 'others',
    is_paid: true,
    created_at: latestYield.created_at,
    is_consolidated: true,
    yield_count: yieldTxs.length,
    pluggy_transaction_id: 'consolidated-yield' // Vinculado ao fluxo bancário
  };

  return [consolidatedYield, ...(otherTxs as DisplayTransaction[])].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

/**
 * 1. Movimentações Bancárias Reais (Open Finance / Pluggy)
 */
export function selectBankTransactions(
  transactions: (DisplayTransaction | TransactionRow)[] = []
): DisplayTransaction[] {
  return (transactions as DisplayTransaction[]).filter(
    t => Boolean(t.pluggy_transaction_id) || Boolean(t.is_consolidated)
  );
}

/**
 * 2. Contas Programadas / A Pagar (Planejamento Manual sem vínculo com banco)
 */
export function selectPlannedBills(
  transactions: (DisplayTransaction | TransactionRow)[] = []
): DisplayTransaction[] {
  return (transactions as DisplayTransaction[]).filter(
    t => !t.pluggy_transaction_id && !t.is_consolidated && t.type !== 'income'
  );
}

/**
 * 3. Receitas Planejadas (Entradas manuais programadas)
 */
export function selectPlannedIncomes(
  transactions: (DisplayTransaction | TransactionRow)[] = []
): DisplayTransaction[] {
  return (transactions as DisplayTransaction[]).filter(
    t => !t.pluggy_transaction_id && !t.is_consolidated && t.type === 'income'
  );
}

/**
 * 4. Todas as transações do Planejamento
 */
export function selectPlannedTransactions(
  transactions: (DisplayTransaction | TransactionRow)[] = []
): DisplayTransaction[] {
  return (transactions as DisplayTransaction[]).filter(
    t => !t.pluggy_transaction_id && !t.is_consolidated
  );
}

/**
 * Resumo Bancário Real (Fluxo de Caixa do Extrato)
 */
export function computeBankSummary(bankTransactions: (DisplayTransaction | TransactionRow)[] = []): BankSummary {
  let incomeCents = 0;
  let expenseCents = 0;
  for (const t of bankTransactions) {
    const cents = parseCents(t.amount);
    if (t.type === 'income') {
      incomeCents += cents;
    } else {
      expenseCents += cents;
    }
  }
  const balanceCents = incomeCents - expenseCents;
  return {
    incomeCents,
    expenseCents,
    balanceCents,
    income: fromCents(incomeCents),
    expense: fromCents(expenseCents),
    balance: fromCents(balanceCents),
    count: bankTransactions.length
  };
}

/**
 * Resumo do Planejamento (Contas a Pagar)
 */
export function computePlannedSummary(plannedBills: (DisplayTransaction | TransactionRow)[] = []): PlannedSummary {
  const totalCents = plannedBills.reduce((acc, t) => acc + parseCents(t.amount), 0);
  const paidCents = plannedBills.filter(t => Boolean(t.is_paid)).reduce((acc, t) => acc + parseCents(t.amount), 0);
  const pendingCents = totalCents - paidCents;
  const paidCount = plannedBills.filter(t => Boolean(t.is_paid)).length;
  const pendingCount = plannedBills.filter(t => !t.is_paid).length;

  return {
    totalCents,
    paidCents,
    pendingCents,
    totalCount: plannedBills.length,
    paidCount,
    pendingCount,
    total: fromCents(totalCents),
    paid: fromCents(paidCents),
    pending: fromCents(pendingCents)
  };
}

/**
 * Resumo geral (retrocompatibilidade)
 */
export function computeOverallSummary(transactions: (DisplayTransaction | TransactionRow)[] = []): OverallSummary {
  let incomeCents = 0;
  let expenseCents = 0;
  for (const t of transactions) {
    const cents = parseCents(t.amount);
    if (t.type === 'income') {
      incomeCents += cents;
    } else {
      expenseCents += cents;
    }
  }
  const balanceCents = incomeCents - expenseCents;
  return { 
    income: fromCents(incomeCents), 
    expense: fromCents(expenseCents), 
    balance: fromCents(balanceCents),
    incomeCents,
    expenseCents,
    balanceCents
  };
}
