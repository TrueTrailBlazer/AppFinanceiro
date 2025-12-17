import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { SummaryCard } from '../components/ui/SummaryCard';
import { TrendingUp, TrendingDown, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Home() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estado para controlar o mês atual (Data baseada no dia 1 do mês)
  const [currentDate, setCurrentDate] = useState(newqhDate());

  // Função para navegar entre meses
  const changeMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  // Formata o título do mês (ex: "Janeiro 2024")
  const monthTitle = useMemo(() => {
    return currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  }, [currentDate]);

  function newqhDate() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  useEffect(() => {
    if (!user) return;

    const fetchMonthData = async () => {
      setLoading(true);
      
      // Calcular primeiro e último dia do mês selecionado
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59).toISOString();

      const { data } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', startOfMonth)
        .lte('created_at', endOfMonth)
        .order('created_at', { ascending: false });

      if (data) setTransactions(data);
      setLoading(false);
    };

    fetchMonthData();
  }, [user, currentDate]);

  const summary = useMemo(() => {
    const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount), 0);
    const expense = transactions.filter(t => t.type !== 'income').reduce((acc, t) => acc + Number(t.amount), 0);
    const balance = income - expense;
    return { income, expense, balance };
  }, [transactions]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* --- SELETOR DE MÊS (NAV SUPERIOR) --- */}
      <div className="flex items-center justify-between bg-[#121212] p-2 rounded-2xl border border-[#222]">
        <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-[#222] rounded-xl transition-colors">
          <ChevronLeft className="text-gray-400" />
        </button>
        
        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-blue-500" />
          <span className="font-bold text-lg capitalize text-white">{monthTitle}</span>
        </div>

        <button onClick={() => changeMonth(1)} className="p-2 hover:bg-[#222] rounded-xl transition-colors">
          <ChevronRight className="text-gray-400" />
        </button>
      </div>

      {/* --- CARDS DE RESUMO --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card de Sobra (Destaque) */}
        <div className={`md:col-span-2 p-6 rounded-3xl border transition-all flex flex-col justify-center items-center gap-2
          ${summary.balance >= 0 
            ? 'bg-gradient-to-br from-green-900/20 to-green-900/5 border-green-500/30' 
            : 'bg-gradient-to-br from-red-900/20 to-red-900/5 border-red-500/30'
          }`}>
          <span className="text-sm font-medium text-gray-400 uppercase tracking-widest">Sobra do Mês</span>
          <h2 className={`text-4xl font-bold ${summary.balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {Number(summary.balance).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </h2>
        </div>

        <SummaryCard title="Entradas" value={summary.income} type="highlight" />
        <SummaryCard title="Gastos Totais" value={summary.expense} type="danger" />
      </div>

      {/* --- LISTA RESUMIDA DO MÊS --- */}
      <div className="space-y-4 pt-2">
        <h3 className="font-bold text-gray-400 text-sm uppercase tracking-wider ml-1">Movimentações de {currentDate.toLocaleString('pt-BR', { month: 'long' })}</h3>

        <div className="space-y-3">
          {loading ? (
             <div className="text-center py-10 text-gray-600 animate-pulse">Carregando mês...</div>
          ) : transactions.length > 0 ? (
            transactions.map(t => (
              <div key={t.id} className="flex justify-between items-center p-4 bg-[#121212] border border-[#222] rounded-2xl">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className={`p-2.5 rounded-full shrink-0 ${t.type === 'income' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                    {t.type === 'income' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-white truncate text-base">{t.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{new Date(t.created_at).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'})}</p>
                  </div>
                </div>
                <span className={`font-bold whitespace-nowrap ml-2 ${t.type === 'income' ? 'text-green-400' : 'text-white'}`}>
                  {t.type === 'income' ? '+ ' : '- '}
                  {Number(t.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
            ))
          ) : (
            <div className="text-center py-12 border border-dashed border-[#222] rounded-2xl">
              <p className="text-gray-500 mb-2">Nada por aqui neste mês.</p>
              <Link to="/add" className="text-blue-500 font-bold text-sm hover:underline">Adicionar gasto agora</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}