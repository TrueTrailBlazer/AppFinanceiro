import type { ChangeEvent, RefObject } from 'react';
import { FileUp } from 'lucide-react';

interface CSVUploadStepProps {
  fileInputRef: RefObject<HTMLInputElement | null>;
  onFileUpload: (e: ChangeEvent<HTMLInputElement>) => void;
}

export default function CSVUploadStep({ fileInputRef, onFileUpload }: CSVUploadStepProps) {
  return (
    <div 
      className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-border rounded-3xl bg-card/50 hover:border-blue-500/30 transition-all cursor-pointer group"
      onClick={() => fileInputRef.current?.click()}
    >
      <input 
        type="file" 
        accept=".csv" 
        ref={fileInputRef} 
        onChange={onFileUpload} 
        className="hidden" 
      />
      <div className="p-4 bg-blue-500/10 rounded-full text-blue-500 mb-4 group-hover:scale-110 transition-transform">
        <FileUp size={32} />
      </div>
      <h3 className="text-foreground font-bold mb-2">Selecione seu arquivo CSV</h3>
      <p className="text-xs text-gray-500 text-center max-w-xs leading-relaxed">
        Arraste seu extrato bancário ou fatura aqui. O sistema reconhecerá automaticamente bancos como Nubank, C6, Inter e Bradesco.
      </p>
    </div>
  );
}
