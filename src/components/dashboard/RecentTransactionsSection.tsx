import { formatCurrency } from '../../utils/money';
import { formatLocalDate } from '../../utils/date';
import type { DisplayTransaction } from '../../types/models';

export interface RecentTransactionsSectionProps {
  transactions?: DisplayTransaction[];
  loading?: boolean;
  onEdit?: (tx: DisplayTransaction) => void;
  onViewExtract?: () => void;
}

export function RecentTransactionsSection({ 
  transactions = [], 
  loading = false, 
  onEdit, 
  onViewExtract 
}: RecentTransactionsSectionProps) {
  const recentList = (transactions || []).slice(0, 3);

  return (
    <section className="flex flex-col gap-3 mt-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-base font-bold text-slate-900 tracking-tight">Últimos Lançamentos</h3>
        <button type="button" onClick={onViewExtract} className="text-xs font-semibold text-primary hover:text-primary-dark transition-colors inline-flex items-center gap-0.5 cursor-pointer">
          <span>Ver extrato</span>
          <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
        </button>
      </div>

      <div className="flex flex-col gap-2.5">
        {loading && recentList.length === 0 ? (
          <div className="text-center text-slate-500 text-sm py-4">Carregando...</div>
        ) : recentList.length === 0 ? (
          <div className="text-center text-slate-500 text-sm py-4">Nenhum lançamento recente no banco.</div>
        ) : (
          recentList.map((tx) => {
            const isIncome = tx.type === 'income';
            const isPaid = tx.is_paid || Boolean(tx.pluggy_transaction_id);
            
            let iconName = 'receipt_long';
            const nameLower = (tx.name || '').toLowerCase();
            if (tx.category === 'shopping' || nameLower.includes('mercado')) iconName = 'shopping_cart';
            if (tx.category === 'home' || nameLower.includes('casa')) iconName = 'home';
            if (isIncome) iconName = 'payments';
            if (nameLower.includes('netflix') || nameLower.includes('spotify')) iconName = 'subscriptions';
            if (nameLower.includes('posto') || nameLower.includes('uber')) iconName = 'local_gas_station';

            return (
              <div 
                key={tx.id} 
                onClick={() => onEdit && onEdit(tx)} 
                className="bg-white rounded-2xl p-3.5 border border-border-subtle shadow-sm flex items-center justify-between transition hover:border-slate-300 cursor-pointer active:scale-[0.98]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${isIncome ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
                    <span className="material-symbols-outlined text-[20px]">{iconName}</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-semibold text-slate-900 truncate">{tx.name}</span>
                    <span className="text-xs text-slate-500 truncate capitalize">{tx.category || 'Outros'} • {formatLocalDate(tx.created_at, { day: '2-digit', month: 'short' })}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-3">
                  <span className={`text-sm font-bold tracking-tight ${isIncome ? 'text-income-green' : 'text-expense-red'}`}>
                    {isIncome ? '+ ' : '- '}{formatCurrency(tx.amount)}
                  </span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${isPaid ? 'bg-status-paid-bg text-status-paid-text border-emerald-100' : 'bg-status-pending-bg text-status-pending-text border-amber-200'}`}>
                    {isPaid ? 'Pago' : 'Pendente'}
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

export default RecentTransactionsSection;
