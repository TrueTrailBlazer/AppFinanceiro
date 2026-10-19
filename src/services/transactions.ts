import { supabase } from './supabase';
import type {
  TransactionRow,
  TransactionInsert,
  TransactionUpdate,
  DisplayTransaction,
  AnalysisData,
  InstallmentInfo
} from '../types/models';
import { getInstallmentInfo } from '../utils/installments';

type RangeQuery<T> = {
  range: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>;
};

/**
 * Helper to fetch all records bypassing the 1000 row limit of Supabase.
 */
async function fetchAllPaginated<T>(queryFactory: () => RangeQuery<T>): Promise<T[]> {
  let allData: T[] = [];
  let from = 0;
  const PAGE_SIZE = 1000;

  while (true) {
    const { data, error } = await queryFactory().range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    
    if (data && data.length > 0) {
      allData = allData.concat(data);
    }
    
    if (!data || data.length < PAGE_SIZE) {
      break;
    }
    from += PAGE_SIZE;
  }
  return allData;
}

/**
 * Gera identificador UUID compatível.
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Busca todas as transações de um determinado mês para um usuário.
 */
export async function fetchTransactionsByMonth(
  userId: string,
  startOfMonth: string,
  endOfMonth: string
): Promise<TransactionRow[]> {
  const queryFactory = () => supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', startOfMonth)
    .lte('created_at', endOfMonth)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false });

  return await fetchAllPaginated<TransactionRow>(queryFactory);
}

/**
 * Busca todas as transações de um usuário (para gráficos e análise histórica).
 */
export async function fetchAllUserTransactions(
  userId: string,
  ascending: boolean = true
): Promise<TransactionRow[]> {
  const queryFactory = () => supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending });

  return await fetchAllPaginated<TransactionRow>(queryFactory);
}

/**
 * Busca transações de um determinado ano para um usuário de forma delimitada no banco.
 * Pode incluir dezembro do ano anterior para cálculo de comparativos mensais.
 */
export async function fetchTransactionsByYear(
  userId: string,
  year: number,
  includePreviousDecember: boolean = false,
  ascending: boolean = true
): Promise<TransactionRow[]> {
  const startMonth = includePreviousDecember ? 11 : 0;
  const startYear = includePreviousDecember ? year - 1 : year;
  const start = new Date(startYear, startMonth, 1, 0, 0, 0).toISOString();
  const end = new Date(year, 11, 31, 23, 59, 59).toISOString();

  const queryFactory = () => supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', start)
    .lte('created_at', end)
    .order('created_at', { ascending });

  return await fetchAllPaginated<TransactionRow>(queryFactory);
}

/**
 * Busca todas as transações de uma categoria específica de um usuário.
 */
export async function fetchTransactionsByCategory(
  userId: string,
  category: string,
  startDate?: string,
  endDate?: string
): Promise<TransactionRow[]> {
  const queryFactory = () => {
    let query = supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('category', category)
      .order('created_at', { ascending: false });

    if (startDate) query = query.gte('created_at', startDate);
    if (endDate) query = query.lte('created_at', endDate);
    
    return query;
  };

  return await fetchAllPaginated<TransactionRow>(queryFactory);
}

/**
 * Retorna os meses que possuem dados para o ano especificado.
 */
export async function fetchActiveMonthsInYear(
  userId: string,
  startOfYear: string,
  endOfYear: string
): Promise<{ created_at: string }[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('created_at')
    .eq('user_id', userId)
    .gte('created_at', startOfYear)
    .lte('created_at', endOfYear);

  if (error) throw error;
  return data || [];
}

function isMissingColumnError(error: unknown, columnName: string): boolean {
  if (typeof error === 'object' && error !== null) {
    const err = error as { code?: string; message?: string };
    const col = columnName.toLowerCase();
    if (err.code === '42703' && err.message?.toLowerCase().includes(col)) return true;
    if (typeof err.message === 'string') {
      const lower = err.message.toLowerCase();
      if (lower.includes(col) && (lower.includes('column') || lower.includes('schema cache'))) {
        return true;
      }
    }
  }
  return false;
}

function sanitizeTransactionData<T extends Record<string, unknown>>(data: T, removeNotes: boolean, removeDueDate: boolean): T {
  const sanitized = { ...data };
  if (removeNotes) delete sanitized.notes;
  if (removeDueDate) delete sanitized.due_date;
  return sanitized;
}

/**
 * Cria uma transação individual com fallback para colunas pendentes de migration.
 */
export async function createTransaction(transactionData: TransactionInsert): Promise<TransactionRow[]> {
  const { data, error } = await supabase
    .from('transactions')
    .insert([transactionData])
    .select();

  if (error) {
    const missingNotes = isMissingColumnError(error, 'notes') && 'notes' in transactionData;
    const missingDueDate = isMissingColumnError(error, 'due_date') && 'due_date' in transactionData;

    if (missingNotes || missingDueDate) {
      console.warn(`[transactions] Coluna ausente no banco (${missingNotes ? 'notes ' : ''}${missingDueDate ? 'due_date' : ''}). Salvando com fallback resiliente.`);
      const fallbackData = sanitizeTransactionData(transactionData as Record<string, unknown>, missingNotes, missingDueDate);
      const { data: retryData, error: retryError } = await supabase
        .from('transactions')
        .insert([fallbackData as TransactionInsert])
        .select();
      if (retryError) throw retryError;
      return retryData || [];
    }
    throw error;
  }
  return data || [];
}

/**
 * Cria um lote de transações (parcelas, contas recorrentes, importação CSV).
 */
export async function createBatchTransactions(transactionsList: TransactionInsert[]): Promise<TransactionRow[]> {
  const { data, error } = await supabase
    .from('transactions')
    .insert(transactionsList)
    .select();

  if (error) {
    const missingNotes = isMissingColumnError(error, 'notes');
    const missingDueDate = isMissingColumnError(error, 'due_date');

    if (missingNotes || missingDueDate) {
      console.warn(`[transactions] Coluna ausente no banco (${missingNotes ? 'notes ' : ''}${missingDueDate ? 'due_date' : ''}). Salvando lote com fallback resiliente.`);
      const fallbackList = transactionsList.map(tx =>
        sanitizeTransactionData(tx as Record<string, unknown>, missingNotes, missingDueDate) as TransactionInsert
      );
      const { data: retryData, error: retryError } = await supabase
        .from('transactions')
        .insert(fallbackList)
        .select();
      if (retryError) throw retryError;
      return retryData || [];
    }
    throw error;
  }
  return data || [];
}

/**
 * Atualiza uma transação pelo ID.
 */
export async function updateTransaction(
  userId: string,
  id: number,
  updateData: TransactionUpdate
): Promise<TransactionRow[]> {
  const { data, error } = await supabase
    .from('transactions')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', userId)
    .select();

  if (error) {
    const missingNotes = isMissingColumnError(error, 'notes') && 'notes' in updateData;
    const missingDueDate = isMissingColumnError(error, 'due_date') && 'due_date' in updateData;

    if (missingNotes || missingDueDate) {
      console.warn(`[transactions] Coluna ausente no banco (${missingNotes ? 'notes ' : ''}${missingDueDate ? 'due_date' : ''}). Atualizando com fallback resiliente.`);
      const fallbackData = sanitizeTransactionData(updateData as Record<string, unknown>, missingNotes, missingDueDate);
      const { data: retryData, error: retryError } = await supabase
        .from('transactions')
        .update(fallbackData as TransactionUpdate)
        .eq('id', id)
        .eq('user_id', userId)
        .select();
      if (retryError) throw retryError;
      return retryData || [];
    }
    throw error;
  }
  return data || [];
}

/**
 * Alterna o status de pagamento de uma transação.
 */
export async function toggleTransactionPaidStatus(
  userId: string,
  id: number,
  newStatus: boolean
): Promise<TransactionRow[]> {
  const { data, error } = await supabase
    .from('transactions')
    .update({ is_paid: newStatus })
    .eq('id', id)
    .eq('user_id', userId)
    .select();

  if (error) throw error;
  return data || [];
}

/**
 * Deleta uma transação pelo ID.
 */
export async function deleteTransaction(userId: string, id: number): Promise<void> {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw error;
}

/**
 * Deleta múltiplas transações pelos seus IDs, fatiando em lotes para evitar erro 414 (URI Too Long).
 */
export async function deleteBatchTransactions(userId: string, ids: number[]): Promise<void> {
  if (!ids || ids.length === 0) return;
  
  const CHUNK_SIZE = 100;
  for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
    const chunk = ids.slice(i, i + CHUNK_SIZE);
    const { error } = await supabase
      .from('transactions')
      .delete()
      .in('id', chunk)
      .eq('user_id', userId);

    if (error) throw error;
  }
}

export type FutureInstallmentItem = Pick<TransactionRow, 'id' | 'name' | 'created_at' | 'installment_group_id'>;

/**
 * Busca parcelas futuras vinculadas.
 * Prioriza `installment_group_id` relacional. Se for registro legado, usa fallback por `LIKE name`.
 */
export async function fetchFutureInstallments(
  userId: string,
  transaction: Pick<TransactionRow, 'created_at' | 'installment_group_id'>,
  instInfo?: InstallmentInfo | null
): Promise<FutureInstallmentItem[]> {
  if (!transaction.installment_group_id && !instInfo) {
    return [];
  }

  let query = supabase
    .from('transactions')
    .select('id, name, created_at, installment_group_id')
    .eq('user_id', userId);

  if (transaction.installment_group_id) {
    query = query.eq('installment_group_id', transaction.installment_group_id);
    const { data, error } = await query;
    if (error) throw error;

    if (instInfo) {
      return (data || []).filter(item => {
        const itemInfo = getInstallmentInfo(item.name);
        if (itemInfo) {
          return itemInfo.current >= instInfo.current;
        }
        return item.created_at >= transaction.created_at;
      });
    }

    return (data || []).filter(item => item.created_at >= transaction.created_at);
  } else if (instInfo) {
    query = query
      .gte('created_at', transaction.created_at)
      .like('name', `${instInfo.baseName} (%/${instInfo.total})`);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } else {
    return [];
  }
}

/**
 * Atualiza esta e as parcelas futuras vinculadas.
 */
export async function updateFutureInstallments(
  userId: string,
  editingTransaction: TransactionRow | DisplayTransaction,
  instInfo: InstallmentInfo | null | undefined,
  baseNameInput: string,
  baseAmount: number,
  type: string,
  category: string,
  isPaid: boolean,
  baseDateIso: string,
  isDateChanged: boolean,
  notes?: string | null,
  dueDateIso?: string | null,
  isDueDateChanged?: boolean
): Promise<void> {
  const futureTxs = await fetchFutureInstallments(userId, editingTransaction, instInfo);
  if (!futureTxs || futureTxs.length === 0) return;

  // Garante que todas as parcelas fiquem atreladas ao mesmo installment_group_id
  const groupId = editingTransaction.installment_group_id || generateUUID();

  for (const fTx of futureTxs) {
    let newName = fTx.name;
    const match = fTx.name.match(/\((\d+)\/(\d+)\)$/);
    if (match) {
      newName = `${baseNameInput} (${match[1]}/${match[2]})`;
    }

    const updateData: TransactionUpdate = {
      name: newName,
      type,
      category,
      installment_group_id: groupId,
      notes: notes !== undefined ? notes : undefined,
    };
    
    // Evita corrupção do resto da divisão em parcelas futuras se o valor não foi alterado
    if (fTx.id === editingTransaction.id || baseAmount !== editingTransaction.amount) {
      updateData.amount = baseAmount;
    }

    if (fTx.id === editingTransaction.id) {
      updateData.is_paid = isPaid;
      if (isDateChanged) {
        updateData.created_at = baseDateIso;
      }
      if (isDueDateChanged) {
        updateData.due_date = dueDateIso;
      }
    }

    await updateTransaction(userId, fTx.id, updateData);
  }
}

/**
 * Deleta esta e as parcelas futuras vinculadas.
 * Prioriza `installment_group_id` relacional com fallback para legacy LIKE name.
 */
export async function deleteFutureInstallments(
  userId: string,
  editingTransaction: TransactionRow | DisplayTransaction,
  instInfo?: InstallmentInfo | null
): Promise<void> {
  const futureTxs = await fetchFutureInstallments(userId, editingTransaction, instInfo);
  if (futureTxs && futureTxs.length > 0) {
    const ids = futureTxs.map(t => Number(t.id));
    await deleteBatchTransactions(userId, ids);
  } else {
    await deleteTransaction(userId, Number(editingTransaction.id));
  }
}

export async function fetchAnalysisRPC(
  userId: string,
  startDate: Date | string,
  endDate: Date | string,
  prevStartDate: Date | string | null = null,
  prevEndDate: Date | string | null = null
): Promise<AnalysisData | null> {
  const toIso = (d: Date | string): string =>
    typeof d === 'string' ? new Date(d).toISOString() : d.toISOString();

  const { data, error } = await supabase.rpc('get_analysis_data_v4', {
    p_user_id: userId,
    p_start_date: toIso(startDate),
    p_end_date: toIso(endDate),
    p_prev_start_date: prevStartDate ? toIso(prevStartDate) : undefined,
    p_prev_end_date: prevEndDate ? toIso(prevEndDate) : undefined,
  });

  if (error) {
    console.error("Erro fetchAnalysisRPC:", error);
    return null;
  }
  return data as unknown as AnalysisData;
}
