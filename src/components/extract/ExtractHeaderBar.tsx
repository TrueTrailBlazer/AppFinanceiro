export interface ExtractHeaderBarProps {
  currentDate: Date;
  onOpenMonthModal: () => void;
  onExport: () => void;
}

export default function ExtractHeaderBar({ 
  currentDate, 
  onOpenMonthModal, 
  onExport 
}: ExtractHeaderBarProps) {
  return (
    <div className="flex items-center justify-between mb-2 px-1">
      <div 
        onClick={onOpenMonthModal}
        className="bg-white border border-border-subtle rounded-full px-3 py-1.5 shadow-sm flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
      >
        <span className="material-symbols-outlined text-[16px] text-slate-500">calendar_today</span>
        <span className="text-[13px] font-bold text-slate-900 select-none capitalize">
          {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </span>
        <span className="material-symbols-outlined text-[16px] text-slate-500">arrow_drop_down</span>
      </div>

      <button 
        onClick={onExport} 
        className="bg-white border border-border-subtle rounded-full px-3 py-1.5 shadow-sm flex items-center gap-1.5 text-slate-600 hover:bg-slate-50 transition-colors active:scale-95"
        type="button"
      >
        <span className="material-symbols-outlined text-[16px]">download</span>
        <span className="text-[11px] font-bold">Exportar</span>
      </button>
    </div>
  );
}
