import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Trash2, Zap, CheckCircle2, ArrowLeft, Calendar, Coins } from 'lucide-react';
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
    if(!confirm("Apagar este gasto fixo?")) return;
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

  // Cálculo do Total Fixo
  const totalFixed = useMemo(() => recurring.reduce((acc, item) => acc + Number(item.amount), 0), [recurring]);

  return (
    <div className="space-y-6 animate-in slide-in-from-right-8 duration-300 pb-24">
      
      {/* Header */}
      <div className="flex items-center gap-3 py-2">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-[#1a1a1a] text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={22} />
        </button>
        <h1 className="text-lg font-bold text-white">Despesas Fixas</h1>
      </div>

      {/* Resumo e Ação */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#121212] border border-[#222] rounded-2xl p-4 flex flex-col justify-center">
            <p className="text-[10px] uppercase font-bold text-gray-500 mb-1 flex items-center gap-1"><Coins size={12}/> Total Fixo</p>
            <p className="text-lg font-bold text-white">
                {totalFixed.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
        </div>
        <button 
            onClick={generateMonthExpenses}
            disabled={isGenerating || recurring.length === 0}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white p-4 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20 active:scale-95"
        >
            {isGenerating ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"/> : <CheckCircle2 size={24}/>}
            <span className="text-xs font-bold">{isGenerating ? 'Gerando...' : 'Lançar Mês'}</span>
        </button>
      </div>

      {/* Formulário Melhorado */}
      <div className="space-y-3">
        <h3 className="px-1 text-xs font-bold text-gray-500 uppercase tracking-wider">Adicionar Novo</h3>
        <div className="bg-[#121212] rounded-2xl border border-[#222] p-5">
            <form onSubmit={handleAddRecurring} className="space-y-5">
                
                {/* Inputs Linha 1 */}
                <div className="grid grid-cols-5 gap-3">
                    <div className="col-span-3 space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Nome</label>
                        <input type="text" placeholder="Ex: Internet" value={newName} onChange={e => setNewName(e.target.value)}
                            className="w-full bg-[#1a1a1a] border border-[#222] rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500 transition-all placeholder-gray-700"/>
                    </div>
                    <div className="col-span-2 space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Dia</label>
                        <input type="number" placeholder="5" max="31" value={newDay} onChange={e => setNewDay(e.target.value)}
                            className="w-full bg-[#1a1a1a] border border-[#222] rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500 transition-all placeholder-gray-700 text-center"/>
                    </div>
                </div>

                {/* Inputs Linha 2 e Categoria */}
                <div className="space-y-3">
                     <div className="flex gap-3 items-end">
                        <div className="flex-1 space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Valor Previsto</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-gray-500 text-sm">R$</span>
                                <input type="number" placeholder="0.00" value={newAmount} onChange={e => setNewAmount(e.target.value)}
                                    className="w-full bg-[#1a1a1a] border border-[#222] rounded-xl pl-9 pr-3 py-2.5 text-sm text-white outline-none focus:border-blue-500 transition-all placeholder-gray-700 font-bold"/>
                            </div>
                        </div>
                        <button type="submit" disabled={!newName || !newAmount}
                            className="h-[42px] px-6 bg-green-600 hover:bg-green-500 rounded-xl flex items-center justify-center text-white disabled:opacity-50 transition-all shadow-lg shadow-green-900/20 active:scale-95">
                            <Plus size={20} />
                        </button>
                    </div>

                    <div className="pt-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-2 ml-1">Categoria</label>
                        <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                            {Object.entries(CATEGORIES)
                                .filter(([k]) => !['salary', 'investment', 'extra'].includes(k))
                                .map(([key, cat]) => (
                                <button key={key} type="button" onClick={() => setNewCategory(key)}
                                    className={`p-2.5 rounded-xl border transition-all shrink-0 flex flex-col items-center justify-center gap-1.5 min-w-[70px] 
                                    ${newCategory === key 
                                        ? 'bg-[#222] border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.15)]' 
                                        : 'border-[#222] bg-[#1a1a1a] opacity-60 hover:opacity-100 hover:bg-[#222]'}`}>
                                    <cat.icon size={20} className={newCategory === key ? 'text-blue-400' : 'text-gray-500'} />
                                    <span className={`text-[9px] truncate w-full text-center ${newCategory === key ? 'text-white font-bold' : 'text-gray-500'}`}>{cat.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </form>
        </div>
      </div>

      {/* Lista */}
      <div className="space-y-3">
        <h3 className="px-1 text-xs font-bold text-gray-500 uppercase tracking-wider">Lista ({recurring.length})</h3>
        
        {loading ? <p className="text-xs text-center text-gray-500 py-4">Carregando...</p> : 
            recurring.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 border border-dashed border-[#222] rounded-2xl bg-[#121212]/50 text-gray-600 gap-2">
                    <Zap size={24} className="opacity-20"/>
                    <p className="text-xs font-medium">Nenhum gasto fixo cadastrado.</p>
                </div>
            ) :
            recurring.map(item => {
            const CatData = getCategory(item.category);
            const CatIcon = CatData.icon;
            return (
                <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl bg-[#121212] border border-[#222] group hover:border-[#333] transition-all">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${CatData.bg}`}>
                            <CatIcon size={20} className={CatData.color} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-white mb-0.5">{item.name}</p>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] bg-[#222] text-gray-400 px-2 py-0.5 rounded font-medium border border-[#333]">Dia {item.day}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <span className="text-sm font-bold text-white">R$ {item.amount}</span>
                        <button onClick={() => handleDelete(item.id)} className="text-[10px] text-gray-600 hover:text-red-500 flex items-center gap-1 py-1 px-2 -mr-2 hover:bg-red-500/10 rounded-lg transition-colors">
                            <Trash2 size={12}/> Remover
                        </button>
                    </div>
                </div>
            )
            })}
      </div>
    </div>
  );
}