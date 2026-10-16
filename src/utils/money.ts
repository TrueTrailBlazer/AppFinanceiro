/**
 * Utilitários de manipulação estrita de moeda e centavos.
 * Elimina os bugs de precisão IEEE 754 de pontos flutuantes do JavaScript.
 */

/**
 * Trata conversão de strings numéricas com potenciais separadores decimais.
 * Se a string contiver separadores decimais (. ou ,), trata como valor em reais e converte para centavos.
 */
function parseStringAmount(str: string | number): number {
  const trimmed = String(str).trim();
  if (!trimmed) return 0;

  // Se contiver separadores decimais explícitos (. ou ,)
  if (/[.,]/.test(trimmed)) {
    let clean = trimmed.replace(/[^\d.,-]/g, '');
    const isNegative = clean.startsWith('-');
    clean = clean.replace(/-/g, '');

    const lastDot = clean.lastIndexOf('.');
    const lastComma = clean.lastIndexOf(',');

    if (lastDot !== -1 && lastComma !== -1) {
      if (lastComma > lastDot) {
        // Formato BR: 1.250,50 -> remove milhares e troca decimal
        clean = clean.replace(/\./g, '').replace(',', '.');
      } else {
        // Formato US: 1,250.50 -> remove milhares
        clean = clean.replace(/,/g, '');
      }
    } else if (lastComma !== -1) {
      // Ex: 50,00 -> 50.00
      clean = clean.replace(',', '.');
    }

    const num = parseFloat(clean);
    if (isNaN(num)) return 0;
    const cents = Math.round(num * 100);
    return isNegative ? -cents : cents;
  }

  // String apenas com dígitos inteiros (ex: "5000")
  // Entende-se que a UI/usuário digita em Reais, então "5000" = R$ 5000,00 = 500000 centavos
  const num = Number(trimmed.replace(/[^\d-]/g, ''));
  if (isNaN(num)) return 0;
  return num * 100;
}

/**
 * Converte qualquer representação para centavos (número inteiro).
 * Suporta inteiros de centavos, floats decimais ou strings.
 */
export function toCents(val?: number | string | null): number {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') {
    return Number.isInteger(val) ? val : Math.round(val * 100);
  }
  if (typeof val === 'string') {
    return parseStringAmount(val);
  }
  const num = Number(val);
  if (isNaN(num)) return 0;
  return Number.isInteger(num) ? num : Math.round(num * 100);
}

/**
 * Converte estritamente centavos inteiros para float decimal (ex: 15050 -> 150.50).
 */
export function fromCents(cents?: number | string | null): number {
  const c = typeof cents === 'number' ? cents : toCents(cents);
  return c / 100;
}

/**
 * Normaliza valores do banco de dados (que podem ser decimais legados ou inteiros de centavos).
 * Se o valor tiver casas decimais (ex: 150.50 ou "150.50"), converte para centavos (15050).
 * Se já for inteiro, preserva como centavos.
 */
export function parseCents(amount?: number | string | null): number {
  if (amount === null || amount === undefined || amount === '') return 0;
  if (typeof amount === 'string') {
    return parseStringAmount(amount);
  }
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
export function formatCents(cents?: number | string | null, includeSymbol: boolean = true): string {
  const decimal = fromCents(parseCents(cents));
  if (includeSymbol) {
    return decimal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
  return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(decimal);
}

/**
 * Formata qualquer valor (decimal ou centavos) para Real brasileiro.
 */
export function formatCurrency(amount?: number | string | null, isCents: boolean = true): string {
  const cents = isCents ? parseCents(amount) : toCents(amount);
  return formatCents(cents, true);
}

/**
 * Divide um valor total em centavos pelo número de parcelas,
 * distribuindo o resto centavo a centavo entre as primeiras parcelas.
 * Garante que: sum(parcelas) === total (sem perder ou criar centavos).
 * Ex: splitInstallments(10000, 3) -> [3334, 3333, 3333]
 */
export function splitInstallments(totalCents: number | string, count: number | string): number[] {
  const safeCount = Math.max(1, parseInt(String(count), 10) || 1);
  const safeTotal = Math.round(toCents(totalCents));
  
  const basePiece = Math.floor(safeTotal / safeCount);
  const remainder = safeTotal - (basePiece * safeCount);
  
  const pieces: number[] = [];
  for (let i = 0; i < safeCount; i++) {
    pieces.push(basePiece + (i < remainder ? 1 : 0));
  }
  return pieces;
}

/**
 * Soma valores em centavos de forma exata.
 */
export function addCents(...values: (number | string | null | undefined)[]): number {
  return values.reduce<number>((sum, v) => sum + parseCents(v), 0);
}

/**
 * Subtrai valores em centavos de forma exata.
 */
export function subtractCents(a?: number | string | null, b?: number | string | null): number {
  return parseCents(a) - parseCents(b);
}
