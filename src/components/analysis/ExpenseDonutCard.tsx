import { useMemo } from 'react';
import { formatCurrency } from '../../utils/money';
import type { AnalysisCategoryRankingItem } from '../../types/models';

const SVG_RADIUS = 54;
const SVG_CIRCUMFERENCE = 2 * Math.PI * SVG_RADIUS;
const DONUT_COLORS = ['#047857', '#10b981', '#34d399', '#6ee7b7', '#94a3b8'];
const DONUT_TAILWIND_BG = ['bg-emerald-700', 'bg-emerald-500', 'bg-emerald-400', 'bg-emerald-300', 'bg-slate-400'];

interface DonutSlice {
  key: string;
  strokeColor: string;
  dashLength: number;
  offset: number;
}

function computeDonutSlices(
  categoryRanking: AnalysisCategoryRankingItem[],
  totalExpenseCents: number
): DonutSlice[] {
  let accOffset = 0;
  const result: DonutSlice[] = [];
  for (let i = 0; i < categoryRanking.length; i++) {
    const cat = categoryRanking[i];
    const colorIndex = i >= DONUT_COLORS.length ? DONUT_COLORS.length - 1 : i;
    const strokeColor = DONUT_COLORS[colorIndex];
    const catFraction = totalExpenseCents > 0 ? cat.amount / totalExpenseCents : 0;
    const dashLength = catFraction * SVG_CIRCUMFERENCE;
    result.push({
      key: cat.cat ?? `slice-${i}`,
      strokeColor,
      dashLength,
      offset: accOffset
    });
    accOffset += dashLength;
  }
  return result;
}

export interface ExpenseDonutCardProps {
  totalExpenseCents: number;
  totalItems: number;
  categoryRanking: AnalysisCategoryRankingItem[];
}

export default function ExpenseDonutCard({
  totalExpenseCents,
  totalItems,
  categoryRanking
}: ExpenseDonutCardProps) {
  const topCategoryPercentage = totalExpenseCents > 0 && categoryRanking.length > 0
    ? Math.round((categoryRanking[0].amount / totalExpenseCents) * 100)
    : 0;

  const slices = useMemo(
    () => computeDonutSlices(categoryRanking, totalExpenseCents),
    [categoryRanking, totalExpenseCents]
  );

  return (
    <div className="bg-white border border-border-subtle rounded-3xl p-5 shadow-sm flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold text-slate-500 tracking-wider uppercase">
            Total de Despesas
          </span>
          <h2 className="text-2xl font-black text-slate-900 mt-0.5">
            {formatCurrency(totalExpenseCents)}
          </h2>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold">
          {totalItems} lançamentos
        </span>
      </div>

      <div className="flex items-center justify-center relative py-2">
        <div className="relative w-44 h-44 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 140 140">
            <circle cx="70" cy="70" fill="none" r="54" stroke="#f1f5f9" strokeWidth="16"></circle>
            {slices.map((slice) => (
              <circle 
                key={slice.key}
                cx="70" cy="70" fill="none" r="54" 
                stroke={slice.strokeColor} 
                strokeWidth="16"
                strokeLinecap="round"
                strokeDasharray={`${slice.dashLength} ${SVG_CIRCUMFERENCE}`}
                strokeDashoffset={-slice.offset}
                className="transition-all duration-1000 ease-out"
              ></circle>
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="material-symbols-outlined text-[20px] text-emerald-600">pie_chart</span>
            <span className="text-[10px] font-semibold text-slate-500 mt-0.5">Maior gasto</span>
            <span className="text-[22px] font-black text-slate-900 leading-none mt-1">
              {topCategoryPercentage}%
            </span>
          </div>
        </div>
      </div>

      <div className="w-full flex h-2 rounded-full overflow-hidden bg-slate-100 gap-0.5 mt-2">
        {categoryRanking.map((cat, index) => {
          const colorIndex = index >= DONUT_TAILWIND_BG.length ? DONUT_TAILWIND_BG.length - 1 : index;
          const bgClass = DONUT_TAILWIND_BG[colorIndex];
          const widthPercent = totalExpenseCents > 0 ? (cat.amount / totalExpenseCents) * 100 : 0;
          return (
            <div 
              key={cat.cat ?? `bar-${index}`} 
              className={`h-full ${bgClass}`} 
              style={{ width: `${widthPercent}%` }}
            ></div>
          );
        })}
      </div>
    </div>
  );
}
