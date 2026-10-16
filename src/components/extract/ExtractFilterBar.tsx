import { useState } from 'react';
import { CATEGORIES } from '../../utils/constants';

export type ExtractSortOrder = 'date' | 'amount_desc' | 'amount_asc';
export type ExtractTypeFilter = 'all' | 'income' | 'expense';

interface SortOption {
  id: ExtractSortOrder;
  label: string;
  icon: string;
}

const SORT_OPTIONS: SortOption[] = [
  { id: 'date', label: 'Mais Recentes', icon: 'calendar_month' },
  { id: 'amount_desc', label: 'Maior Valor', icon: 'trending_down' },
  { id: 'amount_asc', label: 'Menor Valor', icon: 'trending_up' }
];

export interface ExtractFilterBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  categoryFilter: string;
  setCategoryFilter: (category: string) => void;
  sortOrder: ExtractSortOrder;
  setSortOrder: (order: ExtractSortOrder) => void;
  typeFilter: ExtractTypeFilter;
  setTypeFilter: (filter: ExtractTypeFilter) => void;
  totalCount: number;
}

export default function ExtractFilterBar({
  searchQuery,
  setSearchQuery,
  categoryFilter,
  setCategoryFilter,
  sortOrder,
  setSortOrder,
  typeFilter,
  setTypeFilter,
  totalCount
}: ExtractFilterBarProps) {
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      {/* SEARCH AND EXTRA FILTERS */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 flex items-center">
          <span className="material-symbols-outlined absolute left-3.5 text-slate-400 text-[20px] pointer-events-none">
            search
          </span>
          <input 
            className="w-full bg-white text-slate-900 placeholder:text-slate-400 text-sm rounded-2xl pl-10 pr-9 py-3 shadow-sm border border-border-subtle focus:outline-none focus:border-emerald-500 transition-all" 
            placeholder="Buscar lançamentos..." 
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')} 
              className="absolute right-3 text-slate-400 hover:text-slate-600 transition-colors" 
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">cancel</span>
            </button>
          )}
        </div>

        {/* Categoria Filter Toggle */}
        <div className="relative shrink-0">
          <button 
            onClick={() => { setIsFilterMenuOpen(!isFilterMenuOpen); setIsSortOpen(false); }} 
            className={`w-11 h-11 flex items-center justify-center rounded-2xl border shadow-sm transition-colors ${
              categoryFilter !== 'all' 
                ? 'bg-emerald-600 border-emerald-600 text-white' 
                : 'bg-white border-border-subtle text-slate-500 hover:text-slate-900'
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">filter_list</span>
          </button>
          {isFilterMenuOpen && (
            <div className="absolute top-full right-0 mt-2 w-48 max-h-64 overflow-y-auto bg-white border border-border-subtle rounded-xl shadow-xl p-1.5 flex flex-col gap-1 z-50">
              <button 
                onClick={() => { setCategoryFilter('all'); setIsFilterMenuOpen(false); }} 
                className={`text-left px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                  categoryFilter === 'all' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
                type="button"
              >
                Todas as Categorias
              </button>
              {Object.entries(CATEGORIES).map(([key, cat]) => (
                <button 
                  key={key} 
                  onClick={() => { setCategoryFilter(key); setIsFilterMenuOpen(false); }} 
                  className={`text-left px-3 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-between ${
                    categoryFilter === key ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                  type="button"
                >
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Sort Toggle */}
        <div className="relative shrink-0">
          <button 
            onClick={() => { setIsSortOpen(!isSortOpen); setIsFilterMenuOpen(false); }} 
            className={`w-11 h-11 flex items-center justify-center rounded-2xl border shadow-sm transition-colors ${
              sortOrder !== 'date' 
                ? 'bg-emerald-600 border-emerald-600 text-white' 
                : 'bg-white border-border-subtle text-slate-500 hover:text-slate-900'
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">swap_vert</span>
          </button>
          {isSortOpen && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-border-subtle rounded-xl shadow-xl p-1.5 flex flex-col gap-1 z-50">
              {SORT_OPTIONS.map(opt => (
                <button 
                  key={opt.id} 
                  onClick={() => { setSortOrder(opt.id); setIsSortOpen(false); }} 
                  className={`text-left px-3 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-between ${
                    sortOrder === opt.id ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                  type="button"
                >
                  <span>{opt.label}</span>
                  <span className="material-symbols-outlined text-[14px]">{opt.icon}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* FILTER CHIPS */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1 -mx-4 px-4">
        <button 
          onClick={() => setTypeFilter('all')} 
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-semibold shadow-sm transition-all whitespace-nowrap active:scale-95 border ${
            typeFilter === 'all' 
              ? 'bg-emerald-700 text-white border-emerald-700' 
              : 'bg-white text-slate-600 border-border-subtle hover:text-slate-900'
          }`} 
          type="button"
        >
          <span>Todos</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
            typeFilter === 'all' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'
          }`}>{totalCount}</span>
        </button>
        <button 
          onClick={() => setTypeFilter('income')} 
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-semibold shadow-sm transition-all whitespace-nowrap active:scale-95 border ${
            typeFilter === 'income' 
              ? 'bg-emerald-700 text-white border-emerald-700' 
              : 'bg-white text-slate-600 border-border-subtle hover:text-slate-900'
          }`} 
          type="button"
        >
          <span className={`w-2 h-2 rounded-full ${typeFilter === 'income' ? 'bg-white' : 'bg-emerald-500'}`}></span>
          <span>Entradas</span>
        </button>
        <button 
          onClick={() => setTypeFilter('expense')} 
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-semibold shadow-sm transition-all whitespace-nowrap active:scale-95 border ${
            typeFilter === 'expense' 
              ? 'bg-emerald-700 text-white border-emerald-700' 
              : 'bg-white text-slate-600 border-border-subtle hover:text-slate-900'
          }`} 
          type="button"
        >
          <span className={`w-2 h-2 rounded-full ${typeFilter === 'expense' ? 'bg-white' : 'bg-rose-500'}`}></span>
          <span>Saídas</span>
        </button>
      </div>
    </div>
  );
}
