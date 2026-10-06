import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function mapCategory(pluggyCategory: string = '', description: string = ''): string {
  const cat = (pluggyCategory + ' ' + description).toLowerCase();
  if (cat.includes('food') || cat.includes('aliment') || cat.includes('restaurante') || cat.includes('refei') || cat.includes('ifood')) return 'food';
  if (cat.includes('transp') || cat.includes('uber') || cat.includes('99') || cat.includes('combust') || cat.includes('posto')) return 'transport';
  if (cat.includes('mercado') || cat.includes('compra') || cat.includes('shopping') || cat.includes('loja') || cat.includes('amazon')) return 'shopping';
  if (cat.includes('lazer') || cat.includes('entreten') || cat.includes('netflix') || cat.includes('spotify') || cat.includes('cinema')) return 'entertainment';
  if (cat.includes('contas') || cat.includes('servi') || cat.includes('boleto') || cat.includes('luz') || cat.includes('agua') || cat.includes('aluguel')) return 'bills';
  return 'others';
}

serve(async (req) => {
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

    // 1. Autenticação na Pluggy
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

    // 4. Para cada conta, busca as transações (últimos 90 dias se for o primeiro sync)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const fromDateIso = ninetyDaysAgo.toISOString().split('T')[0];

    for (const acc of accounts || []) {
      const txUrl = `https://api.pluggy.ai/v2/transactions?accountId=${acc.id}`;
      const txRes = await fetch(txUrl, { headers: pluggyHeaders });

      if (!txRes.ok) {
        const errText = await txRes.text();
        console.error(`[Pluggy Sync] Falha ao buscar transações da conta ${acc.id}:`, errText);
        continue;
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
              desc.includes('saldo reservado') ||
              desc.includes('dinheiro guardado')
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
              pluggy_transaction_id: tx.id,
              bank_name: itemData.connector?.name || 'Mercado Pago',
              bank_logo_url: itemData.connector?.imageUrl || null,
            };
          });

        if (transactionsToUpsert.length > 0) {
          const { error: upsertErr } = await supabaseClient
            .from('transactions')
            .upsert(transactionsToUpsert, { onConflict: 'pluggy_transaction_id', ignoreDuplicates: true });

          if (!upsertErr) {
            totalImported += transactionsToUpsert.length;

            // --- ETAPA 5: CONCILIAÇÃO INTELIGENTE ---
            // Busca contas pendentes do usuário para tentar dar baixa automática
            const { data: pendingBills } = await supabaseClient
              .from('transactions')
              .select('id, amount, created_at')
              .eq('user_id', user.id)
              .is('pluggy_transaction_id', null)
              .eq('is_paid', false)
              .neq('type', 'income');

            if (pendingBills && pendingBills.length > 0) {
              const idsToMarkAsPaid = new Set<string>();

              for (const tx of transactionsToUpsert) {
                if (tx.type === 'income') continue;

                const txDate = new Date(tx.created_at).getTime();

                // Procura uma conta pendente que bata o valor e a data (± 3 dias)
                const match = pendingBills.find((bill: any) => {
                  if (idsToMarkAsPaid.has(bill.id)) return false;
                  if (bill.amount !== tx.amount) return false;
                  
                  const billDate = new Date(bill.created_at).getTime();
                  const diffDays = Math.abs((txDate - billDate) / (1000 * 60 * 60 * 24));
                  return diffDays <= 3;
                });

                if (match) {
                  idsToMarkAsPaid.add(match.id);
                }
              }

              if (idsToMarkAsPaid.size > 0) {
                // Atualiza as contas pendentes para pagas (baixa automática)
                await supabaseClient
                  .from('transactions')
                  .update({ is_paid: true })
                  .in('id', Array.from(idsToMarkAsPaid));
              }
            }
            // ------------------------------------------
          }
        }
      }

    // 5. Atualiza registro na tabela pluggy_items
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
        last_sync_at: new Date().toISOString(),
      }, { onConflict: 'item_id' });

    return new Response(JSON.stringify({ success: true, totalTransactions: totalImported }), {
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
