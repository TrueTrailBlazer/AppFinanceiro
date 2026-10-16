export interface MonthSelectorBarProps {
  currentDate: Date;
  onOpenModal: () => void;
  onOpenAnalysis: () => void;
}

export function MonthSelectorBar({ 
  currentDate, 
  onOpenModal, 
  onOpenAnalysis 
}: MonthSelectorBarProps) {
  return (
    <div className="flex items-center justify-between mb-2 px-1">
      <div 
        onClick={onOpenModal}
        className="bg-white border border-border-subtle rounded-full px-3 py-1.5 shadow-sm flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
      >
        <span className="material-symbols-outlined text-[16px] text-slate-500">calendar_today</span>
        <span className="text-[13px] font-bold text-slate-900 select-none capitalize">
          {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </span>
        <span className="material-symbols-outlined text-[16px] text-slate-500">arrow_drop_down</span>
      </div>

      <button 
        onClick={onOpenAnalysis} 
        type="button"
        className="bg-white border border-border-subtle rounded-full px-3 py-1.5 shadow-sm flex items-center gap-1.5 text-slate-600 hover:bg-slate-50 transition-colors active:scale-95"
      >
        <span className="material-symbols-outlined text-[16px]">insights</span>
        <span className="text-[11px] font-bold">Resumo</span>
      </button>
    </div>
  );
}

export default MonthSelectorBar;
