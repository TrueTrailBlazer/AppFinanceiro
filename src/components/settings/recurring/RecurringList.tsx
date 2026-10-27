import { Zap, Trash2 } from 'lucide-react';
import { getCategory } from '../../../utils/constants';
import { formatCents } from '../../../utils/money';
import type { RecurringExpenseRow } from '../../../types/models';

interface RecurringListProps {
  recurring: RecurringExpenseRow[];
  loading: boolean;
  onEdit: (item: RecurringExpenseRow) => void;
  onDelete: (id: string) => void;
}

export function RecurringList({ recurring, loading, onEdit, onDelete }: RecurringListProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4" />
      </div>
    );
  }

  if (recurring.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-3 border border-dashed border-slate-300 rounded-2xl bg-white">
        <Zap size={32} className="text-slate-300"/>
        <p className="text-sm font-medium">Nenhuma despesa fixa cadastrada</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {recurring.map(item => {
        const CatData = getCategory(item.category);
        const CatIcon = CatData.icon;
        return (
          <div 
            key={item.id} 
            onClick={() => onEdit(item)}
            className="flex items-center justify-between p-4 rounded-2xl bg-white border border-border-subtle hover:border-slate-300 transition-all group cursor-pointer active:scale-[0.98] shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-slate-50 text-emerald-700 border border-slate-100">
                <CatIcon size={20} />
              </div>
              <div className="flex flex-col min-w-0">
                <p className="text-sm font-bold text-slate-900 mb-0.5 truncate">{item.name}</p>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] bg-slate-50 text-slate-600 px-2 py-0.5 rounded font-bold border border-slate-200">Dia {item.day}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <span className="text-sm font-bold text-slate-900">{formatCents(item.amount)}</span>
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(item.id); }} 
                className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                type="button"
                aria-label="Remover despesa fixa"
              >
                <Trash2 size={18}/>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
