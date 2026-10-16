import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchRecurringExpenses, saveRecurringExpense, deleteRecurringExpense } from './recurring';
import { supabase } from './supabase';

vi.mock('./supabase', () => ({
  supabase: {
    from: vi.fn()
  }
}));

describe('recurring service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchRecurringExpenses', () => {
    it('deve buscar despesas fixas ordenadas pelo dia', async () => {
      const mockData = [
        { id: '1', user_id: 'user-1', name: 'Aluguel', amount: 150000, category: 'housing', day: 5, created_at: '2026-01-01' },
        { id: '2', user_id: 'user-1', name: 'Internet', amount: 10000, category: 'bills', day: 15, created_at: '2026-01-01' }
      ];

      const orderMock = vi.fn().mockResolvedValue({ data: mockData, error: null });
      const eqMock = vi.fn().mockReturnValue({ order: orderMock });
      const selectMock = vi.fn().mockReturnValue({ eq: eqMock });
       
      vi.mocked(supabase.from).mockReturnValue({ select: selectMock } as any);

      const result = await fetchRecurringExpenses('user-1');

      expect(supabase.from).toHaveBeenCalledWith('recurring_expenses');
      expect(selectMock).toHaveBeenCalledWith('*');
      expect(eqMock).toHaveBeenCalledWith('user_id', 'user-1');
      expect(orderMock).toHaveBeenCalledWith('day', { ascending: true });
      expect(result).toEqual(mockData);
    });

    it('deve lançar erro se o Supabase falhar', async () => {
      const mockError = new Error('Database connection failed');
      const orderMock = vi.fn().mockResolvedValue({ data: null, error: mockError });
      const eqMock = vi.fn().mockReturnValue({ order: orderMock });
      const selectMock = vi.fn().mockReturnValue({ eq: eqMock });
       
      vi.mocked(supabase.from).mockReturnValue({ select: selectMock } as any);

      await expect(fetchRecurringExpenses('user-1')).rejects.toThrow('Database connection failed');
    });

    it('deve retornar array vazio se data for null', async () => {
      const orderMock = vi.fn().mockResolvedValue({ data: null, error: null });
      const eqMock = vi.fn().mockReturnValue({ order: orderMock });
      const selectMock = vi.fn().mockReturnValue({ eq: eqMock });
       
      vi.mocked(supabase.from).mockReturnValue({ select: selectMock } as any);

      const result = await fetchRecurringExpenses('user-1');
      expect(result).toEqual([]);
    });
  });

  describe('saveRecurringExpense', () => {
    it('deve inserir nova despesa quando id não for informado', async () => {
      const newExpense = {
        name: 'Academia',
        amount: 9900,
        category: 'health',
        day: 10
      };

      const mockInserted = [{ id: 'new-id', user_id: 'user-1', ...newExpense, created_at: '2026-01-01' }];
      const selectMock = vi.fn().mockResolvedValue({ data: mockInserted, error: null });
      const insertMock = vi.fn().mockReturnValue({ select: selectMock });
       
      vi.mocked(supabase.from).mockReturnValue({ insert: insertMock } as any);

      const result = await saveRecurringExpense('user-1', newExpense);

      expect(supabase.from).toHaveBeenCalledWith('recurring_expenses');
      expect(insertMock).toHaveBeenCalledWith([{ ...newExpense, user_id: 'user-1' }]);
      expect(result).toEqual(mockInserted);
    });

    it('deve atualizar despesa existente quando id for informado', async () => {
      const expenseUpdate = {
        name: 'Academia Premium',
        amount: 12900,
        category: 'health',
        day: 10
      };

      const mockUpdated = [{ id: 'item-1', user_id: 'user-1', ...expenseUpdate, created_at: '2026-01-01' }];
      const selectMock = vi.fn().mockResolvedValue({ data: mockUpdated, error: null });
      const eqUserMock = vi.fn().mockReturnValue({ select: selectMock });
      const eqIdMock = vi.fn().mockReturnValue({ eq: eqUserMock });
      const updateMock = vi.fn().mockReturnValue({ eq: eqIdMock });
       
      vi.mocked(supabase.from).mockReturnValue({ update: updateMock } as any);

      const result = await saveRecurringExpense('user-1', expenseUpdate, 'item-1');

      expect(supabase.from).toHaveBeenCalledWith('recurring_expenses');
      expect(updateMock).toHaveBeenCalledWith({ ...expenseUpdate, user_id: 'user-1' });
      expect(eqIdMock).toHaveBeenCalledWith('id', 'item-1');
      expect(eqUserMock).toHaveBeenCalledWith('user_id', 'user-1');
      expect(result).toEqual(mockUpdated);
    });

    it('deve propagar erro de inserção', async () => {
      const insertMock = vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: null, error: new Error('Insert constraint violated') })
      });
       
      vi.mocked(supabase.from).mockReturnValue({ insert: insertMock } as any);

      await expect(saveRecurringExpense('user-1', { name: 'X', amount: 100, category: 'others', day: 1 }))
        .rejects.toThrow('Insert constraint violated');
    });
  });

  describe('deleteRecurringExpense', () => {
    it('deve deletar despesa com id e user_id', async () => {
      const eqUserMock = vi.fn().mockResolvedValue({ error: null });
      const eqIdMock = vi.fn().mockReturnValue({ eq: eqUserMock });
      const deleteMock = vi.fn().mockReturnValue({ eq: eqIdMock });
       
      vi.mocked(supabase.from).mockReturnValue({ delete: deleteMock } as any);

      await deleteRecurringExpense('user-1', 'item-99');

      expect(supabase.from).toHaveBeenCalledWith('recurring_expenses');
      expect(deleteMock).toHaveBeenCalled();
      expect(eqIdMock).toHaveBeenCalledWith('id', 'item-99');
      expect(eqUserMock).toHaveBeenCalledWith('user_id', 'user-1');
    });

    it('deve lançar erro se a deleção falhar no Supabase', async () => {
      const eqUserMock = vi.fn().mockResolvedValue({ error: new Error('Permission denied') });
      const eqIdMock = vi.fn().mockReturnValue({ eq: eqUserMock });
      const deleteMock = vi.fn().mockReturnValue({ eq: eqIdMock });
       
      vi.mocked(supabase.from).mockReturnValue({ delete: deleteMock } as any);

      await expect(deleteRecurringExpense('user-1', 'item-99')).rejects.toThrow('Permission denied');
    });
  });
});
