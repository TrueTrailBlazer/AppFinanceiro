import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchAllUserTransactions } from '../services/transactions';
import { useNavigate } from 'react-router-dom';
import { useDate } from '../contexts/DateContext';
import { parseCents, formatCurrency } from '../utils/money';
import { formatLocalDate } from '../utils/date';
import { getCategory } from '../utils/constants';
import { MonthPickerModal } from '../components/dashboard/MonthPickerModal';

export default function Analysis() {
  const { user } = useAuth();
  const { currentDate, setCurrentDate } = useDate();
  const navigate = useNavigate();

  const [isMonthModalOpen, setIsMonthModalOpen] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [periodMode, setPeriodMode] = useState('month'); // 'month' or 'year'

  useEffect(() => {
    if (!user) return;
    const fetchAll = async () => {
      setLoading(true);
      try {
        const data = await fetchAllUserTransactions(user.id, true);
        if (data) setTransactions(data);
      } catch (err) {
        console.error("Erro ao buscar dados:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [user]);

  const data = useMemo(() => {
    if (!transactions || transactions.length === 0) return null;

    // Filtragem baseada no Period Mode
    const filteredTx = transactions.filter(t => {
      const d = new Date(t.created_at);
      if (periodMode === 'month') {
        return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
      } else {
        return d.getFullYear() === currentDate.getFullYear();
      }
    });

    const expensesOnly = filteredTx.filter(t => t.type !== 'income');

    const totalExpenseCents = expensesOnly.reduce((acc, t) => acc + parseCents(t.amount), 0);

    // Categories Breakdown
    const catTotals = {};
    expensesOnly.forEach(t => {
      catTotals[t.category] = (catTotals[t.category] || 0) + parseCents(t.amount);
    });

    const categoryRanking = Object.entries(catTotals)
      .map(([cat, amount]) => ({ cat, amount }))
      .sort((a, b) => b.amount - a.amount);

    // Top Expenses
    const uniqueExpensesMap = new Map();
    expensesOnly.forEach(t => {
      const cleanName = t.name.replace(/\s*\(\d+\/\d+\)\s*$/, '').trim();
      if (!uniqueExpensesMap.has(cleanName) || parseCents(t.amount) > parseCents(uniqueExpensesMap.get(cleanName).amount)) {
        uniqueExpensesMap.set(cleanName, t);
      }
    });

    const topExpensesList = Array.from(uniqueExpensesMap.values())
      .sort((a, b) => parseCents(b.amount) - parseCents(a.amount))
      .slice(0, 5);

    // Comparativo (Se Mensal)
    let comparison = null;
    if (periodMode === 'month') {
      const prevMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
      const prevMonthTx = transactions.filter(t => {
        const d = new Date(t.created_at);
        return d.getMonth() === prevMonthDate.getMonth() && d.getFullYear() === prevMonthDate.getFullYear() && t.type !== 'income';
      });
      const prevTotalExpense = prevMonthTx.reduce((acc, t) => acc + parseCents(t.amount), 0);

      if (prevTotalExpense > 0) {
        const diff = prevTotalExpense - totalExpenseCents;
        comparison = {
          isSavings: diff >= 0,
          value: Math.abs(diff),
          percent: Math.round((Math.abs(diff) / prevTotalExpense) * 100)
        };
      }
    }

    return { totalExpenseCents, categoryRanking, topExpensesList, comparison, totalItems: expensesOnly.length };
  }, [transactions, currentDate, periodMode]);

  const svgRadius = 54;
  const svgCircumference = 2 * Math.PI * svgRadius;
  const donutColors = ['#047857', '#10b981', '#34d399', '#6ee7b7', '#94a3b8'];
  const donutTailwindBg = ['bg-emerald-700', 'bg-emerald-500', 'bg-emerald-400', 'bg-emerald-300', 'bg-slate-400'];

  let currentOffset = 0;

  return (
    <div className="flex flex-col w-full gap-4 animate-in fade-in duration-500 pt-1 pb-24">
      
      {/* MONTH SELECTOR & PERIOD SWITCHER (Header replacement) */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div 
          onClick={() => setIsMonthModalOpen(true)}
          className="bg-white border border-border-subtle rounded-full px-3 py-1.5 shadow-sm flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-[16px] text-slate-500">calendar_today</span>
          <span className="text-[13px] font-bold text-slate-900 select-none capitalize">
            {periodMode === 'month' 
              ? currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
              : currentDate.getFullYear()}
          </span>
          <span className="material-symbols-outlined text-[16px] text-slate-500">arrow_drop_down</span>
        </div>

        <div className="flex items-center bg-slate-100 p-1 rounded-full text-[11px] font-semibold text-slate-500 border border-border-subtle">
          <button 
            onClick={() => setPeriodMode('month')} 
            className={`px-3 py-1 rounded-full transition-all ${periodMode === 'month' ? 'bg-white text-emerald-700 shadow-sm font-bold' : 'hover:text-slate-900'}`}
          >
            Mensal
          </button>
          <button 
            onClick={() => setPeriodMode('year')} 
            className={`px-3 py-1 rounded-full transition-all ${periodMode === 'year' ? 'bg-white text-emerald-700 shadow-sm font-bold' : 'hover:text-slate-900'}`}
          >
            Anual
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Calculando métricas...</p>
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
          {data.comparison && (
            <div className={`rounded-2xl p-4 shadow-sm flex items-center gap-3 border ${data.comparison.isSavings ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'}`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${data.comparison.isSavings ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
                <span className="material-symbols-outlined text-[20px]">{data.comparison.isSavings ? 'trending_down' : 'trending_up'}</span>
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[12px] font-bold">{data.comparison.isSavings ? `Economia de ${data.comparison.percent}%` : `Gasto ${data.comparison.percent}% maior`}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60"></span>
                  <span className="text-[11px] opacity-80 truncate">vs. Mês Passado</span>
                </div>
                <p className="text-[11px] opacity-90 leading-tight mt-0.5">
                  Você gastou {formatCurrency(data.comparison.value)} {data.comparison.isSavings ? 'a menos' : 'a mais'}.
                </p>
              </div>
            </div>
          )}

          {/* PRIMARY EXPENSE BREAKDOWN CARD WITH DONUT */}
          <div className="bg-white border border-border-subtle rounded-3xl p-5 shadow-sm flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-500 tracking-wider uppercase">Total de Despesas</span>
                <h2 className="text-2xl font-black text-slate-900 mt-0.5">{formatCurrency(data.totalExpenseCents)}</h2>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold">
                {data.totalItems} lançamentos
              </span>
            </div>

            <div className="flex items-center justify-center relative py-2">
              <div className="relative w-44 h-44 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 140 140">
                  <circle cx="70" cy="70" fill="none" r="54" stroke="#f1f5f9" strokeWidth="16"></circle>
                  {data.categoryRanking.map((cat, index) => {
                    const colorIndex = index >= donutColors.length ? donutColors.length - 1 : index;
                    const strokeColor = donutColors[colorIndex];
                    const catFraction = cat.amount / data.totalExpenseCents;
                    const dashLength = catFraction * svgCircumference;
                    const offset = currentOffset;
                    currentOffset += dashLength;

                    return (
                      <circle 
                        key={cat.cat}
                        cx="70" cy="70" fill="none" r="54" 
                        stroke={strokeColor} 
                        strokeWidth="16"
                        strokeLinecap="round"
                        strokeDasharray={`${dashLength} ${svgCircumference}`}
                        strokeDashoffset={-offset}
                        className="transition-all duration-1000 ease-out"
                      ></circle>
                    );
                  })}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="material-symbols-outlined text-[20px] text-emerald-600">pie_chart</span>
                  <span className="text-[10px] font-semibold text-slate-500 mt-0.5">Maior gasto</span>
                  <span className="text-[22px] font-black text-slate-900 leading-none mt-1">
                    {Math.round((data.categoryRanking[0]?.amount / data.totalExpenseCents) * 100)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="w-full flex h-2 rounded-full overflow-hidden bg-slate-100 gap-0.5 mt-2">
              {data.categoryRanking.map((cat, index) => {
                const colorIndex = index >= donutTailwindBg.length ? donutTailwindBg.length - 1 : index;
                const bgClass = donutTailwindBg[colorIndex];
                const widthPercent = (cat.amount / data.totalExpenseCents) * 100;
                return <div key={cat.cat} className={`h-full ${bgClass}`} style={{ width: `${widthPercent}%` }}></div>;
              })}
            </div>
          </div>

          {/* CATEGORY PROPORTION BREAKDOWN LIST */}
          <div className="bg-white border border-border-subtle rounded-3xl p-5 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[16px] font-bold text-slate-900">Categorias</h3>
              <span className="text-[11px] font-bold text-slate-500">{data.categoryRanking.length} grupos</span>
            </div>
            <div className="flex flex-col gap-4 mt-1">
              {data.categoryRanking.map((cat, index) => {
                const catInfo = getCategory(cat.cat);
                const colorIndex = index >= donutTailwindBg.length ? donutTailwindBg.length - 1 : index;
                const bgClass = donutTailwindBg[colorIndex];
                const percent = Math.round((cat.amount / data.totalExpenseCents) * 100);

                return (
                  <div key={cat.cat} onClick={() => navigate('/category-details', { state: { category: cat.cat } })} className="flex flex-col gap-1.5 cursor-pointer group">
                    <div className="flex items-center justify-between text-slate-900">
                      <div className="flex items-center gap-2.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${bgClass} shrink-0`}></span>
                        <span className="text-[13px] font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">{catInfo.label}</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-[13px] font-black text-slate-900">{formatCurrency(cat.amount)}</span>
                        <span className="text-[11px] font-bold text-slate-400 w-8 text-right">{percent}%</span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${bgClass} rounded-full transition-all duration-1000`} style={{ width: `${percent}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* TOP EXPENSES LIST */}
          <div className="bg-white border border-border-subtle rounded-3xl p-5 shadow-sm flex flex-col gap-3.5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[16px] font-bold text-slate-900">Maiores Despesas</h3>
                <p className="text-[11px] font-semibold text-slate-500 mt-0.5">Lançamentos de maior impacto</p>
              </div>
            </div>
            <div className="flex flex-col mt-2">
              {data.topExpensesList.map((item, index) => {
                const catInfo = getCategory(item.category);
                
                // Adaptação dos ícones dinâmicos
                let iconName = 'receipt_long';
                if (item.category === 'home' || item.name.toLowerCase().includes('condomínio') || item.name.toLowerCase().includes('aluguel')) iconName = 'home_work';
                if (item.category === 'utilities' || item.name.toLowerCase().includes('energia') || item.name.toLowerCase().includes('luz')) iconName = 'bolt';
                if (item.category === 'utilities' || item.name.toLowerCase().includes('internet')) iconName = 'wifi';
                if (item.category === 'food' || item.name.toLowerCase().includes('supermercado') || item.name.toLowerCase().includes('mercado')) iconName = 'shopping_cart';
                if (item.category === 'transport' || item.name.toLowerCase().includes('manutenção') || item.name.toLowerCase().includes('uber')) iconName = 'directions_car';
                if (item.name.toLowerCase().includes('cartão') || item.name.toLowerCase().includes('fatura')) iconName = 'credit_card';
                if (item.category === 'health' || item.name.toLowerCase().includes('academia') || item.name.toLowerCase().includes('smart fit')) iconName = 'fitness_center';

                return (
                  <div key={item.id || index} className="flex items-center justify-between py-3 hover:bg-slate-50 px-2 rounded-2xl transition-colors cursor-pointer" onClick={() => navigate('/add', { state: { transaction: item } })}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[22px]">{iconName}</span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[13px] font-bold text-slate-900 truncate">{item.name.replace(/\s*\(\d+\/\d+\)\s*$/, '')}</span>
                        <span className="text-[11px] font-medium text-slate-500 mt-0.5">
                          {catInfo.label} • {formatLocalDate(item.created_at, { day: '2-digit', month: 'short' })}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end shrink-0 pl-2">
                      <span className="text-[13px] font-black text-rose-600">- {formatCurrency(item.amount)}</span>
                      <span className={`text-[10px] px-2 py-0.5 mt-1 rounded-full font-bold ${item.is_paid ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                        {item.is_paid ? 'Pago' : 'Pendente'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* EDUCATIONAL TIP */}
          <div className="bg-white border border-border-subtle rounded-3xl p-5 shadow-sm flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100">
              <span className="material-symbols-outlined text-emerald-600 text-[22px]">lightbulb</span>
            </div>
            <div className="flex flex-col gap-1 min-w-0">
              <h4 className="text-[13px] font-bold text-slate-900">Dica do Planejador</h4>
              <p className="text-[12px] text-slate-600 leading-snug">
                Os gastos com <span className="font-bold">{getCategory(data.categoryRanking[0]?.cat)?.label}</span> e <span className="font-bold">{getCategory(data.categoryRanking[1]?.cat)?.label}</span> representam a maior fatia do seu orçamento. Fique de olho para não ultrapassar 50% em gastos essenciais.
              </p>
            </div>
          </div>
        </>
      )}

      <MonthPickerModal isOpen={isMonthModalOpen} onClose={() => setIsMonthModalOpen(false)} currentDate={currentDate} onSelectDate={setCurrentDate} />
    </div>
  );
}