import type { MouseEvent, ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../../utils/money';
import BillItemCard from './BillItemCard';
import type { DisplayTransaction } from '../../types/models';
import type { BillFilterType } from './BillsFilterTabs';

export interface BillGroup {
  id: string;
  label: string;
  icon: string;
  color: string;
  iconColor: string;
  total: number;
  items: DisplayTransaction[];
}

export interface BillsGroupedListProps {
  loading: boolean;
  billsCount: number;
  groupedBills: BillGroup[];
  filteredCount: number;
  activeFilter: BillFilterType;
  uploadingId: string | number | null;
  onEdit: (bill: DisplayTransaction) => void;
  onTogglePaid: (e: MouseEvent, bill: DisplayTransaction) => void;
  onUploadReceipt: (e: ChangeEvent<HTMLInputElement>, bill: DisplayTransaction) => void;
}

export default function BillsGroupedList({
  loading,
  billsCount,
  groupedBills,
  filteredCount,
  activeFilter,
  uploadingId,
  onEdit,
  onTogglePaid,
  onUploadReceipt
}: BillsGroupedListProps) {
  return (
    <div className="flex flex-col gap-5 mt-1 pb-16">
      {loading && billsCount === 0 ? (
        <div className="text-center py-16 text-xs text-slate-500 animate-pulse">
          Carregando contas...
        </div>
      ) : filteredCount > 0 ? (
        groupedBills.map(group => (
          <section key={group.id} className="flex flex-col gap-2">
            <div className="flex items-center justify-between px-1">
              <h3 className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${group.color}`}>
                <span className={`material-symbols-outlined text-[15px] ${group.iconColor}`}>{group.icon}</span>
                {group.label}
              </h3>
              <span className={`text-xs font-bold ${group.color}`}>{formatCurrency(group.total)}</span>
            </div>

            {group.items.map(bill => (
              <BillItemCard 
                key={bill.id}
                bill={bill}
                uploadingId={uploadingId}
                onEdit={onEdit}
                onTogglePaid={onTogglePaid}
                onUploadReceipt={onUploadReceipt}
              />
            ))}
          </section>
        ))
      ) : (
        <div className="text-center py-16 px-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3 border border-slate-200 mx-auto">
            <span className="material-symbols-outlined text-[28px]">receipt_long</span>
          </div>
          <p className="text-sm font-bold text-slate-900">Nenhuma conta encontrada</p>
          <p className="text-xs text-slate-500 mt-1 max-w-[240px] mx-auto">
            {activeFilter === 'pending' 
              ? 'Parabéns! Todas as contas deste mês já foram pagas.' 
              : 'Você não tem contas cadastradas com este filtro neste mês.'}
          </p>
          <Link 
            to="/add" 
            className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-md active:scale-95"
          >
            <span className="material-symbols-outlined text-[16px]">add</span> Adicionar Conta
          </Link>
        </div>
      )}
    </div>
  );
}
