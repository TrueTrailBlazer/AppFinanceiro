import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchAnalysisRPC } from '../services/transactions';
import { supabase } from '../services/supabase';
import { useDate } from '../contexts/DateContext';
import { MonthPickerModal } from '../components/dashboard/MonthPickerModal';
import AnalysisHeaderBar from '../components/analysis/AnalysisHeaderBar';
import AnalysisComparisonBanner from '../components/analysis/AnalysisComparisonBanner';
import ExpenseDonutCard from '../components/analysis/ExpenseDonutCard';
import CategoryRankingList from '../components/analysis/CategoryRankingList';
import TopExpensesSection from '../components/analysis/TopExpensesSection';
import type { AnalysisData } from '../types/models';

export default function Analysis() {
  const { user } = useAuth();
  const { currentDate, setCurrentDate } = useDate();

  const [isMonthModalOpen, setIsMonthModalOpen] = useState(false);
  const [data, setData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [periodMode, setPeriodMode] = useState<'month' | 'year'>('month');

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();

      let startDate: Date;
      let endDate: Date;
      let prevStartDate: Date | null = null;
      let prevEndDate: Date | null = null;

      if (periodMode === 'month') {
        startDate = new Date(year, month, 1, 0, 0, 0);
        endDate = new Date(year, month + 1, 0, 23, 59, 59);
        
        prevStartDate = new Date(year, month - 1, 1, 0, 0, 0);
        prevEndDate = new Date(year, month, 0, 23, 59, 59);
      } else {
        startDate = new Date(year, 0, 1, 0, 0, 0);
        endDate = new Date(year, 11, 31, 23, 59, 59);
      }

      const result = await fetchAnalysisRPC(user.id, startDate, endDate, prevStartDate, prevEndDate);
      setData(result);
    } catch (err) {
      console.error("Erro ao buscar análise via RPC:", err);
    } finally {
      setLoading(false);
    }
  }, [user, currentDate, periodMode]);

  const fetchDataRef = useRef(fetchData);
  useEffect(() => {
    fetchDataRef.current = fetchData;
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!user) return;
    const subscription = supabase
      .channel(`analysis_transactions_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchDataRef.current();
        }
      )
      .subscribe();

    return () => { 
      supabase.removeChannel(subscription);
    };
  }, [user]);

  return (
    <div className="flex flex-col w-full gap-4 animate-in fade-in duration-500 pt-1 pb-24">
      
      {/* MONTH SELECTOR & PERIOD SWITCHER */}
      <AnalysisHeaderBar 
        periodMode={periodMode}
        setPeriodMode={setPeriodMode}
        currentDate={currentDate}
        onOpenMonthModal={() => setIsMonthModalOpen(true)}
      />

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Calculando métricas na nuvem...</p>
        </div>
      ) : !data || data.totalExpenseCents === 0 ? (
        <div className="text-center py-16 px-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3 border border-slate-200 mx-auto">
            <span className="material-symbols-outlined text-[28px]">pie_chart</span>
          </div>
          <p className="text-sm font-bold text-slate-900">Sem dados para análise</p>
          <p className="text-xs text-slate-500 mt-1 max-w-[240px] mx-auto">
            Não há despesas registradas neste período para gerar os gráficos.
          </p>
        </div>
      ) : (
        <>
          {/* COMPARISON MICRO-BANNER */}
          <AnalysisComparisonBanner comparison={data.comparison} />

          {/* PRIMARY EXPENSE BREAKDOWN CARD WITH DONUT */}
          <ExpenseDonutCard 
            totalExpenseCents={data.totalExpenseCents}
            totalItems={data.totalItems}
            categoryRanking={data.categoryRanking}
          />

          {/* CATEGORY PROPORTION BREAKDOWN LIST */}
          <CategoryRankingList 
            categoryRanking={data.categoryRanking}
            totalExpenseCents={data.totalExpenseCents}
            currentDate={currentDate}
            periodMode={periodMode}
            isBankSource={data.isBankSource}
          />

          {/* TOP EXPENSES LIST & EDUCATIONAL TIP */}
          <TopExpensesSection 
            topExpensesList={data.topExpensesList}
            topCategoryKey1={data.categoryRanking[0]?.cat}
            topCategoryKey2={data.categoryRanking[1]?.cat}
          />
        </>
      )}

      <MonthPickerModal 
        isOpen={isMonthModalOpen} 
        onClose={() => setIsMonthModalOpen(false)} 
        currentDate={currentDate} 
        onSelectDate={setCurrentDate} 
      />
    </div>
  );
}
