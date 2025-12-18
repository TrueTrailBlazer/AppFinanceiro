import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../services/supabase.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { SummaryCard } from '../components/ui/SummaryCard.jsx';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getCategory } from '../utils/constants.jsx';

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

  // Função para abrir a edição
  const handleEdit = (transaction) => {
    navigate('/add', { state: { transaction } });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-40 md:pb-0">
      
      {/* --- SELETOR DE MÊS --- */}
      <div className="fixed bottom-[110px] left-0 right-0 px-4 z-40 md:static md:z-0 md:px-0 md:mb-8">
        <div className="max-w-3xl md:max-w-none mx-auto">
          <div className="flex items-center justify-between bg-[#1a1a1a]/95 backdrop-blur-md py-2 px-3 rounded-2xl border border-[#333] shadow-2xl shadow-black md:bg-transparent md:border-0 md:shadow-none md:p-0 md:backdrop-blur-none">
            <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-[#333] rounded-xl text-gray-300 active:scale-90 transition-all md:hover:bg-[#1a1a1a]">
              <ChevronLeft size={22} />
            </button>
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-blue-500 md:w-5 md:h-5" />
              <span className="font-bold text-base capitalize text-white md:text-2xl">{monthTitle}</span>
            </div>
            <button onClick={() => changeMonth(1)} className="p-2 hover:bg-[#333] rounded-xl text-gray-300 active:scale-90 transition-all md:hover:bg-[#1a1a1a]">
              <ChevronRight size={22} />
            </button>
          </div>
        </div>
      </div>

      {/* --- CARDS --- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card de Sobra */}
        <div className={`col-span-2 md:col-span-2 p-6 rounded-2xl border flex justify-between items-center min-h-[120px] shadow-lg
          ${summary.balance >= 0 
            ? 'bg-gradient-to-br from-green-900/20 to-black border-green-500/30 shadow-green-900/10' 
            : 'bg-gradient-to-br from-red-900/20 to-black border-red-500/30 shadow-red-900/10'
          }`}>
          <div className="flex flex-col gap-1">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Sobra do Mês</p>
            <h2 className={`text-4xl font-bold tracking-tight ${summary.balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {Number(summary.balance).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </h2>
          </div>
          <div className={`text-xs px-3 py-1.5 rounded-full font-bold border ${summary.balance >= 0 ? 'border-green-500/30 text-green-500 bg-green-500/10' : 'border-red-500/30 text-red-500 bg-red-500/10'}`}>
            {summary.balance >= 0 ? 'Positivo' : 'Negativo'}
          </div>
        </div>

        <SummaryCard title="Entradas" value={summary.income} type="highlight" />
        <SummaryCard title="Saídas" value={summary.expense} type="danger" />
      </div>

      {/* --- LISTA RESUMIDA --- */}
      <div className="space-y-3 pt-2">
        <div className="flex justify-between items-end px-1">
          <h3 className="font-bold text-gray-400 text-sm uppercase tracking-wider">Histórico</h3>
          <Link to="/extract" className="text-xs text-blue-500 hover:text-blue-400 font-medium">Ver tudo</Link>
        </div>

        <div className="space-y-2.5">
          {loading ? (
             <div className="text-center py-10 text-xs text-gray-600 animate-pulse">Carregando...</div>
          ) : transactions.length > 0 ? (
            transactions.map(t => {
              const CategoryIcon = getCategory(t.category).icon;
              const categoryColor = getCategory(t.category).color;
              const categoryBg = getCategory(t.category).bg;

              return (
                <div 
                  key={t.id} 
                  onClick={() => handleEdit(t)}
                  className="flex justify-between items-center p-4 bg-[#121212] border border-[#222] rounded-2xl hover:border-gray-600 hover:bg-[#1a1a1a] transition-all cursor-pointer active:scale-[0.99]"
                >
                  <div className="flex items-center gap-4 overflow-hidden">
                    <div className={`p-3 rounded-full shrink-0 ${categoryBg}`}>
                      <CategoryIcon size={20} className={categoryColor} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-white truncate text-base">{t.name}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-gray-500 capitalize">{getCategory(t.category).label}</p>
                        <span className="text-[10px] text-gray-600">•</span>
                        <p className="text-[10px] text-gray-600 capitalize">{new Date(t.created_at).toLocaleDateString('pt-BR', {day: '2-digit', month: 'short'})}</p>
                      </div>
                    </div>
                  </div>
                  <span className={`font-bold text-base whitespace-nowrap ml-4 ${t.type === 'income' ? 'text-green-400' : 'text-white'}`}>
                    {t.type === 'income' ? '+ ' : '- '}
                    {Number(t.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 border border-dashed border-[#222] rounded-2xl">
              <p className="text-gray-500 text-sm mb-3">Sem movimentações.</p>
              <Link to="/add" className="text-blue-500 font-bold text-sm hover:underline bg-blue-500/10 px-4 py-2 rounded-lg">Adicionar primeira transação</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}