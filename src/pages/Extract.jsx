import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { useTransactionsContext } from '../contexts/TransactionContext';
import { 
  Search, ChevronLeft, ChevronRight, Calendar, 
  CheckCircle2, XCircle, Filter, TrendingUp, 
  TrendingDown, ChevronDown, ChevronUp, ArrowUpDown 
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getCategory } from '../utils/constants';
import { MonthSelector } from '../components/dashboard/MonthSelector';

export default function Extract() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { transactions, loading } = useTransactionsContext();
  const { showAlert } = useNotifications();
  
  // Verifica se veio uma categoria pelo state (drill-down da Análise)
  const initialCategory = location.state?.category || 'all';
  const [activeFilter, setActiveFilter] = useState(initialCategory);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState('date'); // 'date', 'amount_desc', 'amount_asc'

  // --- Ações ---
  const togglePaid = async (e, t) => {
    e.stopPropagation();
    if (t.type === 'income') return;

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

  const filterOptions = [
    { id: 'all', label: 'Todos' },
    { id: 'income', label: 'Entradas' },
    { id: 'expense', label: 'Saídas' },
    { id: 'pending', label: 'Pendentes' },
    { id: 'paid', label: 'Pagos' }
  ];

  const sortOptions = [
    { id: 'date', label: 'Mais Recentes', icon: Calendar },
    { id: 'amount_desc', label: 'Maior Valor', icon: TrendingDown },
    { id: 'amount_asc', label: 'Menor Valor', icon: TrendingUp }
  ];

  const filteredList = useMemo(() => {
    let list = [...transactions].filter(t => {
      // Filtros Especiais
      if (activeFilter === 'all') return true;
      if (activeFilter === 'income') return t.type === 'income';
      if (activeFilter === 'expense') return t.type !== 'income';
      if (activeFilter === 'pending') return !t.is_paid && t.type !== 'income';
      if (activeFilter === 'paid') return t.is_paid;
      
      // Filtro por Categoria Específica (Drill-down)
      return t.category === activeFilter;
    });

    if (sortOrder === 'amount_desc') {
        list.sort((a, b) => b.amount - a.amount);
    } else if (sortOrder === 'amount_asc') {
        list.sort((a, b) => a.amount - b.amount);
    } else {
        list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    return list;
  }, [transactions, activeFilter, sortOrder]);

  const summary = useMemo(() => {
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type !== 'income').reduce((acc, t) => acc + t.amount, 0);
    const balance = totalIncome - totalExpense;
    const pendingExpense = transactions.filter(t => t.type !== 'income' && !t.is_paid).reduce((acc, t) => acc + t.amount, 0);

    return { balance, pendingExpense };
  }, [transactions]);

  return (
    <div className="animate-in fade-in duration-500">
      
      {/* HEADER FIXO */}
      <div className="sticky -top-8 z-20 bg-background/95 backdrop-blur-md pt-8 pb-4 space-y-3 border-b border-border -mx-4 px-4">
        
        {/* Cards de Resumo */}
        <div className="grid grid-cols-2 gap-2">
          <div className={`p-2.5 rounded-xl border flex flex-col justify-center items-center text-center ${summary.balance >= 0 ? 'bg-green-900/10 border-green-900/30' : 'bg-red-900/10 border-red-900/30'}`}>
            <p className="text-[9px] uppercase font-bold text-gray-500 mb-0.5">Sobra Prevista</p>
            <span className={`text-xs font-bold ${summary.balance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {summary.balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>
          <div className="p-2.5 rounded-xl border border-red-900/20 bg-card flex flex-col justify-center items-center text-center">
            <p className="text-[9px] uppercase font-bold text-gray-500 mb-0.5 flex items-center gap-1"><TrendingDown size={10} /> Falta Pagar</p>
            <span className={`text-xs font-bold ${summary.pendingExpense > 0 ? 'text-red-400' : 'text-gray-500'}`}>
              {summary.pendingExpense.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>
        </div>

        {/* BARRA DE FERRAMENTAS */}
        <div className="flex items-center justify-between gap-2 relative">
          <div className="flex items-center gap-2">
            {/* FILTRO */}
            <div className="relative">
              <button
                onClick={() => { setIsFilterOpen(!isFilterOpen); setIsSortOpen(false); }}
                className={`p-2.5 rounded-xl border transition-colors flex items-center justify-center gap-2
                      ${activeFilter !== 'all' ? 'bg-blue-600 border-blue-600 text-foreground' : 'bg-card border-border text-gray-400'}`}
              >
                <Filter size={18} />
                <span className="text-[10px] font-bold uppercase hidden md:block">Filtrar</span>
              </button>

              {isFilterOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-card-hover border border-border rounded-xl shadow-2xl p-1.5 flex flex-col gap-1 animate-in slide-in-from-top-2 duration-200 z-50">
                  {filterOptions.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => { setActiveFilter(opt.id); setIsFilterOpen(false); }}
                      className={`text-left px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors
                            ${activeFilter === opt.id ? 'bg-blue-600 text-foreground' : 'text-gray-400 hover:bg-border hover:text-foreground'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ORDENAÇÃO */}
            <div className="relative">
                <button 
                    onClick={() => { setIsSortOpen(!isSortOpen); setIsFilterOpen(false); }}
                    className={`p-2.5 rounded-xl border transition-all flex items-center justify-center gap-2
                        ${sortOrder !== 'date' ? 'bg-blue-600 border-blue-600 text-foreground' : 'bg-card border-border text-gray-400'}`}
                >
                    <ArrowUpDown size={18} />
                    <span className="text-[10px] font-bold uppercase hidden md:block">Ordenar</span>
                </button>

                {isSortOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-card-hover border border-border rounded-xl shadow-2xl p-1.5 flex flex-col gap-1 animate-in slide-in-from-top-2 duration-200 z-50">
                  {sortOptions.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => { setSortOrder(opt.id); setIsSortOpen(false); }}
                      className={`text-left px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-between
                            ${sortOrder === opt.id ? 'bg-blue-600 text-foreground' : 'text-gray-400 hover:bg-border hover:text-foreground'}`}
                    >
                      {opt.label}
                      <opt.icon size={14} className="opacity-50" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="z-40">
            <MonthSelector />
          </div>
        </div>
      </div>

      {/* LISTA */}
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
                    ? 'bg-card-hover border-green-500/10 shadow-[inset_3px_0_0_0_#22c55e]'
                    : t.is_paid
                      ? 'bg-card border-border hover:border-border-strong'
                      : 'bg-card-hover border-red-500/30 shadow-[inset_3px_0_0_0_#ef4444]'}`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className={`p-2.5 rounded-full shrink-0 ${isIncome ? 'bg-green-500/10' : catData.bg}`}>
                    <CategoryIcon size={18} className={isIncome ? 'text-green-500' : catData.color} />
                  </div>
                  <div className="flex flex-col truncate">
                    <h3 className={`font-bold text-[13px] text-foreground line-clamp-1 leading-tight`}>{t.name}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5 opacity-80">
                      <span className="text-[9px] text-gray-500 bg-background border border-border px-1.5 py-0.5 rounded capitalize">{catData.label}</span>
                      <span className="text-[9px] font-medium text-gray-500">
                        {new Date(t.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0 ml-2">
                  <span className={`text-[14px] font-extrabold ${isIncome ? 'text-green-400' : 'text-foreground'} leading-tight`}>
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
          <div className="py-20 md:col-span-2 flex flex-col items-center justify-center text-gray-500 gap-3 border border-dashed border-border rounded-2xl bg-card/30">
            <p className="text-sm font-medium">Nada encontrado.</p>
          </div>
        )}
      </div>
    </div>
  );
}