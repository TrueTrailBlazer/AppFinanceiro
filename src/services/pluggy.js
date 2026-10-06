import { supabase } from './supabase';

/**
 * Solicita à Edge Function do Supabase um Connect Token seguro da Pluggy.
 */
export async function fetchConnectToken(itemId = null) {
  const { data, error } = await supabase.functions.invoke('pluggy-connect-token', {
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
export async function fetchUserPluggyItems(userId) {
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
export async function savePluggyItem(userId, item) {
  const itemPayload = {
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
export async function syncPluggyItem(itemId) {
  const { data, error } = await supabase.functions.invoke('pluggy-sync', {
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
 * Desconecta e remove uma instituição bancária vinculada.
 */
export async function deletePluggyItem(itemId) {
  const { error } = await supabase
    .from('pluggy_items')
    .delete()
    .eq('item_id', itemId);

  if (error) throw error;
  return true;
}
