import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Search, ChevronLeft, ChevronRight, Calendar, CheckCircle2, XCircle, Filter, TrendingUp, TrendingDown, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getCategory } from '../utils/constants';

export default function Extract() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('month'); 
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [activeFilter, setActiveFilter] = useState('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

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
    if (t.type === 'income') return; // Segurança: Entradas não mudam

    const newStatus = !t.is_paid;
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

  // --- Filtros ---
  const filterOptions = [
    { id: 'all', label: 'Todos' },
    { id: 'income', label: 'Entradas' },
    { id: 'expense', label: 'Saídas' },
    { id: 'pending', label: 'Pendentes' },
    { id: 'paid', label: 'Pagos' }
  ];

  const getActiveLabel = () => filterOptions.find(f => f.id === activeFilter)?.label;

  const filteredList = useMemo(() => {
    return transactions.filter(t => {
      if (activeFilter === 'income') return t.type === 'income';
      if (activeFilter === 'expense') return t.type !== 'income';
      if (activeFilter === 'pending') return !t.is_paid && t.type !== 'income'; 
      if (activeFilter === 'paid') return t.is_paid;
      return true; 
    });
  }, [transactions, activeFilter]);

  const summary = useMemo(() => {
    const baseList = transactions; 
    const totalIncome = baseList.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const totalExpense = baseList.filter(t => t.type !== 'income').reduce((acc, t) => acc + t.amount, 0);
    const balance = totalIncome - totalExpense;
    const pendingExpense = baseList.filter(t => t.type !== 'income' && !t.is_paid).reduce((acc, t) => acc + t.amount, 0);

    return { balance, pendingExpense };
  }, [transactions]);

  return (
    <div className="animate-in fade-in duration-500 pb-32 md:pb-0">
      
      {/* --- ÁREA FIXA SUPERIOR --- */}
      <div className="sticky top-0 z-20 bg-[#050505]/95 backdrop-blur-md pt-2 pb-4 space-y-3 border-b border-[#222] px-1 -mx-1 md:px-0 md:mx-0">
        
        {/* Cards de Resumo */}
        <div className="grid grid-cols-2 gap-2">
            <div className={`p-2.5 rounded-xl border flex flex-col justify-center items-center text-center ${summary.balance >= 0 ? 'bg-green-900/10 border-green-900/30' : 'bg-red-900/10 border-red-900/30'}`}>
                <p className="text-[9px] uppercase font-bold text-gray-500 mb-0.5">Sobra Prevista</p>
                <span className={`text-xs md:text-sm font-bold ${summary.balance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {summary.balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
            </div>
            <div className="p-2.5 rounded-xl border border-red-900/20 bg-[#121212] flex flex-col justify-center items-center text-center">
                <p className="text-[9px] uppercase font-bold text-gray-500 mb-0.5 flex items-center gap-1"><TrendingDown size={10} /> Falta Pagar</p>
                <span className={`text-xs md:text-sm font-bold ${summary.pendingExpense > 0 ? 'text-red-400' : 'text-gray-500'}`}>
                    {summary.pendingExpense.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
            </div>
        </div>

        {/* --- BARRA DE FERRAMENTAS --- */}
        <div className="flex flex-row items-center justify-between gap-2 relative">
            
            {/* 1. FILTRO ICON (Mobile) */}
            <div className="md:hidden relative z-50">
                <button 
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className={`p-2.5 rounded-xl border transition-colors flex items-center justify-center
                    ${activeFilter !== 'all' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-[#121212] border-[#222] text-gray-400'}`}
                >
                  <Filter size={18} />
                </button>

                {/* Dropdown Menu */}
                {isFilterOpen && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-[#1a1a1a] border border-[#222] rounded-xl shadow-2xl p-1.5 flex flex-col gap-1 animate-in slide-in-from-top-2 duration-200">
                    {filterOptions.map(option => (
                      <button
                        key={option.id}
                        onClick={() => { setActiveFilter(option.id); setIsFilterOpen(false); }}
                        className={`text-left px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors
                          ${activeFilter === option.id ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-[#222] hover:text-white'}`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
            </div>

            {/* 2. FILTROS PC */}
            <div className="hidden md:flex gap-2 pb-1">
                {filterOptions.map(filter => (
                    <button
                        key={filter.id}
                        onClick={() => setActiveFilter(filter.id)}
                        className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-colors
                        ${activeFilter === filter.id 
                            ? 'bg-blue-600/10 border-blue-600 text-blue-500' 
                            : 'bg-[#121212] border-[#222] text-gray-500 hover:border-gray-600'}`}
                    >
                        {filter.label}
                    </button>
                ))}
            </div>

            {/* 3. NAVEGAÇÃO DESKTOP (Apenas no PC - md:flex) */}
            {viewMode === 'month' && (
                <div className="hidden md:flex items-center gap-3 bg-[#121212] p-1 rounded-lg border border-[#222] ml-auto">
                    <button onClick={() => changeMonth(-1)} className="p-1.5 hover:bg-[#222] rounded text-gray-400"><ChevronLeft size={16} /></button>
                    <span className="text-xs font-bold text-white min-w-[100px] text-center capitalize">{monthTitle}</span>
                    <button onClick={() => changeMonth(1)} className="p-1.5 hover:bg-[#222] rounded text-gray-400"><ChevronRight size={16} /></button>
                </div>
            )}
        </div>
      </div>

      {/* --- LISTA DE TRANSAÇÕES --- */}
      <div className="space-y-3 pt-2">
        {loading ? (
           <div className="text-center py-12 text-xs text-gray-500 animate-pulse">Carregando...</div>
        ) : filteredList.length > 0 ? (
            filteredList.map(t => {
              const catData = getCategory(t.category);
              const CategoryIcon = catData.icon;
              const isIncome = t.type === 'income';
              
              return (
                <div 
                  key={t.id}
                  onClick={() => handleEdit(t)}
                  className={`relative group flex flex-col md:flex-row md:items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer overflow-hidden
                    ${isIncome
                        ? 'bg-[#1a1a1a] border-green-500/10 shadow-[inset_3px_0_0_0_#22c55e]' 
                        : t.is_paid 
                            ? 'bg-[#121212] border-[#222] hover:border-[#333]' 
                            : 'bg-[#1a1a1a] border-red-500/30 shadow-[inset_3px_0_0_0_#ef4444]'}`}
                >
                  <div className="flex items-center gap-4 mb-3 md:mb-0">
                    <div className={`p-3 rounded-full shrink-0 ${isIncome ? 'bg-green-500/10' : (t.is_paid ? catData.bg : 'bg-red-500/10')}`}>
                      <CategoryIcon size={20} className={isIncome ? 'text-green-500' : (t.is_paid ? catData.color : 'text-red-500')} />
                    </div>
                    <div>
                      <h3 className={`font-bold text-sm md:text-base ${isIncome ? 'text-white' : (t.is_paid ? 'text-white' : 'text-red-100')}`}>{t.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                         <span className="text-[10px] md:text-xs text-gray-500 bg-[#222] px-1.5 py-0.5 rounded capitalize">{catData.label}</span>
                         <span className="text-[10px] md:text-xs text-gray-500">
                            {new Date(t.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
                         </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:gap-8">
                     <span className={`text-base md:text-lg font-bold ${isIncome ? 'text-green-400' : 'text-white'}`}>
                        {isIncome ? '+ ' : '- '}
                        {Number(t.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                     </span>

                     {/* Botão de Status: SÓ PARA DESPESAS */}
                     {!isIncome && (
                         <button
                            onClick={(e) => togglePaid(e, t)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-bold text-[10px] md:text-xs uppercase tracking-wider transition-all hover:scale-105 active:scale-95
                            ${t.is_paid 
                                ? 'bg-green-500/10 border-green-500/50 text-green-500 hover:bg-green-500/20'  // <-- CORRIGIDO PARA VERDE
                                : 'bg-red-500/10 border-red-500/50 text-red-500 hover:bg-red-500/20'}`}
                         >
                            {t.is_paid ? (
                                <>PAGO <CheckCircle2 size={14} /></>
                            ) : (
                                <>PENDENTE <XCircle size={14} /></>
                            )}
                         </button>
                     )}
                     
                     {/* Ícone estático para entrada */}
                     {isIncome && <div className="px-3 py-1.5"><CheckCircle2 size={18} className="text-green-500/30" /></div>}
                  </div>
                </div>
              );
            })
        ) : (
            <div className="py-20 flex flex-col items-center justify-center text-gray-500 gap-3 border border-dashed border-[#222] rounded-2xl bg-[#121212]/30">
                <Search size={24} className="opacity-20" />
                <p className="text-sm font-medium">Nada encontrado com este filtro.</p>
            </div>
        )}
      </div>

      {/* --- NAVEGAÇÃO MOBILE (Fixa em Baixo - md:hidden) --- */}
      {viewMode === 'month' && (
        <div className="fixed bottom-[90px] left-0 right-0 px-4 z-40 md:hidden">
            <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between bg-[#1a1a1a]/95 backdrop-blur-md py-1.5 px-3 rounded-xl border border-[#333] shadow-xl">
                <button onClick={() => changeMonth(-1)} className="p-1.5 hover:bg-[#333] rounded-lg text-gray-300"><ChevronLeft size={18} /></button>
                <div className="flex items-center gap-2">
                <Calendar size={14} className="text-blue-500" />
                <span className="font-bold text-sm capitalize text-white">{monthTitle}</span>
                </div>
                <button onClick={() => changeMonth(1)} className="p-1.5 hover:bg-[#333] rounded-lg text-gray-300"><ChevronRight size={18} /></button>
            </div>
            </div>
        </div>
      )}

    </div>
  );
}