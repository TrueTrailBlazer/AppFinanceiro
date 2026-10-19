-- Migration: Adição da coluna due_date na tabela transactions
-- Permite desacoplar o mês contábil orçado (created_at) do prazo fatal de pagamento (due_date)

ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ NULL;

-- Índice para acelerar filtros e ordenação por data de vencimento
CREATE INDEX IF NOT EXISTS idx_transactions_due_date
ON public.transactions(due_date);

-- Comentário explicativo na coluna
COMMENT ON COLUMN public.transactions.due_date IS 'Data limite de vencimento da fatura ou boleto, independente do mês de competência orçamentário (created_at).';
