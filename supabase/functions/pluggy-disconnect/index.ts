import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

    // Cliente autenticado com a sessão do usuário
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
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

    // Cliente com credenciais de serviço para auditoria e deleção
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Defesa anti-IDOR: verificar se o item pertence de fato ao usuário chamador
    const { data: existingItem, error: findError } = await supabaseClient
      .from('pluggy_items')
      .select('id, user_id, item_id')
      .eq('item_id', itemId)
      .maybeSingle();

    if (findError) {
      return new Response(JSON.stringify({ error: 'Erro ao consultar instituição bancária' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!existingItem) {
      return new Response(JSON.stringify({ error: 'Instituição não encontrada' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (existingItem.user_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Acesso negado: o item pertence a outro usuário' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Revogação de consentimento nos servidores da Pluggy API
    const clientId = Deno.env.get('PLUGGY_CLIENT_ID');
    const clientSecret = Deno.env.get('PLUGGY_CLIENT_SECRET');

    if (clientId && clientSecret) {
      try {
        const authRes = await fetch('https://api.pluggy.ai/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientId, clientSecret }),
        });

        if (authRes.ok) {
          const { apiKey } = await authRes.json();
          const deleteRes = await fetch(`https://api.pluggy.ai/items/${itemId}`, {
            method: 'DELETE',
            headers: { 'X-API-KEY': apiKey },
          });

          // Se status for 200, 204 ou 404 (já deletado/inexistente na Pluggy), prossegue
          if (!deleteRes.ok && deleteRes.status !== 404) {
            const errBody = await deleteRes.text();
            console.warn(`[Pluggy Disconnect] Aviso ao revogar item ${itemId} na Pluggy: ${errBody}`);
          }
        } else {
          console.error('[Pluggy Disconnect] Falha ao autenticar na Pluggy para revogação');
        }
      } catch (pluggyErr) {
        console.error('[Pluggy Disconnect] Erro de rede ao comunicar com API da Pluggy:', pluggyErr);
      }
    } else {
      console.warn('[Pluggy Disconnect] PLUGGY_CLIENT_ID ou PLUGGY_CLIENT_SECRET ausente. Pulando revogação externa.');
    }

    // 3. Exclusão do registro na tabela local pluggy_items
    const { error: deleteError } = await supabaseClient
      .from('pluggy_items')
      .delete()
      .eq('item_id', itemId)
      .eq('user_id', user.id);

    if (deleteError) {
      return new Response(JSON.stringify({ error: `Erro ao remover banco do sistema: ${deleteError.message}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Instituição desconectada e consentimento bancário revogado com sucesso.',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Erro interno no servidor' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
