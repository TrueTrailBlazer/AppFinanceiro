import { useState, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useNotifications } from '../contexts/NotificationContext';
import { useTransactionsContext } from '../contexts/TransactionContext';
import { getCategory } from '../utils/constants';
import { parseCents } from '../utils/money';
import { formatLocalDate } from '../utils/date';
import { useDate } from '../contexts/DateContext';
import { MonthPickerModal } from '../components/dashboard/MonthPickerModal';
import ExtractHeaderBar from '../components/extract/ExtractHeaderBar';
import ExtractSummaryHero from '../components/extract/ExtractSummaryHero';
import ExtractFilterBar, { type ExtractSortOrder, type ExtractTypeFilter } from '../components/extract/ExtractFilterBar';
import ExtractTransactionList, { type ExtractTransactionGroup } from '../components/extract/ExtractTransactionList';
import BankTransactionDetailModal from '../components/extract/BankTransactionDetailModal';
import type { DisplayTransaction } from '../types/models';

interface ExtractLocationState {
  category?: string;
}

export default function Extract() {
  const location = useLocation();
  const locationState = location.state as ExtractLocationState | null;
  const { currentDate, setCurrentDate } = useDate();
  const { 
    bankTransactions = [], 
    loading 
  } = useTransactionsContext();
  const { showAlert } = useNotifications();

  // Filtros
  const initialCategory = locationState?.category || 'all';
  const [typeFilter, setTypeFilter] = useState<ExtractTypeFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>(initialCategory);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<ExtractSortOrder>('date');
  const [isMonthModalOpen, setIsMonthModalOpen] = useState<boolean>(false);

  // Modal de Detalhes
  const [selectedTx, setSelectedTx] = useState<DisplayTransaction | null>(null);

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

  const filteredList = useMemo(() => {
    const list = baseList.filter(t => {
      // 1. Filtro de tipo
      if (typeFilter === 'income' && t.type !== 'income') return false;
      if (typeFilter === 'expense' && t.type === 'income') return false;

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
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return list;
  }, [baseList, typeFilter, categoryFilter, searchQuery, sortOrder]);

  const handleExport = useCallback(() => {
    if (!filteredList.length) return;
    const rows = ["Data,Nome,Categoria,Valor,Tipo,Status"];
    
    filteredList.forEach(t => {
      const val = (t.amount / 100).toFixed(2).replace('.', ',');
      
      // Previne CSV Formula Injection e escape de aspas
      let safeName = String(t.name || '').replace(/"/g, '""');
      if (safeName.match(/^[=\-+@\t\r]/)) {
        safeName = "'" + safeName;
      }
      
      rows.push(`${new Date(t.created_at).toLocaleDateString('pt-BR')},"${safeName}",${t.category},${val},${t.type},${t.is_paid ? 'Pago' : 'Pendente'}`);
    });

    const csvContent = rows.join("\n");
    // Usar Blob + createObjectURL é mais seguro que Data URI e resolve bugs de encodeURI
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `extrato-${currentDate.getMonth() + 1}-${currentDate.getFullYear()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [filteredList, currentDate]);

  // Agrupamento por Data
  const groupedTransactions = useMemo<ExtractTransactionGroup[]>(() => {
    if (sortOrder !== 'date') return [{ label: 'Lançamentos', totalCents: null, transactions: filteredList }];
    
    const now = new Date();
    const todayStr = formatLocalDate(now);
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = formatLocalDate(yesterday);

    const groups: Record<string, ExtractTransactionGroup> = {};
    filteredList.forEach(t => {
      const txDateStr = formatLocalDate(t.created_at);
      const isToday = todayStr === txDateStr;
      const isYesterday = yesterdayStr === txDateStr;
      
      let dateStr = formatLocalDate(t.created_at, { day: '2-digit', month: 'short' }).replace(' de ', ' ');
      if (isToday) dateStr = 'Hoje, ' + dateStr;
      else if (isYesterday) dateStr = 'Ontem, ' + dateStr;

      if (!groups[dateStr]) {
        groups[dateStr] = { label: dateStr, totalCents: 0, transactions: [] };
      }
      
      const cents = parseCents(t.amount);
      const currentGroup = groups[dateStr];
      if (currentGroup.totalCents !== null) {
        if (t.type === 'income') currentGroup.totalCents += cents;
        else currentGroup.totalCents -= cents;
      }
      
      currentGroup.transactions.push(t);
    });
    
    return Object.values(groups);
  }, [filteredList, sortOrder]);

  const handleItemClick = (transaction: DisplayTransaction) => {
    if (transaction?.is_consolidated) {
      showAlert(`Este card consolida ${transaction.yield_count || ''} rendimentos automáticos gerados neste mês.`, 'info');
      return;
    }
    setSelectedTx(transaction);
  };

  return (
    <div className="flex flex-col w-full gap-4 animate-in fade-in duration-500 pt-1">
      
      {/* MONTH SELECTOR & ACTION */}
      <ExtractHeaderBar 
        currentDate={currentDate}
        onOpenMonthModal={() => setIsMonthModalOpen(true)}
        onExport={handleExport}
      />

      {/* SUMMARY CARD */}
      <ExtractSummaryHero summary={summary} />

      {/* SEARCH AND EXTRA FILTERS */}
      <ExtractFilterBar 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        totalCount={baseList.length}
      />

      {/* TRANSACTIONS FEED */}
      <ExtractTransactionList 
        loading={loading}
        baseCount={baseList.length}
        filteredCount={filteredList.length}
        groupedTransactions={groupedTransactions}
        onItemClick={handleItemClick}
      />

      {/* MODAL DE DETALHES DA TRANSAÇÃO BANCÁRIA */}
      <BankTransactionDetailModal 
        transaction={selectedTx}
        onClose={() => setSelectedTx(null)}
      />

      <MonthPickerModal 
        isOpen={isMonthModalOpen} 
        onClose={() => setIsMonthModalOpen(false)} 
        currentDate={currentDate} 
        onSelectDate={setCurrentDate} 
      />

    </div>
  );
}
