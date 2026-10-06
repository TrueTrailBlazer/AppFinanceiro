-- Migração para Armazenamento Estrito em Centavos (Inteiros)
-- Executar no SQL Editor do Supabase se houver dados legados gravados em reais (decimais/float)

BEGIN;

-- 1. Converte registros legados que estejam em decimais para centavos inteiros
UPDATE transactions
SET amount = ROUND(amount * 100)
WHERE amount % 1 != 0;

-- 2. Altera a coluna para BIGINT para garantir precisão e evitar ponto flutuante
ALTER TABLE transactions 
  ALTER COLUMN amount TYPE BIGINT 
  USING ROUND(amount);

COMMIT;
