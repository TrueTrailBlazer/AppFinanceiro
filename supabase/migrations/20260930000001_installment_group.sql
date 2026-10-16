-- Migração: Criação de coluna relacional para grupos de parcelas
-- Executar no SQL Editor do Supabase

BEGIN;

ALTER TABLE transactions 
  ADD COLUMN IF NOT EXISTS installment_group_id UUID NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_installment_group 
  ON transactions(installment_group_id);

COMMIT;
