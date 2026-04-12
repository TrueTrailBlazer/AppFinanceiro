import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './AuthContext';
import { useDate } from './DateContext';

const TransactionContext = createContext({});

export function TransactionProvider({ children }) {
  const { user } = useAuth();
  const { currentDate, changeMonth, monthTitle } = useDate();
  
  // Cache por mês no formato "YYYY-MM"
  const [cache, setCache] = useState({});
  const [loading, setLoading] = useState(true);

  const monthKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}`;

  const fetchMonthData = useCallback(async (forced = false) => {
    if (!user) return;
    
    // Se não tiver no cache, liga o loading. Caso contrário, carrega silenciosamente.
    if (!cache[monthKey] && !forced) {
        setLoading(true);
    }

    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59).toISOString();

    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', startOfMonth)
      .lte('created_at', endOfMonth)
      .order('created_at', { ascending: false });

    if (data) {
      setCache(prev => ({ ...prev, [monthKey]: data }));
    }
    
    setLoading(false);
  }, [user, currentDate, monthKey, cache]);

  useEffect(() => {
    if (!user) return;
    
    fetchMonthData();

    // Inscrição para Realtime
    const channel = supabase
      .channel('global-transactions')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${user.id}` }, 
        () => {
          fetchMonthData(true); // Força refresh sem piscar a tela
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchMonthData]);

  // Transações do mês atualmente visualizado
  const transactions = cache[monthKey] || [];

  const summary = useMemo(() => {
    const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount), 0);
    const expense = transactions.filter(t => t.type !== 'income').reduce((acc, t) => acc + Number(t.amount), 0);
    const balance = income - expense;
    return { income, expense, balance };
  }, [transactions]);

  const recentTransactions = useMemo(() => transactions.slice(0, 3), [transactions]);

  return (
    <TransactionContext.Provider value={{
      transactions,
      recentTransactions,
      loading: !cache[monthKey] && loading, // Só é considerado carregando SE não houver cache
      summary,
      currentDate,
      monthTitle,
      changeMonth,
      refreshData: () => fetchMonthData(true)
    }}>
      {children}
    </TransactionContext.Provider>
  );
}

export const useTransactionsContext = () => useContext(TransactionContext);
