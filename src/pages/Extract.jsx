import { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { useTransactionsContext } from '../contexts/TransactionContext';
import { useLocation } from 'react-router-dom';
import { getCategory, CATEGORIES } from '../utils/constants';
import { parseCents, formatCurrency } from '../utils/money';
import { formatLocalDate } from '../utils/date';
import { BankBadge } from '../utils/banks';
import { useDate } from '../contexts/DateContext';
import { MonthPickerModal } from '../components/dashboard/MonthPickerModal';

export default function Extract() {
  const { user } = useAuth();
  const location = useLocation();
  const { currentDate, setCurrentDate, changeMonth } = useDate();
  const { 
    bankTransactions = [], 
    loading 
  } = useTransactionsContext();

  const handleExport = () => {
    if (!bankTransactions.length) return;
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Data,Nome,Categoria,Valor,Tipo,Status\n" + 
      bankTransactions.map(t => {
        const val = (t.amount / 100).toFixed(2).replace('.', ',');
        return `${new Date(t.created_at).toLocaleDateString('pt-BR')},"${t.name}",${t.category},${val},${t.type},${t.is_paid ? 'Pago' : 'Pendente'}`;
      }).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `extrato-${currentDate.getMonth() + 1}-${currentDate.getFullYear()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const { showAlert } = useNotifications();
  
  // Filtros
  const initialCategory = location.state?.category || 'all';
  const [typeFilter, setTypeFilter] = useState('all'); // 'all', 'income', 'expense', 'pending'
  const [categoryFilter, setCategoryFilter] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState('date'); // 'date', 'amount_desc', 'amount_asc'
  const [isMonthModalOpen, setIsMonthModalOpen] = useState(false);

  // Modal de Detalhes
  const [selectedTx, setSelectedTx] = useState(null);

  // Lista base
  const baseList = bankTransactions;

  // Resumo financeiro
  const summary = useMemo(() => {
    let incomeCents = 0;
    let expenseCents = 0;

    for (const t of baseList) {
      const cents = parseCents(t.amount);
      if (t.type === 'income') {
        incomeCents += cents;
      } else {
        expenseCents += cents;
      }
    }

    const netCents = incomeCents - expenseCents;
    return { incomeCents, expenseCents, netCents, count: baseList.length };
  }, [baseList]);

  // Lista filtrada e ordenada
  const filteredList = useMemo(() => {
    let list = baseList.filter(t => {
      // 1. Filtro de tipo
      if (typeFilter === 'income' && t.type !== 'income') return false;
      if (typeFilter === 'expense' && t.type === 'income') return false;
      if (typeFilter === 'pending' && (t.is_paid || t.pluggy_transaction_id)) return false;

      // 2. Filtro de categoria
      if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;

      // 3. Busca textual
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const nameMatch = (t.name || '').toLowerCase().includes(query);
        const catData = getCategory(t.category);
        const catMatch = (catData?.label || '').toLowerCase().includes(query);
        const bankMatch = (t.bank_name || '').toLowerCase().includes(query);
        return nameMatch || catMatch || bankMatch;
      }

      return true;
    });

    // Ordenação
    if (sortOrder === 'amount_desc') {
      list.sort((a, b) => parseCents(b.amount) - parseCents(a.amount));
    } else if (sortOrder === 'amount_asc') {
      list.sort((a, b) => parseCents(a.amount) - parseCents(b.amount));
    } else {
      list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    return list;
  }, [baseList, typeFilter, categoryFilter, searchQuery, sortOrder]);

  // Agrupamento por Data
  const groupedTransactions = useMemo(() => {
    if (sortOrder !== 'date') return [{ label: 'Lançamentos', totalCents: null, transactions: filteredList }];
    
    const groups = {};
    filteredList.forEach(t => {
      const isToday = formatLocalDate(new Date()) === formatLocalDate(t.created_at);
      const isYesterday = formatLocalDate(new Date(Date.now() - 86400000)) === formatLocalDate(t.created_at);
      
      let dateStr = formatLocalDate(t.created_at, { day: '2-digit', month: 'short' }).replace(' de ', ' ');
      if (isToday) dateStr = 'Hoje, ' + dateStr;
      else if (isYesterday) dateStr = 'Ontem, ' + dateStr;

      if (!groups[dateStr]) {
        groups[dateStr] = { label: dateStr, totalCents: 0, transactions: [] };
      }
      
      const cents = parseCents(t.amount);
      if (t.type === 'income') groups[dateStr].totalCents += cents;
      else groups[dateStr].totalCents -= cents;
      
      groups[dateStr].transactions.push(t);
    });
    
    return Object.values(groups);
  }, [filteredList, sortOrder]);

  const handleItemClick = (transaction) => {
    if (transaction?.is_consolidated) {
      showAlert(`Este card consolida ${transaction.yield_count || ''} rendimentos automáticos gerados neste mês.`, 'info');
      return;
    }
    setSelectedTx(transaction);
  };

  const sortOptions = [
    { id: 'date', label: 'Mais Recentes', icon: 'calendar_month' },
    { id: 'amount_desc', label: 'Maior Valor', icon: 'trending_down' },
    { id: 'amount_asc', label: 'Menor Valor', icon: 'trending_up' }
  ];

  return (
    <div className="flex flex-col w-full gap-4 animate-in fade-in duration-500 pt-1">
      
      {/* MONTH SELECTOR & ACTION */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div 
          onClick={() => setIsMonthModalOpen(true)}
          className="bg-white border border-border-subtle rounded-full px-3 py-1.5 shadow-sm flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-[16px] text-slate-500">calendar_today</span>
          <span className="text-[13px] font-bold text-slate-900 select-none capitalize">
            {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </span>
          <span className="material-symbols-outlined text-[16px] text-slate-500">arrow_drop_down</span>
        </div>

        <button onClick={handleExport} className="bg-white border border-border-subtle rounded-full px-3 py-1.5 shadow-sm flex items-center gap-1.5 text-slate-600 hover:bg-slate-50 transition-colors active:scale-95">
          <span className="material-symbols-outlined text-[16px]">download</span>
          <span className="text-[11px] font-bold">Exportar</span>
        </button>
      </div>

      {/* SUMMARY CARD */}
      <div className="relative overflow-hidden bg-white rounded-2xl p-5 shadow-sm border border-border-subtle">
        <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-emerald-500/5 pointer-events-none"></div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Balanço do Período</span>
          <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${summary.netCents >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'}`}>
            <span className="material-symbols-outlined text-[13px]">{summary.netCents >= 0 ? 'trending_up' : 'trending_down'}</span>
            Open Finance
          </span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className={`text-[28px] font-bold tracking-tight ${summary.netCents >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {summary.netCents >= 0 ? '+ ' : '- '}
            {formatCurrency(Math.abs(summary.netCents))}
          </span>
        </div>

        {/* Mini Period Insights Bar */}
        <div className="grid grid-cols-2 gap-3 mt-4 pt-3.5 bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-100">
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5 uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Entradas
            </span>
            <span className="text-sm text-emerald-600 mt-0.5 font-bold">+ {formatCurrency(summary.incomeCents)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5 uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Saídas
            </span>
            <span className="text-sm text-rose-600 mt-0.5 font-bold">- {formatCurrency(summary.expenseCents)}</span>
          </div>
        </div>
      </div>

      {/* SEARCH AND EXTRA FILTERS */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 flex items-center">
          <span className="material-symbols-outlined absolute left-3.5 text-slate-400 text-[20px] pointer-events-none">search</span>
          <input 
            className="w-full bg-white text-slate-900 placeholder:text-slate-400 text-sm rounded-2xl pl-10 pr-9 py-3 shadow-sm border border-border-subtle focus:outline-none focus:border-emerald-500 transition-all" 
            placeholder="Buscar lançamentos..." 
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 text-slate-400 hover:text-slate-600 transition-colors" type="button">
              <span className="material-symbols-outlined text-[18px]">cancel</span>
            </button>
          )}
        </div>

        {/* Categoria Filter Toggle */}
        <div className="relative shrink-0">
          <button onClick={() => { setIsFilterMenuOpen(!isFilterMenuOpen); setIsSortOpen(false); }} className={`w-11 h-11 flex items-center justify-center rounded-2xl border shadow-sm transition-colors ${categoryFilter !== 'all' ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-border-subtle text-slate-500 hover:text-slate-900'}`}>
            <span className="material-symbols-outlined text-[20px]">filter_list</span>
          </button>
          {isFilterMenuOpen && (
            <div className="absolute top-full right-0 mt-2 w-48 max-h-64 overflow-y-auto bg-white border border-border-subtle rounded-xl shadow-xl p-1.5 flex flex-col gap-1 z-50">
              <button onClick={() => { setCategoryFilter('all'); setIsFilterMenuOpen(false); }} className={`text-left px-3 py-2 rounded-lg text-xs font-bold transition-colors ${categoryFilter === 'all' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>Todas as Categorias</button>
              {Object.entries(CATEGORIES).map(([key, cat]) => (
                <button key={key} onClick={() => { setCategoryFilter(key); setIsFilterMenuOpen(false); }} className={`text-left px-3 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-between ${categoryFilter === key ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Sort Toggle */}
        <div className="relative shrink-0">
          <button onClick={() => { setIsSortOpen(!isSortOpen); setIsFilterMenuOpen(false); }} className={`w-11 h-11 flex items-center justify-center rounded-2xl border shadow-sm transition-colors ${sortOrder !== 'date' ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-border-subtle text-slate-500 hover:text-slate-900'}`}>
            <span className="material-symbols-outlined text-[20px]">swap_vert</span>
          </button>
          {isSortOpen && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-border-subtle rounded-xl shadow-xl p-1.5 flex flex-col gap-1 z-50">
              {sortOptions.map(opt => (
                <button key={opt.id} onClick={() => { setSortOrder(opt.id); setIsSortOpen(false); }} className={`text-left px-3 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-between ${sortOrder === opt.id ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
                  {opt.label}
                  <span className="material-symbols-outlined text-[14px]">{opt.icon}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* FILTER CHIPS */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1 -mx-4 px-4">
        <button onClick={() => setTypeFilter('all')} className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-semibold shadow-sm transition-all whitespace-nowrap active:scale-95 border ${typeFilter === 'all' ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-white text-slate-600 border-border-subtle hover:text-slate-900'}`} type="button">
          <span>Todos</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${typeFilter === 'all' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'}`}>{baseList.length}</span>
        </button>
        <button onClick={() => setTypeFilter('income')} className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-semibold shadow-sm transition-all whitespace-nowrap active:scale-95 border ${typeFilter === 'income' ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-white text-slate-600 border-border-subtle hover:text-slate-900'}`} type="button">
          <span className={`w-2 h-2 rounded-full ${typeFilter === 'income' ? 'bg-white' : 'bg-emerald-500'}`}></span>
          <span>Entradas</span>
        </button>
        <button onClick={() => setTypeFilter('expense')} className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-semibold shadow-sm transition-all whitespace-nowrap active:scale-95 border ${typeFilter === 'expense' ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-white text-slate-600 border-border-subtle hover:text-slate-900'}`} type="button">
          <span className={`w-2 h-2 rounded-full ${typeFilter === 'expense' ? 'bg-white' : 'bg-rose-500'}`}></span>
          <span>Saídas</span>
        </button>
      </div>

      {/* TRANSACTIONS FEED */}
      <div className="flex flex-col gap-5 mt-2 pb-16">
        {loading && baseList.length === 0 ? (
          <div className="text-center py-16 text-xs text-slate-500 animate-pulse">
            Carregando extrato bancário...
          </div>
        ) : filteredList.length > 0 ? (
          groupedTransactions.map(group => (
            <div key={group.label} className="flex flex-col gap-2.5">
              
              {/* Group Header */}
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{group.label}</span>
                {group.totalCents !== null && (
                  <span className={`text-[11px] font-bold ${group.totalCents >= 0 ? 'text-emerald-500' : 'text-slate-500'}`}>
                    {group.totalCents >= 0 ? '+ ' : ''}{formatCurrency(group.totalCents)}
                  </span>
                )}
              </div>

              {/* Group Items */}
              <div className="flex flex-col gap-2.5">
                {group.transactions.map(t => {
                  const catData = getCategory(t.category);
                  const isIncome = t.type === 'income';
                  const bankName = t.bank_name || 'Mercado Pago';
                  const isPaid = t.is_paid || t.pluggy_transaction_id;

                  // Define icon based on category logic visually
                  let iconName = 'receipt_long';
                  if (t.category === 'shopping' || t.name.toLowerCase().includes('mercado')) iconName = 'shopping_cart';
                  if (t.category === 'home' || t.name.toLowerCase().includes('casa')) iconName = 'home';
                  if (isIncome) iconName = 'payments';
                  if (t.category === 'health' || t.name.toLowerCase().includes('farm')) iconName = 'medical_services';
                  if (t.name.toLowerCase().includes('netflix') || t.name.toLowerCase().includes('spotify')) iconName = 'subscriptions';
                  if (t.category === 'transport' || t.name.toLowerCase().includes('posto') || t.name.toLowerCase().includes('uber')) iconName = 'local_gas_station';

                  return (
                    <div key={t.id} onClick={() => handleItemClick(t)} className="flex items-center justify-between p-3.5 bg-white rounded-2xl shadow-sm border border-border-subtle hover:border-slate-300 transition-colors cursor-pointer active:scale-[0.98]">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${isIncome ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
                          <span className="material-symbols-outlined text-[22px]">{iconName}</span>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[14px] leading-tight text-slate-900 truncate font-bold">{t.name}</span>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <span className="text-[11px] text-slate-500 capitalize">{catData.label}</span>
                            <span className="text-slate-300 text-[10px]">•</span>
                            <span className="text-[11px] text-slate-500">{new Date(t.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end shrink-0 pl-2">
                        <span className={`text-[14px] font-bold ${isIncome ? 'text-emerald-600' : 'text-slate-900'}`}>
                          {isIncome ? '+ ' : '- '}{formatCurrency(t.amount)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <div className="py-16 flex flex-col items-center justify-center text-center px-4">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3 border border-slate-200">
              <span className="material-symbols-outlined text-[28px]">search_off</span>
            </div>
            <span className="text-[16px] text-slate-900 font-bold">Nenhum lançamento encontrado</span>
            <p className="text-sm text-slate-500 mt-1 max-w-[240px]">Tente ajustar os filtros ou digitar um termo diferente de busca.</p>
          </div>
        )}
      </div>

      {/* MODAL DE DETALHES DA TRANSAÇÃO BANCÁRIA */}
      {selectedTx && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedTx(null)}
        >
          <div 
            className="w-full max-w-md bg-white border border-border-subtle rounded-3xl p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div className="flex items-center gap-2">
                <BankBadge bankName={selectedTx.bank_name || 'Mercado Pago'} logoUrl={selectedTx.bank_logo_url} className="text-xs py-1 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-semibold flex items-center gap-1.5" />
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Detalhes Bancários</h3>
                  <p className="text-[10px] font-semibold text-slate-500">Transação Open Finance</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedTx(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="text-center py-2 space-y-1">
              <span className={`text-[32px] font-black tracking-tight ${selectedTx.type === 'income' ? 'text-emerald-600' : 'text-slate-900'}`}>
                {selectedTx.type === 'income' ? '+ ' : '- '}
                {formatCurrency(selectedTx.amount)}
              </span>
              <p className="font-bold text-[15px] text-slate-700 max-w-sm mx-auto">
                {selectedTx.name}
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3 text-xs">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-semibold">Instituição Bancária:</span>
                <span className="font-bold text-slate-900">
                  {selectedTx.bank_name || 'Mercado Pago'}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-semibold">Tipo de Fluxo:</span>
                <span className={`font-bold ${selectedTx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {selectedTx.type === 'income' ? 'Crédito (Entrada)' : 'Débito (Saída)'}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-semibold">Categoria Mapeada:</span>
                <span className="font-bold text-slate-900 capitalize">
                  {getCategory(selectedTx.category).label}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-semibold">Data e Horário:</span>
                <span className="font-bold text-slate-900">
                  {formatLocalDate(selectedTx.created_at, { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-semibold">Status Bancário:</span>
                <span className="font-bold text-emerald-600 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span> Confirmado
                </span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-slate-500 font-semibold">ID Open Finance:</span>
                <span className="font-mono text-[10px] text-slate-400 truncate max-w-[150px]">
                  {selectedTx.pluggy_transaction_id || 'N/A'}
                </span>
              </div>
            </div>

            <button
              onClick={() => setSelectedTx(null)}
              className="w-full py-3.5 mt-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm transition-all shadow-md active:scale-95"
            >
              Fechar Detalhes
            </button>
          </div>
        </div>
      )}

      <MonthPickerModal isOpen={isMonthModalOpen} onClose={() => setIsMonthModalOpen(false)} currentDate={currentDate} onSelectDate={setCurrentDate} />

    </div>
  );
}