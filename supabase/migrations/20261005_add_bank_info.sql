-- Adiciona colunas para identificar o banco/instituição financeira de cada transação bancária
ALTER TABLE transactions 
  ADD COLUMN IF NOT EXISTS bank_name TEXT NULL,
  ADD COLUMN IF NOT EXISTS bank_logo_url TEXT NULL;

-- Atualiza todas as transações importadas existentes com 'Mercado Pago'
UPDATE transactions 
SET bank_name = 'Mercado Pago'
WHERE (pluggy_transaction_id IS NOT NULL OR id LIKE 'consolidated-yield%') AND bank_name IS NULL;
