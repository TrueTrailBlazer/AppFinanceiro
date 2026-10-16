import { CheckCircle2, XCircle, CalendarRange, Loader2 } from 'lucide-react';
import { CATEGORIES, type CategoryKey } from '../../../utils/constants';
import { formatCents } from '../../../utils/money';
import { formatLocalDate } from '../../../utils/date';
import type { CSVPreviewTransaction } from '../../../types/models';

const isInstallmentTx = (t: CSVPreviewTransaction) => 
  Boolean(t.installment_group_id) || /(?:\(|\[|parcela\s+)\d+\s*(?:\/|de)\s*\d+(?:\)|\])/i.test(t.name);

interface CSVReviewStepProps {
  transactions: CSVPreviewTransaction[];
  onSetAllStatus: (status: boolean) => void;
  onImport: () => void;
  loading: boolean;
}

export default function CSVReviewStep({
  transactions,
  onSetAllStatus,
  onImport,
  loading
}: CSVReviewStepProps) {
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
          <CheckCircle2 size={16} className="text-green-500" /> Revisar e Importar
        </h3>
        
        {/* Seletor de Status Global */}
        <div className="bg-card p-3 rounded-2xl border border-border space-y-3">
          <p className="text-[10px] font-bold text-gray-500 uppercase">Marcar todos como:</p>
          <div className="flex gap-2">
            <button 
              onClick={() => onSetAllStatus(true)} 
              className="flex-1 py-2 bg-green-500/10 border border-green-500/30 text-green-500 rounded-xl text-[10px] font-bold uppercase flex items-center justify-center gap-1.5 transition-all"
              type="button"
            >
              <CheckCircle2 size={14} /> Pago
            </button>
            <button 
              onClick={() => onSetAllStatus(false)} 
              className="flex-1 py-2 bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl text-[10px] font-bold uppercase flex items-center justify-center gap-1.5 transition-all"
              type="button"
            >
              <XCircle size={14} /> Pendente
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {transactions.slice(0, 15).map((t, i) => {
          const CategoryIcon = CATEGORIES[t.category as CategoryKey]?.icon || CATEGORIES.others.icon;
          const isRetro = isInstallmentTx(t);
          return (
            <div 
              key={i} 
              className={`flex items-center justify-between p-3 border rounded-2xl transition-all ${
                t.is_paid ? 'bg-card border-border' : 'bg-card-hover border-yellow-500/20 shadow-[inset_3px_0_0_0_#eab308]'
              }`}
            >
              <div className="flex items-center gap-3 truncate">
                <div className="p-2 bg-card-hover rounded-full text-gray-500 shrink-0">
                  <CategoryIcon size={14} />
                </div>
                <div className="flex flex-col truncate">
                  <span className="text-xs font-bold text-foreground line-clamp-1">{t.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-gray-500 font-medium">
                      {formatLocalDate(t.created_at, { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </span>
                    {isRetro && (
                      <span className="text-[8px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded flex items-center gap-1">
                        <CalendarRange size={8} /> Parcelamento
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <span className={`text-[13px] font-bold shrink-0 ml-2 ${
                t.type === 'income' ? 'text-green-400' : 'text-foreground'
              }`}>
                {formatCents(t.amount)}
              </span>
            </div>
          );
        })}
        {transactions.length > 15 && (
          <p className="text-center text-[10px] text-gray-600 py-2 font-bold uppercase tracking-widest">
            ... e mais {transactions.length - 15} itens
          </p>
        )}
      </div>

      <div className="p-4 border-t border-border bg-background sticky bottom-0 -mx-4 pb-8 md:pb-4 flex flex-col gap-3">
        <button 
          onClick={onImport} 
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-foreground font-bold py-4 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95"
          type="button"
        >
          {loading ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <>Importar {transactions.length} Lançamentos</>
          )}
        </button>
      </div>
    </div>
  );
}
