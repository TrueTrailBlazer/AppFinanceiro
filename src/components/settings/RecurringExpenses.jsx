import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { Plus, Trash2, Zap, CheckCircle2, ArrowLeft, Calendar, Coins, X, Check } from 'lucide-react';
import { getCategory, CATEGORIES } from '../../utils/constants';
import { useNavigate } from 'react-router-dom';

export function RecurringExpenses({ onBack }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showAlert, showConfirm } = useNotifications();
  
  const [recurring, setRecurring] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form States
  const [editingExpense, setEditingExpense] = useState(null);
  const [newName, setNewName] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newCategory, setNewCategory] = useState('bills'); // Valor padrão
  const [newDay, setNewDay] = useState('5');

  useEffect(() => {
    if (user) fetchRecurring();
  }, [user]);

  const fetchRecurring = async () => {
    const { data } = await supabase
      .from('recurring_expenses')
      .select('*')
      .eq('user_id', user.id)
      .order('day', { ascending: true });
    if (data) setRecurring(data);
    setLoading(false);
  };

  const handleSaveRecurring = async (e) => {
    e.preventDefault();
    if (!newName || !newAmount) return;

    const expenseData = {
      user_id: user.id,
      name: newName,
      amount: parseFloat(newAmount),
      category: newCategory,
      day: parseInt(newDay)
    };

    let error;
    if (editingExpense) {
      const { error: err } = await supabase
        .from('recurring_expenses')
        .update(expenseData)
        .eq('id', editingExpense.id);
      error = err;
    } else {
      const { error: err } = await supabase
        .from('recurring_expenses')
        .insert([expenseData]);
      error = err;
    }

    if (!error) {
      resetForm();
      setIsModalOpen(false);
      fetchRecurring();
    }
  };

  const resetForm = () => {
    setEditingExpense(null);
    setNewName('');
    setNewAmount('');
    setNewCategory('bills');
    setNewDay('5');
  };

  const handleEdit = (item) => {
    setEditingExpense(item);
    setNewName(item.name);
    setNewAmount(item.amount.toString());
    setNewCategory(item.category);
    setNewDay(item.day.toString());
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    const confirmed = await showConfirm("Remover esta despesa fixa?", "Excluir Despesa");
    if(!confirmed) return;
    await supabase.from('recurring_expenses').delete().eq('id', id);
    setRecurring(prev => prev.filter(item => item.id !== id));
    showAlert('Despesa removida', 'success');
  };

  const generateMonthExpenses = async () => {
    if (recurring.length === 0) return;
    const confirmed = await showConfirm(`Gerar ${recurring.length} contas para este mês?`, "Lançar Mensalidade");
    if (!confirmed) return;

    setIsGenerating(true);
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const transactionsToCreate = recurring.map(item => {
      const date = new Date(currentYear, currentMonth, item.day, 12, 0, 0);
      return {
        user_id: user.id,
        name: item.name,
        amount: item.amount,
        type: 'variable',
        category: item.category,
        is_paid: false,
        created_at: date.toISOString()
      };
    });

    const { error } = await supabase.from('transactions').insert(transactionsToCreate);
    setIsGenerating(false);
    
    if (error) showAlert('Erro: ' + error.message, 'error');
    else {
      showAlert('Lançamentos gerados com sucesso!', 'success');
      navigate('/');
    }
  };

  const totalFixed = useMemo(() => recurring.reduce((acc, item) => acc + Number(item.amount), 0), [recurring]);

  return (
    <div className="fixed inset-0 z-[60] bg-[#050505] flex flex-col md:relative md:inset-auto md:z-auto md:bg-transparent md:justify-center md:items-center animate-in slide-in-from-right-4 duration-300">
      
      <div className="flex-1 w-full flex flex-col max-w-md mx-auto bg-[#050505] md:flex-initial md:h-auto md:max-h-[85vh] md:w-full md:rounded-3xl md:border md:border-[#222] md:shadow-2xl overflow-hidden relative">
        
        {/* Header Minimalista S/ Botão */}
        <div className="flex items-center justify-between py-5 px-5 bg-[#121212] border-b border-[#222] shrink-0">
          <h1 className="text-lg font-bold text-white">Despesas Fixas</h1>
          <button 
              onClick={() => { resetForm(); setIsModalOpen(true); }}
              className="flex items-center gap-1.5 bg-blue-600/10 text-blue-500 hover:text-white hover:bg-blue-600 border border-blue-500/20 px-3 py-1.5 rounded-lg transition-all active:scale-95 text-xs font-bold"
          >
              <Plus size={16} /> Nova
          </button>
        </div>

      <div className="flex-1 overflow-y-auto space-y-4 py-4 px-2">
          {/* Card Resumo */}
          {recurring.length > 0 && (
            <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 border border-blue-500/20 rounded-2xl p-5 relative overflow-hidden shadow-lg">
                <div className="absolute top-0 right-0 p-4 opacity-10"><Zap size={80} className="text-white"/></div>
                <div className="relative z-10">
                    <p className="text-[10px] uppercase font-bold text-blue-200 mb-1 flex items-center gap-1">
                        <Coins size={12}/> Total Mensal Recorrente
                    </p>
                    <h2 className="text-3xl font-bold text-white mb-4">
                        {totalFixed.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </h2>
                    <button 
                        onClick={generateMonthExpenses}
                        disabled={isGenerating}
                        className="w-full bg-white text-blue-900 text-xs font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
                    >
                        {isGenerating ? 'Processando...' : <><CheckCircle2 size={16}/> Lançar Contas do Mês</>}
                    </button>
                </div>
            </div>
          )}

          {/* Lista */}
          <div className="space-y-3 pb-8">
            {loading ? <p className="text-xs text-center text-gray-500 py-4">Carregando...</p> : 
                recurring.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-600 gap-3 border border-dashed border-[#222] rounded-2xl bg-[#121212]/30">
                        <Zap size={32} className="opacity-20"/>
                        <p className="text-xs font-medium">Nenhuma conta fixa ainda.</p>
                    </div>
                ) :
                recurring.map(item => {
                const CatData = getCategory(item.category);
                const CatIcon = CatData.icon;
                return (
                    <div 
                        key={item.id} 
                        onClick={() => handleEdit(item)}
                        className="flex items-center justify-between p-4 rounded-2xl bg-[#121212] border border-[#222] hover:border-[#333] transition-all group cursor-pointer active:scale-[0.98]"
                    >
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl bg-[#1a1a1a] text-gray-400 border border-[#222]`}>
                                <CatIcon size={20} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-white mb-0.5">{item.name}</p>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] bg-[#222] text-gray-400 px-2 py-0.5 rounded font-medium border border-[#333]">Dia {item.day}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <span className="text-sm font-bold text-white">R$ {item.amount}</span>
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }} 
                                className="text-gray-600 hover:text-red-500 transition-colors p-1"
                            >
                                <Trash2 size={18}/>
                            </button>
                        </div>
                    </div>
                )
                })}
          </div>
      </div>

      </div>

      {/* FOOTER LISTA - Thumb Zone */}
      <div className="p-4 pb-8 md:pb-4 border-t border-[#222] bg-[#121212] shrink-0 sticky bottom-0 z-10 md:hidden shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
         <button onClick={onBack} className="w-full px-5 py-3.5 rounded-xl border border-[#333] text-gray-300 font-bold hover:bg-[#222] active:scale-95 transition-all text-center">
             Voltar
         </button>
      </div>

      {/* --- MODAL DE ADICIONAR --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-[#050505]/90 flex flex-col justify-end md:justify-center md:items-center">
            
            {/* Modal Box Container */}
            <div className="flex-1 w-full flex flex-col max-w-md mx-auto bg-[#050505] animate-in slide-in-from-bottom-10 duration-200 md:flex-initial md:h-auto md:max-h-[85vh] md:rounded-3xl md:border md:border-[#222] md:shadow-2xl overflow-hidden relative">
                
                {/* Header Modal */}
                <div className="px-5 py-5 border-b border-[#222] text-center bg-[#121212] shrink-0">
                    <h2 className="text-lg font-bold text-white">
                        {editingExpense ? 'Editar Despesa Fixa' : 'Nova Despesa Fixa'}
                    </h2>
                </div>

                {/* Conteúdo Scrollável */}
                <div className="flex-1 overflow-y-auto p-5 pb-8">
                    <form id="recurring-form" onSubmit={handleSaveRecurring} className="space-y-6">
                        
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Nome da Conta</label>
                                <input type="text" placeholder="Ex: Netflix" value={newName} onChange={e => setNewName(e.target.value)} autoFocus
                                    className="w-full bg-[#1a1a1a] border border-[#222] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500 transition-all"/>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Valor (R$)</label>
                                    <input type="number" placeholder="0.00" value={newAmount} onChange={e => setNewAmount(e.target.value)}
                                        className="w-full bg-[#1a1a1a] border border-[#222] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500 transition-all"/>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Dia Vencimento</label>
                                    <input type="number" placeholder="5" max="31" value={newDay} onChange={e => setNewDay(e.target.value)}
                                        className="w-full bg-[#1a1a1a] border border-[#222] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500 text-center transition-all"/>
                                </div>
                            </div>
                        </div>

                        {/* SELEÇÃO DE CATEGORIA */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-500 uppercase ml-1 block">Categoria</label>
                            <div className="grid grid-cols-4 gap-2">
                                {Object.entries(CATEGORIES)
                                    .filter(([k]) => !['salary', 'investment', 'extra'].includes(k))
                                    .map(([key, cat]) => {
                                        const isSelected = newCategory === key;
                                        return (
                                            <button 
                                                key={key} type="button" onClick={() => setNewCategory(key)}
                                                className={`relative p-2.5 rounded-xl border transition-all flex flex-col items-center gap-1.5
                                                ${isSelected 
                                                    ? 'bg-[#1a1a1a] border-blue-500 shadow-[0_0_8px_rgba(37,99,235,0.3)]' 
                                                    : 'bg-[#121212] border-[#222] opacity-60 hover:opacity-100 hover:border-[#333]'}`}
                                            >
                                                <cat.icon size={18} className={isSelected ? 'text-blue-400' : 'text-gray-400'} />
                                                <span className={`text-[8px] uppercase tracking-wide truncate max-w-full px-1 ${isSelected ? 'text-white font-bold' : 'text-gray-500'}`}>{cat.label}</span>
                                            </button>
                                        );
                                    })}
                            </div>
                        </div>
                    </form>
                </div>

                {/* Footer Modal Thumb Zone */}
                <div className="p-4 pb-8 md:pb-4 border-t border-[#222] bg-[#121212] shrink-0 flex gap-3 shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
                    <button type="button" onClick={() => { setIsModalOpen(false); resetForm(); }} className="flex-1 px-5 py-3.5 rounded-xl border border-[#333] text-gray-300 font-bold hover:bg-[#222] active:scale-95 transition-all text-center">
                        Cancelar
                    </button>
                    
                    <button 
                        type="submit" form="recurring-form" disabled={!newName || !newAmount}
                        className="flex-[2] bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-900/20 active:scale-95 transition-all"
                    >
                        Salvar
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}