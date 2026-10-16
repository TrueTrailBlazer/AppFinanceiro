import { Link } from 'react-router-dom';

export type BillFilterType = 'all' | 'pending' | 'paid';

export interface BillsFilterTabsProps {
  activeFilter: BillFilterType;
  setActiveFilter: (filter: BillFilterType) => void;
  totalCount: number;
  pendingCount: number;
  paidCount: number;
}

export default function BillsFilterTabs({
  activeFilter,
  setActiveFilter,
  totalCount,
  pendingCount,
  paidCount
}: BillsFilterTabsProps) {
  return (
    <div className="flex items-center justify-between mt-2">
      <nav className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1 -mx-4 px-4">
        <button 
          onClick={() => setActiveFilter('all')} 
          className={`shrink-0 px-4 py-1.5 rounded-full text-[13px] font-bold shadow-sm transition-all border ${
            activeFilter === 'all' 
              ? 'bg-emerald-700 text-white border-emerald-700' 
              : 'bg-white text-slate-600 border-border-subtle hover:text-slate-900'
          }`}
          type="button"
        >
          Todas ({totalCount})
        </button>
        <button 
          onClick={() => setActiveFilter('pending')} 
          className={`shrink-0 px-4 py-1.5 rounded-full text-[13px] font-semibold shadow-sm transition-all border flex items-center gap-1.5 ${
            activeFilter === 'pending' 
              ? 'bg-emerald-700 text-white border-emerald-700' 
              : 'bg-white text-slate-600 border-border-subtle hover:text-slate-900'
          }`}
          type="button"
        >
          <span className={`w-1.5 h-1.5 rounded-full ${activeFilter === 'pending' ? 'bg-white' : 'bg-amber-500'}`}></span>
          Pendentes ({pendingCount})
        </button>
        <button 
          onClick={() => setActiveFilter('paid')} 
          className={`shrink-0 px-4 py-1.5 rounded-full text-[13px] font-semibold shadow-sm transition-all border flex items-center gap-1.5 ${
            activeFilter === 'paid' 
              ? 'bg-emerald-700 text-white border-emerald-700' 
              : 'bg-white text-slate-600 border-border-subtle hover:text-slate-900'
          }`}
          type="button"
        >
          <span className={`w-1.5 h-1.5 rounded-full ${activeFilter === 'paid' ? 'bg-white' : 'bg-emerald-500'}`}></span>
          Pagas ({paidCount})
        </button>
      </nav>
      <Link 
        to="/dossier" 
        className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-border-subtle text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-[12px] font-bold transition-all shadow-sm shrink-0"
      >
        <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span> PDF
      </Link>
    </div>
  );
}
