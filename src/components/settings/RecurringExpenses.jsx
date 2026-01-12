import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Trash2, Zap, CheckCircle2, ArrowLeft, Calendar } from 'lucide-react';
import { getCategory, CATEGORIES } from '../../utils/constants';
import { useNavigate } from 'react-router-dom';

export function RecurringExpenses({ onBack }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [recurring, setRecurring] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Form
  const [newName, setNewName] = useState('');
  const [newAmount, setNewAmount] = useState('');
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

  const handleAddRecurring = async (e) => {
    e.preventDefault();
    if (!newName || !newAmount) return;

    const { error } = await supabase.from('recurring_expenses').insert([{
      user_id: user.id,
      name: newName,
      amount: parseFloat(newAmount),
      category: newCategory,
      day: parseInt(newDay)
    }]);

    if (!error) {
      setNewName('');
      setNewAmount('');
      fetchRecurring();
    }
  };

  const handleDelete = async (id) => {
    await supabase.from('recurring_expenses').delete().eq('id', id);
    setRecurring(prev => prev.filter(item => item.id !== id));
  };

  const generateMonthExpenses = async () => {
    if (recurring.length === 0) return alert('Cadastre despesas fixas primeiro.');
    if (!confirm(`Gerar ${recurring.length} contas para este mês?`)) return;

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
    
    if (error) alert('Erro: ' + error.message);
    else navigate('/');
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-8 duration-300 pb-24">
      
      {/* --- HEADER DE NAVEGAÇÃO --- */}
      <div className="flex items-center gap-3 py-2">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-[#1a1a1a] text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={22} />
        </button>
        <h1 className="text-lg font-bold text-white">Despesas Fixas</h1>
      </div>

      {/* --- CARD DE AÇÃO PRINCIPAL --- */}
      <div className="bg-gradient-to-br from-[#1a1a1a] to-[#121212] rounded-2xl border border-[#222] p-5 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5"><Calendar size={100}/></div>
        
        <div className="relative z-10">
            <h2 className="font-bold text-white text-sm mb-1">Início do Mês?</h2>
            <p className="text-[11px] text-gray-400 mb-4 max-w-[80%]">
                Gere automaticamente todas as suas contas cadastradas abaixo como "Pendentes" na tela inicial.
            </p>
            <button 
                onClick={generateMonthExpenses}
                disabled={isGenerating || recurring.length === 0}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20 active:scale-95"
            >
                {isGenerating ? 'Processando...' : <><CheckCircle2 size={16}/> Gerar Contas do Mês</>}
            </button>
        </div>
      </div>

      {/* --- FORMULÁRIO --- */}
      <div className="space-y-3">
        <h3 className="px-1 text-xs font-bold text-gray-500 uppercase tracking-wider">Adicionar Nova</h3>
        <div className="bg-[#121212] rounded-2xl border border-[#222] p-4">
            <form onSubmit={handleAddRecurring} className="flex flex-col gap-4">
                <div className="flex gap-3">
                    <div className="flex-1 space-y-1">
                        <label className="text-[9px] font-bold text-gray-500 uppercase">Nome</label>
                        <input type="text" placeholder="Ex: Netflix" value={newName} onChange={e => setNewName(e.target.value)}
                            className="w-full bg-[#0a0a0a] border border-[#222] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500 transition-colors"/>
                    </div>
                    <div className="w-20 space-y-1">
                        <label className="text-[9px] font-bold text-gray-500 uppercase">Dia</label>
                        <input type="number" placeholder="5" max="31" value={newDay} onChange={e => setNewDay(e.target.value)}
                            className="w-full bg-[#0a0a0a] border border-[#222] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500 transition-colors text-center"/>
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-[9px] font-bold text-gray-500 uppercase">Valor</label>
                    <div className="flex gap-2">
                        <input type="number" placeholder="0.00" value={newAmount} onChange={e => setNewAmount(e.target.value)}
                            className="flex-1 bg-[#0a0a0a] border border-[#222] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500 transition-colors"/>
                        <button type="submit" disabled={!newName || !newAmount}
                            className="bg-green-600 hover:bg-green-500 w-12 rounded-lg flex items-center justify-center text-white disabled:opacity-50 transition-colors">
                            <Plus size={20} />
                        </button>
                    </div>
                </div>

                {/* Categorias */}
                <div>
                    <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1.5">Categoria</label>
                    <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
                        {Object.entries(CATEGORIES)
                            .filter(([k]) => !['salary', 'investment', 'extra'].includes(k))
                            .map(([key, cat]) => (
                            <button key={key} type="button" onClick={() => setNewCategory(key)}
                                className={`p-2 rounded-xl border transition-all shrink-0 flex flex-col items-center justify-center gap-1 w-16 h-16 ${newCategory === key ? 'bg-[#1a1a1a] border-blue-500' : 'border-[#222] bg-[#0a0a0a] opacity-50 hover:opacity-80'}`}>
                                <cat.icon size={18} className={newCategory === key ? 'text-white' : 'text-gray-500'} />
                                <span className={`text-[8px] truncate w-full text-center ${newCategory === key ? 'text-white font-bold' : 'text-gray-500'}`}>{cat.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </form>
        </div>
      </div>

      {/* --- LISTA --- */}
      <div className="space-y-3">
        <h3 className="px-1 text-xs font-bold text-gray-500 uppercase tracking-wider">Cadastrados ({recurring.length})</h3>
        
        {loading ? <p className="text-xs text-center text-gray-500 py-4">Carregando...</p> : 
            recurring.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 border border-dashed border-[#222] rounded-2xl bg-[#121212]/50 text-gray-600 gap-2">
                    <Zap size={24} className="opacity-20"/>
                    <p className="text-xs">Nenhuma conta fixa.</p>
                </div>
            ) :
            recurring.map(item => {
            const CatIcon = getCategory(item.category).icon;
            return (
                <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl bg-[#121212] border border-[#222] group hover:border-[#333] transition-all">
                    <div className="flex items-center gap-4">
                        <div className="bg-[#1a1a1a] p-3 rounded-xl border border-[#222] text-gray-400">
                            <CatIcon size={20} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-white mb-0.5">{item.name}</p>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] bg-[#222] text-gray-400 px-1.5 py-0.5 rounded">Dia {item.day}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <span className="text-sm font-bold text-white">R$ {item.amount}</span>
                        <button onClick={() => handleDelete(item.id)} className="text-[10px] text-red-500/60 hover:text-red-500 flex items-center gap-1 py-1 px-2 hover:bg-red-500/10 rounded-lg transition-colors">
                            <Trash2 size={12}/> Apagar
                        </button>
                    </div>
                </div>
            )
            })}
      </div>
    </div>
  );
}