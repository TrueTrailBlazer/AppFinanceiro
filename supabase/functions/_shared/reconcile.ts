/**
 * Conciliação inteligente: dá baixa automática em contas a pagar quando uma transação
 * bancária NOVA corresponde a elas. Módulo puro (sem dependências de Deno) para poder ser testado.
 *
 * Regras de segurança contra baixa indevida:
 *  - Só considera transações bancárias recém-importadas (nunca as antigas).
 *  - Valor exato (±1 centavo) ou, se o nome for parecido, até ±R$ 0,50 (juros/arredondamento).
 *  - Data do banco até 4 dias de distância do vencimento.
 *  - Se houver mais de uma conta candidata e nenhuma com nome parecido, é ambíguo: NÃO baixa.
 */

export interface BankTxLike {
  name: string;
  amount: number; // centavos
  type: string;
  created_at: string;
}

export interface PendingBillLike {
  id: string | number;
  name: string | null;
  amount: number; // centavos
  created_at: string;
  due_date: string | null;
}

export const EXACT_TOLERANCE_CENTS = 1;
export const NAME_MATCH_TOLERANCE_CENTS = 50;
export const MAX_DAYS_DISTANCE = 4;

const STOPWORDS = new Set([
  'pagamento', 'pix', 'transferencia', 'enviado', 'enviada', 'recebido', 'recebida',
  'fatura', 'conta', 'compra', 'debito', 'credito', 'parcela', 'cartao', 'com', 'para', 'ltda',
]);

function normalize(text: string): string {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function significantTokens(text: string): string[] {
  return normalize(text)
    .split(' ')
    .filter(t => t.length >= 4 && !STOPWORDS.has(t));
}

export function namesSimilar(a: string | null, b: string | null): boolean {
  if (!a || !b) return false;
  const tokensB = new Set(significantTokens(b));
  return significantTokens(a).some(t => tokensB.has(t));
}

function daysBetween(a: string, b: string): number {
  return Math.abs((new Date(a).getTime() - new Date(b).getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Retorna os IDs das contas pendentes que devem ser marcadas como pagas.
 */
export function matchBillsToBankTransactions(
  newBankTxs: BankTxLike[],
  pendingBills: PendingBillLike[]
): (string | number)[] {
  const used = new Set<string | number>();
  const ordered = [...newBankTxs]
    .filter(t => t.type !== 'income')
    .sort((x, y) => new Date(x.created_at).getTime() - new Date(y.created_at).getTime());

  for (const tx of ordered) {
    const candidates = pendingBills.filter(bill => {
      if (used.has(bill.id)) return false;
      const amountDiff = Math.abs(bill.amount - tx.amount);
      if (amountDiff > NAME_MATCH_TOLERANCE_CENTS) return false;
      if (amountDiff > EXACT_TOLERANCE_CENTS && !namesSimilar(bill.name, tx.name)) return false;
      return daysBetween(tx.created_at, bill.due_date || bill.created_at) <= MAX_DAYS_DISTANCE;
    });

    if (candidates.length === 0) continue;

    const byName = candidates.filter(b => namesSimilar(b.name, tx.name));
    const pool = byName.length > 0 ? byName : candidates;

    // Ambíguo: várias candidatas e nenhuma se destaca pelo nome -> não arrisca
    if (byName.length === 0 && pool.length > 1) continue;

    pool.sort((x, y) => {
      const dx = Math.abs(x.amount - tx.amount);
      const dy = Math.abs(y.amount - tx.amount);
      if (dx !== dy) return dx - dy;
      return daysBetween(tx.created_at, x.due_date || x.created_at) -
             daysBetween(tx.created_at, y.due_date || y.created_at);
    });

    used.add(pool[0].id);
  }

  return Array.from(used);
}
