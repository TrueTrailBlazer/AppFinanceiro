import { useEffect, useState, useMemo, useRef } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  TrendingUp, TrendingDown, Wallet, HelpCircle,
  ChevronLeft, ChevronRight, PieChart, Tag, Calendar, ChevronDown, ArrowUpRight
} from 'lucide-react';
import { getCategory } from '../utils/constants';
import { MonthPickerModal } from '../components/dashboard/MonthPickerModal';
import { useDate } from '../contexts/DateContext';

export default function Analysis() {
  const { user } = useAuth();
  const { currentDate, setCurrentDate } = useDate();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMonthModalOpen, setIsMonthModalOpen] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(6);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(null);
  const [isPeriodOpen, setIsPeriodOpen] = useState(false);
  const [rankingMode, setRankingMode] = useState('month'); // 'month' or 'all'
  const [activeTooltip, setActiveTooltip] = useState(null); // 'saldo' or 'eficiencia'
  const [activeTab, setActiveTab] = useState(() => sessionStorage.getItem('analysis_tab') || 'geral');
  const [expandedExpense, setExpandedExpense] = useState(null);

  useEffect(() => {
    sessionStorage.setItem('analysis_tab', activeTab);
  }, [activeTab]);

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
        // Usa a data global selecionada pelo MonthSelector para a aba Categorias
        const targetDate = currentDate;
        
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
  }, [transactions, period, rankingMode, currentDate]);

  if (!loading && (!data || transactions.length === 0)) {
      return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-500 animate-in fade-in duration-700">
              <div className="p-6 bg-card rounded-full mb-4 border border-border">
                  <PieChart size={32} className="opacity-20" />
              </div>
              <p className="text-sm font-bold uppercase tracking-widest opacity-40">Sem dados para análise</p>
              <p className="text-xs mt-1">Adicione lançamentos para liberar os gráficos.</p>
          </div>
      );
  }

  const maxChartValue = data ? Math.max(...data.monthList.map(m => Math.max(m.income, m.expense)), 100) : 100;

  return (
    <div className="space-y-6 animate-in fade-in duration-500" onClick={() => setActiveTooltip(null)}>
      
      {/* HEADER + TABS FIXO */}
      <div className="sticky top-0 z-30 bg-background -mt-8 pt-8 -mx-4 px-4 pb-4 border-b border-border">
        <div className="flex justify-between items-center px-1 mb-4">
          <div className="flex flex-col">
              <h1 className="text-xl font-black text-foreground tracking-tight">ANÁLISE</h1>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Inteligência Financeira</p>
          </div>
        </div>

        {loading ? null : (
            <div className="flex gap-2 px-1">
                <button onClick={() => setActiveTab('geral')} className={`flex-1 py-3.5 rounded-2xl text-[10px] sm:text-[11px] font-black uppercase tracking-wider transition-all shadow-sm border ${activeTab === 'geral' ? 'bg-blue-600 border-blue-600 text-white shadow-blue-500/20' : 'bg-card border-border text-gray-500 hover:text-foreground active:scale-95'}`}>Geral</button>
                <button onClick={() => setActiveTab('categories')} className={`flex-1 py-3.5 rounded-2xl text-[10px] sm:text-[11px] font-black uppercase tracking-wider transition-all shadow-sm border ${activeTab === 'categories' ? 'bg-blue-600 border-blue-600 text-white shadow-blue-500/20' : 'bg-card border-border text-gray-500 hover:text-foreground active:scale-95'}`}>Categorias</button>
                <button onClick={() => setActiveTab('expenses')} className={`flex-1 py-3.5 rounded-2xl text-[10px] sm:text-[11px] font-black uppercase tracking-wider transition-all shadow-sm border ${activeTab === 'expenses' ? 'bg-blue-600 border-blue-600 text-white shadow-blue-500/20' : 'bg-card border-border text-gray-500 hover:text-foreground active:scale-95'}`}>Despesas</button>
            </div>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Auditando suas contas...</p>
        </div>
      ) : (
        <>
            {/* ABA GERAL */}
            {activeTab === 'geral' && (

                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 flex flex-col">
                    {/* KPI GRID */}
                    <div className="grid grid-cols-2 gap-3 px-1">
                        <div 
                            onClick={(e) => { e.stopPropagation(); setActiveTooltip(activeTooltip === 'saldo' ? null : 'saldo'); }}
                            className="bg-card p-4 sm:p-5 rounded-[2rem] border border-border relative group overflow-hidden cursor-pointer active:scale-95 transition-all"
                        >
                            <div className="flex items-center justify-between mb-1">
                                <p className="text-[9px] uppercase font-black text-gray-500 tracking-widest">Saldo Total</p>
                                <HelpCircle size={16} className={`transition-colors ${activeTooltip === 'saldo' ? 'text-blue-500' : 'text-gray-500'}`} />
                            </div>
                            <h3 className={`text-base sm:text-lg font-black mt-2 tracking-tight truncate ${data.totalSaved >= 0 ? 'text-foreground' : 'text-red-500'}`}>
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
                            className="bg-card p-4 sm:p-5 rounded-[2rem] border border-border relative group overflow-hidden cursor-pointer active:scale-95 transition-all"
                        >
                            <div className="flex items-center justify-between mb-1">
                                <p className="text-[9px] uppercase font-black text-gray-500 tracking-widest">Eficiência</p>
                                <HelpCircle size={16} className={`transition-colors ${activeTooltip === 'eficiencia' ? 'text-green-500' : 'text-gray-500'}`} />
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

                    {/* SELETOR DE PERIODO (Thumb-Zone Mapeada no centro da leitura em tela inteira) */}
                    <div className="flex justify-center my-4 z-10 relative px-1">
                        <div className="relative w-full">
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsPeriodOpen(!isPeriodOpen); }}
                                className={`flex items-center justify-between w-full px-5 py-4 rounded-[1.5rem] border transition-all active:scale-95 shadow-sm ${
                                isPeriodOpen ? 'bg-blue-600 border-blue-600 text-white shadow-blue-500/30' : 'bg-card border-border text-foreground hover:bg-card-hover hover:border-blue-500/50'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-xl ${isPeriodOpen ? 'bg-white/20 text-white' : 'bg-blue-500/10 text-blue-500'}`}>
                                        <Calendar size={18} />
                                    </div>
                                    <div className="flex flex-col items-start leading-none text-left">
                                        <span className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: isPeriodOpen ? 'rgba(255,255,255,0.7)' : 'var(--color-gray-500)' }}>Analisar Fluxo de:</span>
                                        <span className="text-sm font-black uppercase tracking-wider">{activePeriodLabel}</span>
                                    </div>
                                </div>
                                <ChevronDown size={18} className={`transition-transform duration-300 ${isPeriodOpen ? 'rotate-180 text-white' : 'text-gray-400'}`} />
                            </button>

                            {isPeriodOpen && (
                                <div className="absolute top-full left-0 right-0 mt-3 bg-card border border-border rounded-2xl shadow-xl p-2 flex flex-col gap-1 animate-in slide-in-from-top-4 duration-200 z-20">
                                    {periodOptions.map(opt => (
                                        <button
                                        key={opt.val}
                                        onClick={(e) => { e.stopPropagation(); setPeriod(opt.val); setSelectedMonthIndex(null); setIsPeriodOpen(false); }}
                                        className={`text-left px-5 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                                            period === opt.val ? 'bg-blue-600 text-white' : 'text-foreground hover:bg-card-hover hover:text-blue-500'
                                        }`}
                                        >
                                        {opt.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* GRÁFICO DE BARRAS */}
                    <div className="bg-card-alt p-6 pt-16 rounded-[2.5rem] border border-border shadow-md relative">
                        <div className="absolute top-6 left-6 right-6 flex justify-between items-center mb-8">
                            <div className="flex flex-col">
                                <h3 className="text-xs font-black text-foreground uppercase tracking-widest flex items-center gap-2">
                                    <TrendingUp size={16} className="text-blue-500"/> Fluxo Mensal
                                </h3>
                                <span className="text-[9px] text-gray-500 font-bold uppercase">Toque na barra para ver valores</span>
                            </div>
                            {period === 12 && <span className="text-[8px] text-blue-500 font-black bg-blue-500/10 px-2 py-1 rounded-full animate-pulse tracking-widest">DESLIZE →</span>}
                        </div>

                        {/* Info panel - altura fixa, sem layout shift */}
                        <div className="h-9 flex items-center mb-1">
                            {selectedMonthIndex !== null && data.monthList[selectedMonthIndex] ? (
                                <div className="flex items-center justify-between w-full bg-card border border-border rounded-xl px-4 py-2 animate-in fade-in duration-150">
                                    <span className="text-[10px] font-black text-foreground uppercase tracking-wider">{data.monthList[selectedMonthIndex].label}</span>
                                    <div className="flex items-center gap-4">
                                        <span className="text-[10px] font-black text-blue-500">{data.monthList[selectedMonthIndex].income.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                        <span className="text-[10px] font-black text-red-500">{data.monthList[selectedMonthIndex].expense.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3 px-1 text-[9px] text-gray-400 font-bold">
                                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span> Entrada
                                    <span className="w-2 h-2 bg-red-500 rounded-full ml-2"></span> Saída
                                </div>
                            )}
                        </div>
                        
                        <div ref={chartScrollRef} className={`${period === 12 ? 'overflow-x-auto' : 'overflow-hidden'} pb-4 custom-scrollbar-horizontal snap-x snap-mandatory`}>
                            <div className={`flex items-end justify-around gap-2 h-52 pt-4 ${period === 12 ? 'min-w-[700px]' : 'w-full'} relative px-2`}>
                                {data.monthList.map((m, i) => (
                                    <div key={i} 
                                        onClick={(e) => { e.stopPropagation(); setSelectedMonthIndex(selectedMonthIndex === i ? null : i); }} 
                                        className="flex flex-col items-center flex-1 h-full justify-end cursor-pointer group relative snap-center"
                                    >
                                        <div className="flex gap-1.5 items-end justify-center w-full h-full">
                                            <div className={`w-3 md:w-4 rounded-t-lg transition-all duration-500 
                                                ${selectedMonthIndex === i ? 'bg-blue-500 scale-110 ring-2 ring-blue-500/50 ring-offset-2 ring-offset-background' : m.isCurrent ? 'bg-blue-500' : 'bg-blue-500/50'}`} 
                                                style={{ height: `${Math.max((m.income / maxChartValue) * 100, 2)}%` }}></div>
                                            <div className={`w-3 md:w-4 rounded-t-lg transition-all duration-500 
                                                ${selectedMonthIndex === i ? 'bg-red-500 scale-110 ring-2 ring-red-500/50 ring-offset-2 ring-offset-background' : m.isCurrent ? 'bg-red-500' : 'bg-red-500/50'}`} 
                                                style={{ height: `${Math.max((m.expense / maxChartValue) * 100, 2)}%` }}></div>
                                        </div>
                                        <span className={`text-[8px] font-black uppercase mt-3 transition-colors ${selectedMonthIndex === i || m.isCurrent ? 'text-foreground' : 'text-gray-400'}`}>{m.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* DESTAQUES DO PERÍODO (PREENCHIMENTO DO VAZIO) */}
                    {(data.categoryRanking.length > 0 || data.topExpensesList.length > 0) && (
                        <div className="flex flex-col gap-3 px-1 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
                            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1 mt-2">Destaques do Período</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {/* Maior Categoria */}
                                {data.categoryRanking.length > 0 && (() => {
                                    const topCat = data.categoryRanking[0];
                                    const catInfo = getCategory(topCat.cat);
                                    const Icon = catInfo.icon;
                                    return (
                                        <div onClick={() => setActiveTab('categories')} className="bg-card p-4 rounded-[1.5rem] border border-border relative overflow-hidden flex flex-col justify-between min-h-[110px] cursor-pointer active:scale-95 transition-all group">
                                            <div className="flex items-start justify-between">
                                                <div className={`p-2 rounded-xl ${catInfo.bg} border border-border/10`}>
                                                    <Icon size={14} className={catInfo.color} />
                                                </div>
                                                <span className="text-[8px] uppercase font-black text-gray-400 bg-card-hover px-2 py-1 rounded-md">Categoria Top</span>
                                            </div>
                                            <div className="mt-3">
                                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest truncate">{catInfo.label}</p>
                                                <p className="text-sm font-black text-foreground mt-0.5 truncate">{topCat.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* Maior Despesa */}
                                {data.topExpensesList.length > 0 && (() => {
                                    const topExp = data.topExpensesList[0];
                                    const expCatInfo = getCategory(topExp.category);
                                    return (
                                        <div onClick={() => setActiveTab('expenses')} className="bg-card p-4 rounded-[1.5rem] border border-border relative overflow-hidden flex flex-col justify-between min-h-[110px] cursor-pointer active:scale-95 transition-all group">
                                            <div className="flex items-start justify-between">
                                                <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20">
                                                    <TrendingDown size={14} className="text-red-500" />
                                                </div>
                                                <span className="text-[8px] uppercase font-black text-gray-400 bg-card-hover px-2 py-1 rounded-md">Maior Custo</span>
                                            </div>
                                            <div className="mt-3 flex flex-col">
                                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest truncate">{topExp.name.replace(/\s*\(\d+\/\d+\)\s*$/, '')}</p>
                                                <p className="text-sm font-black text-foreground mt-0.5 truncate">{Number(topExp.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    )}

                </div>
            )}

            {/* ABA CATEGORIAS */}
            {activeTab === 'categories' && (
                <div className="animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex justify-between items-center mb-5 px-1">
                        <div className="flex flex-col">
                            <h3 className="text-xs font-black text-foreground uppercase tracking-widest flex items-center gap-2">
                                <Tag size={16} className="text-blue-500"/> Gastos por Categoria
                            </h3>
                            <span className="text-[9px] text-gray-500 font-bold uppercase mt-1">Toque para ver Detalhes</span>
                        </div>
                        <div className="flex bg-card p-1 rounded-xl border border-border shadow-sm items-center relative z-10 transition-all">
                            <button 
                                onClick={(e) => { 
                                    e.stopPropagation(); 
                                    if (rankingMode === 'month') setIsMonthModalOpen(true);
                                    else setRankingMode('month'); 
                                }} 
                                className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all flex items-center gap-1 ${rankingMode === 'month' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:text-foreground hover:bg-card-hover'}`}
                            >
                                {rankingMode === 'month' ? (
                                    <><span>{currentDate.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).replace('.', '')}</span><ChevronDown size={10} strokeWidth={3} /></>
                                ) : 'Mês'}
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); setRankingMode('all'); }} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${rankingMode === 'all' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:text-foreground hover:bg-card-hover'}`}>Total</button>
                        </div>
                    </div>

                    <div className="divide-y divide-border">
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
                                        className="flex items-center gap-3 py-4 px-1 cursor-pointer active:bg-card-hover transition-colors group"
                                    >
                                        <div className={`p-2.5 rounded-xl ${catInfo.bg} shrink-0`}>
                                            <Icon size={18} className={catInfo.color} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1.5">
                                                <h4 className="text-xs font-bold text-foreground uppercase tracking-wide truncate">{catInfo.label}</h4>
                                                <span className="text-sm font-bold text-foreground shrink-0 ml-3">{amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
                                                <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${percent}%` }}></div>
                                            </div>
                                        </div>
                                        <ArrowUpRight size={14} className="text-gray-400 group-hover:text-blue-500 transition-colors shrink-0" />
                                    </div>
                                );
                            })
                        ) : (
                            <div className="py-16 text-center text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] opacity-50">Sem movimentação</div>
                        )}
                    </div>
                </div>
            )}

            {/* ABA MAIORES DESPESAS */}
            {activeTab === 'expenses' && (
                <div className="bg-card-alt p-6 rounded-[2.5rem] border border-border shadow-md animate-in fade-in slide-in-from-bottom-2">
                    <h3 className="text-xs font-black text-foreground uppercase tracking-widest flex items-center gap-2 mb-8">
                        <TrendingDown size={18} className="text-red-500" /> Maiores Despesas Únicas
                    </h3>
                    <div className="space-y-3">
                        {data.topExpensesList.length > 0 ? data.topExpensesList.map(item => {
                            const catInfo = getCategory(item.category);
                            const Icon = catInfo.icon;
                            const isExpanded = expandedExpense === item.id;
                            
                            return (
                                <div key={item.id} onClick={() => setExpandedExpense(isExpanded ? null : item.id)} className={`relative flex flex-col p-4 bg-card rounded-[1.5rem] border transition-all cursor-pointer ${isExpanded ? 'border-blue-500 shadow-md ring-1 ring-blue-500/20' : 'border-border hover:border-blue-500 hover:shadow-sm'}`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4 truncate">
                                            <div className={`p-3 rounded-2xl ${catInfo.bg} text-blue-500 border border-border/10`}><Icon size={18} className={catInfo.color} /></div>
                                            <div className="flex flex-col truncate">
                                                <span className="text-sm font-black text-foreground truncate tracking-tight mb-0.5 max-w-[130px] sm:max-w-[180px]">{item.name.replace(/\s*\(\d+\/\d+\)\s*$/, '')}</span>
                                                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{catInfo.label}</span>
                                            </div>
                                        </div>
                                        <span className="text-base font-black text-foreground shrink-0 ml-4">
                                            {Number(item.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </span>
                                    </div>

                                    {/* Accordion Context */}
                                    {isExpanded && (
                                        <div className="mt-4 pt-4 border-t border-border flex flex-col gap-2 animate-in fade-in slide-in-from-top-2">
                                            <div className="flex justify-between items-center text-[11px] text-gray-500">
                                                <span className="font-bold uppercase tracking-wider">Data do Registro:</span>
                                                <span className="text-foreground font-black bg-card-hover px-2 py-1 rounded-md border border-border">
                                                    {new Date(item.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center text-[11px] text-gray-500">
                                                <span className="font-bold uppercase tracking-wider">Status:</span>
                                                <span className={`font-black px-2 py-1 rounded-md ${item.is_paid ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                                    {item.is_paid ? 'Pago' : 'Pendente'}
                                                </span>
                                            </div>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); navigate('/add', { state: { transaction: item } })}} 
                                                className="mt-2 py-2 w-full rounded-xl bg-blue-600/10 border border-blue-500/20 text-[10px] font-black text-blue-500 hover:bg-blue-600/20 uppercase tracking-widest active:scale-95 transition-all"
                                            >
                                                Editar Despesa
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )
                        }) : (
                             <div className="py-16 text-center text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] opacity-50">Sem movimentação</div>
                        )}
                    </div>
                </div>
            )}
        </>
      )}

      {/* Modal Independente de Seleção de Mês */}
      <MonthPickerModal isOpen={isMonthModalOpen} onClose={() => setIsMonthModalOpen(false)} currentDate={currentDate} onSelectDate={setCurrentDate} />

    </div>
  );
}