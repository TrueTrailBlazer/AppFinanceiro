import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Trash2, Zap, CheckCircle2, ArrowLeft, Calendar, Coins, X, Check } from 'lucide-react';
import { getCategory, CATEGORIES } from '../../utils/constants';
import { useNavigate } from 'react-router-dom';

export function RecurringExpenses({ onBack }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [recurring, setRecurring] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false); // Modal em vez de form inline
  
  // Form States
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
      setNewCategory('bills');
      setNewDay('5');
      setIsModalOpen(false); // Fecha o modal
      fetchRecurring();
    }
  };

  const handleDelete = async (id) => {
    if(!confirm("Remover esta despesa fixa?")) return;
    await supabase.from('recurring_expenses').delete().eq('id', id);
    setRecurring(prev => prev.filter(item => item.id !== id));
  };

  const generateMonthExpenses = async () => {
    if (recurring.length === 0) return;
    
    // Confirmação estilizada (nativa do browser por enquanto)
    if (!confirm(`Gerar ${recurring.length} contas para este mês?`)) return;

    setIsGenerating(true);
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const transactionsToCreate = recurring.map(item => {
      // Cria data com dia fixo, meio-dia para evitar fuso horário
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

  const totalFixed = useMemo(() => recurring.reduce((acc, item) => acc + Number(item.amount), 0), [recurring]);

  return (
    <div className="space-y-6 animate-in slide-in-from-right-8 duration-300 pb-24 relative min-h-screen">
      
      {/* --- HEADER --- */}
      <div className="flex items-center justify-between py-2 sticky top-0 bg-[#050505] z-10 border-b border-[#222]">
        <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-[#1a1a1a] text-gray-400 hover:text-white transition-colors">
                <ArrowLeft size={22} />
            </button>
            <h1 className="text-lg font-bold text-white">Fixos</h1>
        </div>
        
        {/* Botão de Adicionar (Header) */}
        <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-[#1a1a1a] border border-[#222] text-blue-500 hover:text-white hover:bg-blue-600 hover:border-blue-600 p-2 rounded-xl transition-all active:scale-95"
        >
            <Plus size={20} />
        </button>
      </div>

      {/* --- CARD RESUMO --- */}
      {recurring.length > 0 ? (
        <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 border border-blue-500/20 rounded-2xl p-5 relative overflow-hidden shadow-2xl">
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
      ) : (
        <div className="bg-[#121212] border border-[#222] rounded-2xl p-6 text-center">
             <div className="w-12 h-12 bg-[#1a1a1a] rounded-full flex items-center justify-center mx-auto mb-3 text-gray-500">
                <Zap size={24}/>
             </div>
             <h3 className="text-sm font-bold text-white mb-1">Sem gastos fixos</h3>
             <p className="text-xs text-gray-500 mb-4">Cadastre aluguel, internet e assinaturas para lançar tudo com um clique.</p>
             <button onClick={() => setIsModalOpen(true)} className="text-blue-500 text-xs font-bold hover:underline">
                Começar agora
             </button>
        </div>
      )}

      {/* --- LISTA DE FIXOS --- */}
      <div className="space-y-3">
        {loading ? <p className="text-xs text-center text-gray-500 py-4">Carregando...</p> : 
            recurring.map(item => {
            const CatData = getCategory(item.category);
            const CatIcon = CatData.icon;
            return (
                <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl bg-[#121212] border border-[#222] hover:border-[#333] transition-all group">
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
                        <button onClick={() => handleDelete(item.id)} className="text-gray-600 hover:text-red-500 transition-colors">
                            <Trash2 size={16}/>
                        </button>
                    </div>
                </div>
            )
            })}
      </div>

      {/* --- MODAL DE ADICIONAR (Tela Cheia / Overlay) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#050505] animate-in slide-in-from-bottom-10 duration-200 flex flex-col">
            
            {/* Header Modal */}
            <div className="px-4 py-4 border-b border-[#222] flex items-center justify-between bg-[#121212]">
                <h2 className="text-lg font-bold text-white">Nova Despesa Fixa</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 bg-[#222] rounded-full text-gray-400 hover:text-white">
                    <X size={20} />
                </button>
            </div>

            {/* Conteúdo Scrollável */}
            <div className="flex-1 overflow-y-auto p-5">
                <form onSubmit={handleAddRecurring} className="space-y-6 max-w-md mx-auto">
                    
                    {/* Inputs Básicos */}
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

                    {/* Grid de Categorias */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase ml-1 block">Categoria</label>
                        <div className="grid grid-cols-3 gap-2">
                            {Object.entries(CATEGORIES)
                                .filter(([k]) => !['salary', 'investment', 'extra'].includes(k))
                                .map(([key, cat]) => (
                                <button 
                                    key={key} 
                                    type="button" 
                                    onClick={() => setNewCategory(key)}
                                    className={`relative p-3 rounded-xl border transition-all flex flex-col items-center gap-2
                                    ${newCategory === key 
                                        ? 'bg-blue-600/10 border-blue-500' 
                                        : 'bg-[#1a1a1a] border-[#222] opacity-60 hover:opacity-100'}`}
                                >
                                    {/* Check Visual */}
                                    {newCategory === key && (
                                        <div className="absolute top-2 right-2 bg-blue-500 rounded-full p-0.5">
                                            <Check size={8} className="text-white"/>
                                        </div>
                                    )}
                                    <cat.icon size={20} className={newCategory === key ? 'text-blue-400' : 'text-gray-400'} />
                                    <span className={`text-[10px] ${newCategory === key ? 'text-white font-bold' : 'text-gray-500'}`}>{cat.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </form>
            </div>

            {/* Footer Fixo */}
            <div className="p-4 border-t border-[#222] bg-[#050505]">
                <button 
                    onClick={handleAddRecurring}
                    disabled={!newName || !newAmount}
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-900/20 active:scale-95 transition-all"
                >
                    Salvar Despesa
                </button>
            </div>
        </div>
      )}

    </div>
  );
}