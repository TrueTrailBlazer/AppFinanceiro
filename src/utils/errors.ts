/**
 * Utilitário para extração consistente e detalhada de mensagens de erro.
 * Trata nativamente instâncias de Error, objetos PostgrestError do Supabase,
 * respostas com details/hint, strings ou payloads arbitrários.
 */
export function extractErrorMessage(error: unknown, fallback: string = 'Erro desconhecido'): string {
  if (!error) return fallback;

  if (typeof error === 'string') return error;

  if (typeof error === 'object') {
    const errObj = error as Record<string, unknown>;

    // Trata PostgrestError do Supabase ({ message, details, hint, code })
    if (typeof errObj.message === 'string' && errObj.message.trim()) {
      let msg = errObj.message;
      if (typeof errObj.details === 'string' && errObj.details.trim()) {
        msg += ` (${errObj.details})`;
      } else if (typeof errObj.hint === 'string' && errObj.hint.trim()) {
        msg += ` (${errObj.hint})`;
      }
      return msg;
    }

    if (typeof errObj.error_description === 'string' && errObj.error_description.trim()) {
      return errObj.error_description;
    }

    if (error instanceof Error && error.message) {
      return error.message;
    }

    try {
      const json = JSON.stringify(error);
      if (json && json !== '{}') {
        return json;
      }
    } catch {
      // Ignora erro de serialização
    }
  }

  return String(error);
}
