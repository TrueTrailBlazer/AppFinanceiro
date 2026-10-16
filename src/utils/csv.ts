import { parseCents } from './money';
import { addMonthsSafe } from './date';
import { generateUUID } from '../services/transactions';
import type { CSVColumnMapping, CSVPreviewTransaction } from '../types/models';

export function normalizeCSVHeader(str?: string): string {
  if (!str) return '';
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

export function guessCSVMapping(allHeaders: string[]): CSVColumnMapping {
  const keys: CSVColumnMapping = { date: '', name: '', amount: '' };
  allHeaders.forEach(h => {
    const n = normalizeCSVHeader(h);
    if (n.includes('data') || n.includes('date') || n.includes('quando') || n.includes('lancto')) keys.date = h;
    if (
      n.includes('descri') ||
      n.includes('descr') ||
      n.includes('historico') ||
      n.includes('lancamento') ||
      n.includes('titulo') ||
      n.includes('title') ||
      n.includes('nome') ||
      n.includes('identificador')
    ) {
      if (!keys.name || !n.includes('identificador')) keys.name = h;
    }
    if (
      n.includes('valor') ||
      n.includes('amount') ||
      n.includes('montante') ||
      n.includes('quantia') ||
      n.includes('total')
    ) {
      keys.amount = h;
    }
  });
  return keys;
}

export function detectCSVInstallments(name: string): { current: number; total: number } | null {
  const regex = /(?:\(|\[|parcela\s+)(\d+)\s*(?:\/|de)\s*(\d+)(?:\)|\]|\b)/i;
  const match = name.match(regex);
  if (match) {
    const current = parseInt(match[1], 10);
    const total = parseInt(match[2], 10);
    if (current > 0 && total >= current && total < 100) {
      return { current, total };
    }
  }
  return null;
}

export function parseDateBR(dateString?: string): Date {
  if (!dateString) return new Date();
  const trimmed = dateString.trim();

  // Se for formato ISO YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    const parts = trimmed.split('T')[0].split(' ')[0].split('-').map(Number);
    if (parts.length >= 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      return new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
    }
  }

  const parts = trimmed.split(/[/\-.]/);
  if (parts.length >= 2) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    let year = parts[2] ? parseInt(parts[2], 10) : new Date().getFullYear();
    if (year < 100) {
      year += 2000;
    }
    const constructed = new Date(year, month, day, 12, 0, 0);
    if (!isNaN(constructed.getTime())) return constructed;
  }
  return new Date();
}

export function parseCSVAmount(rawStr: string): { amountCents: number; isNegative: boolean } {
  let rawAmount = String(rawStr || '0').replace('R$', '').replace(/\s/g, '').replace(/[\u00a0\u2000-\u200b]/g, '');
  let isNegative = false;
  if ((rawAmount.startsWith('(') && rawAmount.endsWith(')')) || (rawAmount.startsWith('[') && rawAmount.endsWith(']'))) {
    isNegative = true;
    rawAmount = rawAmount.slice(1, -1);
  } else if (rawAmount.endsWith('-')) {
    isNegative = true;
    rawAmount = rawAmount.slice(0, -1);
  } else if (rawAmount.startsWith('-')) {
    isNegative = true;
  }

  if (rawAmount.includes(',') && rawAmount.includes('.')) {
    rawAmount = rawAmount.replace(/\./g, '').replace(',', '.');
  } else if (rawAmount.includes(',')) {
    rawAmount = rawAmount.replace(',', '.');
  }

  const amountCents = Math.abs(parseCents(rawAmount));
  return { amountCents, isNegative };
}

export function categorizeCSVDescription(rawName: string, isNegative: boolean): string {
  const desc = rawName.toLowerCase();
  if (desc.includes('food') || desc.includes('restaurante') || desc.includes('ifood')) return 'food';
  if (desc.includes('uber') || desc.includes('posto') || desc.includes('combustivel')) return 'transport';
  if (desc.includes('amazon') || desc.includes('mercado') || desc.includes('compras')) return 'shopping';
  if (desc.includes('netflix') || desc.includes('spotify') || desc.includes('lazer')) return 'entertainment';
  if (desc.includes('pix') && !isNegative) return 'extra';
  return 'others';
}

export function transformCSVRowToTransactions(
  row: Record<string, string>,
  mapping: CSVColumnMapping
): CSVPreviewTransaction[] {
  const rawName = String(row[mapping.name] || 'Sem Nome');
  const { amountCents, isNegative } = parseCSVAmount(row[mapping.amount] || '0');
  const type = isNegative ? 'variable' : 'income';
  const baseDate = parseDateBR(row[mapping.date]);
  const category = categorizeCSVDescription(rawName, isNegative);

  const inst = detectCSVInstallments(rawName);
  if (inst && type !== 'income') {
    const baseName = rawName.replace(/(?:\(|\[|parcela\s+)?\d+\s*(?:\/|de)\s*\d+(?:\)|\])?/i, '').trim();
    const installmentGroupId = generateUUID();
    const result: CSVPreviewTransaction[] = [];
    for (let i = 1; i <= inst.total; i++) {
      const transactionDate = addMonthsSafe(baseDate, i - inst.current);
      result.push({
        name: `${baseName} (${i}/${inst.total})`,
        amount: amountCents,
        type,
        category,
        is_paid: i <= inst.current,
        created_at: transactionDate.toISOString(),
        installment_group_id: installmentGroupId
      });
    }
    return result;
  }

  return [
    {
      name: rawName,
      amount: amountCents,
      type,
      category,
      is_paid: true,
      created_at: baseDate.toISOString()
    }
  ];
}
