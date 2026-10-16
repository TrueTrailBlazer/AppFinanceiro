import { formatCurrency } from '../../utils/money';

export interface ExtractSummaryHeroProps {
  summary: {
    netCents: number;
    incomeCents: number;
    expenseCents: number;
  };
}

export default function ExtractSummaryHero({ summary }: ExtractSummaryHeroProps) {
  const isPositive = summary.netCents >= 0;

  return (
    <div className="relative overflow-hidden bg-white rounded-2xl p-5 shadow-sm border border-border-subtle">
      <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-emerald-500/5 pointer-events-none"></div>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Balanço do Período</span>
        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
          isPositive ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'
        }`}>
          <span className="material-symbols-outlined text-[13px]">
            {isPositive ? 'trending_up' : 'trending_down'}
          </span>
          Open Finance
        </span>
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className={`text-[28px] font-bold tracking-tight ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
          {isPositive ? '+ ' : '- '}
          {formatCurrency(Math.abs(summary.netCents))}
        </span>
      </div>

      {/* Mini Period Insights Bar */}
      <div className="grid grid-cols-2 gap-3 mt-4 pt-3.5 bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-100">
        <div className="flex flex-col">
          <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5 uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Entradas
          </span>
          <span className="text-sm text-emerald-600 mt-0.5 font-bold">+ {formatCurrency(summary.incomeCents)}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5 uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Saídas
          </span>
          <span className="text-sm text-rose-600 mt-0.5 font-bold">- {formatCurrency(summary.expenseCents)}</span>
        </div>
      </div>
    </div>
  );
}
