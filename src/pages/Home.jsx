import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext.jsx';
import { SummaryCard } from '../components/ui/SummaryCard.jsx';
import { TrendingUp, TrendingDown, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Home() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [currentDate, setCurrentDate] = useState(new Date());

  const changeMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const monthTitle = useMemo(() => {
    return currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  }, [currentDate]);

  useEffect(() => {
    if (!user) return;

    const fetchMonthData = async () => {
      setLoading(true);
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
    <div className="space-y-4 animate-in fade-in duration-500">
      
      {/* --- SELETOR DE MÊS (Compacto) --- */}
      <div className="flex items-center justify-between bg-[#121212] py-1 px-2 rounded-xl border border-[#222]">
        <button onClick={() => changeMonth(-1)} className="p-1.5 hover:bg-[#222] rounded-lg text-gray-400"><ChevronLeft size={20} /></button>
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-blue-500" />
          <span className="font-bold text-sm capitalize text-white">{monthTitle}</span>
        </div>
        <button onClick={() => changeMonth(1)} className="p-1.5 hover:bg-[#222] rounded-lg text-gray-400"><ChevronRight size={20} /></button>
      </div>

      {/* --- CARDS --- */}
      <div className="grid grid-cols-2 gap-3">
        {/* Card de Sobra */}
        <div className={`col-span-2 p-4 rounded-xl border flex justify-between items-center
          ${summary.balance >= 0 
            ? 'bg-green-900/10 border-green-500/30' 
            : 'bg-red-900/10 border-red-500/30'
          }`}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Sobra do Mês</p>
            <h2 className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {Number(summary.balance).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </h2>
          </div>
          <div className={`text-xs px-2 py-1 rounded border ${summary.balance >= 0 ? 'border-green-500/30 text-green-500' : 'border-red-500/30 text-red-500'}`}>
            {summary.balance >= 0 ? 'Positivo' : 'Negativo'}
          </div>
        </div>

        <SummaryCard title="Entradas" value={summary.income} type="highlight" />
        <SummaryCard title="Saídas" value={summary.expense} type="danger" />
      </div>

      {/* --- LISTA (Compacta) --- */}
      <div className="space-y-2 pt-2">
        <h3 className="font-bold text-gray-500 text-xs uppercase tracking-wider ml-1">Histórico</h3>

        <div className="space-y-2">
          {loading ? (
             <div className="text-center py-6 text-xs text-gray-600">Carregando...</div>
          ) : transactions.length > 0 ? (
            transactions.map(t => (
              <div key={t.id} className="flex justify-between items-center p-3 bg-[#121212] border border-[#222] rounded-xl">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className={`p-1.5 rounded-full shrink-0 ${t.type === 'income' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                    {t.type === 'income' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-white truncate text-sm">{t.name}</p>
                    <p className="text-[10px] text-gray-500 capitalize">{new Date(t.created_at).toLocaleDateString('pt-BR', {day: '2-digit', month: 'short'})}</p>
                  </div>
                </div>
                <span className={`font-bold text-sm whitespace-nowrap ml-2 ${t.type === 'income' ? 'text-green-400' : 'text-white'}`}>
                  {t.type === 'income' ? '+ ' : '- '}
                  {Number(t.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
            ))
          ) : (
            <div className="text-center py-8 border border-dashed border-[#222] rounded-xl">
              <p className="text-gray-500 text-xs mb-2">Sem movimentações.</p>
              <Link to="/add" className="text-blue-500 font-bold text-xs hover:underline">Adicionar</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}