import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../../services/supabase';
import { 
  fetchRecurringExpenses, 
  saveRecurringExpense, 
  deleteRecurringExpense,
  type RecurringExpenseInput 
} from '../../services/recurring';
import { createBatchTransactions } from '../../services/transactions';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { useDate } from '../../contexts/DateContext';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { parseCents } from '../../utils/money';
import { SettingsHeader } from './SettingsHeader';
import { RecurringHero } from './recurring/RecurringHero';
import { RecurringList } from './recurring/RecurringList';
import { RecurringModal } from './recurring/RecurringModal';
import type { RecurringExpenseRow, TransactionInsert } from '../../types/models';

interface RecurringExpensesProps {
  onBack: () => void;
}

export function RecurringExpenses({ onBack }: RecurringExpensesProps) {
  const { user } = useAuth();
  const { currentDate, monthTitle } = useDate();
  const navigate = useNavigate();
  const { showAlert, showConfirm } = useNotifications();
  
  const [recurring, setRecurring] = useState<RecurringExpenseRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingExpense, setEditingExpense] = useState<RecurringExpenseRow | null>(null);

  const fetchRecurring = useCallback(async () => {
    if (!user) return;
    try {
      const data = await fetchRecurringExpenses(user.id);
      setRecurring(data);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchRecurring();
  }, [fetchRecurring]);

  const handleSaveRecurring = async (expenseData: RecurringExpenseInput) => {
    if (!user) return;
    let error: unknown = null;
    try {
      await saveRecurringExpense(user.id, expenseData, editingExpense?.id);
      error = null;
    } catch (err) {
      error = err;
    }

    if (!error) {
      setEditingExpense(null);
      setIsModalOpen(false);
      fetchRecurring();
      showAlert(editingExpense ? 'Atualizado!' : 'Adicionado!', 'success');
    } else {
      showAlert('Erro ao salvar despesa', 'error');
    }
  };

  const handleEdit = (item: RecurringExpenseRow) => {
    setEditingExpense(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    const confirmed = await showConfirm("Remover esta despesa fixa?", "Excluir Despesa");
    if (!confirmed) return;
    try {
      await deleteRecurringExpense(user.id, id);
    } catch {
      showAlert('Erro ao remover', 'error');
      return;
    }
    setRecurring(prev => prev.filter(item => item.id !== id));
    showAlert('Despesa removida', 'success');
  };

  const generateMonthExpenses = async () => {
    if (recurring.length === 0 || !user) return;
    const confirmed = await showConfirm(`Gerar ${recurring.length} contas para ${monthTitle}?`, "Lançar Mensalidade");
    if (!confirmed) return;

    setIsGenerating(true);
    const targetMonth = currentDate.getMonth();
    const targetYear = currentDate.getFullYear();

    const startOfMonth = new Date(targetYear, targetMonth, 1).toISOString();
    const endOfMonth = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59).toISOString();

    const { data: existingTxs } = await supabase
      .from('transactions')
      .select('name, amount')
      .eq('user_id', user.id)
      .gte('created_at', startOfMonth)
      .lte('created_at', endOfMonth)
      .eq('type', 'variable');

    const transactionsToCreate: TransactionInsert[] = recurring
      .filter(item => {
        // Previne duplicar se já existir uma conta com o mesmo nome no mês selecionado
        return !(existingTxs || []).some(t => t.name === item.name);
      })
      .map(item => {
        const maxDayInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
        const safeDay = Math.min(parseInt(String(item.day), 10) || 1, maxDayInMonth);
        const date = new Date(targetYear, targetMonth, safeDay, 12, 0, 0);
        return {
          user_id: user.id,
          name: item.name,
          amount: parseCents(item.amount), // Inteiro estrito em centavos
          type: 'variable',
          category: item.category,
          is_paid: false,
          created_at: date.toISOString(),
          due_date: date.toISOString()
        };
      });

    if (transactionsToCreate.length === 0) {
      showAlert(`Todas as contas de ${monthTitle} já foram lançadas!`, 'info');
      setIsGenerating(false);
      return;
    }

    try {
      await createBatchTransactions(transactionsToCreate);
      showAlert(`${transactionsToCreate.length} lançamentos gerados com sucesso para ${monthTitle}!`, 'success');
      navigate('/');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Falha ao gerar despesas fixas';
      showAlert('Erro: ' + msg, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const totalFixed = useMemo(() => recurring.reduce((acc, item) => acc + parseCents(item.amount), 0), [recurring]);

  return (
    <div className="w-full animate-in fade-in slide-in-from-right-4 duration-300 pt-1 pb-8">
      <SettingsHeader
        title="Despesas Fixas"
        onBack={onBack}
        action={
          <button
            onClick={() => { setEditingExpense(null); setIsModalOpen(true); }}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl transition-all active:scale-95 text-xs font-bold shadow-sm shrink-0"
            type="button"
          >
            <Plus size={16} /> Nova
          </button>
        }
      />

      <p className="text-[12px] text-slate-500 -mt-2 mb-4 px-1">
        Contas que se repetem todo mês. Cadastre uma vez e lance todas de uma vez a cada mês.
      </p>

      <RecurringHero
        totalFixed={totalFixed}
        isGenerating={isGenerating}
        onGenerate={generateMonthExpenses}
        monthTitle={monthTitle}
      />

      <RecurringList
        recurring={recurring}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {isModalOpen && (
        <RecurringModal
          key={editingExpense?.id || 'new'}
          isOpen={true}
          onClose={() => setIsModalOpen(false)}
          editingExpense={editingExpense}
          onSave={handleSaveRecurring}
        />
      )}
    </div>
  );
}

export default RecurringExpenses;
