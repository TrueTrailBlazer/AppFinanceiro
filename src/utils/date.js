/**
 * Utilitários de manipulação estrita de datas no fuso horário local.
 * Elimina os bugs de fuso horário UTC (toISOString) e transbordamento de mês (setMonth).
 */

/**
 * Retorna uma string no formato 'YYYY-MM-DD' baseada no fuso horário local.
 */
export function getLocalDateString(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Converte estritamente uma string 'YYYY-MM-DD' em um objeto Date no fuso horário local,
 * preservando as horas, minutos e segundos da data de referência.
 */
export function parseLocalDate(dateString, referenceTime = new Date()) {
  if (!dateString) return new Date();
  const parts = String(dateString).split('-').map(Number);
  if (parts.length < 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
    return new Date();
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
export function addMonthsPreservingDay(baseDate, monthsToAdd) {
  const d = baseDate instanceof Date ? new Date(baseDate.getTime()) : new Date();
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
export function formatLocalDate(dateOrString, options = { day: '2-digit', month: 'short' }) {
  if (!dateOrString) return '';
  const d = dateOrString instanceof Date ? dateOrString : new Date(dateOrString);
  return d.toLocaleDateString('pt-BR', options);
}
