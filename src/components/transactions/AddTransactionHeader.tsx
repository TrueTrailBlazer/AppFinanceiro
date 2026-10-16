import type { DisplayTransaction, TransactionRow } from '../../types/models';

interface AddTransactionHeaderProps {
  editingTransaction?: TransactionRow | DisplayTransaction | null;
  onBack: () => void;
  onDelete: () => void;
}

export default function AddTransactionHeader({
  editingTransaction,
  onBack,
  onDelete
}: AddTransactionHeaderProps) {
  return (
    <header className="fixed top-0 w-full md:absolute z-50 pt-safe bg-surface/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.03)]">
      <div className="h-16 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button 
            aria-label="Voltar" 
            onClick={onBack} 
            className="w-11 h-11 flex items-center justify-center -ml-2 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-slate-200 transition-colors" 
            type="button"
          >
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          <h1 className="text-lg font-semibold text-slate-900 tracking-tight">
            {editingTransaction ? 'Editar Lançamento' : 'Novo Lançamento'}
          </h1>
        </div>
        <div className="flex items-center gap-1">
          {editingTransaction && (
            <button 
              aria-label="Excluir" 
              onClick={onDelete} 
              className="w-11 h-11 flex items-center justify-center rounded-full text-rose-500 hover:text-rose-600 hover:bg-rose-50 transition-colors" 
              type="button"
            >
              <span className="material-symbols-outlined text-[22px]">delete</span>
            </button>
          )}
          <button 
            aria-label="Fechar" 
            onClick={onBack} 
            className="w-11 h-11 flex items-center justify-center rounded-full text-on-surface-variant hover:text-on-surface hover:bg-slate-200 transition-colors" 
            type="button"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>
      </div>
    </header>
  );
}
