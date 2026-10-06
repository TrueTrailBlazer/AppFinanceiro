import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './AuthContext';
import { useDate } from './DateContext';
import { parseCents, fromCents } from '../utils/money';
import { fetchTransactionsByMonth } from '../services/transactions';
import { fetchUserPluggyItems } from '../services/pluggy';

const TransactionContext = createContext({});

export function TransactionProvider({ children }) {
  const { user } = useAuth();
  const { currentDate, changeMonth, monthTitle } = useDate();
  
  // Cache por mês no formato "YYYY-MM"
  const [cache, setCache] = useState({});
  const [loading, setLoading] = useState(true);
  const [connectedBanks, setConnectedBanks] = useState([]);

  const monthKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}`;

  const cacheRef = useRef(cache);
  useEffect(() => {
    cacheRef.current = cache;
  }, [cache]);

  // Carrega bancos conectados pelo Open Finance
  const loadBanks = useCallback(async () => {
    if (!user) return;
    try {
      const items = await fetchUserPluggyItems(user.id);
      setConnectedBanks(items || []);
    } catch {
      // Falha silenciosa para não quebrar o contexto
    }
  }, [user]);

  useEffect(() => {
    loadBanks();
  }, [loadBanks]);

  const fetchMonthData = useCallback(async (forced = false) => {
    if (!user) return;
    
    // Se não tiver no cache, liga o loading. Caso contrário, carrega silenciosamente.
    if (!cacheRef.current[monthKey] && !forced) {
        setLoading(true);
    }

    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59).toISOString();

    const data = await fetchTransactionsByMonth(user.id, startOfMonth, endOfMonth);

    if (data) {
      setCache(prev => ({ ...prev, [monthKey]: data }));
    }
    
    setLoading(false);
  }, [user?.id, currentDate, monthKey]);

  // Carrega os dados quando o mês ou usuário mudar
  useEffect(() => {
    if (!user) return;
    fetchMonthData();
  }, [user?.id, fetchMonthData]);

  const fetchMonthDataRef = useRef(fetchMonthData);
  useEffect(() => {
    fetchMonthDataRef.current = fetchMonthData;
  }, [fetchMonthData]);

  // Inscrição para Realtime isolada: roda apenas quando o usuário se autentica
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`transactions-user-${user.id}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${user.id}` }, 
        () => {
          fetchMonthDataRef.current?.(true); // Força refresh sem piscar a tela
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Transações brutas do mês atualmente visualizado
  const rawTransactions = cache[monthKey] || [];

  // Transações consolidadas para exibição geral (com rendimentos agrupados)
  const transactions = useMemo(() => {
    const yieldTxs = [];
    const otherTxs = [];

    for (const t of rawTransactions) {
      const name = (t.name || '').toLowerCase();
      // Não contabiliza retiradas/transferências do cofrinho
      if (name.includes('dinheiro retirado') || name.includes('saldo reservado')) {
        continue;
      }
      if (name.includes('rendimento')) {
        yieldTxs.push(t);
      } else {
        otherTxs.push(t);
      }
    }

    if (yieldTxs.length <= 1) {
      return [...yieldTxs, ...otherTxs].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    // Soma os centavos de todos os rendimentos do mês
    const totalYieldCents = yieldTxs.reduce((sum, t) => sum + parseCents(t.amount), 0);
    const sortedYields = [...yieldTxs].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const latestYield = sortedYields[0];

    const consolidatedYield = {
      ...latestYield,
      id: `consolidated-yield-${monthKey}`,
      name: 'Rendimentos',
      amount: totalYieldCents,
      type: 'income',
      category: 'others',
      is_paid: true,
      created_at: latestYield.created_at,
      is_consolidated: true,
      yield_count: yieldTxs.length,
      pluggy_transaction_id: 'consolidated-yield' // Vinculado ao fluxo bancário
    };

    return [consolidatedYield, ...otherTxs].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [rawTransactions, monthKey]);

  // =========================================================================
  // DAT-01: DESACOPLAMENTO DE DADOS (EXTRATO BANCÁRIO vs PLANEJAMENTO)
  // =========================================================================

  // 1. Movimentações Bancárias Reais (Open Finance / Pluggy)
  const bankTransactions = useMemo(() => {
    return transactions.filter(t => Boolean(t.pluggy_transaction_id) || t.is_consolidated);
  }, [transactions]);

  // 2. Contas Programadas / A Pagar (Planejamento Manual sem vínculo com banco)
  const plannedBills = useMemo(() => {
    return transactions.filter(t => !t.pluggy_transaction_id && !t.is_consolidated && t.type !== 'income');
  }, [transactions]);

  // 3. Receitas Planejadas (Entradas manuais programadas)
  const plannedIncomes = useMemo(() => {
    return transactions.filter(t => !t.pluggy_transaction_id && !t.is_consolidated && t.type === 'income');
  }, [transactions]);

  // 4. Todas as transações do Planejamento
  const plannedTransactions = useMemo(() => {
    return transactions.filter(t => !t.pluggy_transaction_id && !t.is_consolidated);
  }, [transactions]);

  // Resumo Bancário Real (Fluxo de Caixa do Extrato)
  const bankSummary = useMemo(() => {
    let incomeCents = 0;
    let expenseCents = 0;
    for (const t of bankTransactions) {
      const cents = parseCents(t.amount);
      if (t.type === 'income') {
        incomeCents += cents;
      } else {
        expenseCents += cents;
      }
    }
    const balanceCents = incomeCents - expenseCents;
    return {
      incomeCents,
      expenseCents,
      balanceCents,
      income: fromCents(incomeCents),
      expense: fromCents(expenseCents),
      balance: fromCents(balanceCents),
      count: bankTransactions.length
    };
  }, [bankTransactions]);

  // Resumo do Planejamento (Contas a Pagar)
  const plannedSummary = useMemo(() => {
    const totalCents = plannedBills.reduce((acc, t) => acc + parseCents(t.amount), 0);
    const paidCents = plannedBills.filter(t => t.is_paid).reduce((acc, t) => acc + parseCents(t.amount), 0);
    const pendingCents = totalCents - paidCents;
    const paidCount = plannedBills.filter(t => t.is_paid).length;
    const pendingCount = plannedBills.filter(t => !t.is_paid).length;

    return {
      totalCents,
      paidCents,
      pendingCents,
      totalCount: plannedBills.length,
      paidCount,
      pendingCount,
      total: fromCents(totalCents),
      paid: fromCents(paidCents),
      pending: fromCents(pendingCents)
    };
  }, [plannedBills]);

  // Resumo geral (retrocompatibilidade)
  const summary = useMemo(() => {
    let incomeCents = 0;
    let expenseCents = 0;
    for (const t of transactions) {
      const cents = parseCents(t.amount);
      if (t.type === 'income') {
        incomeCents += cents;
      } else {
        expenseCents += cents;
      }
    }
    const balanceCents = incomeCents - expenseCents;
    return { 
      income: fromCents(incomeCents), 
      expense: fromCents(expenseCents), 
      balance: fromCents(balanceCents),
      incomeCents,
      expenseCents,
      balanceCents
    };
  }, [transactions]);

  const recentTransactions = useMemo(() => transactions.slice(0, 3), [transactions]);

  return (
    <TransactionContext.Provider value={{
      transactions,
      bankTransactions,
      plannedBills,
      plannedIncomes,
      plannedTransactions,
      bankSummary,
      plannedSummary,
      connectedBanks,
      recentTransactions,
      loading: !cache[monthKey] && loading, // Só é considerado carregando SE não houver cache
      summary,
      currentDate,
      monthTitle,
      changeMonth,
      refreshData: () => {
        fetchMonthData(true);
        loadBanks();
      }
    }}>
      {children}
    </TransactionContext.Provider>
  );
}

export const useTransactionsContext = () => useContext(TransactionContext);
