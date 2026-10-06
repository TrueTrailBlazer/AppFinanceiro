/**
 * Utilitários de manipulação estrita de moeda e centavos.
 * Elimina os bugs de precisão IEEE 754 de pontos flutuantes do JavaScript.
 */

/**
 * Converte qualquer representação para centavos (número inteiro).
 * Suporta inteiros de centavos, floats decimais ou strings.
 */
export function toCents(val) {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') {
    return Number.isInteger(val) ? val : Math.round(val * 100);
  }
  const cleanStr = String(val).replace(/[^\d.-]/g, '');
  const num = parseFloat(cleanStr);
  if (isNaN(num)) return 0;
  return Number.isInteger(num) ? num : Math.round(num * 100);
}

/**
 * Converte estritamente centavos inteiros para float decimal (ex: 15050 -> 150.50).
 */
export function fromCents(cents) {
  const c = typeof cents === 'number' ? cents : toCents(cents);
  return c / 100;
}

/**
 * Normaliza valores do banco de dados (que podem ser decimais legados ou inteiros de centavos).
 * Se o valor tiver casas decimais (ex: 150.50), converte para centavos (15050).
 * Se já for inteiro, preserva como centavos.
 */
export function parseCents(amount) {
  if (amount === null || amount === undefined || amount === '') return 0;
  const num = Number(amount);
  if (isNaN(num)) return 0;
  if (!Number.isInteger(num)) {
    return Math.round(num * 100);
  }
  return num;
}

/**
 * Formata um valor em centavos diretamente para Real brasileiro (BRL).
 * Ex: 15050 -> "R$ 150,50"
 */
export function formatCents(cents, includeSymbol = true) {
  const decimal = fromCents(parseCents(cents));
  if (includeSymbol) {
    return decimal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
  return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(decimal);
}

/**
 * Formata qualquer valor (decimal ou centavos) para Real brasileiro.
 */
export function formatCurrency(amount, isCents = true) {
  const cents = isCents ? parseCents(amount) : toCents(amount);
  return formatCents(cents, true);
}

/**
 * Divide um valor total em centavos pelo número de parcelas,
 * distribuindo o resto centavo a centavo entre as primeiras parcelas.
 * Garante que: sum(parcelas) === total (sem perder ou criar centavos).
 * Ex: splitInstallments(10000, 3) -> [3334, 3333, 3333]
 */
export function splitInstallments(totalCents, count) {
  const safeCount = Math.max(1, parseInt(count, 10) || 1);
  const safeTotal = Math.round(toCents(totalCents));
  
  const basePiece = Math.floor(safeTotal / safeCount);
  const remainder = safeTotal - (basePiece * safeCount);
  
  const pieces = [];
  for (let i = 0; i < safeCount; i++) {
    pieces.push(basePiece + (i < remainder ? 1 : 0));
  }
  return pieces;
}

/**
 * Soma valores em centavos de forma exata.
 */
export function addCents(...values) {
  return values.reduce((sum, v) => sum + parseCents(v), 0);
}

/**
 * Subtrai valores em centavos de forma exata.
 */
export function subtractCents(a, b) {
  return parseCents(a) - parseCents(b);
}
