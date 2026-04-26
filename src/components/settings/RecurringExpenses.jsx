import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { Plus, Trash2, Zap, CheckCircle2, ArrowLeft, Calendar, Coins, X, Check, Type } from 'lucide-react';
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
  const [newAmount, setNewAmount] = useState(''); // float string
  const [displayAmount, setDisplayAmount] = useState(''); // masked string
  const [newCategory, setNewCategory] = useState('bills'); 
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
      amount: parseFloat(newAmount) || 0,
      category: newCategory,
      day: parseInt(newDay) || 1
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
      showAlert(editingExpense ? 'Atualizado!' : 'Adicionado!', 'success');
    }
  };

  const resetForm = () => {
    setEditingExpense(null);
    setNewName('');
    setNewAmount('');
    setDisplayAmount('');
    setNewCategory('bills');
    setNewDay('5');
  };

  const handleEdit = (item) => {
    setEditingExpense(item);
    setNewName(item.name);
    
    // Configura valor inicial com máscara
    const initialAmount = Number(item.amount).toFixed(2);
    setNewAmount(initialAmount);
    setDisplayAmount(
        new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(item.amount))
    );
    
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
    <div className="fixed inset-0 z-[60] bg-background flex flex-col items-center justify-start h-[100dvh] overflow-hidden animate-in fade-in duration-300">
      
      <div className="flex-1 w-full flex flex-col max-w-md mx-auto bg-background overflow-hidden relative shadow-2xl">
        
        {/* Header Minimalista */}
        <div className="flex items-center justify-between py-5 px-5 bg-card border-b border-border shrink-0">
          <h1 className="text-lg font-bold text-foreground tracking-tight text-left">Despesas Fixas</h1>
          <button 
              onClick={() => { resetForm(); setIsModalOpen(true); }}
              className="flex items-center gap-1.5 bg-blue-600/10 text-blue-500 hover:text-foreground hover:bg-blue-600 border border-blue-500/20 px-3 py-1.5 rounded-lg transition-all active:scale-95 text-xs font-bold"
          >
              <Plus size={16} /> Nova
          </button>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto space-y-4 py-4 px-2 custom-scrollbar">
            {/* Card Resumo */}
            {recurring.length > 0 && (
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 relative overflow-hidden shadow-lg mx-2 mb-2 border border-blue-500/30">
                    <div className="absolute -top-4 -right-2 p-4 opacity-10"><Zap size={100} className="text-white"/></div>
                    <div className="relative z-10">
                        <p className="text-[10px] uppercase font-bold text-blue-100 mb-1 flex items-center gap-1">
                            <Coins size={12}/> Total Mensal Recorrente
                        </p>
                        <h2 className="text-3xl font-bold text-white mb-4 tracking-tight drop-shadow-sm">
                            {totalFixed.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </h2>
                        <button 
                            onClick={generateMonthExpenses}
                            disabled={isGenerating}
                            className="w-full bg-white/10 text-white backdrop-blur-sm border border-white/20 text-xs font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg active:scale-95 hover:bg-white/20 transition-all font-bold"
                        >
                            {isGenerating ? 'Processando...' : <><CheckCircle2 size={16}/> Lançar Contas do Mês</>}
                        </button>
                    </div>
                </div>
            )}

            {/* Render List */}
            <div className="space-y-3 pb-8 px-1">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 opacity-20">
                        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mb-4" />
                    </div>
                ) : recurring.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-600 gap-3 border border-dashed border-border rounded-2xl bg-card/30">
                        <Zap size={32} className="opacity-20"/>
                        <p className="text-xs font-medium uppercase tracking-widest opacity-60">Nenhuma conta fixa</p>
                    </div>
                ) :
                recurring.map(item => {
                const CatData = getCategory(item.category);
                const CatIcon = CatData.icon;
                return (
                    <div 
                        key={item.id} 
                        onClick={() => handleEdit(item)}
                        className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border hover:border-border-strong transition-all group cursor-pointer active:scale-[0.98] shadow-sm ml-1 mr-1"
                    >
                        <div className="flex items-center gap-3">
                            <div className={`p-3 rounded-xl bg-card-hover text-foreground/60 border border-border transition-colors group-hover:bg-border`}>
                                <CatIcon size={20} />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <p className="text-sm font-bold text-foreground mb-0.5 truncate">{item.name}</p>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] bg-card-alt text-foreground/60 px-2 py-0.5 rounded font-bold border border-border">Dia {item.day}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                            <span className="text-sm font-black text-foreground">R$ {item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }} 
                                className="text-gray-700 hover:text-red-500 transition-colors p-1"
                            >
                                <Trash2 size={18}/>
                            </button>
                        </div>
                    </div>
                )
                })}
            </div>
        </div>

        {/* Footer Voltar - Estilo Unificado */}
        <div className="p-4 pb-8 bg-card border-t border-border shrink-0 w-full shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
            <button 
                onClick={onBack} 
                className="w-full px-5 py-4 rounded-xl border border-border-strong text-foreground/70 hover:text-foreground font-bold hover:bg-border active:scale-95 transition-all text-center tracking-wide"
            >
                Voltar
            </button>
        </div>
      </div>

      {/* --- MODAL DE ADICIONAR --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-background/95 flex flex-col justify-end md:justify-center md:items-center">
            
            <div className="flex-1 w-full flex flex-col max-w-md mx-auto bg-background animate-in slide-in-from-bottom-10 duration-300 md:flex-initial md:rounded-3xl md:border md:border-border max-h-[100dvh]">
                
                {/* Header Modal */}
                <div className="px-5 py-5 border-b border-border text-center bg-card flex items-center justify-between shrink-0">
                    <div className="w-8" />
                    <h2 className="text-lg font-bold text-foreground">
                        {editingExpense ? 'Editar Despesa' : 'Nova Despesa'}
                    </h2>
                    <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="text-gray-500 p-1 hover:text-foreground transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Form Content */}
                <div className="flex-1 overflow-y-auto p-5 pb-8">
                    <form id="recurring-form" onSubmit={handleSaveRecurring} className="space-y-6">
                        
                        <div className="space-y-6">
                            {/* VALOR COM MÁSCARA */}
                            <div className="relative bg-card-hover rounded-xl p-4 border border-border focus-within:border-blue-500 transition-all shadow-inner">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Valor da Conta</label>
                                <div className="flex items-center">
                                    <span className="text-xl mr-2 font-medium text-blue-500">R$</span>
                                    <input
                                        type="text" inputMode="numeric"
                                        value={displayAmount} 
                                        onChange={e => {
                                            let val = e.target.value.replace(/\D/g, '');
                                            if (!val) { setDisplayAmount(''); setNewAmount(''); return; }
                                            const numValue = parseInt(val, 10);
                                            setNewAmount((numValue / 100).toFixed(2));
                                            setDisplayAmount(new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(numValue / 100));
                                        }}
                                        placeholder="0,00"
                                        className="w-full bg-transparent text-4xl font-black text-foreground placeholder-gray-800 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1.5 ml-1"><Type size={12}/> Nome da Conta</label>
                                <input type="text" placeholder="Ex: Netflix, Aluguel, Internet..." value={newName} onChange={e => setNewName(e.target.value)} autoFocus
                                    className="w-full bg-card-hover border border-border rounded-xl px-4 py-3.5 text-sm text-foreground outline-none focus:border-blue-500 transition-all font-medium shadow-sm"/>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1.5 ml-1"><Calendar size={12}/> Dia de Vencimento (1 a 31)</label>
                                <input 
                                    type="text" 
                                    inputMode="numeric" 
                                    pattern="\d*" 
                                    placeholder="Ex: 10" 
                                    value={newDay} 
                                    onChange={e => {
                                        const val = e.target.value;
                                        // Permite vazio para apagar, mas limita a 31 se tiver valor
                                        if (val === '' || (parseInt(val) >= 1 && parseInt(val) <= 31)) {
                                            setNewDay(val);
                                        }
                                    }}
                                    className="w-full bg-card-hover border border-border rounded-xl px-4 py-3.5 text-sm text-foreground outline-none focus:border-blue-500 transition-all font-bold shadow-sm"
                                />
                                <span className="text-[9px] text-gray-600 block ml-1">Lançaremos automaticamente neste dia todo mês.</span>
                            </div>
                        </div>

                        {/* CATEGORIAS */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-500 uppercase ml-1 block tracking-wider">Selecione o Ícone</label>
                            <div className="grid grid-cols-4 gap-2">
                                {Object.entries(CATEGORIES)
                                    .filter(([k]) => !['salary', 'investment', 'extra'].includes(k))
                                    .map(([key, cat]) => {
                                        const isSelected = newCategory === key;
                                        return (
                                            <button 
                                                key={key} type="button" onClick={() => setNewCategory(key)}
                                                className={`relative p-3 rounded-xl border transition-all flex flex-col items-center gap-1.5
                                                ${isSelected 
                                                    ? 'bg-blue-600/10 border-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.2)]' 
                                                    : 'bg-card border-border opacity-60 hover:opacity-100'}`}
                                            >
                                                <cat.icon size={18} className={isSelected ? 'text-blue-400' : 'text-gray-400'} />
                                                <span className={`text-[8px] font-black uppercase tracking-tight truncate max-w-full ${isSelected ? 'text-foreground' : 'text-gray-600'}`}>{cat.label}</span>
                                            </button>
                                        );
                                    })}
                            </div>
                        </div>
                    </form>
                </div>

                {/* Footer Modal Thumb Zone */}
                <div className="p-4 pb-8 bg-card border-t border-border shrink-0 flex gap-3 shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
                    <button type="button" onClick={() => { setIsModalOpen(false); resetForm(); }} className="flex-1 px-5 py-4 rounded-xl border border-border-strong text-gray-500 dark:text-gray-300 font-bold hover:bg-border active:scale-95 transition-all text-center">
                        Cancelar
                    </button>
                    
                    <button 
                        type="submit" form="recurring-form" disabled={!newName || !newAmount || !newDay}
                        className="flex-[2] bg-blue-600 disabled:bg-blue-600/40 disabled:text-white/90 hover:bg-blue-500 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg disabled:shadow-none active:scale-95 transition-all tracking-wide"
                    >
                        Salvar Despesa
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}