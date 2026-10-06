import { supabase } from './supabase';

/**
 * Uploads a receipt file to the Supabase storage bucket and returns the public URL.
 * The file is stored in a folder corresponding to the user's ID.
 */
export async function uploadReceipt(userId, transactionId, file) {
  if (!file) throw new Error('Nenhum arquivo selecionado.');

  const fileExt = file.name.split('.').pop();
  const fileName = `${transactionId}.${fileExt}`;
  const filePath = `${userId}/${fileName}`;

  // Upload file to the 'receipts' bucket
  const { error: uploadError } = await supabase.storage
    .from('receipts')
    .upload(filePath, file, { upsert: true });

  if (uploadError) {
    throw new Error(`Erro ao fazer upload do comprovante: ${uploadError.message}`);
  }

  // Get the public URL
  const { data } = supabase.storage.from('receipts').getPublicUrl(filePath);

  // Update the transaction record with the receipt URL
  const { error: updateError } = await supabase
    .from('transactions')
    .update({ receipt_url: data.publicUrl })
    .eq('id', transactionId)
    .eq('user_id', userId);

  if (updateError) {
    throw new Error(`Erro ao vincular comprovante à transação: ${updateError.message}`);
  }

  return data.publicUrl;
}

/**
 * Removes a receipt from storage and clears the transaction record.
 */
export async function removeReceipt(userId, transactionId, receiptUrl) {
  if (!receiptUrl) return;

  // Extract the file path from the URL
  // Assuming public URL format: .../object/public/receipts/userId/fileName
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
    .eq('id', transactionId)
    .eq('user_id', userId);

  if (updateError) {
    throw new Error(`Erro ao desvincular comprovante: ${updateError.message}`);
  }
}
