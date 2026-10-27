import type { MouseEvent, ChangeEvent } from 'react';
import { formatCurrency } from '../../utils/money';
import { formatLocalDate } from '../../utils/date';
import type { DisplayTransaction } from '../../types/models';

function getBillIcon(bill: DisplayTransaction): string {
  const nameLower = (bill.name || '').toLowerCase();
  if (bill.category === 'home' || nameLower.includes('condomínio') || nameLower.includes('aluguel')) return 'home';
  if (bill.category === 'utilities' || nameLower.includes('energia') || nameLower.includes('luz')) return 'bolt';
  if (bill.category === 'utilities' || nameLower.includes('internet')) return 'wifi';
  if (nameLower.includes('cartão') || nameLower.includes('fatura')) return 'credit_card';
  if (bill.category === 'health' || nameLower.includes('academia')) return 'fitness_center';
  return 'receipt_long';
}

export interface BillItemCardProps {
  bill: DisplayTransaction;
  uploadingId: string | number | null;
  onEdit: (bill: DisplayTransaction) => void;
  onTogglePaid: (e: MouseEvent, bill: DisplayTransaction) => void;
  onUploadReceipt: (e: ChangeEvent<HTMLInputElement>, bill: DisplayTransaction) => void;
}

export default function BillItemCard({
  bill,
  uploadingId,
  onEdit,
  onTogglePaid,
  onUploadReceipt
}: BillItemCardProps) {
  const iconName = getBillIcon(bill);
  const effectiveDueDate = bill.due_date || bill.created_at;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDateTime = new Date(effectiveDueDate);
  dueDateTime.setHours(0, 0, 0, 0);
  const isOverdue = !bill.is_paid && dueDateTime < today;

  const createdDate = new Date(bill.created_at);
  const isCrossMonthDue = Boolean(
    bill.due_date && (
      dueDateTime.getMonth() !== createdDate.getMonth() ||
      dueDateTime.getFullYear() !== createdDate.getFullYear()
    )
  );

  return (
    <article 
      onClick={() => onEdit(bill)}
      className={`bg-white border border-border-subtle rounded-2xl p-3.5 flex items-center justify-between shadow-sm hover:border-slate-300 transition-all cursor-pointer ${
        bill.is_paid ? 'opacity-70 hover:opacity-100' : ''
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
          bill.is_paid ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'
        }`}>
          <span className="material-symbols-outlined text-[22px]">{iconName}</span>
        </div>
        <div className="flex flex-col min-w-0">
          <h4 className={`text-[14px] font-bold leading-snug truncate ${
            bill.is_paid ? 'text-slate-500 line-through' : 'text-slate-900'
          }`}>
            {bill.name}
          </h4>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className={`text-[11px] font-medium ${bill.is_paid ? 'text-slate-400' : 'text-slate-500'}`}>
              {bill.is_paid ? 'Pago em ' : 'Vence: '}{formatLocalDate(effectiveDueDate, { day: '2-digit', month: 'short' })}
            </span>
            {isCrossMonthDue && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 capitalize">
                {formatLocalDate(bill.created_at, { month: 'long' })}
              </span>
            )}
            {!bill.is_paid && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                isOverdue ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {isOverdue ? 'Vencida' : 'Pendente'}
              </span>
            )}
            {bill.is_paid && (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[10px]">done</span> Pago
              </span>
            )}
            {bill.notes && (
              <span className="text-[10px] text-slate-400 truncate max-w-[220px]" title={bill.notes}>
                • {bill.notes}
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-3 shrink-0 pl-2">
        <div className="text-right">
          <p className={`text-[14px] font-bold ${bill.is_paid ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
            - {formatCurrency(bill.amount)}
          </p>
          {bill.is_paid && bill.receipt_url && (
            <p 
              onClick={(e) => { 
                e.stopPropagation(); 
                window.open(bill.receipt_url as string, '_blank'); 
              }}
              className="text-[10px] text-blue-600 font-bold hover:underline mt-0.5 flex items-center justify-end gap-0.5"
            >
              <span className="material-symbols-outlined text-[10px]">receipt</span> Comprovante
            </p>
          )}
          {bill.is_paid && !bill.receipt_url && (
            <label 
              onClick={(e) => e.stopPropagation()} 
              className="text-[10px] text-slate-500 hover:text-slate-700 font-bold mt-0.5 flex items-center justify-end gap-0.5 cursor-pointer"
            >
              {uploadingId === bill.id ? (
                <div className="w-2.5 h-2.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span className="material-symbols-outlined text-[10px]">attach_file</span> Anexar
                </>
              )}
              <input 
                type="file" 
                accept="image/jpeg,image/png,image/webp,application/pdf" 
                className="hidden" 
                onChange={(e) => onUploadReceipt(e, bill)} 
                disabled={uploadingId === bill.id} 
              />
            </label>
          )}
        </div>
        
        <button 
          onClick={(e) => onTogglePaid(e, bill)}
          aria-label="Marcar como Pago" 
          className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all ${
            bill.is_paid 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100' 
              : 'border-border-subtle hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-600 text-slate-400'
          }`} 
          title={bill.is_paid ? "Desmarcar" : "Marcar como Pago"}
          type="button"
        >
          <span className={`material-symbols-outlined text-[18px] ${bill.is_paid ? 'material-symbols-filled' : ''}`}>
            {bill.is_paid ? 'verified' : 'check'}
          </span>
        </button>
      </div>
    </article>
  );
}
