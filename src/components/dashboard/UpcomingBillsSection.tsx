import { formatCurrency } from '../../utils/money';
import type { DisplayTransaction } from '../../types/models';

const getDaysRemaining = (dateString: string): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(dateString);
  targetDate.setHours(0, 0, 0, 0);
  const diffTime = targetDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export interface UpcomingBillsSectionProps {
  bills?: DisplayTransaction[];
  loading?: boolean;
  onEdit?: (bill: DisplayTransaction) => void;
  onViewAll?: () => void;
  onAddBill?: () => void;
}

export function UpcomingBillsSection({ 
  bills = [], 
  loading = false, 
  onEdit, 
  onViewAll, 
  onAddBill 
}: UpcomingBillsSectionProps) {
  const pendingBills = (bills || [])
    .filter(t => !t.is_paid)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .slice(0, 3);

  return (
    <section className="flex flex-col gap-3 mt-1">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-base font-bold text-slate-900 tracking-tight">Próximos Vencimentos</h3>
        <button 
          type="button" 
          onClick={onViewAll} 
          className="text-xs font-semibold text-primary hover:text-primary-dark transition-colors inline-flex items-center gap-0.5 cursor-pointer"
        >
          <span>Ver todas</span>
          <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
        </button>
      </div>

      <div className="flex flex-col gap-2.5">
        {loading && pendingBills.length === 0 ? (
          <div className="text-center text-slate-500 text-sm py-4">Carregando...</div>
        ) : pendingBills.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 border border-dashed border-border-subtle flex flex-col items-center justify-center gap-2">
            <span className="material-symbols-outlined text-emerald-500 text-[28px]">task_alt</span>
            <span className="text-sm font-medium text-slate-600">Tudo em dia!</span>
            <button 
              type="button" 
              onClick={onAddBill} 
              className="text-xs text-primary font-bold mt-1 cursor-pointer hover:underline"
            >
              Adicionar Nova Conta
            </button>
          </div>
        ) : (
          pendingBills.map(t => {
            const daysRemaining = getDaysRemaining(t.created_at);
            const isOverdue = daysRemaining < 0;

            return (
              <div 
                key={t.id} 
                onClick={() => onEdit && onEdit(t)} 
                className={`bg-white rounded-2xl p-3.5 border shadow-sm flex items-center justify-between transition cursor-pointer active:scale-[0.98] ${isOverdue ? 'border-rose-300 bg-rose-50/30' : 'border-border-subtle hover:border-slate-300'}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${isOverdue ? 'bg-rose-100 border-rose-200 text-rose-600' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
                    <span className="material-symbols-outlined text-[20px]">{isOverdue ? 'error' : 'event'}</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className={`text-sm font-semibold truncate ${isOverdue ? 'text-rose-600' : 'text-slate-900'}`}>{t.name}</span>
                    <span className={`text-[10px] font-bold ${isOverdue ? 'text-rose-500' : 'text-slate-500'}`}>
                      {isOverdue 
                        ? `Atrasado há ${Math.abs(daysRemaining)} dia(s)` 
                        : daysRemaining === 0 
                          ? 'Vence hoje' 
                          : `Vence em ${daysRemaining} dia(s)`}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-3">
                  <span className={`text-sm font-bold tracking-tight ${isOverdue ? 'text-rose-600' : 'text-slate-900'}`}>
                    {formatCurrency(t.amount)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

export default UpcomingBillsSection;
