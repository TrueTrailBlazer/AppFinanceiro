import type { BillFilterType } from './BillsFilterTabs';

export interface BillsHeaderBarProps {
  currentDate: Date;
  onOpenMonthModal: () => void;
  activeFilter: BillFilterType;
  onToggleFilter: () => void;
}

export default function BillsHeaderBar({
  currentDate,
  onOpenMonthModal,
  activeFilter,
  onToggleFilter
}: BillsHeaderBarProps) {
  const filterLabel = activeFilter === 'all' ? 'Filtros' : activeFilter === 'pending' ? 'Pendentes' : 'Pagos';

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
        onClick={onToggleFilter}
        className="bg-white border border-border-subtle rounded-full px-3 py-1.5 shadow-sm flex items-center gap-1.5 text-slate-600 hover:bg-slate-50 transition-colors active:scale-95"
        type="button"
      >
        <span className="material-symbols-outlined text-[16px]">filter_list</span>
        <span className="text-[11px] font-bold">{filterLabel}</span>
      </button>
    </div>
  );
}
