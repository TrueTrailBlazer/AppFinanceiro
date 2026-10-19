import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createTransaction,
  createBatchTransactions,
  updateTransaction,
  deleteBatchTransactions,
  fetchFutureInstallments,
  deleteFutureInstallments,
  fetchAnalysisRPC
} from './transactions';
import { supabase } from './supabase';
import type { TransactionInsert, TransactionRow, AnalysisData } from '../types/models';

vi.mock('./supabase', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn()
  }
}));

describe('transactions service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createTransaction', () => {
    it('deve inserir uma nova transação individual', async () => {
      const txInput: TransactionInsert = {
        user_id: 'user-1',
        name: 'Café',
        amount: 850,
        type: 'variable',
        category: 'food',
        is_paid: true,
        created_at: '2026-10-14T10:00:00.000Z'
      };

      const mockRow: TransactionRow = {
        id: 101,
        user_id: txInput.user_id || 'user-1',
        name: txInput.name,
        amount: txInput.amount,
        type: txInput.type,
        category: txInput.category ?? 'food',
        is_paid: txInput.is_paid ?? true,
        created_at: txInput.created_at || '2026-10-14T10:00:00.000Z',
        bank_logo_url: null,
        bank_name: null,
        installment_group_id: null,
        pluggy_transaction_id: null,
        receipt_url: null,
        notes: null,
        due_date: null
      };

      const selectMock = vi.fn().mockResolvedValue({ data: [mockRow], error: null });
      const insertMock = vi.fn().mockReturnValue({ select: selectMock });
       
      vi.mocked(supabase.from).mockReturnValue({ insert: insertMock } as any);

      const result = await createTransaction(txInput);

      expect(supabase.from).toHaveBeenCalledWith('transactions');
      expect(insertMock).toHaveBeenCalledWith([txInput]);
      expect(result).toEqual([mockRow]);
    });
  });

  describe('createBatchTransactions', () => {
    it('deve inserir uma lista de transações em lote', async () => {
      const txsInput: TransactionInsert[] = [
        {
          user_id: 'user-1',
          name: 'Compra (1/2)',
          amount: 5000,
          type: 'variable',
          category: 'shopping',
          is_paid: true,
          created_at: '2026-10-14T10:00:00.000Z'
        },
        {
          user_id: 'user-1',
          name: 'Compra (2/2)',
          amount: 5000,
          type: 'variable',
          category: 'shopping',
          is_paid: false,
          created_at: '2026-11-14T10:00:00.000Z'
        }
      ];

      const selectMock = vi.fn().mockResolvedValue({ data: [{ id: 1 }, { id: 2 }], error: null });
      const insertMock = vi.fn().mockReturnValue({ select: selectMock });
       
      vi.mocked(supabase.from).mockReturnValue({ insert: insertMock } as any);

      const result = await createBatchTransactions(txsInput);

      expect(supabase.from).toHaveBeenCalledWith('transactions');
      expect(insertMock).toHaveBeenCalledWith(txsInput);
      expect(result).toEqual([{ id: 1 }, { id: 2 }]);
    });
  });

  describe('deleteBatchTransactions', () => {
    it('deve deletar transações pelo lote de IDs', async () => {
      const eqMock = vi.fn().mockResolvedValue({ error: null });
      const inMock = vi.fn().mockReturnValue({ eq: eqMock });
      const deleteMock = vi.fn().mockReturnValue({ in: inMock });
       
      vi.mocked(supabase.from).mockReturnValue({ delete: deleteMock } as any);

      await deleteBatchTransactions('user-1', [10, 20, 30]);

      expect(supabase.from).toHaveBeenCalledWith('transactions');
      expect(inMock).toHaveBeenCalledWith('id', [10, 20, 30]);
      expect(eqMock).toHaveBeenCalledWith('user_id', 'user-1');
    });

    it('não deve chamar o Supabase se o array de IDs for vazio', async () => {
      await deleteBatchTransactions('user-1', []);
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('deve particionar deleções em lotes de 100 quando houver muitos IDs', async () => {
      const eqMock = vi.fn().mockResolvedValue({ error: null });
      const inMock = vi.fn().mockReturnValue({ eq: eqMock });
      const deleteMock = vi.fn().mockReturnValue({ in: inMock });
       
      vi.mocked(supabase.from).mockReturnValue({ delete: deleteMock } as any);

      // Gerar 250 IDs
      const manyIds = Array.from({ length: 250 }, (_, i) => i + 1);
      await deleteBatchTransactions('user-1', manyIds);

      expect(supabase.from).toHaveBeenCalledTimes(3);
      expect(inMock).toHaveBeenCalledTimes(3);
      expect(inMock).toHaveBeenNthCalledWith(1, 'id', manyIds.slice(0, 100));
      expect(inMock).toHaveBeenNthCalledWith(2, 'id', manyIds.slice(100, 200));
      expect(inMock).toHaveBeenNthCalledWith(3, 'id', manyIds.slice(200, 250));
    });
  });

  describe('fetchFutureInstallments', () => {
    it('deve buscar parcelas futuras por installment_group_id e filtrar pelo número da parcela, mesmo se as datas foram modificadas fora de ordem', async () => {
      const groupTxs = [
        { id: 1, name: 'Notebook (1/3)', created_at: '2026-01-10T12:00:00.000Z', installment_group_id: 'grp-123' },
        { id: 2, name: 'Notebook (2/3)', created_at: '2026-03-01T12:00:00.000Z', installment_group_id: 'grp-123' }, // adiada para março
        { id: 3, name: 'Notebook (3/3)', created_at: '2026-02-15T12:00:00.000Z', installment_group_id: 'grp-123' }  // parcela 3 mantida em fevereiro
      ];

      const eqGroupMock = vi.fn().mockResolvedValue({ data: groupTxs, error: null });
      const eqUserMock = vi.fn().mockReturnValue({ eq: eqGroupMock });
      const selectMock = vi.fn().mockReturnValue({ eq: eqUserMock });
       
      vi.mocked(supabase.from).mockReturnValue({ select: selectMock } as any);

      // Editando a parcela 2 (com data em março), queremos que encontre a parcela 2 E a parcela 3 (em fevereiro)
      const editingTx = {
        created_at: '2026-03-01T12:00:00.000Z',
        installment_group_id: 'grp-123'
      };
      const instInfo = {
        baseName: 'Notebook',
        current: 2,
        total: 3
      };

      const result = await fetchFutureInstallments('user-1', editingTx, instInfo);

      expect(supabase.from).toHaveBeenCalledWith('transactions');
      expect(eqUserMock).toHaveBeenCalledWith('user_id', 'user-1');
      expect(eqGroupMock).toHaveBeenCalledWith('installment_group_id', 'grp-123');
      // Deve conter as parcelas 2 e 3, descartando a parcela 1
      expect(result).toHaveLength(2);
      expect(result.map(r => r.id)).toEqual([2, 3]);
    });

    it('deve utilizar fallback por LIKE e created_at quando não houver installment_group_id', async () => {
      const legacyTxs = [
        { id: 2, name: 'Curso (2/3)', created_at: '2026-02-10T12:00:00.000Z', installment_group_id: null },
        { id: 3, name: 'Curso (3/3)', created_at: '2026-03-10T12:00:00.000Z', installment_group_id: null }
      ];

      const likeMock = vi.fn().mockResolvedValue({ data: legacyTxs, error: null });
      const gteMock = vi.fn().mockReturnValue({ like: likeMock });
      const eqUserMock = vi.fn().mockReturnValue({ gte: gteMock });
      const selectMock = vi.fn().mockReturnValue({ eq: eqUserMock });
       
      vi.mocked(supabase.from).mockReturnValue({ select: selectMock } as any);

      const editingTx = {
        created_at: '2026-02-10T12:00:00.000Z',
        installment_group_id: null
      };
      const instInfo = {
        baseName: 'Curso',
        current: 2,
        total: 3
      };

      const result = await fetchFutureInstallments('user-1', editingTx, instInfo);

      expect(gteMock).toHaveBeenCalledWith('created_at', '2026-02-10T12:00:00.000Z');
      expect(likeMock).toHaveBeenCalledWith('name', 'Curso (%/3)');
      expect(result).toEqual(legacyTxs);
    });

    it('deve retornar vazio se não houver installment_group_id nem instInfo', async () => {
      const result = await fetchFutureInstallments('user-1', { created_at: '2026-01-01', installment_group_id: null }, null);
      expect(result).toEqual([]);
      expect(supabase.from).not.toHaveBeenCalled();
    });
  });

  describe('deleteFutureInstallments', () => {
    it('deve deletar em lote todas as parcelas retornadas por fetchFutureInstallments', async () => {
      const futureItems = [
        { id: 10, name: 'Carro (2/12)', created_at: '2026-02-01', installment_group_id: 'grp-car' },
        { id: 11, name: 'Carro (3/12)', created_at: '2026-03-01', installment_group_id: 'grp-car' }
      ];

      // Mock para a query de fetchFutureInstallments
      const eqGroupMock = vi.fn().mockResolvedValue({ data: futureItems, error: null });
      const eqUserMock = vi.fn().mockReturnValue({ eq: eqGroupMock });
      const selectMock = vi.fn().mockReturnValue({ eq: eqUserMock });

      // Mock para deleteBatchTransactions
      const eqDeleteMock = vi.fn().mockResolvedValue({ error: null });
      const inDeleteMock = vi.fn().mockReturnValue({ eq: eqDeleteMock });
      const deleteMock = vi.fn().mockReturnValue({ in: inDeleteMock });

       
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'transactions') {
          return {
            select: selectMock,
            delete: deleteMock
          } as any;
        }
        return {} as any;
      });

      const editingTx: TransactionRow = {
        id: 10,
        user_id: 'user-1',
        name: 'Carro (2/12)',
        amount: 80000,
        type: 'variable',
        category: 'transport',
        is_paid: true,
        created_at: '2026-02-01T12:00:00.000Z',
        installment_group_id: 'grp-car',
        bank_name: null,
        bank_logo_url: null,
        pluggy_transaction_id: null,
        receipt_url: null,
        notes: null,
        due_date: null
      };

      await deleteFutureInstallments('user-1', editingTx, { baseName: 'Carro', current: 2, total: 12 });

      expect(deleteMock).toHaveBeenCalled();
      expect(inDeleteMock).toHaveBeenCalledWith('id', [10, 11]);
    });
  });

  describe('fetchAnalysisRPC', () => {
    it('deve chamar get_analysis_data_v4 com os parâmetros em formato ISO e retornar dados analíticos', async () => {
      const mockAnalysisData: AnalysisData = {
        totalExpenseCents: 150000,
        categoryRanking: [{ cat: 'food', amount: 50000 }],
        topExpensesList: [],
        comparison: {
          isSavings: true,
          value: 20000,
          percent: 12
        },
        totalItems: 5,
        isBankSource: true
      };

      vi.mocked(supabase.rpc).mockResolvedValue({ data: mockAnalysisData, error: null } as any);

      const startDate = new Date('2026-10-01T00:00:00.000Z');
      const endDate = new Date('2026-10-31T23:59:59.000Z');
      const prevStartDate = new Date('2026-09-01T00:00:00.000Z');
      const prevEndDate = new Date('2026-09-30T23:59:59.000Z');

      const result = await fetchAnalysisRPC('user-uuid-123', startDate, endDate, prevStartDate, prevEndDate);

      expect(supabase.rpc).toHaveBeenCalledWith('get_analysis_data_v4', {
        p_user_id: 'user-uuid-123',
        p_start_date: '2026-10-01T00:00:00.000Z',
        p_end_date: '2026-10-31T23:59:59.000Z',
        p_prev_start_date: '2026-09-01T00:00:00.000Z',
        p_prev_end_date: '2026-09-30T23:59:59.000Z'
      });
      expect(result).toEqual(mockAnalysisData);
    });

    it('deve passar undefined para datas anteriores quando não forem fornecidas', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null } as any);

      await fetchAnalysisRPC('user-uuid-123', '2026-10-01T00:00:00.000Z', '2026-10-31T23:59:59.000Z');

      expect(supabase.rpc).toHaveBeenCalledWith('get_analysis_data_v4', {
        p_user_id: 'user-uuid-123',
        p_start_date: '2026-10-01T00:00:00.000Z',
        p_end_date: '2026-10-31T23:59:59.000Z',
        p_prev_start_date: undefined,
        p_prev_end_date: undefined
      });
    });

    it('deve retornar null e logar erro quando o Supabase retornar erro', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: { message: 'Acesso não autorizado: usuário inválido' } } as any);

      const result = await fetchAnalysisRPC('user-uuid-123', '2026-10-01T00:00:00.000Z', '2026-10-31T23:59:59.000Z');

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Erro fetchAnalysisRPC:', { message: 'Acesso não autorizado: usuário inválido' });
      consoleSpy.mockRestore();
    });
  });

  describe('Campo de Observações (notes)', () => {
    it('deve suportar criação de transação com campo notes', async () => {
      const txWithNotes: TransactionInsert = {
        user_id: 'user-1',
        name: 'Aluguel',
        amount: 150000,
        type: 'fixed',
        category: 'home',
        notes: 'Pago adiantado com desconto de R$ 50',
      };

      const selectMock = vi.fn().mockResolvedValue({ data: [{ ...txWithNotes, id: 999 }], error: null });
      const insertMock = vi.fn().mockReturnValue({ select: selectMock });
      vi.mocked(supabase.from).mockReturnValue({ insert: insertMock } as any);

      const result = await createTransaction(txWithNotes);

      expect(supabase.from).toHaveBeenCalledWith('transactions');
      expect(insertMock).toHaveBeenCalledWith([txWithNotes]);
      expect(result[0].notes).toBe('Pago adiantado com desconto de R$ 50');
    });

    it('deve executar fallback resiliente e salvar sem notes se o banco acusar ausência da coluna (código 42703)', async () => {
      const txWithNotes: TransactionInsert = {
        user_id: 'user-1',
        name: 'Internet Fibra',
        amount: 12000,
        type: 'fixed',
        category: 'utilities',
        notes: 'Vencimento todo dia 10',
      };

      const selectFailure = vi.fn().mockResolvedValue({
        data: null,
        error: { code: '42703', message: 'column transactions.notes does not exist' }
      });
      const selectSuccess = vi.fn().mockResolvedValue({
        data: [{ id: 1001, user_id: 'user-1', name: 'Internet Fibra', amount: 12000, type: 'fixed', category: 'utilities' }],
        error: null
      });

      const insertMock = vi.fn()
        .mockReturnValueOnce({ select: selectFailure })
        .mockReturnValueOnce({ select: selectSuccess });

      vi.mocked(supabase.from).mockReturnValue({ insert: insertMock } as any);

      const result = await createTransaction(txWithNotes);

      expect(insertMock).toHaveBeenCalledTimes(2);
      // Segunda chamada deve ter o campo notes removido para salvar com sucesso
      expect(insertMock).toHaveBeenNthCalledWith(2, [{
        user_id: 'user-1',
        name: 'Internet Fibra',
        amount: 12000,
        type: 'fixed',
        category: 'utilities',
      }]);
      expect(result[0].id).toBe(1001);
    });
  });

  describe('Campo de Vencimento (due_date) e Competência', () => {
    it('deve incluir due_date ao criar uma transação', async () => {
      const txWithDueDate: TransactionInsert = {
        user_id: 'user-1',
        name: 'Energia Elétrica Outubro',
        amount: 25000,
        type: 'fixed',
        category: 'utilities',
        created_at: '2026-10-15T12:00:00.000Z',
        due_date: '2026-11-05T00:00:00.000Z',
      };

      const selectMock = vi.fn().mockResolvedValue({
        data: [{ id: 2001, ...txWithDueDate }],
        error: null,
      });
      const insertMock = vi.fn().mockReturnValue({ select: selectMock });
      vi.mocked(supabase.from).mockReturnValue({ insert: insertMock } as any);

      const result = await createTransaction(txWithDueDate);

      expect(supabase.from).toHaveBeenCalledWith('transactions');
      expect(insertMock).toHaveBeenCalledWith([txWithDueDate]);
      expect(result[0].due_date).toBe('2026-11-05T00:00:00.000Z');
      expect(result[0].created_at).toBe('2026-10-15T12:00:00.000Z');
    });

    it('deve executar fallback resiliente e salvar sem due_date se o banco acusar ausência da coluna (código 42703)', async () => {
      const txWithDueDate: TransactionInsert = {
        user_id: 'user-1',
        name: 'Condomínio',
        amount: 45000,
        type: 'fixed',
        category: 'home',
        due_date: '2026-11-10T00:00:00.000Z',
      };

      const selectFailure = vi.fn().mockResolvedValue({
        data: null,
        error: { code: '42703', message: 'column transactions.due_date does not exist' }
      });
      const selectSuccess = vi.fn().mockResolvedValue({
        data: [{ id: 2002, user_id: 'user-1', name: 'Condomínio', amount: 45000, type: 'fixed', category: 'home' }],
        error: null
      });

      const insertMock = vi.fn()
        .mockReturnValueOnce({ select: selectFailure })
        .mockReturnValueOnce({ select: selectSuccess });

      vi.mocked(supabase.from).mockReturnValue({ insert: insertMock } as any);

      const result = await createTransaction(txWithDueDate);

      expect(insertMock).toHaveBeenCalledTimes(2);
      // Segunda chamada deve ter o campo due_date removido para salvar com sucesso
      expect(insertMock).toHaveBeenNthCalledWith(2, [{
        user_id: 'user-1',
        name: 'Condomínio',
        amount: 45000,
        type: 'fixed',
        category: 'home',
      }]);
      expect(result[0].id).toBe(2002);
    });

    it('deve atualizar transação com due_date corretamente', async () => {
      const selectMock = vi.fn().mockResolvedValue({
        data: [{ id: 2001, user_id: 'user-1', name: 'Energia', amount: 25000, due_date: '2026-11-08T00:00:00.000Z' }],
        error: null,
      });
      const eqUserMock = vi.fn().mockReturnValue({ select: selectMock });
      const eqIdMock = vi.fn().mockReturnValue({ eq: eqUserMock });
      const updateMock = vi.fn().mockReturnValue({ eq: eqIdMock });

      vi.mocked(supabase.from).mockReturnValue({ update: updateMock } as any);

      const result = await updateTransaction('user-1', 2001, {
        due_date: '2026-11-08T00:00:00.000Z',
      });

      expect(supabase.from).toHaveBeenCalledWith('transactions');
      expect(updateMock).toHaveBeenCalledWith({
        due_date: '2026-11-08T00:00:00.000Z',
      });
      expect(result[0].due_date).toBe('2026-11-08T00:00:00.000Z');
    });
  });
});

