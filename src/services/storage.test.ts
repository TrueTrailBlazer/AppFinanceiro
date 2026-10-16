import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  validateReceiptFile,
  uploadReceipt,
  removeReceipt,
  MAX_RECEIPT_SIZE_BYTES
} from './storage';
import { supabase } from './supabase';

vi.mock('./supabase', () => ({
  supabase: {
    storage: {
      from: vi.fn(),
    },
    from: vi.fn(),
  },
}));

function createMockFile(name: string, size: number, type: string): File {
  return {
    name,
    size,
    type,
  } as unknown as File;
}

describe('storage service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validateReceiptFile', () => {
    it('deve aceitar arquivos válidos de imagem (JPEG, PNG, WEBP) e PDF dentro do limite de tamanho', () => {
      const validJpeg = createMockFile('comprovante.jpg', 1024 * 50, 'image/jpeg');
      const validPng = createMockFile('comprovante.png', 1024 * 80, 'image/png');
      const validWebp = createMockFile('comprovante.webp', 1024 * 40, 'image/webp');
      const validPdf = createMockFile('comprovante.pdf', 1024 * 200, 'application/pdf');

      expect(() => validateReceiptFile(validJpeg)).not.toThrow();
      expect(() => validateReceiptFile(validPng)).not.toThrow();
      expect(() => validateReceiptFile(validWebp)).not.toThrow();
      expect(() => validateReceiptFile(validPdf)).not.toThrow();
    });

    it('deve rejeitar arquivo se for nulo ou indefinido', () => {
      expect(() => validateReceiptFile(null as unknown as File)).toThrow('Nenhum arquivo selecionado.');
    });

    it('deve rejeitar arquivo com tamanho superior a 5MB (mitigação DoS)', () => {
      const oversizedFile = createMockFile('comprovante.pdf', MAX_RECEIPT_SIZE_BYTES + 1, 'application/pdf');

      expect(() => validateReceiptFile(oversizedFile)).toThrow(
        'O arquivo excede o limite máximo permitido de 5MB.'
      );
    });

    it('deve rejeitar arquivos SVG (Stored XSS) mesmo se contiverem extensão de imagem', () => {
      const svgFile = createMockFile('malicious.svg', 2048, 'image/svg+xml');

      expect(() => validateReceiptFile(svgFile)).toThrow(
        'Tipo de arquivo não permitido. Envie apenas imagens seguras (JPEG, PNG, WEBP) ou documentos PDF.'
      );
    });

    it('deve rejeitar arquivos com extensões executáveis ou perigosas (HTML, EXE, SH)', () => {
      const htmlFile = createMockFile('page.html', 1024, 'text/html');
      const exeFile = createMockFile('virus.exe', 1024, 'application/octet-stream');

      expect(() => validateReceiptFile(htmlFile)).toThrow(/Tipo de arquivo não permitido/);
      expect(() => validateReceiptFile(exeFile)).toThrow(/Tipo de arquivo não permitido/);
    });

    it('deve rejeitar inconsistência entre extensão e MIME type', () => {
      // Arquivo com extensão .png mas tipo text/html
      const spoofedFile = createMockFile('fake.png', 1024, 'text/html');
      expect(() => validateReceiptFile(spoofedFile)).toThrow(/Tipo de arquivo não permitido/);
    });
  });

  describe('uploadReceipt', () => {
    it('deve fazer upload seguro, obter URL pública e atualizar a transação', async () => {
      const mockUpload = vi.fn().mockResolvedValue({ data: { path: 'user-1/100.png' }, error: null });
      const mockGetPublicUrl = vi.fn().mockReturnValue({
        data: { publicUrl: 'https://supabase.co/storage/v1/object/public/receipts/user-1/100.png' },
      });

      vi.mocked(supabase.storage.from).mockReturnValue({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
      } as any);

      const mockEqUserId = vi.fn().mockResolvedValue({ error: null });
      const mockEqId = vi.fn().mockReturnValue({ eq: mockEqUserId });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEqId });

      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate,
      } as any);

      const file = createMockFile('nota.png', 5000, 'image/png');
      const result = await uploadReceipt('user-1', 100, file);

      expect(supabase.storage.from).toHaveBeenCalledWith('receipts');
      expect(mockUpload).toHaveBeenCalledWith('user-1/100.png', file, {
        upsert: true,
        contentType: 'image/png',
      });
      expect(supabase.from).toHaveBeenCalledWith('transactions');
      expect(mockUpdate).toHaveBeenCalledWith({
        receipt_url: 'https://supabase.co/storage/v1/object/public/receipts/user-1/100.png',
      });
      expect(mockEqId).toHaveBeenCalledWith('id', 100);
      expect(mockEqUserId).toHaveBeenCalledWith('user_id', 'user-1');
      expect(result).toBe('https://supabase.co/storage/v1/object/public/receipts/user-1/100.png');
    });

    it('deve falhar e lançar erro se o upload no storage retornar erro', async () => {
      const mockUpload = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Storage bucket full' },
      });

      vi.mocked(supabase.storage.from).mockReturnValue({
        upload: mockUpload,
      } as any);

      const file = createMockFile('nota.pdf', 5000, 'application/pdf');

      await expect(uploadReceipt('user-1', 100, file)).rejects.toThrow(
        'Erro ao fazer upload do comprovante: Storage bucket full'
      );
    });
  });

  describe('removeReceipt', () => {
    it('deve remover o comprovante do storage e desvincular da transação', async () => {
      const mockRemove = vi.fn().mockResolvedValue({ error: null });
      vi.mocked(supabase.storage.from).mockReturnValue({
        remove: mockRemove,
      } as any);

      const mockEqUserId = vi.fn().mockResolvedValue({ error: null });
      const mockEqId = vi.fn().mockReturnValue({ eq: mockEqUserId });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEqId });

      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate,
      } as any);

      const receiptUrl = 'https://supabase.co/storage/v1/object/public/receipts/user-1/100.pdf';
      await removeReceipt('user-1', 100, receiptUrl);

      expect(mockRemove).toHaveBeenCalledWith(['user-1/100.pdf']);
      expect(mockUpdate).toHaveBeenCalledWith({ receipt_url: null });
      expect(mockEqId).toHaveBeenCalledWith('id', 100);
      expect(mockEqUserId).toHaveBeenCalledWith('user_id', 'user-1');
    });

    it('não deve fazer nada se receiptUrl for nulo ou indefinido', async () => {
      await removeReceipt('user-1', 100, null);
      expect(supabase.storage.from).not.toHaveBeenCalled();
      expect(supabase.from).not.toHaveBeenCalled();
    });
  });
});
