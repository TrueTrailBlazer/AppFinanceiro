import { useNavigate } from 'react-router-dom';
import { getCategory } from '../../utils/constants';
import { formatCurrency } from '../../utils/money';
import type { AnalysisCategoryRankingItem } from '../../types/models';

const DONUT_TAILWIND_BG = ['bg-emerald-700', 'bg-emerald-500', 'bg-emerald-400', 'bg-emerald-300', 'bg-slate-400'];

export interface CategoryRankingListProps {
  categoryRanking: AnalysisCategoryRankingItem[];
  totalExpenseCents: number;
  currentDate: Date;
  periodMode: 'month' | 'year';
  isBankSource: boolean;
}

export default function CategoryRankingList({
  categoryRanking,
  totalExpenseCents,
  currentDate,
  periodMode,
  isBankSource
}: CategoryRankingListProps) {
  const navigate = useNavigate();

  return (
    <div className="bg-white border border-border-subtle rounded-3xl p-5 shadow-sm flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[16px] font-bold text-slate-900">Categorias</h3>
        <span className="text-[11px] font-bold text-slate-500">{categoryRanking.length} grupos</span>
      </div>
      <div className="flex flex-col gap-4 mt-1">
        {categoryRanking.map((cat, index) => {
          const catInfo = getCategory(cat.cat);
          const colorIndex = index >= DONUT_TAILWIND_BG.length ? DONUT_TAILWIND_BG.length - 1 : index;
          const bgClass = DONUT_TAILWIND_BG[colorIndex];
          const percent = totalExpenseCents > 0 ? Math.round((cat.amount / totalExpenseCents) * 100) : 0;

          return (
            <div 
              key={cat.cat ?? `category-${index}`} 
              onClick={() => {
                const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
                const monthLabel = periodMode === 'month' 
                  ? currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
                  : String(currentDate.getFullYear());
                navigate('/category-details', { 
                  state: { 
                    category: cat.cat, 
                    monthKey: periodMode === 'month' ? monthKey : null,
                    monthLabel,
                    isBankSource
                  } 
                });
              }} 
              className="flex flex-col gap-1.5 cursor-pointer group"
            >
              <div className="flex items-center justify-between text-slate-900">
                <div className="flex items-center gap-2.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${bgClass} shrink-0`}></span>
                  <span className="text-[13px] font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                    {catInfo.label}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-[13px] font-black text-slate-900">{formatCurrency(cat.amount)}</span>
                  <span className="text-[11px] font-bold text-slate-400 w-8 text-right">{percent}%</span>
                </div>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${bgClass} rounded-full transition-all duration-1000`} 
                  style={{ width: `${percent}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
