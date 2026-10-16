import { formatCurrency } from '../../utils/money';

export interface BillsLiquidationSummary {
  totalCents: number;
  paidCents: number;
  pendingCents: number;
  pendingCount: number;
  paidCount: number;
}

export interface BillsLiquidationHeroProps {
  summary: BillsLiquidationSummary;
  billsCount: number;
  progress: number;
}

export default function BillsLiquidationHero({
  summary,
  billsCount,
  progress
}: BillsLiquidationHeroProps) {
  return (
    <section className="relative overflow-hidden bg-emerald-700 text-white rounded-3xl p-5 shadow-sm border border-emerald-600">
      <div className="absolute -right-8 -top-8 w-44 h-44 rounded-full bg-emerald-400/20 blur-2xl pointer-events-none"></div>
      <div className="absolute -left-10 -bottom-10 w-36 h-36 rounded-full bg-black/10 blur-xl pointer-events-none"></div>
      
      <div className="relative z-10 flex flex-col gap-4">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[11px] font-semibold tracking-wider uppercase text-emerald-200">
              Total a pagar no mês
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-3xl font-extrabold tracking-tight">
                {formatCurrency(summary.totalCents)}
              </span>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/10 backdrop-blur-md text-white border border-white/10">
            <span className="material-symbols-outlined text-[14px]">receipt_long</span>
            {billsCount} Contas
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <div className="bg-black/10 backdrop-blur-sm rounded-2xl p-3 border border-white/10 flex flex-col">
            <div className="flex items-center gap-1.5 text-xs text-emerald-100 font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0"></span>
              <span>Pendentes ({summary.pendingCount})</span>
            </div>
            <span className="text-base font-bold text-white mt-1">
              {formatCurrency(summary.pendingCents)}
            </span>
          </div>
          <div className="bg-black/10 backdrop-blur-sm rounded-2xl p-3 border border-white/10 flex flex-col">
            <div className="flex items-center gap-1.5 text-xs text-emerald-100 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-300 shrink-0"></span>
              <span>Pagas ({summary.paidCount})</span>
            </div>
            <span className="text-base font-bold text-white mt-1">
              {formatCurrency(summary.paidCents)}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 pt-1 border-t border-white/15">
          <div className="flex justify-between text-xs font-semibold text-emerald-50">
            <span>Progresso de liquidação</span>
            <span className="text-emerald-200">{progress}% quitado</span>
          </div>
          <div className="h-2 w-full bg-black/20 rounded-full overflow-hidden p-0.5">
            <div 
              className="h-full bg-emerald-300 rounded-full transition-all duration-500 ease-out" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-[11px] text-emerald-100/80">
            Faltam {formatCurrency(summary.pendingCents)} para encerrar as despesas do mês.
          </p>
        </div>
      </div>
    </section>
  );
}
