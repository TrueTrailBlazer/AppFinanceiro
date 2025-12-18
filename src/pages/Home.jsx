import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { SummaryCard } from '../components/ui/SummaryCard';
import { SwipeableItem } from '../components/ui/SwipeableItem';
import { ChevronLeft, ChevronRight, Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getCategory } from '../utils/constants';

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
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

  useEffect(() => {
    if (user) fetchMonthData();
  }, [user, currentDate]);

  const summary = useMemo(() => {
    const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount), 0);
    const expense = transactions.filter(t => t.type !== 'income').reduce((acc, t) => acc + Number(t.amount), 0);
    const balance = income - expense;
    return { income, expense, balance };
  }, [transactions]);

  const handleEdit = (transaction) => {
    navigate('/add', { state: { transaction } });
  };

  const handleDelete = async (id) => {
    if (confirm('Excluir esta transação?')) {
      await supabase.from('transactions').delete().eq('id', id);
      fetchMonthData();
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500 pb-28 md:pb-0">
      
      {/* SELETOR DE MÊS (Compacto) */}
      <div className="fixed bottom-[90px] left-0 right-0 px-4 z-40 md:static md:z-0 md:px-0 md:mb-6">
        <div className="max-w-3xl md:max-w-none mx-auto">
          <div className="flex items-center justify-between bg-[#1a1a1a]/95 backdrop-blur-md py-1.5 px-3 rounded-xl border border-[#333] shadow-xl md:bg-transparent md:border-0 md:shadow-none md:p-0">
            <button onClick={() => changeMonth(-1)} className="p-1.5 hover:bg-[#333] rounded-lg text-gray-300 md:hover:bg-[#1a1a1a]">
              <ChevronLeft size={18} />
            </button>
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-blue-500 md:w-5 md:h-5" />
              <span className="font-bold text-sm capitalize text-white md:text-xl">{monthTitle}</span>
            </div>
            <button onClick={() => changeMonth(1)} className="p-1.5 hover:bg-[#333] rounded-lg text-gray-300 md:hover:bg-[#1a1a1a]">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* CARDS (Layout Otimizado) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
        {/* Sobra */}
        <div className={`col-span-2 md:col-span-2 p-4 rounded-2xl border flex justify-between items-center shadow-lg
          ${summary.balance >= 0 
            ? 'bg-gradient-to-r from-green-900/20 to-[#0a0a0a] border-green-500/20' 
            : 'bg-gradient-to-r from-red-900/20 to-[#0a0a0a] border-red-500/20'
          }`}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Sobra</p>
            <h2 className={`text-2xl font-bold tracking-tight ${summary.balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {Number(summary.balance).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </h2>
          </div>
          <div className={`text-[9px] px-2 py-0.5 rounded border font-semibold ${summary.balance >= 0 ? 'border-green-500/30 text-green-500' : 'border-red-500/30 text-red-500'}`}>
            {summary.balance >= 0 ? 'Positivo' : 'Negativo'}
          </div>
        </div>

        <SummaryCard title="Entradas" value={summary.income} type="highlight" />
        <SummaryCard title="Saídas" value={summary.expense} type="danger" />
      </div>

      {/* LISTA COMPACTA */}
      <div className="space-y-2 pt-1">
        <div className="flex justify-between items-end px-1">
          <h3 className="font-bold text-gray-500 text-[10px] uppercase tracking-wider">Histórico</h3>
          <Link to="/extract" className="text-[10px] text-blue-500 hover:text-blue-400">Ver tudo</Link>
        </div>

        <div className="space-y-2">
          {loading ? (
             <div className="text-center py-6 text-xs text-gray-600 animate-pulse">Carregando...</div>
          ) : transactions.length > 0 ? (
            transactions.map(t => {
              const catData = getCategory(t.category);
              const CategoryIcon = catData.icon;

              return (
                <SwipeableItem 
                  key={t.id}
                  onEdit={() => handleEdit(t)}
                  onDelete={() => handleDelete(t.id)}
                >
                  <div className="flex justify-between items-center p-3">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className={`p-2 rounded-full shrink-0 ${catData.bg}`}>
                        <CategoryIcon size={16} className={catData.color} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-white truncate text-sm leading-tight">{t.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <p className="text-[10px] text-gray-500 capitalize">{catData.label}</p>
                          <span className="text-[8px] text-gray-700">•</span>
                          <p className="text-[10px] text-gray-500 capitalize">{new Date(t.created_at).toLocaleDateString('pt-BR', {day: '2-digit', month: 'short'})}</p>
                        </div>
                      </div>
                    </div>
                    <span className={`font-bold text-sm whitespace-nowrap ml-2 ${t.type === 'income' ? 'text-green-400' : 'text-white'}`}>
                      {t.type === 'income' ? '+ ' : '- '}
                      {Number(t.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                </SwipeableItem>
              );
            })
          ) : (
            <div className="text-center py-8 border border-dashed border-[#222] rounded-xl">
              <p className="text-gray-500 text-xs mb-2">Vazio por aqui.</p>
              <Link to="/add" className="text-blue-500 font-bold text-xs bg-blue-500/10 px-3 py-1 rounded">Adicionar</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}