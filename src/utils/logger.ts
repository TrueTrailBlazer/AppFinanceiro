/**
 * Utilitário de logging condicional:
 * - Em desenvolvimento (import.meta.env.DEV): emite logs normalmente no console.
 * - Em produção: silencia log, info e warn para evitar poluição do console do usuário,
 *   mas preserva logger.error para erros críticos e monitoramento.
 */

const isDev = typeof import.meta !== 'undefined' && Boolean(import.meta.env?.DEV);

export const logger = {
  log: (...args: unknown[]): void => {
    if (isDev) {
      console.log(...args);
    }
  },
  info: (...args: unknown[]): void => {
    if (isDev) {
      console.info(...args);
    }
  },
  warn: (...args: unknown[]): void => {
    if (isDev) {
      console.warn(...args);
    }
  },
  error: (...args: unknown[]): void => {
    console.error(...args);
  },
};
