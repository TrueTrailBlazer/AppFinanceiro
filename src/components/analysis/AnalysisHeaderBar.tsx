export interface AnalysisHeaderBarProps {
  periodMode: 'month' | 'year';
  setPeriodMode: (mode: 'month' | 'year') => void;
  currentDate: Date;
  onOpenMonthModal: () => void;
}

export default function AnalysisHeaderBar({
  periodMode,
  setPeriodMode,
  currentDate,
  onOpenMonthModal
}: AnalysisHeaderBarProps) {
  return (
    <div className="flex items-center justify-between mb-2 px-1">
      <div 
        onClick={onOpenMonthModal}
        className="bg-white border border-border-subtle rounded-full px-3 py-1.5 shadow-sm flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
      >
        <span className="material-symbols-outlined text-[16px] text-slate-500">calendar_today</span>
        <span className="text-[13px] font-bold text-slate-900 select-none capitalize">
          {periodMode === 'month' 
            ? currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
            : currentDate.getFullYear()}
        </span>
        <span className="material-symbols-outlined text-[16px] text-slate-500">arrow_drop_down</span>
      </div>

      <div className="flex items-center bg-slate-100 p-1 rounded-full text-[11px] font-semibold text-slate-500 border border-border-subtle">
        <button 
          onClick={() => setPeriodMode('month')} 
          className={`px-3 py-1 rounded-full transition-all ${
            periodMode === 'month' 
              ? 'bg-white text-emerald-700 shadow-sm font-bold' 
              : 'hover:text-slate-900'
          }`}
          type="button"
        >
          Mensal
        </button>
        <button 
          onClick={() => setPeriodMode('year')} 
          className={`px-3 py-1 rounded-full transition-all ${
            periodMode === 'year' 
              ? 'bg-white text-emerald-700 shadow-sm font-bold' 
              : 'hover:text-slate-900'
          }`}
          type="button"
        >
          Anual
        </button>
      </div>
    </div>
  );
}
