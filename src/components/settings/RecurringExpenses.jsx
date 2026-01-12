import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Trash2, Zap, CheckCircle2, ArrowLeft, Calendar, Coins, X } from 'lucide-react';
import { getCategory, CATEGORIES } from '../../utils/constants';
import { useNavigate } from 'react-router-dom';

export function RecurringExpenses({ onBack }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [recurring, setRecurring] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAdding, setIsAdding] = useState(false); // Controla a visibilidade do form
  
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
      setIsAdding(false); // Fecha o form ao salvar
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
    if (!confirm(`Confirmar lançamento de ${recurring.length} despesas para este mês?`)) return;

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

  const totalFixed = useMemo(() => recurring.reduce((acc, item) => acc + Number(item.amount), 0), [recurring]);

  return (
    <div className="space-y-6 animate-in slide-in-from-right-8 duration-300 pb-24 relative min-h-screen">
      
      {/* Header Fixo no Topo */}
      <div className="flex items-center justify-between py-2 sticky top-0 bg-[#050505] z-10 border-b border-[#222] mb-4">
        <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-[#1a1a1a] text-gray-400 hover:text-white transition-colors">
                <ArrowLeft size={22} />
            </button>
            <h1 className="text-lg font-bold text-white">Fixos</h1>
        </div>
        
        {/* Botão Novo (Só aparece se não estiver adicionando) */}
        {!isAdding && (
            <button 
                onClick={() => setIsAdding(true)} 
                className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-xl transition-all shadow-lg shadow-blue-900/20 active:scale-95"
            >
                <Plus size={20} />
            </button>
        )}
      </div>

      {/* --- FORMULÁRIO DE ADIÇÃO (Colapsável) --- */}
      {isAdding && (
          <div className="bg-[#121212] border border-[#222] rounded-2xl p-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Nova Despesa Fixa</h3>
                  <button onClick={() => setIsAdding(false)} className="text-gray-500 hover:text-white"><X size={18}/></button>
              </div>
              
              <form onSubmit={handleAddRecurring} className="space-y-4">
                  <div className="grid grid-cols-4 gap-3">
                      <div className="col-span-3 space-y-1">
                          <label className="text-[9px] font-bold text-gray-500 uppercase ml-1">Nome</label>
                          <input type="text" placeholder="Ex: Netflix" value={newName} onChange={e => setNewName(e.target.value)} autoFocus
                              className="w-full bg-[#1a1a1a] border border-[#222] rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500 transition-all"/>
                      </div>
                      <div className="col-span-1 space-y-1">
                          <label className="text-[9px] font-bold text-gray-500 uppercase ml-1">Dia</label>
                          <input type="number" placeholder="5" max="31" value={newDay} onChange={e => setNewDay(e.target.value)}
                              className="w-full bg-[#1a1a1a] border border-[#222] rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500 text-center transition-all"/>
                      </div>
                  </div>

                  <div className="space-y-1">
                      <label className="text-[9px] font-bold text-gray-500 uppercase ml-1">Valor</label>
                      <div className="relative">
                          <span className="absolute left-3 top-2.5 text-gray-500 text-sm font-bold">R$</span>
                          <input type="number" placeholder="0.00" value={newAmount} onChange={e => setNewAmount(e.target.value)}
                              className="w-full bg-[#1a1a1a] border border-[#222] rounded-xl pl-9 pr-3 py-2.5 text-sm text-white font-bold outline-none focus:border-blue-500 transition-all"/>
                      </div>
                  </div>

                  <div>
                      <label className="text-[9px] font-bold text-gray-500 uppercase block mb-2 ml-1">Categoria</label>
                      <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                          {Object.entries(CATEGORIES)
                              .filter(([k]) => !['salary', 'investment', 'extra'].includes(k))
                              .map(([key, cat]) => (
                              <button key={key} type="button" onClick={() => setNewCategory(key)}
                                  className={`p-2 rounded-xl border transition-all shrink-0 flex flex-col items-center justify-center gap-1 min-w-[64px] 
                                  ${newCategory === key ? 'bg-[#222] border-blue-500 shadow-[0_0_10px_rgba(37,99,235,0.2)]' : 'border-[#222] bg-[#1a1a1a] opacity-50'}`}>
                                  <cat.icon size={18} className={newCategory === key ? 'text-blue-400' : 'text-gray-500'} />
                                  <span className={`text-[9px] ${newCategory === key ? 'text-white font-bold' : 'text-gray-500'}`}>{cat.label}</span>
                              </button>
                          ))}
                      </div>
                  </div>

                  <button type="submit" disabled={!newName || !newAmount}
                      className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-green-900/20 active:scale-95 transition-all">
                      Salvar Despesa
                  </button>
              </form>
          </div>
      )}

      {/* --- DASHBOARD E LISTA --- */}
      {!isAdding && (
          <>
            {/* Card Resumo */}
            {recurring.length > 0 && (
                <div className="bg-gradient-to-br from-[#121212] to-[#0a0a0a] border border-[#222] rounded-2xl p-5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5"><Coins size={80}/></div>
                    <div className="relative z-10 flex justify-between items-end">
                        <div>
                            <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">Total em Fixos</p>
                            <h2 className="text-2xl font-bold text-white">
                                {totalFixed.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </h2>
                            <p className="text-[10px] text-gray-400 mt-1">{recurring.length} contas cadastradas</p>
                        </div>
                        <button 
                            onClick={generateMonthExpenses}
                            disabled={isGenerating}
                            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-blue-900/20 active:scale-95 transition-all"
                        >
                            {isGenerating ? '...' : <><CheckCircle2 size={16}/> Lançar Mês</>}
                        </button>
                    </div>
                </div>
            )}

            {/* Lista */}
            <div className="space-y-3">
                {loading ? <p className="text-xs text-center text-gray-500 py-10">Carregando...</p> : 
                    recurring.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-600 gap-3 border border-dashed border-[#222] rounded-2xl bg-[#121212]/30">
                            <Zap size={32} className="opacity-20"/>
                            <p className="text-xs font-medium">Nenhuma conta fixa ainda.</p>
                            <button onClick={() => setIsAdding(true)} className="text-blue-500 text-xs font-bold hover:underline">
                                Adicionar a primeira
                            </button>
                        </div>
                    ) :
                    recurring.map(item => {
                    const CatData = getCategory(item.category);
                    const CatIcon = CatData.icon;
                    return (
                        <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl bg-[#121212] border border-[#222] hover:bg-[#161616] transition-all group">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-xl bg-[#1a1a1a] text-gray-400 border border-[#222]`}>
                                    <CatIcon size={20} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white mb-0.5">{item.name}</p>
                                    <p className="text-[10px] text-gray-500 bg-[#1a1a1a] px-2 py-0.5 rounded-md inline-block">
                                        Dia {item.day}
                                    </p>
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
          </>
      )}
    </div>
  );
}