import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Trash2, Zap, CheckCircle2 } from 'lucide-react';
import { getCategory, CATEGORIES } from '../../utils/constants';
import { useNavigate } from 'react-router-dom';

export function RecurringExpenses() {
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
    if (!confirm(`Gerar ${recurring.length} despesas pendentes para este mês?`)) return;

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
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header com Botão de Ação Principal */}
      <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-2xl border border-blue-500/20 p-4 flex items-center justify-between">
        <div>
            <h2 className="font-bold text-white text-sm flex items-center gap-2">
                <Zap size={16} className="text-yellow-400 fill-yellow-400"/> Lançamento Rápido
            </h2>
            <p className="text-[10px] text-gray-400 mt-0.5">Gera todas as contas do mês num clique.</p>
        </div>
        <button 
            onClick={generateMonthExpenses}
            disabled={isGenerating || recurring.length === 0}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-blue-900/20 active:scale-95"
        >
            {isGenerating ? '...' : <><CheckCircle2 size={16}/> Gerar Mês</>}
        </button>
      </div>

      <div className="bg-[#121212] rounded-2xl border border-[#222] overflow-hidden">
        <div className="p-4 border-b border-[#222] bg-[#1a1a1a]">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Novo Modelo</h3>
        </div>
        
        <div className="p-4">
            <form onSubmit={handleAddRecurring} className="flex flex-col gap-3">
                <div className="grid grid-cols-6 gap-2">
                    <div className="col-span-4 bg-[#0a0a0a] rounded-lg border border-[#222] px-3 py-1.5 focus-within:border-blue-500 transition-colors">
                        <label className="text-[9px] text-gray-500 font-bold uppercase block">Nome</label>
                        <input type="text" placeholder="Ex: Internet" value={newName} onChange={e => setNewName(e.target.value)}
                            className="w-full bg-transparent text-white text-sm outline-none placeholder-gray-700"/>
                    </div>
                    <div className="col-span-2 bg-[#0a0a0a] rounded-lg border border-[#222] px-3 py-1.5 focus-within:border-blue-500 transition-colors">
                        <label className="text-[9px] text-gray-500 font-bold uppercase block">Dia</label>
                        <input type="number" placeholder="5" max="31" value={newDay} onChange={e => setNewDay(e.target.value)}
                            className="w-full bg-transparent text-white text-sm outline-none placeholder-gray-700"/>
                    </div>
                </div>

                <div className="flex gap-2">
                    <div className="flex-1 bg-[#0a0a0a] rounded-lg border border-[#222] px-3 py-1.5 focus-within:border-blue-500 transition-colors">
                        <label className="text-[9px] text-gray-500 font-bold uppercase block">Valor</label>
                        <input type="number" placeholder="0.00" value={newAmount} onChange={e => setNewAmount(e.target.value)}
                            className="w-full bg-transparent text-white text-sm outline-none placeholder-gray-700"/>
                    </div>
                    
                    <button type="submit" disabled={!newName || !newAmount}
                        className="bg-green-600 hover:bg-green-500 w-12 rounded-lg flex items-center justify-center text-white disabled:opacity-50 transition-colors">
                        <Plus size={20} />
                    </button>
                </div>

                {/* Categorias */}
                <div className="flex gap-1 overflow-x-auto py-1 hide-scrollbar">
                    {Object.entries(CATEGORIES)
                        .filter(([k]) => !['salary', 'investment', 'extra'].includes(k))
                        .map(([key, cat]) => (
                        <button key={key} type="button" onClick={() => setNewCategory(key)}
                            className={`p-2 rounded-lg border transition-all shrink-0 flex flex-col items-center gap-1 min-w-[60px] ${newCategory === key ? 'bg-[#222] border-blue-500' : 'border-[#222] bg-[#0a0a0a] opacity-60'}`}>
                            <cat.icon size={16} className={newCategory === key ? 'text-white' : 'text-gray-500'} />
                            <span className={`text-[9px] ${newCategory === key ? 'text-white font-bold' : 'text-gray-500'}`}>{cat.label}</span>
                        </button>
                    ))}
                </div>
            </form>
        </div>
      </div>

      {/* Lista */}
      <div className="space-y-2 pb-4">
        <h3 className="px-1 text-xs font-bold text-gray-500 uppercase tracking-wider">Seus Modelos ({recurring.length})</h3>
        
        {loading ? <p className="text-xs text-center text-gray-500">Carregando...</p> : 
            recurring.length === 0 ? <p className="text-xs text-center text-gray-500 py-6 border border-dashed border-[#222] rounded-xl">Nenhum modelo cadastrado.</p> :
            recurring.map(item => {
            const CatIcon = getCategory(item.category).icon;
            return (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-[#121212] border border-[#222] group hover:border-[#333] transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="text-gray-400 bg-[#1a1a1a] p-2.5 rounded-lg border border-[#222]"><CatIcon size={18} /></div>
                        <div>
                            <p className="text-sm font-bold text-white leading-none mb-1">{item.name}</p>
                            <p className="text-[10px] text-gray-500">Todo dia <span className="text-gray-300 font-bold">{item.day}</span></p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-bold text-white">R$ {item.amount}</span>
                        <button onClick={() => handleDelete(item.id)} className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 size={16}/></button>
                    </div>
                </div>
            )
            })}
      </div>
    </div>
  );
}