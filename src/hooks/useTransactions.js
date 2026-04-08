import { useState, useCallback, useEffect, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useDate } from '../contexts/DateContext';

export function useTransactions() {
  const { user } = useAuth();
  const { currentDate, changeMonth, monthTitle } = useDate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMonthData = useCallback(async () => {
    if (!user) return;
    
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
      setTransactions(data);
    }
    setLoading(false);
  }, [user, currentDate]);

  useEffect(() => {
    if (!user) return;
    let mounted = true;

    setLoading(true);
    fetchMonthData();

    const channel = supabase
      .channel('home-realtime')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${user.id}` }, 
        () => {
          if (mounted) fetchMonthData();
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [user, fetchMonthData]);

  const summary = useMemo(() => {
    const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount), 0);
    const expense = transactions.filter(t => t.type !== 'income').reduce((acc, t) => acc + Number(t.amount), 0);
    const balance = income - expense;
    return { income, expense, balance };
  }, [transactions]);

  const recentTransactions = useMemo(() => transactions.slice(0, 3), [transactions]);

  return {
    transactions,
    recentTransactions,
    loading,
    currentDate,
    monthTitle,
    summary,
    changeMonth,
  };
}
