import { describe, it, expect, vi } from 'vitest';
import { logger } from './logger';

describe('logger utility', () => {
  it('deve chamar console.error quando logger.error for invocado', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    logger.error('Erro crítico de teste', { code: 500 });
    expect(errorSpy).toHaveBeenCalledWith('Erro crítico de teste', { code: 500 });
    errorSpy.mockRestore();
  });

  it('deve fornecer métodos seguros para log, info e warn sem lançar erros', () => {
    expect(() => logger.log('Mensagem de log')).not.toThrow();
    expect(() => logger.info('Mensagem de info')).not.toThrow();
    expect(() => logger.warn('Mensagem de warn')).not.toThrow();
  });
});
