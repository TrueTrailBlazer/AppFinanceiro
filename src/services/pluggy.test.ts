import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchUserPluggyItems,
  fetchConnectToken,
  syncPluggyItem,
  deletePluggyItem,
} from './pluggy';
import { supabase } from './supabase';

vi.mock('./supabase', () => ({
  supabase: {
    from: vi.fn(),
    functions: {
      invoke: vi.fn(),
    },
  },
}));

describe('pluggy service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchUserPluggyItems', () => {
    it('deve buscar as conexões bancárias ordenadas por created_at', async () => {
      const mockItems = [
        { id: '1', item_id: 'item-1', connector_name: 'Nubank', created_at: '2026-10-01' },
      ];

      const orderMock = vi.fn().mockResolvedValue({ data: mockItems, error: null });
      const eqMock = vi.fn().mockReturnValue({ order: orderMock });
      const selectMock = vi.fn().mockReturnValue({ eq: eqMock });
      vi.mocked(supabase.from).mockReturnValue({ select: selectMock } as any);

      const result = await fetchUserPluggyItems('user-1');
      expect(supabase.from).toHaveBeenCalledWith('pluggy_items');
      expect(eqMock).toHaveBeenCalledWith('user_id', 'user-1');
      expect(orderMock).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result).toEqual(mockItems);
    });

    it('deve lançar erro se a consulta falhar', async () => {
      const orderMock = vi.fn().mockResolvedValue({ data: null, error: new Error('DB Error') });
      const eqMock = vi.fn().mockReturnValue({ order: orderMock });
      const selectMock = vi.fn().mockReturnValue({ eq: eqMock });
      vi.mocked(supabase.from).mockReturnValue({ select: selectMock } as any);

      await expect(fetchUserPluggyItems('user-1')).rejects.toThrow('DB Error');
    });
  });

  describe('fetchConnectToken', () => {
    it('deve invocar a Edge Function pluggy-connect-token e retornar accessToken', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { accessToken: 'token-abc-123' },
        error: null,
      } as any);

      const token = await fetchConnectToken('item-123');
      expect(supabase.functions.invoke).toHaveBeenCalledWith('pluggy-connect-token', {
        body: { itemId: 'item-123' },
      });
      expect(token).toBe('token-abc-123');
    });

    it('deve lançar erro se a função retornar erro de execução', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: null,
        error: new Error('Functions error'),
      } as any);

      await expect(fetchConnectToken()).rejects.toThrow('Functions error');
    });
  });

  describe('syncPluggyItem', () => {
    it('deve invocar pluggy-sync e retornar dados de transações importadas', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { success: true, totalTransactions: 15 },
        error: null,
      } as any);

      const result = await syncPluggyItem('item-123');
      expect(supabase.functions.invoke).toHaveBeenCalledWith('pluggy-sync', {
        body: { itemId: 'item-123' },
      });
      expect(result?.totalTransactions).toBe(15);
    });
  });

  describe('deletePluggyItem (Revogação de Consentimento Open Finance)', () => {
    it('deve invocar pluggy-disconnect para revogar token na Pluggy e remover registro', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { success: true, message: 'Sucesso' },
        error: null,
      } as any);

      const result = await deletePluggyItem('item-to-revoke');
      expect(supabase.functions.invoke).toHaveBeenCalledWith('pluggy-disconnect', {
        body: { itemId: 'item-to-revoke' },
      });
      expect(result).toBe(true);
    });

    it('deve realizar fallback para deleção local caso a Edge Function falhe por conectividade', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: null,
        error: new Error('Network error on edge function'),
      } as any);

      const eqMock = vi.fn().mockResolvedValue({ error: null });
      const deleteMock = vi.fn().mockReturnValue({ eq: eqMock });
      vi.mocked(supabase.from).mockReturnValue({ delete: deleteMock } as any);

      const result = await deletePluggyItem('item-to-revoke');
      expect(supabase.from).toHaveBeenCalledWith('pluggy_items');
      expect(eqMock).toHaveBeenCalledWith('item_id', 'item-to-revoke');
      expect(result).toBe(true);
    });
  });
});
