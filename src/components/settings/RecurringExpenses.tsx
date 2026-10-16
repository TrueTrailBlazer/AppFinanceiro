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
          created_at: date.toISOString()
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
    <div className="fixed inset-0 z-[60] bg-background flex flex-col items-center justify-start h-[100dvh] overflow-hidden animate-in fade-in duration-300">
      
      <div className="flex-1 w-full flex flex-col max-w-md mx-auto bg-background overflow-hidden relative shadow-2xl">
        
        {/* Header Minimalista */}
        <div className="flex items-center justify-between py-5 px-5 bg-card border-b border-border shrink-0">
          <h1 className="text-lg font-bold text-foreground tracking-tight text-left">Despesas Fixas</h1>
          <button 
            onClick={() => { setEditingExpense(null); setIsModalOpen(true); }}
            className="flex items-center gap-1.5 bg-blue-600/10 text-blue-500 hover:text-foreground hover:bg-blue-600 border border-blue-500/20 px-3 py-1.5 rounded-lg transition-all active:scale-95 text-xs font-bold"
            type="button"
          >
            <Plus size={16} /> Nova
          </button>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto py-4 px-2 custom-scrollbar">
          <RecurringHero 
            totalFixed={totalFixed} 
            isGenerating={isGenerating} 
            onGenerate={generateMonthExpenses} 
          />

          <RecurringList 
            recurring={recurring} 
            loading={loading} 
            onEdit={handleEdit} 
            onDelete={handleDelete} 
          />
        </div>

        {/* Footer Voltar - Estilo Unificado */}
        <div className="p-4 pb-8 bg-card border-t border-border shrink-0 w-full shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
          <button 
            onClick={onBack} 
            className="w-full px-5 py-4 rounded-xl border border-border-strong text-foreground/70 hover:text-foreground font-bold hover:bg-border active:scale-95 transition-all text-center tracking-wide"
            type="button"
          >
            Voltar
          </button>
        </div>
      </div>

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
