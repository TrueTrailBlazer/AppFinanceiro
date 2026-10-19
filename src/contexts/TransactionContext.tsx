import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  type ReactNode
} from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './AuthContext';
import { useDate } from './DateContext';
import { fetchTransactionsByMonth } from '../services/transactions';
import { fetchUserPluggyItems } from '../services/pluggy';
import {
  consolidateMonthlyTransactions,
  selectBankTransactions,
  selectPlannedBills,
  selectPlannedIncomes,
  selectPlannedTransactions,
  computeBankSummary,
  computePlannedSummary,
  computeOverallSummary
} from '../utils/transactionSelectors';
import type {
  TransactionRow,
  DisplayTransaction,
  PluggyItemRow,
  BankSummary,
  PlannedSummary,
  OverallSummary
} from '../types/models';

export interface TransactionContextType {
  transactions: DisplayTransaction[];
  bankTransactions: DisplayTransaction[];
  plannedBills: DisplayTransaction[];
  plannedIncomes: DisplayTransaction[];
  plannedTransactions: DisplayTransaction[];
  bankSummary: BankSummary;
  plannedSummary: PlannedSummary;
  connectedBanks: PluggyItemRow[];
  recentTransactions: DisplayTransaction[];
  loading: boolean;
  summary: OverallSummary;
  currentDate: Date;
  monthTitle: string;
  changeMonth: (direction: number) => void;
  refreshData: () => Promise<void>;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export function TransactionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { currentDate, changeMonth, monthTitle } = useDate();
  
  // Cache por mês no formato "YYYY-MM"
  const [cache, setCache] = useState<Record<string, TransactionRow[]>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [connectedBanks, setConnectedBanks] = useState<PluggyItemRow[]>([]);

  const monthKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}`;

  const cacheRef = useRef<Record<string, TransactionRow[]>>(cache);
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
    let isMounted = true;
    const initBanks = async () => {
      if (!user) return;
      try {
        const items = await fetchUserPluggyItems(user.id);
        if (isMounted) setConnectedBanks(items || []);
      } catch {
        // Falha silenciosa
      }
    };
    initBanks();
    return () => { isMounted = false; };
  }, [user]);

  const fetchMonthData = useCallback(async (forced: boolean = false) => {
    if (!user) return;
    
    // Se não tiver no cache, liga o loading. Caso contrário, carrega silenciosamente.
    if (!cacheRef.current[monthKey] && !forced) {
      setLoading(true);
    }

    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59).toISOString();

    try {
      const data = await fetchTransactionsByMonth(user.id, startOfMonth, endOfMonth);
      if (data) {
        setCache(prev => ({ ...prev, [monthKey]: data }));
      }
    } catch (error) {
      console.error("[TransactionContext] Erro ao buscar transações:", error);
    } finally {
      setLoading(false);
    }
  }, [user, currentDate, monthKey]);

  // Carrega os dados quando o mês ou usuário mudar
  useEffect(() => {
    if (!user) return;
    const run = async () => {
      await fetchMonthData();
    };
    run();
  }, [user, fetchMonthData]);

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
  }, [user]);

  // Transações brutas do mês atualmente visualizado
  const rawTransactions = useMemo<TransactionRow[]>(() => cache[monthKey] || [], [cache, monthKey]);

  // Transações consolidadas para exibição geral (com rendimentos agrupados)
  const transactions = useMemo<DisplayTransaction[]>(
    () => consolidateMonthlyTransactions(rawTransactions, monthKey),
    [rawTransactions, monthKey]
  );

  // =========================================================================
  // DAT-01: DESACOPLAMENTO DE DADOS (EXTRATO BANCÁRIO vs PLANEJAMENTO)
  // =========================================================================

  // 1. Movimentações Bancárias Reais (Open Finance / Pluggy)
  const bankTransactions = useMemo<DisplayTransaction[]>(
    () => selectBankTransactions(transactions),
    [transactions]
  );

  // 2. Contas Programadas / A Pagar (Planejamento Manual sem vínculo com banco)
  const plannedBills = useMemo<DisplayTransaction[]>(
    () => selectPlannedBills(transactions),
    [transactions]
  );

  // 3. Receitas Planejadas (Entradas manuais programadas)
  const plannedIncomes = useMemo<DisplayTransaction[]>(
    () => selectPlannedIncomes(transactions),
    [transactions]
  );

  // 4. Todas as transações do Planejamento
  const plannedTransactions = useMemo<DisplayTransaction[]>(
    () => selectPlannedTransactions(transactions),
    [transactions]
  );

  // Resumo Bancário Real (Fluxo de Caixa do Extrato)
  const bankSummary = useMemo<BankSummary>(
    () => computeBankSummary(bankTransactions),
    [bankTransactions]
  );

  // Resumo do Planejamento (Contas a Pagar)
  const plannedSummary = useMemo<PlannedSummary>(
    () => computePlannedSummary(plannedBills),
    [plannedBills]
  );

  // Resumo geral (retrocompatibilidade)
  const summary = useMemo<OverallSummary>(
    () => computeOverallSummary(transactions),
    [transactions]
  );

  const recentTransactions = useMemo<DisplayTransaction[]>(() => transactions.slice(0, 3), [transactions]);

  const isActuallyLoading = Boolean(!cache[monthKey] && loading);

  const refreshData = useCallback(async () => {
    await fetchMonthData(true);
    await loadBanks();
  }, [fetchMonthData, loadBanks]);

  const value = useMemo<TransactionContextType>(() => ({
    transactions,
    bankTransactions,
    plannedBills,
    plannedIncomes,
    plannedTransactions,
    bankSummary,
    plannedSummary,
    connectedBanks,
    recentTransactions,
    loading: isActuallyLoading,
    summary,
    currentDate,
    monthTitle,
    changeMonth,
    refreshData
  }), [
    transactions,
    bankTransactions,
    plannedBills,
    plannedIncomes,
    plannedTransactions,
    bankSummary,
    plannedSummary,
    connectedBanks,
    recentTransactions,
    isActuallyLoading,
    summary,
    currentDate,
    monthTitle,
    changeMonth,
    refreshData
  ]);

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  );
}

export const useTransactionsContext = (): TransactionContextType => {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error('useTransactionsContext must be used within a TransactionProvider');
  }
  return context;
};

export const useTransactions = useTransactionsContext;
