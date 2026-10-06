import { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { useTransactionsContext } from '../contexts/TransactionContext';
import { 
  Search, Calendar, Filter, TrendingUp, 
  TrendingDown, ArrowUpDown, Building2, 
  X, ShieldCheck, CheckCircle2 
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { getCategory, CATEGORIES } from '../utils/constants';
import { MonthSelector } from '../components/dashboard/MonthSelector';
import { parseCents, formatCents } from '../utils/money';
import { formatLocalDate } from '../utils/date';
import { BankBadge, getBankInfo } from '../utils/banks';

export default function Extract() {
  const { user } = useAuth();
  const location = useLocation();
  const { 
    bankTransactions = [], 
    connectedBanks = [], 
    loading 
  } = useTransactionsContext();
  const { showAlert } = useNotifications();
  
  // Filtros
  const initialCategory = location.state?.category || 'all';
  const [typeFilter, setTypeFilter] = useState('all'); // 'all', 'income', 'expense'
  const [bankFilter, setBankFilter] = useState('all'); // 'all' ou nome do banco
  const [categoryFilter, setCategoryFilter] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState('date'); // 'date', 'amount_desc', 'amount_asc'

  // Modal de Detalhes da Transação Bancária
  const [selectedTx, setSelectedTx] = useState(null);

  // Lista base: EXCLUSIVAMENTE movimentações bancárias reais (Open Finance)
  const baseList = bankTransactions;

  // Bancos únicos presentes no extrato deste mês
  const uniqueBanks = useMemo(() => {
    const set = new Set();
    for (const t of baseList) {
      set.add(t.bank_name || 'Mercado Pago');
    }
    return Array.from(set);
  }, [baseList]);

  // Resumo financeiro do extrato bancário
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
    return {
      incomeCents,
      expenseCents,
      netCents,
      count: baseList.length
    };
  }, [baseList]);

  // Lista filtrada e ordenada
  const filteredList = useMemo(() => {
    let list = baseList.filter(t => {
      // 1. Filtro de tipo (Entradas / Saídas)
      if (typeFilter === 'income' && t.type !== 'income') return false;
      if (typeFilter === 'expense' && t.type === 'income') return false;

      // 2. Filtro de banco (se houver mais de um)
      if (bankFilter !== 'all') {
        const itemBank = (t.bank_name || 'Mercado Pago').toLowerCase();
        if (!itemBank.includes(bankFilter.toLowerCase())) return false;
      }

      // 3. Filtro de categoria
      if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;

      // 4. Busca textual por nome/estabelecimento
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
  }, [baseList, typeFilter, bankFilter, categoryFilter, searchQuery, sortOrder]);

  // Click na transação
  const handleItemClick = (transaction) => {
    if (transaction?.is_consolidated) {
      showAlert(`Este card consolida ${transaction.yield_count || ''} rendimentos automáticos gerados neste mês.`, 'info');
      return;
    }
    setSelectedTx(transaction);
  };

  const sortOptions = [
    { id: 'date', label: 'Mais Recentes', icon: Calendar },
    { id: 'amount_desc', label: 'Maior Valor', icon: TrendingDown },
    { id: 'amount_asc', label: 'Menor Valor', icon: TrendingUp }
  ];

  return (
    <div className="animate-in fade-in duration-300 pb-16">
      
      {/* HEADER FIXO */}
      <div className="sticky top-0 z-20 bg-background -mt-8 pt-8 pb-3 space-y-3 border-b border-border -mx-4 px-4">
        
        {/* Topo do Header: Título + Badge Open Finance + Seletor de Mês */}
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">Extrato Bancário</h1>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <ShieldCheck size={11} /> Open Finance
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">Movimentações reais registradas nas suas contas conectadas.</p>
          </div>
          <MonthSelector />
        </div>

        {/* CARDS DE RESUMO DO FLUXO BANCÁRIO REAL */}
        <div className="grid grid-cols-3 gap-2">
          {/* Entradas */}
          <div className="p-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex flex-col justify-center items-center text-center">
            <p className="text-[9px] uppercase font-bold text-emerald-400 mb-0.5 flex items-center gap-1">
              <TrendingUp size={10} /> Entradas
            </p>
            <span className="text-xs sm:text-sm font-black text-emerald-400 truncate w-full">
              {formatCents(summary.incomeCents)}
            </span>
          </div>

          {/* Saídas */}
          <div className="p-2.5 rounded-xl border border-rose-500/20 bg-rose-500/5 flex flex-col justify-center items-center text-center">
            <p className="text-[9px] uppercase font-bold text-rose-400 mb-0.5 flex items-center gap-1">
              <TrendingDown size={10} /> Saídas
            </p>
            <span className="text-xs sm:text-sm font-black text-rose-400 truncate w-full">
              {formatCents(summary.expenseCents)}
            </span>
          </div>

          {/* Resultado Líquido */}
          <div className={`p-2.5 rounded-xl border flex flex-col justify-center items-center text-center ${
            summary.netCents >= 0 
              ? 'bg-emerald-500/10 border-emerald-500/30' 
              : 'bg-rose-500/10 border-rose-500/30'
          }`}>
            <p className="text-[9px] uppercase font-bold text-gray-400 mb-0.5">Resultado</p>
            <span className={`text-xs sm:text-sm font-black truncate w-full ${
              summary.netCents >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {summary.netCents >= 0 ? '+' : ''}{formatCents(summary.netCents)}
            </span>
          </div>
        </div>

        {/* BARRA DE FERRAMENTAS: TIPO, BANCOS, CATEGORIA, ORDENAÇÃO E BUSCA */}
        <div className="flex items-center justify-between gap-2">
          
          {/* Segmented Control por Tipo */}
          <div className="flex bg-card p-0.5 rounded-xl border border-border text-xs">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                typeFilter === 'all' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-foreground'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setTypeFilter('income')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                typeFilter === 'income' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-400 hover:text-foreground'
              }`}
            >
              Entradas
            </button>
            <button
              onClick={() => setTypeFilter('expense')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                typeFilter === 'expense' ? 'bg-rose-600 text-white shadow-sm' : 'text-gray-400 hover:text-foreground'
              }`}
            >
              Saídas
            </button>
          </div>

          {/* Botões da Direita: Busca, Filtro de Categoria e Ordenação */}
          <div className="flex items-center gap-1.5">
            
            {/* Toggle de Busca */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className={`p-2 rounded-xl border transition-all ${
                isSearchOpen || searchQuery ? 'bg-blue-600 border-blue-600 text-white' : 'bg-card border-border text-gray-400 hover:text-foreground'
              }`}
              title="Pesquisar lançamentos"
            >
              <Search size={16} />
            </button>

            {/* Menu de Categoria */}
            <div className="relative">
              <button
                onClick={() => { setIsFilterMenuOpen(!isFilterMenuOpen); setIsSortOpen(false); }}
                className={`p-2 rounded-xl border transition-all flex items-center gap-1 ${
                  categoryFilter !== 'all' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-card border-border text-gray-400 hover:text-foreground'
                }`}
                title="Filtrar por Categoria"
              >
                <Filter size={16} />
                {categoryFilter !== 'all' && (
                  <span className="text-[10px] font-bold max-w-[60px] truncate hidden sm:inline">
                    {getCategory(categoryFilter).label}
                  </span>
                )}
              </button>

              {isFilterMenuOpen && (
                <div className="absolute top-full right-0 mt-2 w-48 max-h-64 overflow-y-auto bg-card border border-border rounded-xl shadow-2xl p-1.5 flex flex-col gap-1 z-50">
                  <button
                    onClick={() => { setCategoryFilter('all'); setIsFilterMenuOpen(false); }}
                    className={`text-left px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                      categoryFilter === 'all' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-card-hover hover:text-foreground'
                    }`}
                  >
                    Todas as Categorias
                  </button>
                  {Object.entries(CATEGORIES).map(([key, cat]) => (
                    <button
                      key={key}
                      onClick={() => { setCategoryFilter(key); setIsFilterMenuOpen(false); }}
                      className={`text-left px-3 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-between ${
                        categoryFilter === key ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-card-hover hover:text-foreground'
                      }`}
                    >
                      <span>{cat.label}</span>
                      <cat.icon size={14} className="opacity-60" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Menu de Ordenação */}
            <div className="relative">
              <button
                onClick={() => { setIsSortOpen(!isSortOpen); setIsFilterMenuOpen(false); }}
                className={`p-2 rounded-xl border transition-all ${
                  sortOrder !== 'date' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-card border-border text-gray-400 hover:text-foreground'
                }`}
                title="Ordenar extrato"
              >
                <ArrowUpDown size={16} />
              </button>

              {isSortOpen && (
                <div className="absolute top-full right-0 mt-2 w-44 bg-card border border-border rounded-xl shadow-2xl p-1.5 flex flex-col gap-1 z-50">
                  {sortOptions.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => { setSortOrder(opt.id); setIsSortOpen(false); }}
                      className={`text-left px-3 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-between ${
                        sortOrder === opt.id ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-card-hover hover:text-foreground'
                      }`}
                    >
                      {opt.label}
                      <opt.icon size={14} className="opacity-60" />
                    </button>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Input de Busca Expansível */}
        {isSearchOpen && (
          <div className="relative animate-in slide-in-from-top-2 duration-200">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por descrição, estabelecimento..."
              className="w-full bg-card border border-border rounded-xl px-3.5 py-2 text-xs text-foreground placeholder:text-gray-500 focus:outline-none focus:border-blue-500"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-foreground"
              >
                <X size={14} />
              </button>
            )}
          </div>
        )}

      </div>

      {/* FEED DE LANÇAMENTOS DO EXTRATO BANCÁRIO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-3">
        {loading && baseList.length === 0 ? (
          <div className="text-center md:col-span-2 py-16 text-xs text-gray-500 animate-pulse">
            Carregando extrato bancário...
          </div>
        ) : filteredList.length > 0 ? (
          filteredList.map(t => {
            const catData = getCategory(t.category);
            const CategoryIcon = catData.icon;
            const isIncome = t.type === 'income';
            const bankName = t.bank_name || 'Mercado Pago';

            return (
              <div
                key={t.id}
                onClick={() => handleItemClick(t)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isIncome
                    ? 'bg-card border-border hover:border-emerald-500/40 shadow-sm'
                    : 'bg-card border-border hover:border-border-strong shadow-sm'
                }`}
              >
                {/* Lado Esquerdo: Ícone da categoria + Nome do lançamento */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2.5 rounded-xl shrink-0 ${isIncome ? 'bg-emerald-500/10' : catData.bg}`}>
                    <CategoryIcon size={18} className={isIncome ? 'text-emerald-400' : catData.color} />
                  </div>

                  <div className="min-w-0">
                    <h3 className="font-bold text-xs sm:text-[13px] text-foreground truncate leading-tight">
                      {t.name}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      {/* Tag com Logotipo do Banco */}
                      <BankBadge bankName={bankName} logoUrl={t.bank_logo_url} />

                      <span className="text-[9px] font-semibold text-gray-400 bg-card-hover border border-border/50 px-1.5 py-0.5 rounded capitalize">
                        {catData.label}
                      </span>
                      <span className="text-[10px] text-gray-500 font-medium">
                        {formatLocalDate(t.created_at, { day: '2-digit', month: 'short' })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Lado Direito: Valor Bancário Liquidado */}
                <div className="flex flex-col items-end shrink-0 pl-2">
                  <span className={`text-sm sm:text-[15px] font-black leading-tight ${
                    isIncome ? 'text-emerald-400' : 'text-foreground'
                  }`}>
                    {isIncome ? '+ ' : '- '}
                    {formatCents(t.amount)}
                  </span>
                  <span className="text-[9px] text-gray-500 mt-0.5 flex items-center gap-0.5 font-medium">
                    <CheckCircle2 size={9} className="text-emerald-500" /> Liquidado
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-20 md:col-span-2 flex flex-col items-center justify-center text-gray-500 gap-3 border border-dashed border-border rounded-2xl bg-card/20 text-center px-4">
            <Building2 size={32} className="text-gray-600" />
            <div>
              <p className="text-sm font-bold text-foreground">Nenhuma movimentação encontrada</p>
              <p className="text-xs text-gray-500 mt-1 max-w-xs">
                {searchQuery || categoryFilter !== 'all' || typeFilter !== 'all'
                  ? 'Nenhum resultado corresponde aos filtros selecionados.'
                  : 'Nenhuma transação bancária registrada para este mês.'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* MODAL DE DETALHES DA TRANSAÇÃO BANCÁRIA */}
      {selectedTx && (
        <div 
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedTx(null)}
        >
          <div 
            className="w-full max-w-md bg-card border border-border rounded-3xl p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header do Modal com Logo do Banco */}
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <BankBadge bankName={selectedTx.bank_name || 'Mercado Pago'} logoUrl={selectedTx.bank_logo_url} className="text-xs py-1 px-2.5" />
                <div>
                  <h3 className="font-bold text-sm text-foreground">Detalhes Bancários</h3>
                  <p className="text-[10px] text-gray-500">Transação Open Finance</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedTx(null)}
                className="p-1.5 rounded-full text-gray-400 hover:text-foreground hover:bg-card-hover transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Valor e Descrição */}
            <div className="text-center py-2 space-y-1">
              <span className={`text-2xl font-black ${
                selectedTx.type === 'income' ? 'text-emerald-400' : 'text-foreground'
              }`}>
                {selectedTx.type === 'income' ? '+ ' : '- '}
                {formatCents(selectedTx.amount)}
              </span>
              <p className="font-bold text-sm text-foreground max-w-sm mx-auto">
                {selectedTx.name}
              </p>
            </div>

            {/* Dados Técnicos da Transação */}
            <div className="bg-background rounded-2xl p-3 border border-border space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-gray-400">Instituição Bancária:</span>
                <span className="font-bold text-foreground">
                  {selectedTx.bank_name || 'Mercado Pago'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-gray-400">Tipo de Fluxo:</span>
                <span className={`font-bold ${selectedTx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {selectedTx.type === 'income' ? 'Crédito (Entrada)' : 'Débito (Saída)'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-gray-400">Categoria Mapeada:</span>
                <span className="font-bold text-foreground capitalize">
                  {getCategory(selectedTx.category).label}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-gray-400">Data e Horário:</span>
                <span className="font-bold text-foreground">
                  {formatLocalDate(selectedTx.created_at, { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-gray-400">Status Bancário:</span>
                <span className="font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 size={12} /> Confirmado / Liquidado
                </span>
              </div>
              <div className="flex justify-between py-1 text-[10px]">
                <span className="text-gray-500">ID Open Finance:</span>
                <span className="font-mono text-gray-500 truncate max-w-[180px]">
                  {selectedTx.pluggy_transaction_id || 'N/A'}
                </span>
              </div>
            </div>

            <button
              onClick={() => setSelectedTx(null)}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all shadow-md active:scale-95"
            >
              Fechar Detalhes
            </button>
          </div>
        </div>
      )}

    </div>
  );
}