import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { matchBillsToBankTransactions } from '../_shared/reconcile.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
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
    const webhookSecret = Deno.env.get('PLUGGY_WEBHOOK_SECRET');
    const headerSecret = req.headers.get('x-webhook-secret');
    if (!webhookSecret || !headerSecret || headerSecret !== webhookSecret) {
      console.error('[Pluggy Webhook] Acesso não autorizado: Header x-webhook-secret inválido ou segredo do webhook não configurado no servidor.');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload = await req.json().catch(() => null);
    if (!payload || !payload.itemId) {
      return new Response(JSON.stringify({ message: 'Evento ignorado: payload sem itemId' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { event, itemId } = payload;
    console.log(`[Pluggy Webhook] Evento: ${event} para Item: ${itemId}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Localiza a qual usuário esse item pertence
    const { data: itemRecord, error: itemErr } = await supabaseClient
      .from('pluggy_items')
      .select('user_id')
      .eq('item_id', itemId)
      .single();

    if (itemErr || !itemRecord) {
      console.warn(`[Pluggy Webhook] Item ${itemId} não encontrado no banco local.`);
      return new Response(JSON.stringify({ message: 'Item não registrado localmente' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = itemRecord.user_id;

    // 2. Autentica na Pluggy
    const clientId = Deno.env.get('PLUGGY_CLIENT_ID');
    const clientSecret = Deno.env.get('PLUGGY_CLIENT_SECRET');

    const authRes = await fetch('https://api.pluggy.ai/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, clientSecret }),
    });

    if (!authRes.ok) {
      console.error('[Pluggy Webhook] Erro ao autenticar na Pluggy');
      return new Response(JSON.stringify({ error: 'Erro auth Pluggy' }), { status: 500 });
    }

    const { apiKey } = await authRes.json();
    const pluggyHeaders = { 'Content-Type': 'application/json', 'X-API-KEY': apiKey };

    // 3. Atualiza status do item
    const itemRes = await fetch(`https://api.pluggy.ai/items/${itemId}`, { headers: pluggyHeaders });
    let itemData: any = {};
    if (itemRes.ok) {
      itemData = await itemRes.json();
      await supabaseClient
        .from('pluggy_items')
        .update({
          status: itemData.status,
          execution_status: itemData.executionStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('item_id', itemId);
    }

    // 4. Se houver novas transações ou item atualizado com sucesso, sincroniza transações
    const accountsRes = await fetch(`https://api.pluggy.ai/accounts?itemId=${itemId}`, { headers: pluggyHeaders });
    if (accountsRes.ok) {
      const { results: accounts } = await accountsRes.json();

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const fromDateIso = thirtyDaysAgo.toISOString().split('T')[0];

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
            console.error(`[Pluggy Webhook] Falha ao buscar transações da conta ${acc.id}:`, errText);
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
                user_id: userId,
                name: tx.description || tx.descriptionRaw || 'Transação Bancária',
                amount: amountCents,
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
            const { data: insertedData, error: upsertErr } = await supabaseClient
              .from('transactions')
              .upsert(transactionsToUpsert, { onConflict: 'pluggy_transaction_id', ignoreDuplicates: true })
              .select();

            if (!upsertErr && insertedData && insertedData.length > 0) {
              const { data: pendingBills } = await supabaseClient
                .from('transactions')
                .select('id, name, amount, created_at, due_date')
                .eq('user_id', userId)
                .is('pluggy_transaction_id', null)
                .eq('is_paid', false)
                .neq('type', 'income');

              if (pendingBills && pendingBills.length > 0) {
                const idsToMarkAsPaid = matchBillsToBankTransactions(insertedData, pendingBills);
                if (idsToMarkAsPaid.length > 0) {
                  await supabaseClient
                    .from('transactions')
                    .update({ is_paid: true })
                    .eq('user_id', userId)
                    .in('id', idsToMarkAsPaid);
                }
              }
            }
          }

          nextCursor = txData.next || null;
          pageCount++;
        } while (nextCursor && pageCount < MAX_PAGES);
      }

      await supabaseClient
        .from('pluggy_items')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('item_id', itemId);
    }

    return new Response(JSON.stringify({ success: true, processed: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err: any) {
    console.error('[Pluggy Webhook] Exceção:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
