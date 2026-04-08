import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { TrendingUp, TrendingDown, Wallet, Award } from 'lucide-react';
import { getCategory } from '../utils/constants';

export default function Analysis() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(6);

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
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-white">Análise</h1>
        <select 
            value={period} onChange={e => setPeriod(Number(e.target.value))}
            className="bg-[#121212] border border-[#222] text-xs text-gray-400 rounded-lg px-2 py-1 outline-none cursor-pointer"
        >
            <option value={3}>3 Meses</option>
            <option value={6}>6 Meses</option>
            <option value={12}>1 Ano</option>
        </select>
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

            {/* --- GRÁFICO --- */}
            <div className="bg-[#121212] p-5 rounded-2xl border border-[#222]">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-bold text-gray-300 flex items-center gap-2">
                        <TrendingUp size={16} className="text-blue-500"/> Receitas vs. Despesas
                    </h3>
                    <div className="flex items-center gap-3 text-[10px] font-bold text-gray-500 uppercase">
                        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-600"></div> Receitas</div>
                        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-600"></div> Despesas</div>
                    </div>
                </div>
                
                <div className="flex items-end justify-between gap-2 h-40 pt-2 border-b border-[#222] pb-1">
                    {data.monthList.map((m, i) => (
                        <div key={i} className="flex flex-col items-center gap-2 flex-1 group h-full justify-end">
                            <div className="flex gap-1 items-end justify-center w-full h-full relative">
                                {/* Barra Receita */}
                                <div 
                                    className="w-2 md:w-4 bg-blue-600 rounded-t-sm transition-all group-hover:bg-blue-500 min-h-[4px]"
                                    style={{ height: `${(m.income / maxChartValue) * 100}%` }}
                                ></div>
                                {/* Barra Despesa */}
                                <div 
                                    className="w-2 md:w-4 bg-red-600 rounded-t-sm transition-all group-hover:bg-red-500 min-h-[4px]"
                                    style={{ height: `${(m.expense / maxChartValue) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>
                {/* Legenda Meses */}
                <div className="flex justify-between mt-2 px-1">
                     {data.monthList.map((m, i) => (
                         <span key={i} className="text-[9px] uppercase font-bold text-gray-500 w-full text-center">{m.label}</span>
                     ))}
                </div>
            </div>

            {/* --- RANKING --- */}
            <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-300 px-1">Maiores Gastos</h3>
                {data.topExpensesList.map(item => {
                    const catInfo = getCategory(item.category);
                    const Icon = catInfo.icon;
                    const amount = Number(item.amount);
                    const percent = (amount / data.maxTopExpenseValue) * 100;
                    
                    return (
                        <div key={item.id} className="bg-[#121212] p-3 rounded-xl border border-[#222] flex items-center gap-3 relative overflow-hidden">
                            <div 
                                className="absolute left-0 top-0 bottom-0 bg-red-900/10 pointer-events-none transition-all duration-1000" 
                                style={{ width: `${percent}%` }}
                            />
                            <div className={`p-2 rounded-lg shrink-0 ${catInfo.bg} z-10`}>
                                <Icon size={16} className={catInfo.color} />
                            </div>
                            <div className="flex-1 z-10">
                                <div className="flex justify-between items-center mb-0.5">
                                    <span className="text-xs font-bold text-gray-200">{item.name}</span>
                                    <span className="text-xs font-bold text-white">
                                        {amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                     <span className="text-[10px] text-gray-500">
                                        {new Date(item.created_at).toLocaleDateString('pt-BR', {day: '2-digit', month: 'short'})}
                                     </span>
                                     <span className="text-[9px] bg-[#222] text-gray-500 px-1.5 py-0.5 rounded capitalize">{catInfo.label}</span>
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