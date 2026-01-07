import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Search, ChevronLeft, ChevronRight, Calendar, CheckCircle2, XCircle, Filter, Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getCategory } from '../utils/constants';

export default function Extract() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('month'); 
  const [currentDate, setCurrentDate] = useState(new Date());
  const [typeFilter, setTypeFilter] = useState('all');

  // --- Lógica de Data ---
  const changeMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const monthTitle = useMemo(() => {
    return currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  }, [currentDate]);

  // --- Busca ---
  const fetchTransactions = async () => {
    setLoading(true);
    let query = supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (viewMode === 'month') {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59).toISOString();
      query = query.gte('created_at', startOfMonth).lte('created_at', endOfMonth);
    } else {
      query = query.limit(200);
    }

    const { data } = await query;
    if (data) setTransactions(data);
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    fetchTransactions();

    const channel = supabase
      .channel('extract-realtime')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${user.id}` }, 
        () => fetchTransactions()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, currentDate, viewMode]);

  // --- Ações ---
  const togglePaid = async (e, t) => {
    e.stopPropagation(); 
    const newStatus = !t.is_paid;
    
    // Atualização otimista
    setTransactions(prev => prev.map(item => item.id === t.id ? {...item, is_paid: newStatus} : item));

    const { error } = await supabase
        .from('transactions')
        .update({ is_paid: newStatus })
        .eq('id', t.id);
    
    if (error) alert('Erro ao atualizar status');
  };

  const handleEdit = (transaction) => {
    navigate('/add', { state: { transaction } });
  };

  const filteredList = transactions.filter(t => {
    if (typeFilter === 'income') return t.type === 'income';
    if (typeFilter === 'expense') return t.type !== 'income';
    return true;
  });

  // --- NOVO: Cálculo do Resumo Dinâmico ---
  const summary = useMemo(() => {
    // Totais Gerais do período visualizado
    const totalIncome = filteredList.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const totalExpense = filteredList.filter(t => t.type !== 'income').reduce((acc, t) => acc + t.amount, 0);
    const balance = totalIncome - totalExpense;

    // Totais Pendentes (O que falta pagar/receber)
    const pendingIncome = filteredList.filter(t => t.type === 'income' && !t.is_paid).reduce((acc, t) => acc + t.amount, 0);
    const pendingExpense = filteredList.filter(t => t.type !== 'income' && !t.is_paid).reduce((acc, t) => acc + t.amount, 0);

    return { totalIncome, totalExpense, balance, pendingIncome, pendingExpense };
  }, [filteredList]);

  return (
    <div className="space-y-4 animate-in fade-in duration-500 pb-24">
      
      {/* --- CABEÇALHO --- */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between sticky top-0 z-20 bg-[#050505] py-2">
        <div className="flex bg-[#121212] p-1 rounded-xl border border-[#222] self-start">
            <button onClick={() => setViewMode('month')} className={`px-4 py-2 rounded-lg text-xs font-bold flex gap-2 ${viewMode === 'month' ? 'bg-[#222] text-white' : 'text-gray-500'}`}><Calendar size={14} /> Mês</button>
            <button onClick={() => setViewMode('all')} className={`px-4 py-2 rounded-lg text-xs font-bold flex gap-2 ${viewMode === 'all' ? 'bg-[#222] text-white' : 'text-gray-500'}`}><Filter size={14} /> Tudo</button>
        </div>

        {viewMode === 'month' && (
             <div className="flex items-center justify-between bg-[#1a1a1a] py-1.5 px-2 rounded-xl border border-[#333] w-full md:w-auto md:min-w-[250px]">
                <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-[#333] rounded-lg text-gray-300"><ChevronLeft size={18} /></button>
                <span className="font-bold text-sm capitalize text-white">{monthTitle}</span>
                <button onClick={() => changeMonth(1)} className="p-2 hover:bg-[#333] rounded-lg text-gray-300"><ChevronRight size={18} /></button>
             </div>
        )}
      </div>

      {/* --- NOVO PAINEL DE RESUMO --- */}
      {filteredList.length > 0 && (
        <div className="grid grid-cols-3 gap-2 md:gap-4">
            {/* Balanço */}
            <div className={`p-3 rounded-xl border flex flex-col justify-center items-center text-center ${summary.balance >= 0 ? 'bg-green-900/10 border-green-900/30' : 'bg-red-900/10 border-red-900/30'}`}>
                <p className="text-[9px] uppercase font-bold text-gray-500 mb-0.5">Sobra Prevista</p>
                <span className={`text-sm md:text-lg font-bold ${summary.balance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {summary.balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
            </div>

            {/* A Pagar (Falta) */}
            <div className="p-3 rounded-xl border border-red-900/20 bg-[#121212] flex flex-col justify-center items-center text-center">
                <p className="text-[9px] uppercase font-bold text-gray-500 mb-0.5 flex items-center gap-1"><TrendingDown size={10} /> Falta Pagar</p>
                <span className={`text-sm md:text-lg font-bold ${summary.pendingExpense > 0 ? 'text-red-400' : 'text-gray-500'}`}>
                    {summary.pendingExpense.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
            </div>

            {/* A Receber (Falta) */}
            <div className="p-3 rounded-xl border border-blue-900/20 bg-[#121212] flex flex-col justify-center items-center text-center">
                <p className="text-[9px] uppercase font-bold text-gray-500 mb-0.5 flex items-center gap-1"><TrendingUp size={10} /> Falta Receber</p>
                <span className={`text-sm md:text-lg font-bold ${summary.pendingIncome > 0 ? 'text-blue-400' : 'text-gray-500'}`}>
                    {summary.pendingIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
            </div>
        </div>
      )}

      {/* --- LISTA --- */}
      <div className="space-y-3">
        {loading ? (
           <div className="text-center py-12 text-xs text-gray-500 animate-pulse">Carregando...</div>
        ) : filteredList.length > 0 ? (
            filteredList.map(t => {
              const catData = getCategory(t.category);
              const CategoryIcon = catData.icon;
              
              return (
                <div 
                  key={t.id}
                  onClick={() => handleEdit(t)}
                  className={`relative group flex flex-col md:flex-row md:items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer overflow-hidden
                    ${t.is_paid 
                        ? 'bg-[#121212] border-[#222] hover:border-[#333]' 
                        : 'bg-[#1a1a1a] border-red-500/30 shadow-[inset_3px_0_0_0_#ef4444]'}`} // Mudei a cor da borda/sombra para Red
                >
                  <div className="flex items-center gap-4 mb-3 md:mb-0">
                    <div className={`p-3 rounded-full shrink-0 ${t.is_paid ? catData.bg : 'bg-red-500/10'}`}>
                      <CategoryIcon size={20} className={t.is_paid ? catData.color : 'text-red-500'} />
                    </div>
                    <div>
                      <h3 className={`font-bold text-sm md:text-base ${t.is_paid ? 'text-white' : 'text-red-100'}`}>{t.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                         <span className="text-[10px] md:text-xs text-gray-500 bg-[#222] px-1.5 py-0.5 rounded capitalize">{catData.label}</span>
                         <span className="text-[10px] md:text-xs text-gray-500">
                            {new Date(t.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
                         </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:gap-8">
                     <span className={`text-base md:text-lg font-bold ${t.type === 'income' ? 'text-green-400' : 'text-white'}`}>
                        {t.type === 'income' ? '+ ' : '- '}
                        {Number(t.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                     </span>

                     <button
                        onClick={(e) => togglePaid(e, t)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-bold text-[10px] md:text-xs uppercase tracking-wider transition-all hover:scale-105 active:scale-95
                        ${t.is_paid 
                            ? 'bg-green-500/10 border-green-500/50 text-green-500 hover:bg-green-500/20' 
                            : 'bg-red-500/10 border-red-500/50 text-red-500 hover:bg-red-500/20'}`} // Cores atualizadas para Red
                     >
                        {t.is_paid ? (
                            <>PAGO <CheckCircle2 size={14} /></>
                        ) : (
                            <>PENDENTE <XCircle size={14} /></>
                        )}
                     </button>
                  </div>
                </div>
              );
            })
        ) : (
            <div className="py-20 flex flex-col items-center justify-center text-gray-500 gap-3 border border-dashed border-[#222] rounded-2xl bg-[#121212]/30">
                <Search size={24} className="opacity-20" />
                <p className="text-sm font-medium">Nada encontrado.</p>
            </div>
        )}
      </div>
    </div>
  );
}