import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { Flag, Plus } from 'lucide-react';
import { SettingsHeader } from './SettingsHeader';
import { parseCents } from '../../utils/money';
import { GoalCard } from './goals/GoalCard';
import { GoalModal, type GoalFormData } from './goals/GoalModal';
import { ContributeModal } from './goals/ContributeModal';
import type { FinancialGoalRow, FinancialGoalInsert } from '../../types/models';

export interface FinancialGoalsProps {
  onBack: () => void;
}

export function FinancialGoals({ onBack }: FinancialGoalsProps) {
  const { user } = useAuth();
  const { showAlert, showConfirm } = useNotifications();

  const [goals, setGoals] = useState<FinancialGoalRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isContributeModalOpen, setIsContributeModalOpen] = useState<boolean>(false);

  const [editingGoal, setEditingGoal] = useState<FinancialGoalRow | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<FinancialGoalRow | null>(null);

  const fetchGoals = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('financial_goals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      showAlert('Erro ao buscar metas', 'error');
    } else {
      setGoals(data || []);
    }
    setLoading(false);
  }, [user, showAlert]);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('financial_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!isMounted) return;
      if (error) {
        showAlert('Erro ao buscar metas', 'error');
      } else {
        setGoals(data || []);
      }
      setLoading(false);
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [user, showAlert]);

  const handleSaveGoal = async ({ name, targetAmount, currentAmount, deadline }: GoalFormData) => {
    if (!user || !name || !targetAmount) return;

    const goalData: FinancialGoalInsert = {
      user_id: user.id,
      name,
      target_amount: parseCents(targetAmount),
      current_amount: parseCents(currentAmount || '0'),
      deadline: deadline || null,
    };

    let error: Error | { message: string } | null = null;
    if (editingGoal) {
      const { error: err } = await supabase
        .from('financial_goals')
        .update(goalData)
        .eq('id', editingGoal.id)
        .eq('user_id', user.id);
      error = err;
    } else {
      const { error: err } = await supabase
        .from('financial_goals')
        .insert([goalData]);
      error = err;
    }

    if (error) {
      showAlert('Erro ao salvar meta', 'error');
    } else {
      showAlert(editingGoal ? 'Meta atualizada!' : 'Meta criada com sucesso!', 'success');
      setEditingGoal(null);
      setIsModalOpen(false);
      fetchGoals();
    }
  };

  const handleContribute = async (contributeAmount: string) => {
    if (!user || !selectedGoal || !contributeAmount) return;

    const currentVal = selectedGoal.current_amount ?? 0;
    const newAmount = currentVal + parseCents(contributeAmount);

    const { error } = await supabase
      .from('financial_goals')
      .update({ current_amount: newAmount })
      .eq('id', selectedGoal.id)
      .eq('user_id', user.id);

    if (error) {
      showAlert('Erro ao adicionar valor', 'error');
    } else {
      showAlert('Aporte realizado!', 'success');
      setIsContributeModalOpen(false);
      fetchGoals();
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    const confirmed = await showConfirm('Deseja excluir esta meta permanentemente?', 'Excluir Meta');
    if (!confirmed) return;

    const { error } = await supabase
      .from('financial_goals')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      showAlert('Erro ao excluir', 'error');
    } else {
      setGoals(prev => prev.filter(g => g.id !== id));
      showAlert('Meta excluída', 'success');
    }
  };

  const openEdit = (goal: FinancialGoalRow) => {
    setEditingGoal(goal);
    setIsModalOpen(true);
  };

  return (
    <div className="w-full animate-in fade-in slide-in-from-right-4 duration-300 pt-1 pb-8">
      <SettingsHeader
        title="Metas Financeiras"
        onBack={onBack}
        action={
          <button
            onClick={() => { setEditingGoal(null); setIsModalOpen(true); }}
            aria-label="Nova meta"
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl transition-all active:scale-95 text-xs font-bold shadow-sm shrink-0"
            type="button"
          >
            <Plus size={16} /> Nova
          </button>
        }
      />

      <div className="space-y-4">
        {loading ? (
          <p className="text-center text-slate-500 py-10 text-sm">Carregando metas...</p>
        ) : goals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500 gap-4 border border-dashed border-slate-300 rounded-3xl bg-white">
            <Flag size={40} className="text-slate-300" />
            <div className="text-center">
              <p className="text-sm font-bold text-slate-900">Nenhuma meta ainda</p>
              <p className="text-xs mt-1">Defina objetivos para o seu futuro financeiro.</p>
            </div>
          </div>
        ) : (
          goals.map(goal => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onEdit={openEdit}
              onDelete={handleDelete}
              onContribute={(g) => { setSelectedGoal(g); setIsContributeModalOpen(true); }}
            />
          ))
        )}
      </div>

      {isModalOpen && (
        <GoalModal
          isOpen={true}
          onClose={() => setIsModalOpen(false)}
          editingGoal={editingGoal}
          onSave={handleSaveGoal}
        />
      )}

      {isContributeModalOpen && (
        <ContributeModal
          isOpen={true}
          onClose={() => setIsContributeModalOpen(false)}
          selectedGoal={selectedGoal}
          onConfirm={handleContribute}
        />
      )}
    </div>
  );
}
