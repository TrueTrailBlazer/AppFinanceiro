import React, { useState } from 'react';
import { X, Type, Calendar } from 'lucide-react';
import { CATEGORIES } from '../../../utils/constants';
import { parseCents, formatCents } from '../../../utils/money';
import type { RecurringExpenseRow } from '../../../types/models';
import type { RecurringExpenseInput } from '../../../services/recurring';

interface RecurringModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingExpense: RecurringExpenseRow | null;
  onSave: (expenseData: RecurringExpenseInput) => void;
}

export function RecurringModal({ isOpen, onClose, editingExpense, onSave }: RecurringModalProps) {
  const initialCents = editingExpense ? parseCents(editingExpense.amount) : 0;
  
  const [newName, setNewName] = useState(editingExpense ? editingExpense.name : '');
  const [amountCents, setAmountCents] = useState<number>(initialCents); 
  const [displayAmount, setDisplayAmount] = useState(initialCents > 0 ? formatCents(initialCents, false) : ''); 
  const [newCategory, setNewCategory] = useState(editingExpense ? editingExpense.category : 'bills'); 
  const [newDay, setNewDay] = useState(editingExpense ? (editingExpense.day?.toString() || '5') : '5');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !amountCents || !newDay) return;
    onSave({
      name: newName,
      amount: amountCents,
      category: newCategory,
      day: parseInt(newDay, 10) || 1
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex flex-col justify-end md:justify-center md:items-center">
      <div className="flex-1 w-full flex flex-col max-w-md mx-auto bg-white animate-in slide-in-from-bottom-10 duration-300 md:flex-initial md:rounded-3xl md:border md:border-slate-200 max-h-[100dvh]">
        
        <div className="px-5 py-5 border-b border-slate-200 text-center bg-white flex items-center justify-between shrink-0">
          <div className="w-8" />
          <h2 className="text-lg font-bold text-slate-900">
            {editingExpense ? 'Editar Despesa' : 'Nova Despesa'}
          </h2>
          <button onClick={onClose} className="text-slate-500 p-1 hover:text-slate-900 transition-colors" type="button" aria-label="Fechar modal">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 pb-8">
          <form id="recurring-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-6">
              <div className="relative bg-slate-50 rounded-xl p-4 border border-slate-200 focus-within:border-emerald-500 transition-all shadow-inner">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Valor da Conta</label>
                <div className="flex items-center">
                  <span className="text-xl mr-2 font-medium text-emerald-700">R$</span>
                  <input
                    type="text" 
                    inputMode="numeric"
                    value={displayAmount} 
                    onChange={e => {
                      const rawValue = e.target.value.replace(/\D/g, '');
                      if (!rawValue) {
                        setDisplayAmount('');
                        setAmountCents(0);
                        return;
                      }
                      const cents = parseInt(rawValue, 10);
                      setAmountCents(cents);
                      setDisplayAmount(formatCents(cents, false));
                    }}
                    placeholder="0,00"
                    className="w-full bg-transparent text-4xl font-black text-slate-900 placeholder-slate-300 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5 ml-1"><Type size={12}/> Nome da Conta</label>
                <input 
                  type="text" 
                  placeholder="Ex: Netflix, Aluguel, Internet..." 
                  value={newName} 
                  onChange={e => setNewName(e.target.value)} 
                  autoFocus
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm text-slate-900 outline-none focus:border-emerald-500 transition-all font-medium shadow-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5 ml-1"><Calendar size={12}/> Dia de Vencimento (1 a 31)</label>
                <input 
                  type="text" 
                  inputMode="numeric" 
                  pattern="\d*" 
                  placeholder="Ex: 10" 
                  value={newDay} 
                  onChange={e => {
                    const val = e.target.value;
                    if (val === '' || (parseInt(val, 10) >= 1 && parseInt(val, 10) <= 31)) {
                      setNewDay(val);
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm text-slate-900 outline-none focus:border-emerald-500 transition-all font-bold shadow-sm"
                />
                <span className="text-[9px] text-slate-500 block ml-1">Lançaremos automaticamente neste dia todo mês.</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 block tracking-wider">Selecione o Ícone</label>
              <div className="grid grid-cols-4 gap-2">
                {Object.entries(CATEGORIES)
                  .filter(([k]) => !['salary', 'investment', 'extra'].includes(k))
                  .map(([key, cat]) => {
                    const isSelected = newCategory === key;
                    return (
                      <button 
                        key={key} 
                        type="button" 
                        onClick={() => setNewCategory(key)}
                        className={`relative p-3 rounded-xl border transition-all flex flex-col items-center gap-1.5
                        ${isSelected 
                          ? 'bg-emerald-50 border-emerald-500 ' 
                          : 'bg-white border-slate-200 opacity-60 hover:opacity-100'}`}
                      >
                        <cat.icon size={18} className={isSelected ? 'text-emerald-700' : 'text-slate-500'} />
                        <span className={`text-[8px] font-black uppercase tracking-tight truncate max-w-full ${isSelected ? 'text-slate-900' : 'text-slate-500'}`}>{cat.label}</span>
                      </button>
                    );
                  })}
              </div>
            </div>
          </form>
        </div>

        <div className="p-4 pb-8 bg-white border-t border-slate-200 shrink-0 flex gap-3 shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
          <button type="button" onClick={onClose} className="flex-1 px-5 py-4 rounded-xl border border-slate-300 text-slate-500 dark:text-slate-500 font-bold hover:bg-slate-100 active:scale-95 transition-all text-center">
            Cancelar
          </button>
          
          <button 
            type="submit" 
            form="recurring-form" 
            disabled={!newName || !amountCents || !newDay}
            className="flex-[2] bg-emerald-600 disabled:bg-emerald-600/40 disabled:text-white/90 hover:bg-emerald-700 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg disabled:shadow-none active:scale-95 transition-all tracking-wide"
          >
            Salvar Despesa
          </button>
        </div>
      </div>
    </div>
  );
}
