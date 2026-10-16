import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCategory } from '../../utils/constants';
import { formatCurrency } from '../../utils/money';
import { formatLocalDate } from '../../utils/date';
import BankTransactionDetailModal from '../extract/BankTransactionDetailModal';
import type { AnalysisTopExpense } from '../../types/models';

function getExpenseIcon(item: AnalysisTopExpense): string {
  const nameLower = (item.name || '').toLowerCase();
  if (item.category === 'home' || nameLower.includes('condomínio') || nameLower.includes('aluguel')) return 'home_work';
  if (item.category === 'utilities' || nameLower.includes('energia') || nameLower.includes('luz')) return 'bolt';
  if (item.category === 'utilities' || nameLower.includes('internet')) return 'wifi';
  if (item.category === 'food' || nameLower.includes('supermercado') || nameLower.includes('mercado')) return 'shopping_cart';
  if (item.category === 'transport' || nameLower.includes('manutenção') || nameLower.includes('uber')) return 'directions_car';
  if (nameLower.includes('cartão') || nameLower.includes('fatura')) return 'credit_card';
  if (item.category === 'health' || nameLower.includes('academia') || nameLower.includes('smart fit')) return 'fitness_center';
  return 'receipt_long';
}

export interface TopExpensesSectionProps {
  topExpensesList: AnalysisTopExpense[];
  topCategoryKey1?: string | null;
  topCategoryKey2?: string | null;
}

export default function TopExpensesSection({
  topExpensesList,
  topCategoryKey1,
  topCategoryKey2
}: TopExpensesSectionProps) {
  const navigate = useNavigate();
  const [selectedBankTx, setSelectedBankTx] = useState<AnalysisTopExpense | null>(null);

  return (
    <>
      {/* TOP EXPENSES LIST */}
      <div className="bg-white border border-border-subtle rounded-3xl p-5 shadow-sm flex flex-col gap-3.5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[16px] font-bold text-slate-900">Maiores Despesas</h3>
            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">Lançamentos de maior impacto</p>
          </div>
        </div>
        <div className="flex flex-col mt-2">
          {topExpensesList.map((item, index) => {
            const catInfo = getCategory(item.category);
            const iconName = getExpenseIcon(item);

            return (
              <div 
                key={item.id || index} 
                className="flex items-center justify-between py-3 hover:bg-slate-50 px-2 rounded-2xl transition-colors cursor-pointer" 
                onClick={() => {
                  if (item.pluggy_transaction_id) {
                    setSelectedBankTx(item);
                  } else {
                    navigate('/add', { state: { transaction: item } });
                  }
                }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[22px]">{iconName}</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[13px] font-bold text-slate-900 truncate">
                      {(item.name || '').replace(/\s*\(\d+\/\d+\)\s*$/, '')}
                    </span>
                    <span className="text-[11px] font-medium text-slate-500 mt-0.5">
                      {catInfo.label} • {formatLocalDate(item.created_at, { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end shrink-0 pl-2">
                  <span className="text-[13px] font-black text-rose-600">- {formatCurrency(item.amount)}</span>
                  <span className={`text-[10px] px-2 py-0.5 mt-1 rounded-full font-bold ${
                    item.is_paid ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {item.is_paid ? 'Pago' : 'Pendente'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* EDUCATIONAL TIP */}
      <div className="bg-white border border-border-subtle rounded-3xl p-5 shadow-sm flex items-start gap-4">
        <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100">
          <span className="material-symbols-outlined text-emerald-600 text-[22px]">lightbulb</span>
        </div>
        <div className="flex flex-col gap-1 min-w-0">
          <h4 className="text-[13px] font-bold text-slate-900">Dica do Planejador</h4>
          <p className="text-[12px] text-slate-600 leading-snug">
            Os gastos com <span className="font-bold">{getCategory(topCategoryKey1)?.label}</span> e <span className="font-bold">{getCategory(topCategoryKey2)?.label}</span> representam a maior fatia do seu orçamento. Fique de olho para não ultrapassar 50% em gastos essenciais.
          </p>
        </div>
      </div>

      {selectedBankTx && (
        <BankTransactionDetailModal
          isOpen={!!selectedBankTx}
          onClose={() => setSelectedBankTx(null)}
          transaction={selectedBankTx}
        />
      )}
    </>
  );
}
