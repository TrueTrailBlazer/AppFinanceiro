import type { AnalysisComparison } from '../../types/models';
import { formatCurrency } from '../../utils/money';

export interface AnalysisComparisonBannerProps {
  comparison: AnalysisComparison | null;
}

export default function AnalysisComparisonBanner({ comparison }: AnalysisComparisonBannerProps) {
  if (!comparison) return null;

  return (
    <div className={`rounded-2xl p-4 shadow-sm flex items-center gap-3 border ${
      comparison.isSavings 
        ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
        : 'bg-rose-50 border-rose-100 text-rose-800'
    }`}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
        comparison.isSavings ? 'bg-emerald-500/10' : 'bg-rose-500/10'
      }`}>
        <span className="material-symbols-outlined text-[20px]">
          {comparison.isSavings ? 'trending_down' : 'trending_up'}
        </span>
      </div>
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[12px] font-bold">
            {comparison.isSavings 
              ? `Economia de ${comparison.percent}%` 
              : `Gasto ${comparison.percent}% maior`}
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60"></span>
          <span className="text-[11px] opacity-80 truncate">vs. Mês Passado</span>
        </div>
        <p className="text-[11px] opacity-90 leading-tight mt-0.5">
          Você gastou {formatCurrency(comparison.value)} {comparison.isSavings ? 'a menos' : 'a mais'}.
        </p>
      </div>
    </div>
  );
}
