
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { matchBillsToBankTransactions } from '../_shared/reconcile.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function mapCategory(pluggyCategory: string = '', description: string = ''): string {
  const cat = (pluggyCategory + ' ' + description).toLowerCase();
  if (
    cat.includes('contas') ||
    cat.includes('servi') ||
    cat.includes('boleto') ||
    cat.includes('luz') ||
    cat.includes('agua') ||
    cat.includes('aluguel') ||
    cat.includes('emprestimo') ||
    cat.includes('empréstimo') ||
    cat.includes('parcela') ||
    cat.includes('financiamento') ||
    cat.includes('tarifa') ||
    cat.includes('imposto')
  ) {
    return 'bills';
  }
  if (cat.includes('food') || cat.includes('aliment') || cat.includes('restaurante') || cat.includes('refei') || cat.includes('ifood')) return 'food';
  if (cat.includes('transp') || cat.includes('uber') || cat.includes('99') || cat.includes('combust') || cat.includes('posto')) return 'transport';
  if (cat.includes('mercado') || cat.includes('compra') || cat.includes('shopping') || cat.includes('loja') || cat.includes('amazon')) return 'shopping';
  if (cat.includes('lazer') || cat.includes('entreten') || cat.includes('netflix') || cat.includes('spotify') || cat.includes('cinema')) return 'entertainment';
  return 'others';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado: cabeçalho ausente' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY') ?? '';

    // Cliente com credenciais de serviço para inserções seguras
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Valida usuário pela sessão
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Usuário não autenticado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { itemId } = await req.json().catch(() => ({}));
    if (!itemId) {
      return new Response(JSON.stringify({ error: 'itemId é obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. Autenticação na Pluggy e prevenção estrita de IDOR
    const { data: existingItem } = await supabaseClient
      .from('pluggy_items')
      .select('user_id, last_sync_at')
      .eq('item_id', itemId)
      .maybeSingle();

    if (!existingItem || existingItem.user_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Acesso negado: item bancário não encontrado ou não pertence a você' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const clientId = Deno.env.get('PLUGGY_CLIENT_ID');
    const clientSecret = Deno.env.get('PLUGGY_CLIENT_SECRET');

    const authRes = await fetch('https://api.pluggy.ai/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, clientSecret }),
    });

    if (!authRes.ok) {
      const authErr = await authRes.text();
      return new Response(JSON.stringify({ error: 'Falha na autenticação da Pluggy', details: authErr }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { apiKey } = await authRes.json();
    const pluggyHeaders = { 'Content-Type': 'application/json', 'X-API-KEY': apiKey };

    // 2. Busca dados do item
    const itemRes = await fetch(`https://api.pluggy.ai/items/${itemId}`, { headers: pluggyHeaders });
    let itemData: any = {};
    if (itemRes.ok) {
      itemData = await itemRes.json();
    }

    // 3. Busca contas associadas ao item
    const accountsRes = await fetch(`https://api.pluggy.ai/accounts?itemId=${itemId}`, { headers: pluggyHeaders });
    if (!accountsRes.ok) {
      const accErr = await accountsRes.text();
      return new Response(JSON.stringify({ error: 'Falha ao buscar contas', details: accErr }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { results: accounts } = await accountsRes.json();
    let totalImported = 0;
    let totalReconciled = 0;
    const failedAccountIds = new Set<string>();

    // 4. Determina período de sincronização:
    // Se o item já tiver sido sincronizado anteriormente, busca a partir de last_sync_at - 3 dias (margem de compensação)
    // Se for o primeiro sync do item, busca os últimos 90 dias
    let fromDate: Date;
    if (existingItem?.last_sync_at) {
      fromDate = new Date(existingItem.last_sync_at);
      fromDate.setDate(fromDate.getDate() - 3);
    } else {
      fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - 90);
    }
    const fromDateIso = fromDate.toISOString().split('T')[0];

    for (const acc of accounts || []) {
      let nextCursor: string | null = null;
      let pageCount = 0;
      const MAX_PAGES = 5;

      do {
        let txUrl = `https://api.pluggy.ai/v2/transactions?accountId=${acc.id}&dateFrom=${fromDateIso}`;
        if (nextCursor) {
          txUrl += nextCursor.startsWith('?') || nextCursor.startsWith('&') ? nextCursor : `&${nextCursor}`;
        }
        const txRes = await fetch(txUrl, { headers: pluggyHeaders });

        if (!txRes.ok) {
          const errText = await txRes.text();
          console.error(`[Pluggy Sync] Falha ao buscar transações da conta ${acc.id}:`, errText);
          failedAccountIds.add(acc.id);
          break;
        }

        const txData = await txRes.json();
        const rawTransactions = txData.results || [];

        const transactionsToUpsert = rawTransactions
          .filter((tx: any) => {
            const desc = (tx.description || tx.descriptionRaw || '').toLowerCase();
            const opType = (tx.operationType || '').toLowerCase();
            if (
              opType.includes('saldo_reservado') ||
              desc.includes('dinheiro retirado') ||
              desc.includes('dinheiro reservado') ||
              desc.includes('saldo reservado') ||
              desc.includes('dinheiro guardado') ||
              desc.includes('reserva programada') ||
              desc.includes('cofrinho')
            ) {
              return false;
            }
            return true;
          })
          .map((tx: any) => {
            const rawAmount = typeof tx.amount === 'number' ? tx.amount : parseFloat(tx.amount || '0');
            const isIncome = tx.type === 'CREDIT' || (tx.type !== 'DEBIT' && rawAmount > 0);
            const amountCents = Math.round(Math.abs(rawAmount) * 100);

            return {
              user_id: user.id,
              name: tx.description || tx.descriptionRaw || 'Transação Bancária',
              amount: amountCents, // Inteiro estrito em centavos
              type: isIncome ? 'income' : 'variable',
              category: mapCategory(tx.category, tx.description),
              is_paid: true,
              created_at: tx.date || new Date().toISOString(),
              due_date: tx.date || new Date().toISOString(),
              pluggy_transaction_id: tx.id,
              bank_name: itemData.connector?.name || 'Banco Conectado',
              bank_logo_url: itemData.connector?.imageUrl || null,
            };
          });

        if (transactionsToUpsert.length > 0) {
          const { error: upsertErr, data: insertedData } = await supabaseClient
            .from('transactions')
            .upsert(transactionsToUpsert, { onConflict: 'pluggy_transaction_id', ignoreDuplicates: true })
            .select();

          if (upsertErr) {
            console.error(`[Pluggy Sync] Falha ao gravar transações da conta ${acc.id}:`, upsertErr.message);
            failedAccountIds.add(acc.id);
          } else {
            const newlyInserted = insertedData || [];
            totalImported += newlyInserted.length;

            // --- CONCILIAÇÃO INTELIGENTE (somente com transações recém-importadas) ---
            if (newlyInserted.length > 0) {
              const { data: pendingBills } = await supabaseClient
                .from('transactions')
                .select('id, name, amount, created_at, due_date')
                .eq('user_id', user.id)
                .is('pluggy_transaction_id', null)
                .eq('is_paid', false)
                .neq('type', 'income');

              if (pendingBills && pendingBills.length > 0) {
                const idsToMarkAsPaid = matchBillsToBankTransactions(newlyInserted, pendingBills);
                if (idsToMarkAsPaid.length > 0) {
                  const { error: payErr } = await supabaseClient
                    .from('transactions')
                    .update({ is_paid: true })
                    .eq('user_id', user.id)
                    .in('id', idsToMarkAsPaid);
                  if (!payErr) totalReconciled += idsToMarkAsPaid.length;
                }
              }
            }
            // ------------------------------------------------------------------------
          }
        }

        nextCursor = txData.next || null;
        pageCount++;
      } while (nextCursor && pageCount < MAX_PAGES);
    }

    const totalAccounts = (accounts || []).length;

    // Todas as contas falharam: não reportar sucesso
    if (totalAccounts > 0 && failedAccountIds.size === totalAccounts) {
      return new Response(JSON.stringify({ error: 'Não foi possível buscar as transações no banco agora. Tente novamente em instantes.' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const isPartial = failedAccountIds.size > 0;

    // 5. Atualiza registro na tabela pluggy_items (só marca "última sincronização" se tudo deu certo)
    await supabaseClient
      .from('pluggy_items')
      .upsert({
        user_id: user.id,
        item_id: itemId,
        connector_id: itemData.connector?.id || null,
        connector_name: itemData.connector?.name || null,
        connector_image_url: itemData.connector?.imageUrl || null,
        status: itemData.status || 'UPDATED',
        execution_status: itemData.executionStatus || 'SUCCESS',
        ...(isPartial ? {} : { last_sync_at: new Date().toISOString() }),
      }, { onConflict: 'item_id' });

    return new Response(JSON.stringify({
      success: true,
      partial: isPartial,
      failedAccounts: failedAccountIds.size,
      totalAccounts,
      totalTransactions: totalImported,
      reconciledBills: totalReconciled,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Erro interno na sincronização' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
