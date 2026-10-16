import type { InstallmentInfo } from '../types/models';

/**
 * Extrai o nome base, parcela atual e total de parcelas a partir do título da transação.
 * Ex: "Notebook Dell (2/10)" -> { baseName: "Notebook Dell", current: 2, total: 10 }
 */
export function getInstallmentInfo(txName?: string | null): InstallmentInfo | null {
  if (!txName) return null;
  const match = txName.match(/^(.*?) \((\d+)\/(\d+)\)$/);
  if (match) {
    const current = parseInt(match[2], 10);
    const total = parseInt(match[3], 10);
    if (!isNaN(current) && !isNaN(total)) {
      return { baseName: match[1], current, total };
    }
  }
  return null;
}
