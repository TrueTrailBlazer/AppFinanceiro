import { supabase } from './supabase';
import type { PluggyItemRow, PluggyItemInsert } from '../types/models';

export interface PluggyConnectItem {
  id: string;
  connector?: {
    id?: number | null;
    name?: string | null;
    imageUrl?: string | null;
  } | null;
  status?: string | null;
  executionStatus?: string | null;
}

export interface PluggyConnectTokenResponse {
  accessToken?: string;
  error?: string;
}

export interface PluggySyncResponse {
  success?: boolean;
  error?: string;
  partial?: boolean;
  failedAccounts?: number;
  totalAccounts?: number;
  totalTransactions?: number;
  reconciledBills?: number;
  [key: string]: unknown;
}

/**
 * Solicita à Edge Function do Supabase um Connect Token seguro da Pluggy.
 */
export async function fetchConnectToken(itemId: string | null = null): Promise<string> {
  const { data, error } = await supabase.functions.invoke<PluggyConnectTokenResponse>('pluggy-connect-token', {
    body: itemId ? { itemId } : {},
  });

  if (error) {
    throw new Error(error.message || 'Erro ao gerar token de conexão com a Pluggy');
  }

  if (!data?.accessToken) {
    throw new Error(data?.error || 'Token de acesso não retornado pelo servidor');
  }

  return data.accessToken;
}

/**
 * Busca todas as instituições bancárias conectadas pelo usuário.
 */
export async function fetchUserPluggyItems(userId: string): Promise<PluggyItemRow[]> {
  const { data, error } = await supabase
    .from('pluggy_items')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Salva ou atualiza um item retornado pelo Pluggy Connect no banco de dados.
 */
export async function savePluggyItem(
  userId: string,
  item: PluggyConnectItem
): Promise<PluggyItemRow | PluggyItemInsert> {
  const itemPayload: PluggyItemInsert = {
    user_id: userId,
    item_id: item.id,
    connector_id: item.connector?.id || null,
    connector_name: item.connector?.name || 'Banco Conectado',
    connector_image_url: item.connector?.imageUrl || null,
    status: item.status || 'UPDATING',
    execution_status: item.executionStatus || null,
    last_sync_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('pluggy_items')
    .upsert(itemPayload, { onConflict: 'item_id' })
    .select();

  if (error) throw error;
  return data?.[0] || itemPayload;
}

/**
 * Dispara a sincronização manual sob demanda de um banco conectado via Edge Function.
 */
export async function syncPluggyItem(itemId: string): Promise<PluggySyncResponse | null> {
  const { data, error } = await supabase.functions.invoke<PluggySyncResponse>('pluggy-sync', {
    body: { itemId },
  });

  if (error) {
    throw new Error(error.message || 'Erro ao sincronizar extrato bancário');
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data;
}

/**
 * Desconecta e remove uma instituição bancária vinculada,
 * revogando o consentimento na API da Pluggy via Edge Function pluggy-disconnect.
 */
export async function deletePluggyItem(itemId: string): Promise<boolean> {
  const { data, error } = await supabase.functions.invoke<{ success?: boolean; error?: string }>('pluggy-disconnect', {
    body: { itemId },
  });

  if (error) {
    // Fallback gracioso: se a Edge Function falhar temporariamente por rede, tenta exclusão local
    console.warn('[Pluggy] Fallback na exclusão direta após erro na Edge Function:', error);
    const { error: directError } = await supabase
      .from('pluggy_items')
      .delete()
      .eq('item_id', itemId);

    if (directError) throw new Error(directError.message || error.message);
    return true;
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return true;
}
