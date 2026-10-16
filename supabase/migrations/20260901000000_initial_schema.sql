-- ==============================================================================
-- Migração Base Inicial Consolidada: AppFinanceiro
-- Criação de tabelas essenciais, índices, RLS e provisionamento do Supabase Storage
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. TABELA DE TRANSAÇÕES FINANCEIRAS (transactions)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.transactions (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    amount BIGINT NOT NULL, -- Valores estritos em centavos (ex: R$ 50,00 = 5000)
    type TEXT NOT NULL DEFAULT 'variable', -- 'income', 'fixed', 'variable'
    category TEXT NULL DEFAULT 'others',
    is_paid BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    installment_group_id UUID NULL,
    pluggy_transaction_id TEXT NULL,
    bank_name TEXT NULL,
    bank_logo_url TEXT NULL,
    receipt_url TEXT NULL,
    notes TEXT NULL
);

-- Constraint única para idempotência de transações do Open Finance
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_transactions_pluggy_id'
    ) THEN
        ALTER TABLE public.transactions
            ADD CONSTRAINT uq_transactions_pluggy_id UNIQUE (pluggy_transaction_id);
    END IF;
END $$;

-- Índices de consulta de alto rendimento para transactions
CREATE INDEX IF NOT EXISTS idx_transactions_user_created 
    ON public.transactions(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_installment_group 
    ON public.transactions(installment_group_id) 
    WHERE installment_group_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_pluggy_id 
    ON public.transactions(pluggy_transaction_id) 
    WHERE pluggy_transaction_id IS NOT NULL;

-- ------------------------------------------------------------------------------
-- 2. TABELA DE CONTAS E DESPESAS RECORRENTES (recurring_expenses)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.recurring_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    amount BIGINT NOT NULL, -- Centavos
    category TEXT NOT NULL DEFAULT 'bills',
    day INT NULL CHECK (day >= 1 AND day <= 31),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recurring_expenses_user 
    ON public.recurring_expenses(user_id);

-- ------------------------------------------------------------------------------
-- 3. TABELA DE METAS FINANCEIRAS (financial_goals)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.financial_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    target_amount BIGINT NOT NULL, -- Centavos
    current_amount BIGINT NOT NULL DEFAULT 0, -- Centavos
    deadline DATE NULL,
    category TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_financial_goals_user 
    ON public.financial_goals(user_id);

-- ------------------------------------------------------------------------------
-- 4. TABELA DE CONEXÕES BANCÁRIAS OPEN FINANCE (pluggy_items)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pluggy_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    item_id TEXT NOT NULL UNIQUE,
    connector_id INT NULL,
    connector_name TEXT NULL,
    connector_image_url TEXT NULL,
    status TEXT DEFAULT 'UPDATING',
    execution_status TEXT NULL,
    last_sync_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pluggy_items_user 
    ON public.pluggy_items(user_id);

-- ------------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS) EM TODAS AS TABELAS
-- ------------------------------------------------------------------------------
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pluggy_items ENABLE ROW LEVEL SECURITY;

-- Políticas para transactions
DROP POLICY IF EXISTS "Usuários gerenciam suas próprias transações" ON public.transactions;
CREATE POLICY "Usuários gerenciam suas próprias transações"
    ON public.transactions
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Políticas para recurring_expenses
DROP POLICY IF EXISTS "Usuários gerenciam suas despesas recorrentes" ON public.recurring_expenses;
CREATE POLICY "Usuários gerenciam suas despesas recorrentes"
    ON public.recurring_expenses
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Políticas para financial_goals
DROP POLICY IF EXISTS "Usuários gerenciam suas metas financeiras" ON public.financial_goals;
CREATE POLICY "Usuários gerenciam suas metas financeiras"
    ON public.financial_goals
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Políticas para pluggy_items
DROP POLICY IF EXISTS "Usuários gerenciam seus items da Pluggy" ON public.pluggy_items;
CREATE POLICY "Usuários gerenciam seus items da Pluggy"
    ON public.pluggy_items
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 6. PROVISIONAMENTO DE BUCKETS DO SUPABASE STORAGE
-- ------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public) 
VALUES ('receipts', 'receipts', false) 
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true) 
ON CONFLICT (id) DO NOTHING;

-- Políticas de Storage para Comprovantes (receipts - bucket privado)
DROP POLICY IF EXISTS "Usuários visualizam seus próprios comprovantes" ON storage.objects;
CREATE POLICY "Usuários visualizam seus próprios comprovantes"
    ON storage.objects FOR SELECT TO authenticated
    USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Usuários enviam seus próprios comprovantes" ON storage.objects;
CREATE POLICY "Usuários enviam seus próprios comprovantes"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Usuários atualizam seus próprios comprovantes" ON storage.objects;
CREATE POLICY "Usuários atualizam seus próprios comprovantes"
    ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Usuários removem seus próprios comprovantes" ON storage.objects;
CREATE POLICY "Usuários removem seus próprios comprovantes"
    ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Políticas de Storage para Fotos de Perfil (avatars - leitura pública, escrita do dono)
DROP POLICY IF EXISTS "Leitura pública de avatares" ON storage.objects;
CREATE POLICY "Leitura pública de avatares"
    ON storage.objects FOR SELECT TO public
    USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Usuários enviam sua foto de perfil" ON storage.objects;
CREATE POLICY "Usuários enviam sua foto de perfil"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Usuários atualizam sua foto de perfil" ON storage.objects;
CREATE POLICY "Usuários atualizam sua foto de perfil"
    ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Usuários removem sua foto de perfil" ON storage.objects;
CREATE POLICY "Usuários removem sua foto de perfil"
    ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

COMMIT;
