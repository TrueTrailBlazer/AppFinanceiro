/**
 * Utilitários de manipulação estrita de datas no fuso horário local.
 * Elimina os bugs de fuso horário UTC (toISOString) e transbordamento de mês (setMonth).
 */

function toLocalDate(dateOrString: Date | string | number): Date {
  if (dateOrString instanceof Date) {
    return dateOrString;
  }
  if (typeof dateOrString === 'string') {
    const trimmed = dateOrString.trim();
    // Se for formato de data YYYY-MM-DD (date-only)
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return parseLocalDate(trimmed);
    }
  }
  return new Date(dateOrString);
}

/**
 * Retorna uma string no formato 'YYYY-MM-DD' baseada no fuso horário local.
 */
export function getLocalDateString(date: Date | string | number = new Date()): string {
  const d = toLocalDate(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Converte estritamente uma string 'YYYY-MM-DD' em um objeto Date no fuso horário local,
 * preservando as horas, minutos e segundos da data de referência.
 */
export function parseLocalDate(dateString?: string | null, referenceTime: Date = new Date()): Date {
  if (!dateString) return new Date();
  const str = String(dateString).trim();
  const dateOnly = str.includes('T') ? str.split('T')[0] : (str.includes(' ') ? str.split(' ')[0] : str);
  const parts = dateOnly.split('-').map(Number);
  if (parts.length < 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
    const fallback = new Date(dateString);
    return isNaN(fallback.getTime()) ? new Date() : fallback;
  }
  const [year, month, day] = parts;
  const ref = referenceTime instanceof Date ? referenceTime : new Date();
  return new Date(
    year,
    month - 1,
    day,
    ref.getHours(),
    ref.getMinutes(),
    ref.getSeconds(),
    ref.getMilliseconds()
  );
}

/**
 * Adiciona N meses a uma data base preservando o dia de forma estrita.
 * Evita que dias 29, 30 e 31 transbordem para o mês seguinte (ex: 31 de janeiro virando março).
 */
export function addMonthsPreservingDay(baseDate: Date | string | number, monthsToAdd: number): Date {
  const d = toLocalDate(baseDate);
  const targetYear = d.getFullYear();
  const targetMonth = d.getMonth() + monthsToAdd;
  const originalDay = d.getDate();

  // Cria a data no 1º dia do mês alvo
  const result = new Date(targetYear, targetMonth, 1, d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds());
  // Obtém o número máximo de dias do mês de destino
  const maxDaysInTargetMonth = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
  
  result.setDate(Math.min(originalDay, maxDaysInTargetMonth));
  return result;
}

/**
 * Formata data para exibição em pt-BR padrão.
 */
export function formatLocalDate(
  dateOrString?: Date | string | number | null,
  options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short' }
): string {
  if (!dateOrString) return '';
  const d = toLocalDate(dateOrString);
  return d.toLocaleDateString('pt-BR', options);
}

export const addMonthsSafe = addMonthsPreservingDay;
