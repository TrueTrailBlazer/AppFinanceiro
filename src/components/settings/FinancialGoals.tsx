import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { Flag, Plus, Target, ArrowLeft } from 'lucide-react';
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
    <div className="fixed inset-0 z-[60] bg-background flex flex-col md:relative md:inset-auto md:z-auto md:bg-transparent md:justify-center md:items-center animate-in slide-in-from-right-4 duration-300">
      <div className="flex-1 w-full flex flex-col max-w-md mx-auto bg-background md:flex-initial md:h-auto md:max-h-[85vh] md:w-full md:rounded-3xl md:border md:border-border md:shadow-2xl overflow-hidden relative">
        {/* Header */}
        <div className="flex items-center justify-between py-5 px-5 bg-card border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={onBack} aria-label="Voltar" className="p-2 -ml-2 text-gray-500 hover:text-foreground transition-colors">
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Target size={20} className="text-blue-500" /> Metas
            </h1>
          </div>
          <button 
            onClick={() => { setEditingGoal(null); setIsModalOpen(true); }}
            aria-label="Nova meta"
            className="bg-blue-600 text-foreground p-2 rounded-xl active:scale-95 transition-all"
          >
            <Plus size={20} />
          </button>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <p className="text-center text-gray-500 py-10 text-sm">Carregando metas...</p>
          ) : goals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-600 gap-4 border border-dashed border-border rounded-3xl bg-card/30">
              <Flag size={40} className="opacity-20 text-blue-500" />
              <div className="text-center">
                <p className="text-sm font-bold text-foreground">Nenhuma meta ainda</p>
                <p className="text-[10px] mt-1">Defina objetivos para o seu futuro financeiro.</p>
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

        {/* Footer Back Button */}
        <div className="p-4 pb-8 md:pb-4 border-t border-border bg-card shrink-0 md:hidden">
          <button onClick={onBack} className="w-full px-5 py-3.5 rounded-xl border border-border-strong text-gray-300 font-bold text-sm">
            Voltar
          </button>
        </div>
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
