import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { TrendingUp, TrendingDown, Wallet, Award, Calendar, ChevronDown } from 'lucide-react';
import { getCategory } from '../utils/constants';

export default function Analysis() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(6);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(null);
  const [isPeriodOpen, setIsPeriodOpen] = useState(false);

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
            .order('created_at', { ascending: true }); // Crescente para o gráfico
        
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

  // --- Processamento ---
  const data = useMemo(() => {
    if (!transactions || transactions.length === 0) return null;

    // 1. Agrupar por Mês
    const months = {};
    const now = new Date();
    
    // Cria chaves para os últimos X meses (garante que meses vazios apareçam)
    for (let i = period - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}`;
        // Formata como Jan, Fev, Mar...
        const label = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.','');
        months[key] = { label, income: 0, expense: 0 };
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

    // 2. Top Maiores Gastos (Transações Individuais)
    const topExpensesList = transactions
        .filter(t => t.type !== 'income')
        .sort((a, b) => Number(b.amount) - Number(a.amount))
        .slice(0, 5);

    const maxTopExpenseValue = Math.max(...topExpensesList.map(t => Number(t.amount)), 1);

    // 3. KPIs
    const totalSaved = transactions.reduce((acc, t) => acc + (t.type === 'income' ? Number(t.amount) : -Number(t.amount)), 0);
    
    // Média de Poupança (evita divisão por zero)
    let savingsRateSum = 0;
    let validMonths = 0;
    monthList.forEach(m => {
        if(m.income > 0) {
            savingsRateSum += ((m.income - m.expense) / m.income);
            validMonths++;
        }
    });
    const avgSavingsRate = validMonths > 0 ? (savingsRateSum / validMonths) * 100 : 0;

    return { monthList, topExpensesList, maxTopExpenseValue, totalSaved, avgSavingsRate };
  }, [transactions, period]);

  // Se não houver dados
  if (!loading && (!data || transactions.length === 0)) {
      return (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <p>Adicione transações para ver a análise.</p>
          </div>
      );
  }

  const maxChartValue = data ? Math.max(...data.monthList.map(m => Math.max(m.income, m.expense)), 100) : 100;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-24">
      <div className="flex justify-between items-center px-1">
        <h1 className="text-xl font-bold text-white">Análise</h1>
        
        {/* Dropdown de Período */}
        <div className="relative z-50">
          <button
            onClick={() => setIsPeriodOpen(!isPeriodOpen)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border transition-all active:scale-95 ${
              isPeriodOpen ? 'bg-blue-600 border-blue-600 text-white' : 'bg-[#121212] border-[#222] text-gray-400 hover:text-white'
            }`}
          >
            <Calendar size={14} />
            <span className="text-xs font-bold">{activePeriodLabel}</span>
            <ChevronDown size={14} className={`transition-transform ${isPeriodOpen ? 'rotate-180' : ''}`} />
          </button>

          {isPeriodOpen && (
            <div className="absolute top-full right-0 mt-2 w-36 bg-[#1a1a1a] border border-[#222] rounded-xl shadow-2xl p-1.5 flex flex-col gap-1 animate-in slide-in-from-top-2 duration-200">
              {periodOptions.map(opt => (
                <button
                  key={opt.val}
                  onClick={() => { setPeriod(opt.val); setSelectedMonthIndex(null); setIsPeriodOpen(false); }}
                  className={`text-left px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                    period === opt.val ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-[#222] hover:text-white'
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
        <div className="text-center py-20 text-xs text-gray-500 animate-pulse">Calculando...</div>
      ) : (
        <>
            {/* --- KPIs --- */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#121212] p-4 rounded-2xl border border-[#222] relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-10"><Wallet size={40} className="text-blue-500"/></div>
                    <p className="text-[10px] uppercase font-bold text-gray-500">Saldo Acumulado</p>
                    <h3 className={`text-lg font-bold mt-1 ${data.totalSaved >= 0 ? 'text-white' : 'text-red-400'}`}>
                        {data.totalSaved.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </h3>
                </div>
                <div className="bg-[#121212] p-4 rounded-2xl border border-[#222] relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-10"><Award size={40} className="text-yellow-500"/></div>
                    <p className="text-[10px] uppercase font-bold text-gray-400">Taxa de Poupança (Média)</p>
                    <h3 className={`text-lg font-bold mt-1 ${data.avgSavingsRate > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {data.avgSavingsRate.toFixed(1)}%
                    </h3>
                </div>
            </div>

            {/* --- Desktop Grid para Gráfico + Ranking --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* --- GRÁFICO --- */}
                <div className="bg-[#121212] p-5 rounded-2xl border border-[#222] h-fit shadow-lg">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-sm font-bold text-gray-300 flex items-center gap-2">
                            <TrendingUp size={16} className="text-blue-500"/> Receitas vs. Despesas
                        </h3>
                        <div className="flex items-center gap-3 text-[10px] font-bold text-gray-500 uppercase">
                            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-600"></div> Receitas</div>
                            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-600"></div> Despesas</div>
                        </div>
                    </div>
                    
                    <div className="flex items-end justify-between gap-1 h-48 pt-8 pb-1 relative mt-4">
                        {data.monthList.map((m, i) => (
                            <div 
                              key={i} 
                              onClick={() => setSelectedMonthIndex(selectedMonthIndex === i ? null : i)}
                              className="flex flex-col items-center flex-1 group h-full justify-end cursor-pointer relative"
                            >
                                {/* Tooltip */}
                                {selectedMonthIndex === i && (
                                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-[#1a1a1a] border border-[#333] text-white text-[9px] whitespace-nowrap px-2.5 py-2 rounded-xl shadow-2xl z-30 animate-in zoom-in-95 fade-in duration-200">
                                    <div className="flex flex-col gap-1 items-center">
                                      <span className="text-green-400 font-bold">+ {m.income.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}</span>
                                      <span className="text-red-400 font-bold">- {m.expense.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}</span>
                                      <span className="text-[8px] text-gray-500 border-t border-[#333] pt-1 mt-0.5">Saldo: {(m.income - m.expense).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}</span>
                                    </div>
                                    <div className="absolute -bottom-[5px] left-1/2 -translate-x-1/2 border-l-[5px] border-r-[5px] border-t-[5px] border-l-transparent border-r-transparent border-t-[#333] w-0 h-0"></div>
                                  </div>
                                )}

                                <div className="flex gap-[3px] items-end justify-center w-full h-full">
                                    {/* Barra Receita */}
                                    <div 
                                        className={`w-3 md:w-5 rounded-t transition-all duration-300 min-h-[4px] ${selectedMonthIndex !== null && selectedMonthIndex !== i ? 'bg-blue-600/20' : 'bg-blue-600 group-hover:bg-blue-500 group-hover:shadow-[0_0_12px_rgba(37,99,235,0.3)]'} ${selectedMonthIndex === i ? 'bg-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.4)]' : ''}`}
                                        style={{ height: `${Math.max((m.income / maxChartValue) * 100, 2)}%` }}
                                    ></div>
                                    {/* Barra Despesa */}
                                    <div 
                                        className={`w-3 md:w-5 rounded-t transition-all duration-300 min-h-[4px] ${selectedMonthIndex !== null && selectedMonthIndex !== i ? 'bg-red-600/20' : 'bg-red-600 group-hover:bg-red-500 group-hover:shadow-[0_0_12px_rgba(220,38,38,0.3)]'} ${selectedMonthIndex === i ? 'bg-red-500 shadow-[0_0_15px_rgba(220,38,38,0.4)]' : ''}`}
                                        style={{ height: `${Math.max((m.expense / maxChartValue) * 100, 2)}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {/* Legenda Meses */}
                    <div className="flex justify-between mt-3 px-1">
                         {data.monthList.map((m, i) => (
                             <span key={i} className={`text-[9px] md:text-[10px] uppercase font-bold w-full text-center transition-colors ${selectedMonthIndex === i ? 'text-white' : 'text-gray-500'}`}>
                                {m.label}
                             </span>
                         ))}
                    </div>
                </div>

                {/* --- RANKING --- */}
                <div className="space-y-3 p-4 bg-[#121212]/30 md:bg-transparent rounded-2xl">
                    <h3 className="text-sm font-bold text-gray-300 px-1 flex items-center gap-2">
                        <TrendingDown size={18} className="text-red-500" />
                        Maiores Gastos
                    </h3>
                    {data.topExpensesList.map(item => {
                        const catInfo = getCategory(item.category);
                        const Icon = catInfo.icon;
                        const amount = Number(item.amount);
                        const percent = (amount / data.maxTopExpenseValue) * 100;
                        
                        return (
                            <div key={item.id} className="bg-[#121212] p-3 rounded-xl border border-[#222] flex items-center gap-3 relative overflow-hidden transition-colors hover:border-[#333]">
                                <div 
                                    className="absolute left-0 top-0 bottom-0 bg-red-900/10 pointer-events-none transition-all duration-1000" 
                                    style={{ width: `${percent}%` }}
                                />
                                <div className={`p-2.5 rounded-lg shrink-0 ${catInfo.bg} z-10 border border-[#222]`}>
                                    <Icon size={16} className={catInfo.color} />
                                </div>
                                <div className="flex-1 z-10">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs font-bold text-gray-200 truncate pr-2">{item.name}</span>
                                        <span className="text-sm font-bold text-white shrink-0">
                                            {amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                         <span className="text-[10px] text-gray-500 font-medium">
                                            {new Date(item.created_at).toLocaleDateString('pt-BR', {day: '2-digit', month: 'short'})}
                                         </span>
                                         <span className="text-[9px] bg-[#222] text-gray-400 px-1.5 py-0.5 rounded capitalize font-medium">{catInfo.label}</span>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </>
      )}
    </div>
  );
}