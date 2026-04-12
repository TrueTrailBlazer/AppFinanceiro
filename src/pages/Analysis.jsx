import { useEffect, useState, useMemo, useRef } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, TrendingDown, Wallet, Award, 
  Calendar, ChevronDown, Tag, PieChart, 
  ArrowUpRight, Target, Flame, HelpCircle
} from 'lucide-react';
import { getCategory } from '../utils/constants';

export default function Analysis() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(6);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(null);
  const [isPeriodOpen, setIsPeriodOpen] = useState(false);
  const [rankingMode, setRankingMode] = useState('month'); // 'month' or 'all'
  const [activeTooltip, setActiveTooltip] = useState(null); // 'saldo' or 'eficiencia'

  const chartScrollRef = useRef(null);

  const periodOptions = [
    { val: 3, label: '3 Meses' },
    { val: 6, label: '6 Meses' },
    { val: 12, label: '1 Ano' }
  ];
  const activePeriodLabel = periodOptions.find(p => p.val === period)?.label;

  useEffect(() => {
    if (!user) return;
    const fetchAll = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: true });
        
        if (error) throw error;
        if (data) setTransactions(data);
      } catch (err) {
        console.error("Erro ao buscar dados:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [user]);

  // Efeito para rolar o gráfico para o final (mês atual) ao carregar ou mudar o período
  useEffect(() => {
    if (chartScrollRef.current && !loading) {
        chartScrollRef.current.scrollLeft = chartScrollRef.current.scrollWidth;
    }
  }, [loading, period]);

  // --- Processamento ---
  const data = useMemo(() => {
    if (!transactions || transactions.length === 0) return null;

    const months = {};
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2,'0')}`;
    
    for (let i = period - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}`;
        const label = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.','');
        months[key] = { label, income: 0, expense: 0, isCurrent: key === currentMonthKey, key };
    }

    transactions.forEach(t => {
        const d = new Date(t.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}`;
        if (months[key]) {
            const val = Number(t.amount);
            if (t.type === 'income') months[key].income += val;
            else months[key].expense += val;
        }
    });

    const monthList = Object.values(months);

    // 2. Top Maiores Gastos (UNIFICADOS)
    const uniqueExpensesMap = new Map();
    transactions
        .filter(t => t.type !== 'income')
        .forEach(t => {
            const cleanName = t.name.replace(/\s*\(\d+\/\d+\)\s*$/, '').trim();
            if (!uniqueExpensesMap.has(cleanName) || Number(t.amount) > Number(uniqueExpensesMap.get(cleanName).amount)) {
                uniqueExpensesMap.set(cleanName, t);
            }
        });

    const topExpensesList = Array.from(uniqueExpensesMap.values())
        .sort((a, b) => Number(b.amount) - Number(a.amount))
        .slice(0, 5);

    const maxTopExpenseValue = Math.max(...topExpensesList.map(t => Number(t.amount)), 1);

    // 3. KPIs
    const totalSaved = transactions.reduce((acc, t) => acc + (t.type === 'income' ? Number(t.amount) : -Number(t.amount)), 0);
    
    let savingsRateSum = 0;
    let validMonths = 0;
    monthList.forEach(m => {
        if(m.income > 0) {
            savingsRateSum += ((m.income - m.expense) / m.income);
            validMonths++;
        }
    });
    const avgSavingsRate = validMonths > 0 ? (savingsRateSum / validMonths) * 100 : 0;

    // 4. Ranking por Categoria
    let filteredForRanking = transactions.filter(t => t.type !== 'income');
    let selectedMonthKeyForRanking = null;
    let selectedMonthLabelForRanking = null;

    if (rankingMode === 'month') {
        const targetDate = selectedMonthIndex !== null 
            ? new Date(now.getFullYear(), now.getMonth() - (period - 1 - selectedMonthIndex), 1)
            : now;
        selectedMonthKeyForRanking = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;
        selectedMonthLabelForRanking = targetDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        
        filteredForRanking = filteredForRanking.filter(t => {
            const d = new Date(t.created_at);
            return d.getMonth() === targetDate.getMonth() && d.getFullYear() === targetDate.getFullYear();
        });
    }

    const catTotals = {};
    filteredForRanking.forEach(t => {
        catTotals[t.category] = (catTotals[t.category] || 0) + Number(t.amount);
    });

    const categoryRanking = Object.entries(catTotals)
        .map(([cat, amount]) => ({ cat, amount }))
        .sort((a, b) => b.amount - a.amount);

    const maxCatValue = Math.max(...categoryRanking.map(c => c.amount), 1);

    return { monthList, topExpensesList, maxTopExpenseValue, totalSaved, avgSavingsRate, categoryRanking, maxCatValue, selectedMonthKeyForRanking, selectedMonthLabelForRanking };
  }, [transactions, period, selectedMonthIndex, rankingMode]);

  if (!loading && (!data || transactions.length === 0)) {
      return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-500 animate-in fade-in duration-700">
              <div className="p-6 bg-[#121212] rounded-full mb-4 border border-[#222]">
                  <PieChart size={32} className="opacity-20" />
              </div>
              <p className="text-sm font-bold uppercase tracking-widest opacity-40">Sem dados para análise</p>
              <p className="text-xs mt-1">Adicione lançamentos para liberar os gráficos.</p>
          </div>
      );
  }

  const maxChartValue = data ? Math.max(...data.monthList.map(m => Math.max(m.income, m.expense)), 100) : 100;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10" onClick={() => setActiveTooltip(null)}>
      
      {/* HEADER */}
      <div className="flex justify-between items-center px-1">
        <div className="flex flex-col">
            <h1 className="text-xl font-black text-white tracking-tight italic">ANÁLISE</h1>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Inteligência Financeira</p>
        </div>
        
        <div className="relative z-50">
          <button
            onClick={() => setIsPeriodOpen(!isPeriodOpen)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl border transition-all active:scale-95 ${
              isPeriodOpen ? 'bg-blue-600 border-blue-600 text-white' : 'bg-[#121212] border-[#222] text-gray-400 hover:text-white'
            }`}
          >
            <Calendar size={14} />
            <span className="text-xs font-black uppercase tracking-wider">{activePeriodLabel}</span>
            <ChevronDown size={14} className={`transition-transform duration-300 ${isPeriodOpen ? 'rotate-180' : ''}`} />
          </button>

          {isPeriodOpen && (
            <div className="absolute top-full right-0 mt-2 w-40 bg-[#121212]/95 backdrop-blur-xl border border-[#222] rounded-2xl shadow-2xl p-2 flex flex-col gap-1 animate-in slide-in-from-top-4 duration-300">
              {periodOptions.map(opt => (
                <button
                  key={opt.val}
                  onClick={() => { setPeriod(opt.val); setSelectedMonthIndex(null); setIsPeriodOpen(false); }}
                  className={`text-left px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    period === opt.val ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-[#1a1a1a] hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest transition-pulse">Auditando suas contas...</p>
        </div>
      ) : (
        <>
            {/* KPI GRID - REFINADO */}
            <div className="grid grid-cols-2 gap-3 px-1">
                <div 
                    onClick={(e) => { e.stopPropagation(); setActiveTooltip(activeTooltip === 'saldo' ? null : 'saldo'); }}
                    className="bg-[#121212] p-4 sm:p-5 rounded-[2rem] border border-[#222] relative group overflow-hidden cursor-pointer active:scale-95 transition-all"
                >
                    <div className="flex items-center justify-between mb-1">
                        <p className="text-[9px] uppercase font-black text-gray-500 tracking-widest">Saldo Total</p>
                        <HelpCircle size={16} className={`transition-colors ${activeTooltip === 'saldo' ? 'text-blue-500' : 'text-gray-700'}`} />
                    </div>
                    <h3 className={`text-base sm:text-lg font-black mt-2 tracking-tight truncate ${data.totalSaved >= 0 ? 'text-white' : 'text-red-500'}`}>
                        {data.totalSaved.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </h3>
                    
                    {activeTooltip === 'saldo' && (
                        <div className="absolute inset-0 bg-blue-600 p-4 flex items-center justify-center animate-in fade-in zoom-in duration-200">
                            <p className="text-[10px] font-bold text-white uppercase tracking-tighter leading-tight text-center">Toda a sobra acumulada no período selecionado.</p>
                        </div>
                    )}
                </div>

                <div 
                    onClick={(e) => { e.stopPropagation(); setActiveTooltip(activeTooltip === 'eficiencia' ? null : 'eficiencia'); }}
                    className="bg-[#121212] p-4 sm:p-5 rounded-[2rem] border border-[#222] relative group overflow-hidden cursor-pointer active:scale-95 transition-all"
                >
                    <div className="flex items-center justify-between mb-1">
                        <p className="text-[9px] uppercase font-black text-gray-500 tracking-widest">Eficiência</p>
                        <HelpCircle size={16} className={`transition-colors ${activeTooltip === 'eficiencia' ? 'text-green-500' : 'text-gray-700'}`} />
                    </div>
                    <h3 className={`text-base sm:text-lg font-black mt-2 tracking-tight truncate ${data.avgSavingsRate > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {data.avgSavingsRate.toFixed(1)}%
                    </h3>

                    {activeTooltip === 'eficiencia' && (
                        <div className="absolute inset-0 bg-green-600 p-4 flex items-center justify-center animate-in fade-in zoom-in duration-200">
                            <p className="text-[10px] font-bold text-white uppercase tracking-tighter leading-tight text-center">O quanto você consegue salvar do seu ganho mensal.</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* GRÁFICO DE BARRAS - SCROLLABLE & FOCUS */}
                <div className="bg-[#0c0c0c] p-6 rounded-[2.5rem] border border-[#1a1a1a] shadow-2xl overflow-hidden">
                    <div className="flex justify-between items-center mb-8">
                        <div className="flex flex-col">
                            <h3 className="text-xs font-black text-gray-200 uppercase tracking-widest flex items-center gap-2">
                                <TrendingUp size={16} className="text-blue-500"/> Fluxo Mensal
                            </h3>
                            <span className="text-[9px] text-gray-600 font-bold uppercase">Toque na barra para ver valores</span>
                        </div>
                        {period > 6 && <span className="text-[8px] text-blue-500 font-black bg-blue-500/10 px-2 py-1 rounded-full animate-pulse tracking-widest">HOJE →</span>}
                    </div>
                    
                    <div ref={chartScrollRef} className="overflow-x-auto pb-4 custom-scrollbar-horizontal snap-x snap-mandatory">
                        <div className="flex items-end justify-between gap-3 h-44 min-w-[500px] md:min-w-full relative px-4">
                            {data.monthList.map((m, i) => (
                                <div key={i} 
                                    onClick={(e) => { e.stopPropagation(); setSelectedMonthIndex(selectedMonthIndex === i ? null : i); }} 
                                    className="flex flex-col items-center flex-1 h-full justify-end cursor-pointer group relative snap-center"
                                >
                                    {selectedMonthIndex === i && (
                                      <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white text-black p-3 rounded-2xl shadow-2xl z-30 animate-in slide-in-from-bottom-2 duration-300">
                                        <div className="flex flex-col items-center gap-1 font-black">
                                          <span className="text-[10px] text-green-600">+ {m.income.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}</span>
                                          <span className="text-[10px] text-red-600">- {m.expense.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}</span>
                                        </div>
                                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rotate-45"></div>
                                      </div>
                                    )}
                                    <div className="flex gap-1.5 items-end justify-center w-full h-full">
                                        <div className={`w-3 md:w-4 rounded-t-lg transition-all duration-500 
                                            ${selectedMonthIndex === i ? 'bg-blue-500 h-full scale-110' : 'bg-blue-600/30'}
                                            ${m.isCurrent ? 'ring-2 ring-blue-500/50 ring-offset-2 ring-offset-[#0c0c0c] shadow-[0_0_15px_rgba(37,99,235,0.3)]' : ''}`} 
                                            style={{ height: `${(m.income / maxChartValue) * 100}%` }}></div>
                                        <div className={`w-3 md:w-4 rounded-t-lg transition-all duration-500 
                                            ${selectedMonthIndex === i ? 'bg-red-500 h-full scale-110' : 'bg-red-600/30'}
                                            ${m.isCurrent ? 'ring-2 ring-red-500/50 ring-offset-2 ring-offset-[#0c0c0c] shadow-[0_0_15px_rgba(239,68,68,0.3)]' : ''}`} 
                                            style={{ height: `${(m.expense / maxChartValue) * 100}%` }}></div>
                                    </div>
                                    <span className={`text-[8px] font-black uppercase mt-4 transition-colors ${selectedMonthIndex === i || m.isCurrent ? 'text-white' : 'text-gray-600'}`}>{m.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* RANKING CATEGORIAS - NAVEGAÇÃO NOVA TELA */}
                <div className="bg-[#0c0c0c] p-6 rounded-[2.5rem] border border-[#1a1a1a] shadow-2xl">
                    <div className="flex justify-between items-center mb-8">
                        <div className="flex flex-col">
                            <h3 className="text-xs font-black text-gray-200 uppercase tracking-widest flex items-center gap-2">
                                <Tag size={16} className="text-blue-500"/> Gastos por Categoria
                            </h3>
                            <span className="text-[9px] text-gray-600 font-bold uppercase">Toque para ver Detalhes</span>
                        </div>
                        <div className="flex bg-[#121212] p-1 rounded-xl border border-[#222]">
                            <button onClick={(e) => { e.stopPropagation(); setRankingMode('month'); }} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${rankingMode === 'month' ? 'bg-blue-600 text-white' : 'text-gray-500'}`}>Mês</button>
                            <button onClick={(e) => { e.stopPropagation(); setRankingMode('all'); }} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${rankingMode === 'all' ? 'bg-blue-600 text-white' : 'text-gray-500'}`}>Total</button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {data.categoryRanking.length > 0 ? (
                            data.categoryRanking.map(({ cat, amount }) => {
                                const catInfo = getCategory(cat);
                                const Icon = catInfo.icon;
                                const percent = (amount / data.maxCatValue) * 100;
                                return (
                                    <div 
                                        key={cat} 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate('/category-details', { 
                                                state: { 
                                                    category: cat, 
                                                    monthKey: rankingMode === 'month' ? data.selectedMonthKeyForRanking : null,
                                                    monthLabel: rankingMode === 'month' ? data.selectedMonthLabelForRanking : 'Todo o Período'
                                                } 
                                            });
                                        }}
                                        className="p-4 bg-[#121212] rounded-3xl border border-[#1a1a1a] relative overflow-hidden group hover:border-blue-500 transition-all cursor-pointer active:scale-[0.98]"
                                    >
                                        <div className="absolute bottom-0 left-0 h-1 bg-blue-600/20 group-hover:bg-blue-600 transition-all" style={{ width: `${percent}%` }}></div>
                                        <div className="flex items-start justify-between mb-3">
                                            <div className={`p-2.5 rounded-2xl ${catInfo.bg} border border-white/5`}>
                                                <Icon size={16} className={catInfo.color} />
                                            </div>
                                            <ArrowUpRight size={14} className="text-gray-700 group-hover:text-blue-500 transition-colors" />
                                        </div>
                                        <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{catInfo.label}</h4>
                                        <p className="text-sm font-black text-white mt-1 italic">{amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="col-span-full py-16 text-center text-[10px] text-gray-700 font-black uppercase tracking-[0.2em] opacity-30 italic">Sem movimentação</div>
                        )}
                    </div>
                </div>

                {/* TOP 5 GASTOS */}
                <div className="lg:col-span-2 bg-[#0c0c0c] p-6 rounded-[2.5rem] border border-[#1a1a1a] shadow-2xl">
                    <h3 className="text-xs font-black text-gray-200 uppercase tracking-widest flex items-center gap-2 mb-8">
                        <TrendingDown size={18} className="text-red-500" /> Maiores Despesas Únicas
                    </h3>
                    <div className="space-y-3">
                        {data.topExpensesList.map(item => {
                            const catInfo = getCategory(item.category);
                            const Icon = catInfo.icon;
                            return (
                                <div key={item.id} className="flex items-center justify-between p-4 bg-[#121212] rounded-[1.5rem] border border-[#1a1a1a] group hover:scale-[1.01] transition-all">
                                    <div className="flex items-center gap-4 truncate">
                                        <div className={`p-3 rounded-2xl ${catInfo.bg} text-blue-500`}><Icon size={18} className={catInfo.color} /></div>
                                        <div className="flex flex-col truncate">
                                            <span className="text-sm font-black text-white truncate uppercase tracking-tight italic">{item.name.replace(/\s*\(\d+\/\d+\)\s*$/, '')}</span>
                                            <span className="text-[9px] text-gray-600 font-black uppercase tracking-widest">{catInfo.label} • {new Date(item.created_at).toLocaleDateString('pt-BR')}</span>
                                        </div>
                                    </div>
                                    <span className="text-lg font-black text-white shrink-0 ml-4 italic">
                                        {Number(item.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </>
      )}
    </div>
  );
}