import { BankBadge } from '../ui/BankBadge';
import { getCategory } from '../../utils/constants';
import { formatCurrency } from '../../utils/money';
import { formatLocalDate } from '../../utils/date';
import type { DisplayTransaction, AnalysisTopExpense } from '../../types/models';

export interface BankTransactionDetailModalProps {
  transaction: DisplayTransaction | AnalysisTopExpense | null;
  onClose: () => void;
  isOpen?: boolean;
}

export default function BankTransactionDetailModal({ 
  transaction, 
  onClose,
  isOpen
}: BankTransactionDetailModalProps) {
  if (!transaction || isOpen === false) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md bg-white border border-border-subtle rounded-3xl p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border-subtle pb-3">
          <div className="flex items-center gap-2">
            <BankBadge 
              bankName={transaction.bank_name || 'Banco Conectado'} 
              logoUrl={transaction.bank_logo_url} 
              className="text-xs py-1 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-semibold flex items-center gap-1.5" 
            />
            <div>
              <h3 className="font-bold text-sm text-slate-900">Detalhes Bancários</h3>
              <p className="text-[10px] font-semibold text-slate-500">Transação Open Finance</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="text-center py-2 space-y-1">
          <span className={`text-[32px] font-black tracking-tight ${
            transaction.type === 'income' ? 'text-emerald-600' : 'text-slate-900'
          }`}>
            {transaction.type === 'income' ? '+ ' : '- '}
            {formatCurrency(transaction.amount)}
          </span>
          <p className="font-bold text-[15px] text-slate-700 max-w-sm mx-auto">
            {transaction.name}
          </p>
        </div>

        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3 text-xs">
          <div className="flex justify-between items-center border-b border-slate-200 pb-2">
            <span className="text-slate-500 font-semibold">Instituição Bancária:</span>
            <span className="font-bold text-slate-900">
              {transaction.bank_name || 'Banco Conectado'}
            </span>
          </div>
          <div className="flex justify-between items-center border-b border-slate-200 pb-2">
            <span className="text-slate-500 font-semibold">Tipo de Fluxo:</span>
            <span className={`font-bold ${transaction.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
              {transaction.type === 'income' ? 'Crédito (Entrada)' : 'Débito (Saída)'}
            </span>
          </div>
          <div className="flex justify-between items-center border-b border-slate-200 pb-2">
            <span className="text-slate-500 font-semibold">Categoria Mapeada:</span>
            <span className="font-bold text-slate-900 capitalize">
              {getCategory(transaction.category).label}
            </span>
          </div>
          <div className="flex justify-between items-center border-b border-slate-200 pb-2">
            <span className="text-slate-500 font-semibold">Data e Horário:</span>
            <span className="font-bold text-slate-900">
              {formatLocalDate(transaction.created_at, { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </span>
          </div>
          <div className="flex justify-between items-center border-b border-slate-200 pb-2">
            <span className="text-slate-500 font-semibold">Status Bancário:</span>
            <span className="font-bold text-emerald-600 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">check_circle</span> Confirmado
            </span>
          </div>
          <div className="flex justify-between items-center pt-1">
            <span className="text-slate-500 font-semibold">ID Open Finance:</span>
            <span className="font-mono text-[10px] text-slate-400 truncate max-w-[150px]">
              {transaction.pluggy_transaction_id || 'N/A'}
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          type="button"
          className="w-full py-3.5 mt-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm transition-all shadow-md active:scale-95"
        >
          Fechar Detalhes
        </button>
      </div>
    </div>
  );
}
