import React, { useState } from 'react';
import { fromCents } from '../../../utils/money';
import type { FinancialGoalRow } from '../../../types/models';

export interface GoalFormData {
  name: string;
  targetAmount: string;
  currentAmount: string;
  deadline: string;
}

export interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingGoal: FinancialGoalRow | null;
  onSave: (data: GoalFormData) => void | Promise<void>;
}

export function GoalModal({ isOpen, onClose, editingGoal, onSave }: GoalModalProps) {
  const [prevGoal, setPrevGoal] = useState<FinancialGoalRow | null>(editingGoal);
  const [name, setName] = useState<string>(editingGoal ? editingGoal.name : '');
  const [targetAmount, setTargetAmount] = useState<string>(
    editingGoal ? fromCents(editingGoal.target_amount).toString() : ''
  );
  const [currentAmount, setCurrentAmount] = useState<string>(
    editingGoal ? fromCents(editingGoal.current_amount).toString() : '0'
  );
  const [deadline, setDeadline] = useState<string>(
    editingGoal?.deadline ? editingGoal.deadline.split('T')[0] : ''
  );

  if (editingGoal !== prevGoal) {
    setPrevGoal(editingGoal);
    setName(editingGoal ? editingGoal.name : '');
    setTargetAmount(editingGoal ? fromCents(editingGoal.target_amount).toString() : '');
    setCurrentAmount(editingGoal ? fromCents(editingGoal.current_amount).toString() : '0');
    setDeadline(editingGoal?.deadline ? editingGoal.deadline.split('T')[0] : '');
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSave({ name, targetAmount, currentAmount, deadline });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex flex-col justify-end md:justify-center md:items-center">
      <div className="flex-1 w-full flex flex-col max-w-md mx-auto bg-background animate-in slide-in-from-bottom-10 duration-200 md:flex-initial md:h-auto md:max-h-[85vh] md:rounded-3xl border-t md:border border-border overflow-hidden">
        <div className="p-5 border-b border-border text-center shrink-0">
          <h2 className="text-sm font-bold text-foreground">
            {editingGoal ? 'Editar Meta' : 'Nova Meta Financeira'}
          </h2>
        </div>
        <div className="flex-1 p-6 overflow-y-auto">
          <form id="goal-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">
                  O que você quer alcançar?
                </label>
                <input 
                  type="text" 
                  placeholder="Ex: Reserva de Emergência" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  autoFocus
                  className="w-full bg-card-hover border border-border rounded-xl px-4 py-3.5 text-sm text-foreground outline-none focus:border-blue-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">
                    Meta final (R$)
                  </label>
                  <input 
                    type="number" 
                    placeholder="5000" 
                    value={targetAmount} 
                    onChange={e => setTargetAmount(e.target.value)}
                    className="w-full bg-card-hover border border-border rounded-xl px-4 py-3.5 text-sm text-foreground outline-none focus:border-blue-500 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">
                    Já tenho (R$)
                  </label>
                  <input 
                    type="number" 
                    placeholder="0" 
                    value={currentAmount} 
                    onChange={e => setCurrentAmount(e.target.value)}
                    className="w-full bg-card-hover border border-border rounded-xl px-4 py-3.5 text-sm text-foreground outline-none focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">
                  Prazo Planejado (Opcional)
                </label>
                <input 
                  type="date" 
                  value={deadline} 
                  onChange={e => setDeadline(e.target.value)}
                  className="w-full bg-card-hover border border-border rounded-xl px-4 py-3.5 text-sm text-foreground outline-none focus:border-blue-500 transition-all [&::-webkit-calendar-picker-indicator]:invert"
                />
              </div>
            </div>
          </form>
        </div>
        <div className="p-4 pb-8 md:pb-4 border-t border-border bg-card flex gap-3">
          <button 
            type="button" 
            onClick={onClose} 
            className="flex-1 px-5 py-3.5 rounded-xl border border-border-strong text-gray-300 font-bold text-xs uppercase tracking-wider"
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            form="goal-form" 
            className="flex-[2] bg-blue-600 text-foreground font-bold py-3.5 rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-blue-900/20 active:scale-95 transition-all"
          >
            Salvar Meta
          </button>
        </div>
      </div>
    </div>
  );
}
