-- ==============================================================================
-- Migração: Adição da coluna 'notes' (observações) à tabela transactions
-- ==============================================================================

BEGIN;

ALTER TABLE public.transactions 
    ADD COLUMN IF NOT EXISTS notes TEXT NULL;

COMMIT;
