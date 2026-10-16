import { Target, Calendar, Pencil, Trash, CheckCircle2 } from 'lucide-react';
import { formatCents } from '../../../utils/money';
import { parseLocalDate, formatLocalDate } from '../../../utils/date';
import type { FinancialGoalRow } from '../../../types/models';

export interface GoalCardProps {
  goal: FinancialGoalRow;
  onEdit: (goal: FinancialGoalRow) => void;
  onDelete: (id: string) => void | Promise<void>;
  onContribute: (goal: FinancialGoalRow) => void;
}

export function GoalCard({ goal, onEdit, onDelete, onContribute }: GoalCardProps) {
  const currentAmount = goal.current_amount ?? 0;
  const targetAmount = goal.target_amount;
  const progress = targetAmount > 0 ? Math.min(100, Math.round((currentAmount / targetAmount) * 100)) : 0;
  const remaining = Math.max(0, targetAmount - currentAmount);

  return (
    <div className="bg-card border border-border rounded-3xl p-5 space-y-4 hover:border-blue-500/30 transition-colors">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-500">
            <Target size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">{goal.name}</h3>
            {goal.deadline && (
              <p className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5">
                <Calendar size={10} /> Até {formatLocalDate(parseLocalDate(goal.deadline.split('T')[0]), { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-1">
          <button 
            onClick={() => onEdit(goal)} 
            aria-label="Editar meta"
            className="p-1.5 text-gray-600 hover:text-foreground transition-colors"
          >
            <Pencil size={14} />
          </button>
          <button 
            onClick={() => onDelete(goal.id)} 
            aria-label="Excluir meta"
            className="p-1.5 text-gray-600 hover:text-red-500 transition-colors"
          >
            <Trash size={14} />
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-[10px] font-bold">
          <span className="text-gray-400 uppercase tracking-wider">{progress}% Concluído</span>
          <span className="text-foreground">{formatCents(currentAmount)} / {formatCents(targetAmount)}</span>
        </div>
        <div className="h-2 bg-border rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {progress < 100 ? (
        <div className="flex items-center justify-between pt-2">
          <div className="text-[10px] text-gray-500">
            Faltam <span className="text-blue-400 font-bold">{formatCents(remaining)}</span>
          </div>
          <button 
            onClick={() => onContribute(goal)}
            className="bg-blue-600/10 text-blue-500 text-[10px] font-bold py-1.5 px-3 rounded-lg border border-blue-500/20 hover:bg-blue-600 hover:text-foreground transition-all active:scale-95"
          >
            Adicionar Valor
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-emerald-500 font-bold text-[10px] pt-1">
          <CheckCircle2 size={12} /> Meta Concluída! Parabéns!
        </div>
      )}
    </div>
  );
}
