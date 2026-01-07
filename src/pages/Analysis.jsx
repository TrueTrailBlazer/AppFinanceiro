import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext.jsx';
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, Award } from 'lucide-react';
import { getCategory, CATEGORIES } from '../utils/constants';

export default function Analysis() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(6); // Analisar últimos 6 meses

  useEffect(() => {
    if (!user) return;
    const fetchAll = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true }); // Ordem crescente para gráficos temporais
      if (data) setTransactions(data);
      setLoading(false);
    };
    fetchAll();
  }, [user]);

  // --- Processamento de Dados ---
  const data = useMemo(() => {
    // 1. Agrupar por Mês (Últimos X meses)
    const months = {};
    const now = new Date();
    
    // Inicializa os últimos 6 meses vazios para garantir que apareçam no gráfico
    for (let i = period - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}`;
        const label = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.','');
        months[key] = { label, income: 0, expense: 0, balance: 0 };
    }

    // Preenche com transações
    transactions.forEach(t => {
        const d = new Date(t.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}`;
        if (months[key]) {
            if (t.type === 'income') months[key].income += t.amount;
            else months[key].expense += t.amount;
        }
    });

    const monthList = Object.values(months);

    // 2. Agrupar por Categoria (Todas as transações carregadas)
    const categories = {};
    let totalExpense = 0;
    
    transactions.forEach(t => {
        if(t.type !== 'income') {
            const cat = t.category || 'others';
            if(!categories[cat]) categories[cat] = 0;
            categories[cat] += t.amount;
            totalExpense += t.amount;
        }
    });

    const categoryList = Object.entries(categories)
        .map(([key, value]) => ({ key, value, percent: (value/totalExpense)*100 }))
        .sort((a, b) => b.value - a.value); // Ordernar maior gasto

    // 3. Cálculos de KPI
    const totalSaved = transactions.reduce((acc, t) => acc + (t.type === 'income' ? t.amount : -t.amount), 0);
    const avgSavingsRate = monthList.reduce((acc, m) => {
        if(m.income === 0) return acc;
        return acc + ((m.income - m.expense) / m.income);
    }, 0) / (monthList.filter(m => m.income > 0).length || 1) * 100;

    return { monthList, categoryList, totalSaved, avgSavingsRate };
  }, [transactions, period]);

  const maxChartValue = Math.max(...data.monthList.map(m => Math.max(m.income, m.expense)), 100);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-24">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-white">Análise Financeira</h1>
        <select 
            value={period} onChange={e => setPeriod(Number(e.target.value))}
            className="bg-[#121212] border border-[#222] text-xs text-gray-400 rounded-lg px-2 py-1 outline-none"
        >
            <option value={3}>3 Meses</option>
            <option value={6}>6 Meses</option>
            <option value={12}>1 Ano</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-20 text-xs text-gray-500 animate-pulse">Calculando métricas...</div>
      ) : (
        <>
            {/* --- KPIs --- */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#121212] p-4 rounded-2xl border border-[#222] relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-10"><Wallet size={40} className="text-blue-500"/></div>
                    <p className="text-[10px] uppercase font-bold text-gray-500">Patrimônio Acumulado</p>
                    <h3 className="text-xl font-bold text-white mt-1">
                        {data.totalSaved.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </h3>
                </div>
                <div className="bg-[#121212] p-4 rounded-2xl border border-[#222] relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-10"><Award size={40} className="text-yellow-500"/></div>
                    <p className="text-[10px] uppercase font-bold text-gray-500">Taxa de Poupança</p>
                    <h3 className={`text-xl font-bold mt-1 ${data.avgSavingsRate > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {data.avgSavingsRate.toFixed(1)}%
                    </h3>
                </div>
            </div>

            {/* --- GRÁFICO DE BARRAS (Histórico) --- */}
            <div className="bg-[#121212] p-5 rounded-2xl border border-[#222]">
                <h3 className="text-sm font-bold text-gray-300 mb-6 flex items-center gap-2">
                    <TrendingUp size={16} className="text-blue-500"/> Fluxo de Caixa
                </h3>
                
                {/* Container do Gráfico */}
                <div className="flex items-end justify-between gap-2 h-40 pt-2">
                    {data.monthList.map((m, i) => (
                        <div key={i} className="flex flex-col items-center gap-2 flex-1 group">
                            <div className="flex gap-1 items-end w-full justify-center h-full relative">
                                {/* Barra Receita */}
                                <div 
                                    className="w-1.5 md:w-3 bg-blue-600 rounded-t-sm transition-all group-hover:bg-blue-500"
                                    style={{ height: `${(m.income / maxChartValue) * 100}%` }}
                                ></div>
                                {/* Barra Despesa */}
                                <div 
                                    className="w-1.5 md:w-3 bg-red-600 rounded-t-sm transition-all group-hover:bg-red-500"
                                    style={{ height: `${(m.expense / maxChartValue) * 100}%` }}
                                ></div>
                            </div>
                            <span className="text-[9px] uppercase font-bold text-gray-500">{m.label}</span>
                        </div>
                    ))}
                </div>
                
                {/* Legenda */}
                <div className="flex justify-center gap-4 mt-4">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        <span className="text-[10px] text-gray-400">Entradas</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                        <span className="text-[10px] text-gray-400">Saídas</span>
                    </div>
                </div>
            </div>

            {/* --- RANKING DE CATEGORIAS --- */}
            <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-300 px-1">Onde você gasta mais?</h3>
                {data.categoryList.map(cat => {
                    const catInfo = getCategory(cat.key);
                    const Icon = catInfo.icon;
                    return (
                        <div key={cat.key} className="bg-[#121212] p-3 rounded-xl border border-[#222] flex items-center gap-3 relative overflow-hidden">
                            {/* Barra de Fundo Proporcional */}
                            <div 
                                className="absolute left-0 top-0 bottom-0 bg-red-900/10 pointer-events-none" 
                                style={{ width: `${cat.percent}%` }}
                            />

                            <div className={`p-2 rounded-lg shrink-0 ${catInfo.bg} z-10`}>
                                <Icon size={16} className={catInfo.color} />
                            </div>
                            <div className="flex-1 z-10">
                                <div className="flex justify-between items-center mb-0.5">
                                    <span className="text-xs font-bold text-gray-200 capitalize">{catInfo.label}</span>
                                    <span className="text-xs font-bold text-white">
                                        {cat.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </span>
                                </div>
                                <div className="w-full bg-[#222] h-1 rounded-full overflow-hidden">
                                    <div className="bg-red-500 h-full" style={{ width: `${cat.percent}%` }}></div>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </>
      )}
    </div>
  );
}