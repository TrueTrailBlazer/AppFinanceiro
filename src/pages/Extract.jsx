import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { useTransactionsContext } from '../contexts/TransactionContext';
import { Search, ChevronLeft, ChevronRight, Calendar, CheckCircle2, XCircle, Filter, TrendingUp, TrendingDown, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getCategory } from '../utils/constants';
import { MonthSelector } from '../components/dashboard/MonthSelector';

export default function Extract() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const { transactions, loading, monthTitle, changeMonth } = useTransactionsContext();
  const [viewMode, setViewMode] = useState('month');
  
  const { showAlert } = useNotifications();
  const [activeFilter, setActiveFilter] = useState('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // --- Ações ---
  const togglePaid = async (e, t) => {
    e.stopPropagation();
    if (t.type === 'income') return; // Segurança: Entradas não mudam

    const newStatus = !t.is_paid;

    const { error } = await supabase
      .from('transactions')
      .update({ is_paid: newStatus })
      .eq('id', t.id);

    if (error) showAlert('Erro ao atualizar status', 'error');
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
    <div className="animate-in fade-in duration-500 pb-48 md:pb-0">

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

          <div className="flex z-50">
            <MonthSelector />
          </div>

          {/* NAVEGAÇÃO DESKTOP ANTIGA (Removida, substituída pelo MonthSelector modal unificado) */}
        </div>
      </div>

      {/* --- LISTA DE TRANSAÇÕES --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
        {loading ? (
          <div className="text-center md:col-span-2 py-12 text-xs text-gray-500 animate-pulse">Carregando...</div>
        ) : filteredList.length > 0 ? (
          filteredList.map(t => {
            const catData = getCategory(t.category);
            const CategoryIcon = catData.icon;
            const isIncome = t.type === 'income';

            return (
              <div
                key={t.id}
                onClick={() => handleEdit(t)}
                className={`group flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer overflow-hidden
                    ${isIncome
                    ? 'bg-[#1a1a1a] border-green-500/10 shadow-[inset_3px_0_0_0_#22c55e]'
                    : t.is_paid
                      ? 'bg-[#121212] border-[#222] hover:border-[#333]'
                      : 'bg-[#1a1a1a] border-red-500/30 shadow-[inset_3px_0_0_0_#ef4444]'}`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className={`p-2.5 rounded-full shrink-0 ${isIncome ? 'bg-green-500/10' : (t.is_paid ? catData.bg : 'bg-red-500/10')}`}>
                    <CategoryIcon size={18} className={isIncome ? 'text-green-500' : (t.is_paid ? catData.color : 'text-red-500')} />
                  </div>
                  <div className="flex flex-col truncate">
                    <h3 className={`font-bold text-[13px] ${isIncome ? 'text-white' : (t.is_paid ? 'text-white' : 'text-red-100')} line-clamp-1 leading-tight`}>{t.name}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5 opacity-80">
                      <span className="text-[9px] text-gray-500 bg-[#2b2b2b] px-1.5 py-0.5 rounded capitalize">{catData.label}</span>
                      <span className="text-[9px] font-medium text-gray-500">
                        {new Date(t.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0 ml-2">
                  <span className={`text-[14px] font-extrabold ${isIncome ? 'text-green-400' : 'text-white'} leading-tight`}>
                    {isIncome ? '+ ' : '- '}
                    {Number(t.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>

                  {!isIncome && (
                    <button
                      onClick={(e) => togglePaid(e, t)}
                      className={`mt-2 px-3 py-1.5 rounded-lg border font-bold text-[9px] uppercase tracking-widest transition-all
                            ${t.is_paid
                          ? 'bg-green-500/10 border-green-500/50 text-green-500'
                          : 'bg-red-500/10 border-red-500/40 text-red-500'}`}
                    >
                      {t.is_paid ? 'PAGO' : 'PENDENTE'}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-20 md:col-span-2 flex flex-col items-center justify-center text-gray-500 gap-3 border border-dashed border-[#222] rounded-2xl bg-[#121212]/30">
            <Search size={24} className="opacity-20" />
            <p className="text-sm font-medium">Nada encontrado com este filtro.</p>
          </div>
        )}
      </div>

      {/* NAVEGAÇÃO MOBILE ANTIGA REMOVIDA */}

    </div>
  );
}