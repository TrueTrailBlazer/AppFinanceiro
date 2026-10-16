/**
 * Tipos de domínio derivados do schema gerado pelo Supabase CLI (database.types.ts).
 * Nunca edite os tipos de linha à mão: regenere database.types.ts quando o schema mudar.
 */
import type { Tables, TablesInsert, TablesUpdate } from './database.types';

// ---------------------------------------------------------------------------
// Tabelas
// ---------------------------------------------------------------------------
export type TransactionRow = Tables<'transactions'>;
export type TransactionInsert = TablesInsert<'transactions'>;
export type TransactionUpdate = TablesUpdate<'transactions'>;

export type RecurringExpenseRow = Tables<'recurring_expenses'>;
export type RecurringExpenseInsert = TablesInsert<'recurring_expenses'>;

export type PluggyItemRow = Tables<'pluggy_items'>;
export type PluggyItemInsert = TablesInsert<'pluggy_items'>;

export type FinancialGoalRow = Tables<'financial_goals'>;
export type FinancialGoalInsert = TablesInsert<'financial_goals'>;
export type FinancialGoalUpdate = TablesUpdate<'financial_goals'>;

// ---------------------------------------------------------------------------
// Transações de exibição
// ---------------------------------------------------------------------------

/**
 * Transação como é exibida na UI.
 * É uma linha do banco ou um lançamento sintético gerado no cliente
 * (ex: rendimentos consolidados, cujo `id` é uma string como "consolidated-yield-2026-9").
 * `is_consolidated` e `yield_count` NÃO existem na tabela; são apenas campos de cliente.
 */
export interface DisplayTransaction extends Omit<TransactionRow, 'id' | 'notes'> {
  id: TransactionRow['id'] | string;
  notes?: string | null;
  is_consolidated?: boolean;
  yield_count?: number;
}

/** Informação de parcela extraída do nome, ex: "Notebook (2/10)". */
export interface InstallmentInfo {
  baseName: string;
  current: number;
  total: number;
}

// ---------------------------------------------------------------------------
// Resumos Financeiros
// ---------------------------------------------------------------------------
export interface BankSummary {
  incomeCents: number;
  expenseCents: number;
  balanceCents: number;
  income: number;
  expense: number;
  balance: number;
  count: number;
}

export interface PlannedSummary {
  totalCents: number;
  paidCents: number;
  pendingCents: number;
  totalCount: number;
  paidCount: number;
  pendingCount: number;
  total: number;
  paid: number;
  pending: number;
}

export interface OverallSummary {
  income: number;
  expense: number;
  balance: number;
  incomeCents: number;
  expenseCents: number;
  balanceCents: number;
}

// ---------------------------------------------------------------------------
// RPC get_analysis_data_v4 (ver supabase/migrations/*_analysis_rpc.sql)
// ---------------------------------------------------------------------------
export interface AnalysisCategoryRankingItem {
  cat: string | null;
  amount: number;
}

export type AnalysisTopExpense = Pick<
  TransactionRow,
  | 'id'
  | 'user_id'
  | 'name'
  | 'amount'
  | 'type'
  | 'category'
  | 'is_paid'
  | 'created_at'
  | 'pluggy_transaction_id'
  | 'bank_name'
  | 'bank_logo_url'
>;

export interface AnalysisComparison {
  isSavings: boolean;
  value: number;
  percent: number;
}

export interface AnalysisData {
  totalExpenseCents: number;
  categoryRanking: AnalysisCategoryRankingItem[];
  topExpensesList: AnalysisTopExpense[];
  comparison: AnalysisComparison | null;
  totalItems: number;
  isBankSource: boolean;
}

// ---------------------------------------------------------------------------
// Importação de CSV
// ---------------------------------------------------------------------------
export interface CSVColumnMapping {
  date: string;
  name: string;
  amount: string;
}

export interface CSVPreviewTransaction {
  name: string;
  amount: number;
  type: string;
  category: string;
  is_paid: boolean;
  created_at: string;
  installment_group_id?: string;
}

