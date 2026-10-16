import { supabase } from './supabase';
import type { RecurringExpenseRow, RecurringExpenseInsert } from '../types/models';
import type { TablesUpdate } from '../types/database.types';

export type RecurringExpenseInput = {
  name: string;
  amount: number;
  category: string;
  day?: number | null;
  created_at?: string;
};

/**
 * Busca todas as despesas recorrentes de um usuário
 */
export async function fetchRecurringExpenses(userId: string): Promise<RecurringExpenseRow[]> {
  const { data, error } = await supabase
    .from('recurring_expenses')
    .select('*')
    .eq('user_id', userId)
    .order('day', { ascending: true });
    
  if (error) throw error;
  return data || [];
}

/**
 * Insere ou atualiza uma despesa recorrente
 */
export async function saveRecurringExpense(
  userId: string,
  expenseData: RecurringExpenseInput,
  id: string | null = null
): Promise<RecurringExpenseRow[]> {
  if (id) {
    const updatePayload: TablesUpdate<'recurring_expenses'> = {
      ...expenseData,
      user_id: userId
    };

    const { data, error } = await supabase
      .from('recurring_expenses')
      .update(updatePayload)
      .eq('id', id)
      .eq('user_id', userId)
      .select();
      
    if (error) throw error;
    return data || [];
  } else {
    const insertPayload: RecurringExpenseInsert = {
      ...expenseData,
      user_id: userId
    };

    const { data, error } = await supabase
      .from('recurring_expenses')
      .insert([insertPayload])
      .select();
      
    if (error) throw error;
    return data || [];
  }
}

/**
 * Deleta uma despesa recorrente
 */
export async function deleteRecurringExpense(userId: string, id: string): Promise<void> {
  const { error } = await supabase
    .from('recurring_expenses')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
    
  if (error) throw error;
}
