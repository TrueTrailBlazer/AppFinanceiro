import { formatCurrency } from '../../utils/money';

export interface BillsSummaryCardsProps {
  faltaPagarCents?: number;
  jaPagoCents?: number;
  onViewBills?: () => void;
}

export function BillsSummaryCards({ 
  faltaPagarCents = 0, 
  jaPagoCents = 0, 
  onViewBills 
}: BillsSummaryCardsProps) {
  return (
    <section className="grid grid-cols-2 gap-2.5">
      <div 
        onClick={onViewBills} 
        className="bg-white rounded-2xl p-3.5 border border-border-subtle shadow-sm flex flex-col justify-between cursor-pointer active:scale-95 transition-transform"
      >
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="w-5 h-5 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center">
            <span className="material-symbols-outlined text-[13px] font-bold">calendar_clock</span>
          </span>
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-tight">Falta Pagar</span>
        </div>
        <p className="text-base font-bold text-slate-900 truncate">{formatCurrency(faltaPagarCents)}</p>
      </div>

      <div 
        onClick={onViewBills} 
        className="bg-white rounded-2xl p-3.5 border border-border-subtle shadow-sm flex flex-col justify-between cursor-pointer active:scale-95 transition-transform"
      >
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
            <span className="material-symbols-outlined text-[13px] font-bold">check_circle</span>
          </span>
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-tight">Já Pago</span>
        </div>
        <p className="text-base font-bold text-slate-900 truncate">{formatCurrency(jaPagoCents)}</p>
      </div>
    </section>
  );
}

export default BillsSummaryCards;
