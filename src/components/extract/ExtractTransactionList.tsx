import { getCategory } from '../../utils/constants';
import { formatCurrency } from '../../utils/money';
import { formatLocalDate } from '../../utils/date';
import type { DisplayTransaction } from '../../types/models';

function getTransactionIcon(t: DisplayTransaction): string {
  const isIncome = t.type === 'income';
  const nameLower = (t.name || '').toLowerCase();
  if (t.category === 'shopping' || nameLower.includes('mercado')) return 'shopping_cart';
  if (t.category === 'home' || nameLower.includes('casa')) return 'home';
  if (isIncome) return 'payments';
  if (t.category === 'health' || nameLower.includes('farm')) return 'medical_services';
  if (nameLower.includes('netflix') || nameLower.includes('spotify')) return 'subscriptions';
  if (t.category === 'transport' || nameLower.includes('posto') || nameLower.includes('uber')) return 'local_gas_station';
  return 'receipt_long';
}

export interface ExtractTransactionGroup {
  label: string;
  totalCents: number | null;
  transactions: DisplayTransaction[];
}

export interface ExtractTransactionListProps {
  loading: boolean;
  baseCount: number;
  filteredCount: number;
  groupedTransactions: ExtractTransactionGroup[];
  onItemClick: (transaction: DisplayTransaction) => void;
}

export default function ExtractTransactionList({
  loading,
  baseCount,
  filteredCount,
  groupedTransactions,
  onItemClick
}: ExtractTransactionListProps) {
  return (
    <div className="flex flex-col gap-5 mt-2 pb-16">
      {loading && baseCount === 0 ? (
        <div className="text-center py-16 text-xs text-slate-500 animate-pulse">
          Carregando extrato bancário...
        </div>
      ) : filteredCount > 0 ? (
        groupedTransactions.map(group => (
          <div key={group.label} className="flex flex-col gap-2.5">
            {/* Group Header */}
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                {group.label}
              </span>
              {group.totalCents !== null && (
                <span className={`text-[11px] font-bold ${group.totalCents >= 0 ? 'text-emerald-500' : 'text-slate-500'}`}>
                  {group.totalCents >= 0 ? '+ ' : ''}{formatCurrency(group.totalCents)}
                </span>
              )}
            </div>

            {/* Group Items */}
            <div className="flex flex-col gap-2.5">
              {group.transactions.map(t => {
                const catData = getCategory(t.category);
                const isIncome = t.type === 'income';
                const iconName = getTransactionIcon(t);

                return (
                  <div 
                    key={t.id} 
                    onClick={() => onItemClick(t)} 
                    className="flex items-center justify-between p-3.5 bg-white rounded-2xl shadow-sm border border-border-subtle hover:border-slate-300 transition-colors cursor-pointer active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                        isIncome ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'
                      }`}>
                        <span className="material-symbols-outlined text-[22px]">{iconName}</span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[14px] leading-tight text-slate-900 truncate font-bold">{t.name}</span>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className="text-[11px] text-slate-500 capitalize">{catData.label}</span>
                          <span className="text-slate-300 text-[10px]">•</span>
                          <span className="text-[11px] text-slate-500">
                            {new Date(t.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {t.notes && (
                            <>
                              <span className="text-slate-300 text-[10px]">•</span>
                              <span className="text-[11px] text-slate-400 italic truncate max-w-[140px]" title={t.notes}>
                                {t.notes}
                              </span>
                            </>
                          )}
                          {t.due_date && (
                            <>
                              <span className="text-slate-300 text-[10px]">•</span>
                              <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-1 py-0.2 rounded border border-amber-200">
                                Vence: {formatLocalDate(t.due_date, { day: '2-digit', month: 'short' })}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end shrink-0 pl-2">
                      <span className={`text-[14px] font-bold ${isIncome ? 'text-emerald-600' : 'text-slate-900'}`}>
                        {isIncome ? '+ ' : '- '}{formatCurrency(t.amount)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      ) : (
        <div className="py-16 flex flex-col items-center justify-center text-center px-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3 border border-slate-200">
            <span className="material-symbols-outlined text-[28px]">search_off</span>
          </div>
          <span className="text-[16px] text-slate-900 font-bold">Nenhum lançamento encontrado</span>
          <p className="text-sm text-slate-500 mt-1 max-w-[240px]">Tente ajustar os filtros ou digitar um termo diferente de busca.</p>
        </div>
      )}
    </div>
  );
}
