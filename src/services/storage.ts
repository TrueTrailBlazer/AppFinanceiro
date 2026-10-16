import { supabase } from './supabase';

export const MAX_RECEIPT_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export const ALLOWED_RECEIPT_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'pdf'] as const;

export const ALLOWED_RECEIPT_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
] as const;

/**
 * Valida o arquivo do comprovante contra DoS (tamanho excessivo) e Stored XSS / MIME spoofing.
 */
export function validateReceiptFile(file: File): void {
  if (!file) {
    throw new Error('Nenhum arquivo selecionado.');
  }

  if (file.size > MAX_RECEIPT_SIZE_BYTES) {
    throw new Error('O arquivo excede o limite máximo permitido de 5MB.');
  }

  const rawExt = file.name.split('.').pop()?.toLowerCase() || '';
  const sanitizedExt = rawExt.replace(/[^a-z0-9]/g, '');

  const isExtensionAllowed = (ALLOWED_RECEIPT_EXTENSIONS as readonly string[]).includes(sanitizedExt);
  const isMimeAllowed = (ALLOWED_RECEIPT_MIME_TYPES as readonly string[]).includes(file.type.toLowerCase());

  if (!isExtensionAllowed || !isMimeAllowed) {
    throw new Error(
      'Tipo de arquivo não permitido. Envie apenas imagens seguras (JPEG, PNG, WEBP) ou documentos PDF.'
    );
  }
}

/**
 * Faz upload do arquivo de comprovante para o bucket 'receipts' com validações de segurança.
 * O arquivo é armazenado em uma pasta com o ID do usuário.
 */
export async function uploadReceipt(
  userId: string,
  transactionId: number | string,
  file: File
): Promise<string> {
  validateReceiptFile(file);

  const rawExt = file.name.split('.').pop()?.toLowerCase() || '';
  const fileExt = rawExt.replace(/[^a-z0-9]/g, '') || 'pdf';
  const fileName = `${transactionId}.${fileExt}`;
  const filePath = `${userId}/${fileName}`;

  // Upload file to the 'receipts' bucket
  const { error: uploadError } = await supabase.storage
    .from('receipts')
    .upload(filePath, file, { 
      upsert: true,
      contentType: file.type || undefined,
    });

  if (uploadError) {
    throw new Error(`Erro ao fazer upload do comprovante: ${uploadError.message}`);
  }

  // Get the public URL
  const { data } = supabase.storage.from('receipts').getPublicUrl(filePath);

  // Update the transaction record with the receipt URL
  const { error: updateError } = await supabase
    .from('transactions')
    .update({ receipt_url: data.publicUrl })
    .eq('id', Number(transactionId))
    .eq('user_id', userId);

  if (updateError) {
    throw new Error(`Erro ao vincular comprovante à transação: ${updateError.message}`);
  }

  return data.publicUrl;
}

/**
 * Remove um comprovante do storage e limpa a coluna receipt_url da transação.
 */
export async function removeReceipt(
  userId: string,
  transactionId: number | string,
  receiptUrl?: string | null
): Promise<void> {
  if (!receiptUrl) return;

  // Extrai o caminho do arquivo a partir da URL
  // Formato esperado da public URL: .../object/public/receipts/userId/fileName
  const urlParts = receiptUrl.split('/receipts/');
  if (urlParts.length !== 2) throw new Error('URL de comprovante inválida.');
  
  const filePath = urlParts[1];

  const { error: removeError } = await supabase.storage
    .from('receipts')
    .remove([filePath]);

  if (removeError) {
    throw new Error(`Erro ao remover comprovante do storage: ${removeError.message}`);
  }

  const { error: updateError } = await supabase
    .from('transactions')
    .update({ receipt_url: null })
    .eq('id', Number(transactionId))
    .eq('user_id', userId);

  if (updateError) {
    throw new Error(`Erro ao desvincular comprovante: ${updateError.message}`);
  }
}
