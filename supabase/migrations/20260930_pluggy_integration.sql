-- ==============================================================================
-- Migração Fase 4: Suporte à Integração Bancária Open Finance (Pluggy)
-- Executar no SQL Editor do Supabase
-- ==============================================================================

BEGIN;

-- 1. Idempotência de transações importadas da Pluggy (evita duplicação)
ALTER TABLE transactions 
  ADD COLUMN IF NOT EXISTS pluggy_transaction_id TEXT NULL;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_transactions_pluggy_id'
  ) THEN
    ALTER TABLE transactions 
      ADD CONSTRAINT uq_transactions_pluggy_id UNIQUE (pluggy_transaction_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_transactions_pluggy_id 
  ON transactions(pluggy_transaction_id);

-- 2. Tabela de conexões bancárias do usuário (Items da Pluggy)
CREATE TABLE IF NOT EXISTS pluggy_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL UNIQUE,
  connector_id INT NULL,
  connector_name TEXT NULL,
  connector_image_url TEXT NULL,
  status TEXT DEFAULT 'UPDATING',
  execution_status TEXT NULL,
  last_sync_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Habilita RLS (Row Level Security) na tabela de conexões
ALTER TABLE pluggy_items ENABLE ROW LEVEL SECURITY;

-- Remove políticas antigas se existirem para evitar conflitos
DROP POLICY IF EXISTS "Usuários gerenciam seus próprios items da Pluggy" ON pluggy_items;

CREATE POLICY "Usuários gerenciam seus próprios items da Pluggy"
  ON pluggy_items
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_pluggy_items_user_id 
  ON pluggy_items(user_id);

COMMIT;
