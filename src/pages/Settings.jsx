import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import { LogOut, Plus, Trash2, Zap, CheckCircle2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getCategory, CATEGORIES } from '../utils/constants';

export default function Settings() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  
  const [recurring, setRecurring] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estados do Formulário
  const [newName, setNewName] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newCategory, setNewCategory] = useState('bills');
  const [newDay, setNewDay] = useState('5');
  
  const [isGenerating, setIsGenerating] = useState(false);

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

  // --- A MÁGICA: Gerar transações para o mês atual ---
  const generateMonthExpenses = async () => {
    if (recurring.length === 0) return alert('Cadastre despesas fixas primeiro.');
    
    // Confirmação simples para evitar duplicados acidentais
    if (!confirm(`Deseja lançar ${recurring.length} despesas fixas para este mês como Pendentes?`)) return;

    setIsGenerating(true);
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // Cria o array de transações baseadas nos modelos
    const transactionsToCreate = recurring.map(item => {
      // Define a data para o mês atual, no dia configurado
      const date = new Date(currentYear, currentMonth, item.day, 12, 0, 0);
      
      return {
        user_id: user.id,
        name: item.name,
        amount: item.amount,
        type: 'variable', // Fixos geralmente são saídas
        category: item.category,
        is_paid: false, // Cria sempre como PENDENTE para controlo
        created_at: date.toISOString()
      };
    });

    const { error } = await supabase.from('transactions').insert(transactionsToCreate);

    setIsGenerating(false);
    if (error) {
      alert('Erro ao gerar: ' + error.message);
    } else {
      navigate('/'); // Leva o usuário para a Home para ver o resultado
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="animate-in fade-in duration-500 pb-24 space-y-6">
      <h1 className="text-xl font-bold text-white">Configurações</h1>

      {/* --- SEÇÃO DE GASTOS FIXOS --- */}
      <div className="bg-[#121212] rounded-2xl border border-[#222] overflow-hidden">
        {/* Cabeçalho do Card */}
        <div className="p-4 border-b border-[#222] bg-[#1a1a1a] flex justify-between items-center">
            <div>
                <h2 className="font-bold text-white flex items-center gap-2"><Zap size={18} className="text-yellow-500"/> Despesas Fixas</h2>
                <p className="text-[10px] text-gray-500">Modelos para lançar todo mês</p>
            </div>
            
            {/* O BOTÃO MÁGICO */}
            <button 
                onClick={generateMonthExpenses}
                disabled={isGenerating || recurring.length === 0}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-blue-900/20"
            >
                {isGenerating ? 'Gerando...' : <><CheckCircle2 size={14}/> Lançar no Mês</>}
            </button>
        </div>
        
        <div className="p-4 space-y-4">
            {/* Formulário de Cadastro Rápido */}
            <form onSubmit={handleAddRecurring} className="grid grid-cols-6 gap-2 items-end bg-[#0a0a0a] p-3 rounded-xl border border-[#222]">
                <div className="col-span-3">
                    <label className="text-[9px] text-gray-500 font-bold uppercase">Nome</label>
                    <input type="text" placeholder="Ex: Internet" value={newName} onChange={e => setNewName(e.target.value)}
                        className="w-full bg-transparent border-b border-[#333] text-white text-xs py-1 outline-none focus:border-blue-500 placeholder-gray-700"/>
                </div>
                <div className="col-span-2">
                    <label className="text-[9px] text-gray-500 font-bold uppercase">Valor</label>
                    <input type="number" placeholder="0.00" value={newAmount} onChange={e => setNewAmount(e.target.value)}
                        className="w-full bg-transparent border-b border-[#333] text-white text-xs py-1 outline-none focus:border-blue-500 placeholder-gray-700"/>
                </div>
                <div className="col-span-1">
                    <label className="text-[9px] text-gray-500 font-bold uppercase">Dia</label>
                    <input type="number" placeholder="5" max="31" value={newDay} onChange={e => setNewDay(e.target.value)}
                        className="w-full bg-transparent border-b border-[#333] text-white text-xs py-1 outline-none focus:border-blue-500 placeholder-gray-700"/>
                </div>
                
                {/* Seletor de Categorias Horizontal */}
                <div className="col-span-5 flex gap-1 overflow-x-auto py-1 hide-scrollbar">
                    {Object.entries(CATEGORIES)
                        .filter(([k]) => !['salary', 'investment', 'extra'].includes(k)) // Filtra só despesas
                        .map(([key, cat]) => (
                        <button key={key} type="button" onClick={() => setNewCategory(key)}
                            className={`p-1.5 rounded-lg border transition-all shrink-0 ${newCategory === key ? 'bg-[#222] border-blue-500 text-white' : 'border-transparent text-gray-600 hover:bg-[#1a1a1a]'}`}>
                            <cat.icon size={14} />
                        </button>
                    ))}
                </div>

                <button type="submit" disabled={!newName || !newAmount}
                    className="col-span-1 bg-green-600 hover:bg-green-500 h-8 rounded-lg flex items-center justify-center text-white disabled:opacity-50">
                    <Plus size={18} />
                </button>
            </form>

            {/* Lista de Recorrentes */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {loading ? <p className="text-xs text-center text-gray-500">Carregando...</p> : 
                 recurring.length === 0 ? <p className="text-xs text-center text-gray-500 py-4 border border-dashed border-[#222] rounded-lg">Nenhum gasto fixo cadastrado.</p> :
                 recurring.map(item => {
                    const CatIcon = getCategory(item.category).icon;
                    return (
                        <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-[#1a1a1a] border border-[#222] group hover:border-[#333] transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="text-gray-500 bg-[#222] p-2 rounded-lg"><CatIcon size={16} /></div>
                                <div>
                                    <p className="text-sm font-bold text-white leading-none mb-1">{item.name}</p>
                                    <p className="text-[10px] text-gray-500">Vence dia {item.day}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-sm font-bold text-white">R$ {item.amount}</span>
                                <button onClick={() => handleDelete(item.id)} className="text-gray-600 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                            </div>
                        </div>
                    )
                 })}
            </div>
        </div>
      </div>

      {/* --- ÁREA DE CONTA --- */}
      <div className="bg-[#121212] rounded-2xl border border-[#222] p-4">
        <h2 className="font-bold text-white text-sm mb-3">Sua Conta</h2>
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between bg-[#1a1a1a] p-3 rounded-xl border border-[#222]">
                <span className="text-xs text-gray-400">Email</span>
                <span className="text-xs text-white font-medium">{user?.email}</span>
            </div>
            <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-red-900/30 text-red-500 hover:bg-red-900/10 transition-colors text-xs font-bold uppercase tracking-wider"
            >
                <LogOut size={16} /> Sair da conta
            </button>
        </div>
      </div>
    </div>
  );
}