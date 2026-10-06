import { supabase } from './supabase';

/**
 * Gera identificador UUID compatível.
 */
export function generateUUID() {
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
export async function fetchTransactionsByMonth(userId, startOfMonth, endOfMonth) {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', startOfMonth)
    .lte('created_at', endOfMonth)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Busca todas as transações de um usuário (para gráficos e análise histórica).
 */
export async function fetchAllUserTransactions(userId, ascending = true) {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending });

  if (error) throw error;
  return data || [];
}

/**
 * Busca todas as transações de uma categoria específica de um usuário.
 */
export async function fetchTransactionsByCategory(userId, category) {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .eq('category', category)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Retorna os meses que possuem dados para o ano especificado.
 */
export async function fetchActiveMonthsInYear(userId, startOfYear, endOfYear) {
  const { data, error } = await supabase
    .from('transactions')
    .select('created_at')
    .eq('user_id', userId)
    .gte('created_at', startOfYear)
    .lte('created_at', endOfYear);

  if (error) throw error;
  return data || [];
}

/**
 * Cria uma transação individual.
 */
export async function createTransaction(transactionData) {
  const { data, error } = await supabase
    .from('transactions')
    .insert([transactionData])
    .select();

  if (error) throw error;
  return data;
}

/**
 * Cria um lote de transações (parcelas, contas recorrentes, importação CSV).
 */
export async function createBatchTransactions(transactionsList) {
  const { data, error } = await supabase
    .from('transactions')
    .insert(transactionsList)
    .select();

  if (error) throw error;
  return data;
}

/**
 * Atualiza uma transação pelo ID.
 */
export async function updateTransaction(id, updateData) {
  const { data, error } = await supabase
    .from('transactions')
    .update(updateData)
    .eq('id', id);

  if (error) throw error;
  return data;
}

/**
 * Alterna o status de pagamento de uma transação.
 */
export async function toggleTransactionPaidStatus(id, newStatus) {
  const { data, error } = await supabase
    .from('transactions')
    .update({ is_paid: newStatus })
    .eq('id', id);

  if (error) throw error;
  return data;
}

/**
 * Deleta uma transação pelo ID.
 */
export async function deleteTransaction(id) {
  const { data, error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return data;
}

/**
 * Deleta múltiplas transações pelos seus IDs.
 */
export async function deleteBatchTransactions(ids) {
  const { data, error } = await supabase
    .from('transactions')
    .delete()
    .in('id', ids);

  if (error) throw error;
  return data;
}

/**
 * Busca parcelas futuras vinculadas.
 * Prioriza `installment_group_id` relacional. Se for registro legado, usa fallback por `LIKE name`.
 */
export async function fetchFutureInstallments(userId, transaction, instInfo) {
  let query = supabase
    .from('transactions')
    .select('id, name, created_at, installment_group_id')
    .eq('user_id', userId)
    .gte('created_at', transaction.created_at);

  if (transaction.installment_group_id) {
    query = query.eq('installment_group_id', transaction.installment_group_id);
  } else if (instInfo) {
    query = query.like('name', `${instInfo.baseName} (%/${instInfo.total})`);
  } else {
    return [];
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

/**
 * Atualiza esta e as parcelas futuras vinculadas.
 */
export async function updateFutureInstallments(userId, editingTransaction, instInfo, baseNameInput, baseAmount, type, category, isPaid, baseDateIso, isDateChanged) {
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

    const updateData = {
      name: newName,
      amount: baseAmount,
      type,
      category,
      installment_group_id: groupId,
    };

    if (fTx.id === editingTransaction.id) {
      updateData.is_paid = isPaid;
      if (isDateChanged) {
        updateData.created_at = baseDateIso;
      }
    }

    await updateTransaction(fTx.id, updateData);
  }
}

/**
 * Deleta esta e as parcelas futuras vinculadas.
 * Prioriza `installment_group_id` relacional com fallback para legacy LIKE name.
 */
export async function deleteFutureInstallments(userId, editingTransaction, instInfo) {
  let query = supabase
    .from('transactions')
    .delete()
    .eq('user_id', userId)
    .gte('created_at', editingTransaction.created_at);

  if (editingTransaction.installment_group_id) {
    query = query.eq('installment_group_id', editingTransaction.installment_group_id);
  } else if (instInfo) {
    query = query.like('name', `${instInfo.baseName} (%/${instInfo.total})`);
  } else {
    return deleteTransaction(editingTransaction.id);
  }

  const { error } = await query;
  if (error) throw error;
}
