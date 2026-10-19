import { describe, it, expect } from 'vitest';
import { extractErrorMessage } from './errors';

describe('extractErrorMessage', () => {
  it('deve retornar a mensagem correta para Error nativo', () => {
    const err = new Error('Falha de conexão com a API');
    expect(extractErrorMessage(err)).toBe('Falha de conexão com a API');
  });

  it('deve extrair a mensagem de um PostgrestError do Supabase (objeto simples)', () => {
    const postgrestErr = {
      message: 'column transactions.notes does not exist',
      code: '42703',
      details: null,
      hint: null
    };
    expect(extractErrorMessage(postgrestErr)).toBe('column transactions.notes does not exist');
  });

  it('deve incluir details ou hint se presentes no PostgrestError', () => {
    const errWithDetails = {
      message: 'duplicate key value violates unique constraint',
      details: 'Key (id)=(1) already exists.',
      code: '23505'
    };
    expect(extractErrorMessage(errWithDetails)).toBe(
      'duplicate key value violates unique constraint (Key (id)=(1) already exists.)'
    );
  });

  it('deve tratar strings passadas diretamente', () => {
    expect(extractErrorMessage('Erro de autenticação')).toBe('Erro de autenticação');
  });

  it('deve usar fallback para valores falsy', () => {
    expect(extractErrorMessage(null, 'Erro padrão')).toBe('Erro padrão');
    expect(extractErrorMessage(undefined, 'Erro padrão')).toBe('Erro padrão');
  });

  it('deve tratar objetos com error_description', () => {
    const err = { error_description: 'Token expired' };
    expect(extractErrorMessage(err)).toBe('Token expired');
  });
});
