import React, { useState } from 'react';
import type { FinancialGoalRow } from '../../../types/models';

export interface ContributeModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedGoal: FinancialGoalRow | null;
  onConfirm: (amount: string) => void | Promise<void>;
}

export function ContributeModal({ isOpen, onClose, selectedGoal, onConfirm }: ContributeModalProps) {
  const [contributeAmount, setContributeAmount] = useState<string>('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onConfirm(contributeAmount);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] bg-black/95 flex flex-col items-center justify-center p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-card border border-border rounded-3xl p-6 space-y-6 shadow-2xl">
        <div className="text-center">
          <h3 className="text-lg font-bold text-foreground">Adicionar Valor</h3>
          <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">Meta: {selectedGoal?.name}</p>
        </div>

        <form id="contribute-form" onSubmit={handleSubmit} className="space-y-1.5 text-center">
          <label className="text-[10px] font-bold text-gray-500 uppercase">Quanto você guardou?</label>
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl font-bold text-blue-500">R$</span>
            <input 
              type="number" 
              value={contributeAmount} 
              onChange={e => setContributeAmount(e.target.value)} 
              autoFocus
              className="bg-transparent text-4xl font-bold text-foreground outline-none w-40 text-center" 
              placeholder="0"
            />
          </div>
        </form>

        <div className="flex gap-3 pt-2">
          <button 
            type="button" 
            onClick={onClose} 
            className="flex-1 py-3.5 rounded-xl border border-border-strong text-gray-400 font-bold text-xs uppercase tracking-wider"
          >
            Sair
          </button>
          <button 
            type="submit" 
            form="contribute-form" 
            className="flex-[2] bg-blue-600 text-foreground font-bold py-3.5 rounded-xl text-xs uppercase tracking-wider active:scale-95 transition-all"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
