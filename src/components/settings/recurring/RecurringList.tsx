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
      <div className="flex flex-col items-center justify-center py-20 opacity-20">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mb-4" />
      </div>
    );
  }

  if (recurring.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-600 gap-3 border border-dashed border-border rounded-2xl bg-card/30">
        <Zap size={32} className="opacity-20"/>
        <p className="text-xs font-medium uppercase tracking-widest opacity-60">Nenhuma conta fixa</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-8 px-1">
      {recurring.map(item => {
        const CatData = getCategory(item.category);
        const CatIcon = CatData.icon;
        return (
          <div 
            key={item.id} 
            onClick={() => onEdit(item)}
            className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border hover:border-border-strong transition-all group cursor-pointer active:scale-[0.98] shadow-sm ml-1 mr-1"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-card-hover text-foreground/60 border border-border transition-colors group-hover:bg-border">
                <CatIcon size={20} />
              </div>
              <div className="flex flex-col min-w-0">
                <p className="text-sm font-bold text-foreground mb-0.5 truncate">{item.name}</p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-card-alt text-foreground/60 px-2 py-0.5 rounded font-bold border border-border">Dia {item.day}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <span className="text-sm font-black text-foreground">{formatCents(item.amount)}</span>
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(item.id); }} 
                className="text-gray-700 hover:text-red-500 transition-colors p-1"
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
