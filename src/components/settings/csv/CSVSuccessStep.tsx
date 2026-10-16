import { Check, Loader2, Undo2 } from 'lucide-react';

interface CSVSuccessStepProps {
  transactionsCount: number;
  onBack: () => void;
  onUndo: () => void;
  loading: boolean;
}

export default function CSVSuccessStep({
  transactionsCount,
  onBack,
  onUndo,
  loading
}: CSVSuccessStepProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-10 animate-in zoom-in-95 duration-300">
      <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center text-green-500 mb-6 border border-green-500/30">
        <Check size={40} />
      </div>
      <h3 className="text-xl font-bold text-foreground mb-2">Importação Concluída!</h3>
      <p className="text-sm text-gray-500 text-center mb-10 max-w-[250px]">
        Todos os {transactionsCount} lançamentos foram adicionados ao seu extrato.
      </p>
      
      <div className="w-full space-y-3">
        <button 
          onClick={onBack}
          className="w-full bg-card hover:bg-card-hover text-foreground border border-border font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2"
          type="button"
        >
          Voltar para Configurações
        </button>
        <button 
          onClick={onUndo} 
          disabled={loading}
          className="w-full bg-red-600/10 hover:bg-red-600/20 text-red-500 border border-red-500/20 font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2"
          type="button"
        >
          {loading ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <>
              <Undo2 size={18} /> Desfazer Importação
            </>
          )}
        </button>
      </div>
    </div>
  );
}
