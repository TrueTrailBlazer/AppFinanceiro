import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../services/supabase.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { SummaryCard } from '../components/ui/SummaryCard.jsx';
import { ChevronLeft, ChevronRight, Calendar, TrendingUp, TrendingDown } from 'lucide-react';
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

  const fetchMonthData = async () => {
    // Só mostra loading se não tiver nada na tela para evitar piscar
    if(transactions.length === 0) setLoading(true);
    
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
    if (!user) return;

    fetchMonthData();

    // --- ATUALIZAÇÃO EM TEMPO REAL ---
    // Isso é crucial para a edição funcionar: Ouve mudanças no banco e atualiza a tela
    const channel = supabase
      .channel('home-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${user.id}` }, 
        () => fetchMonthData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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

  // Pega apenas as 3 últimas para a Home
  const recentTransactions = transactions.slice(0, 3);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-32 md:pb-0">
      
      {/* --- SELETOR DE MÊS --- */}
      <div className="fixed bottom-[90px] left-0 right-0 px-4 z-40 md:static md:z-0 md:px-0 md:mb-6">
        <div className="max-w-3xl md:max-w-none mx-auto">
          <div className="flex items-center justify-between bg-[#1a1a1a]/95 backdrop-blur-md py-2 px-4 rounded-2xl border border-[#333] shadow-2xl shadow-black md:bg-transparent md:border-0 md:shadow-none md:p-0 md:backdrop-blur-none">
            <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-[#333] rounded-xl text-gray-300 md:hover:bg-[#1a1a1a]">
              <ChevronLeft size={22} />
            </button>
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-blue-500 md:w-5 md:h-5" />
              <span className="font-bold text-lg capitalize text-white md:text-2xl">{monthTitle}</span>
            </div>
            <button onClick={() => changeMonth(1)} className="p-2 hover:bg-[#333] rounded-xl text-gray-300 md:hover:bg-[#1a1a1a]">
              <ChevronRight size={22} />
            </button>
          </div>
        </div>
      </div>

      {/* --- CARDS (Aumentados) --- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        
        {/* Card de Sobra (Bem maior) */}
        <div className={`col-span-2 md:col-span-2 p-6 rounded-3xl border flex flex-col justify-center gap-2 min-h-[160px] shadow-xl relative overflow-hidden
          ${summary.balance >= 0 
            ? 'bg-gradient-to-br from-green-900/30 to-[#050505] border-green-500/30' 
            : 'bg-gradient-to-br from-red-900/30 to-[#050505] border-red-500/30'
          }`}>
          
          <div className="flex justify-between items-start z-10">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Sobra do Mês</p>
            <div className={`text-[10px] px-2 py-1 rounded-full font-bold border ${summary.balance >= 0 ? 'border-green-500/40 text-green-400 bg-green-500/10' : 'border-red-500/40 text-red-400 bg-red-500/10'}`}>
              {summary.balance >= 0 ? 'Positivo' : 'Negativo'}
            </div>
          </div>
          
          <h2 className={`text-5xl font-bold tracking-tight z-10 mt-1 ${summary.balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {Number(summary.balance).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </h2>

          {/* Efeito visual de fundo */}
          <div className={`absolute -bottom-10 -right-10 w-40 h-40 rounded-full blur-[60px] z-0 ${summary.balance >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'}`} />
        </div>

        {/* Card Entradas */}
        <div className="col-span-1 md:col-span-1 p-5 rounded-3xl border border-blue-500/20 bg-blue-900/10 flex flex-col justify-between min-h-[130px]">
          <p className="text-[10px] font-bold uppercase tracking-wider text-blue-300 opacity-70">Entradas</p>
          <h3 className="text-xl md:text-2xl font-bold text-blue-400 truncate">
            {Number(summary.income).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </h3>
        </div>

        {/* Card Saídas */}
        <div className="col-span-1 md:col-span-1 p-5 rounded-3xl border border-red-500/20 bg-red-900/10 flex flex-col justify-between min-h-[130px]">
          <p className="text-[10px] font-bold uppercase tracking-wider text-red-300 opacity-70">Saídas</p>
          <h3 className="text-xl md:text-2xl font-bold text-red-400 truncate">
            {Number(summary.expense).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </h3>
        </div>
      </div>

      {/* --- ÚLTIMOS LANÇAMENTOS (Apenas 3) --- */}
      <div className="space-y-3 pt-4">
        <div className="flex justify-between items-end px-1">
          <h3 className="font-bold text-gray-400 text-sm uppercase tracking-wider">Últimos Lançamentos</h3>
          <Link to="/extract" className="text-xs font-bold text-blue-500 hover:text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-lg transition-colors">
            Ver Extrato Completo
          </Link>
        </div>

        <div className="space-y-2">
          {loading && transactions.length === 0 ? (
             <div className="text-center py-10 text-xs text-gray-600 animate-pulse">Carregando...</div>
          ) : recentTransactions.length > 0 ? (
            recentTransactions.map(t => {
              const catData = getCategory(t.category);
              const CategoryIcon = catData.icon;

              return (
                <div 
                  key={t.id}
                  onClick={() => handleEdit(t)}
                  className="flex justify-between items-center p-4 bg-[#121212] border border-[#222] rounded-2xl active:bg-[#1a1a1a] active:scale-[0.98] transition-all cursor-pointer shadow-sm"
                >
                  <div className="flex items-center gap-4 overflow-hidden">
                    <div className={`p-3 rounded-full shrink-0 ${catData.bg}`}>
                      <CategoryIcon size={20} className={catData.color} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-white truncate text-base leading-tight">{t.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-gray-500 capitalize">{catData.label}</p>
                        <span className="text-[10px] text-gray-700">•</span>
                        <p className="text-xs text-gray-500 capitalize">{new Date(t.created_at).toLocaleDateString('pt-BR', {day: '2-digit', month: 'short'})}</p>
                      </div>
                    </div>
                  </div>
                  <span className={`font-bold text-base whitespace-nowrap ml-3 ${t.type === 'income' ? 'text-green-400' : 'text-white'}`}>
                    {t.type === 'income' ? '+ ' : '- '}
                    {Number(t.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 border border-dashed border-[#222] rounded-2xl">
              <p className="text-gray-500 text-sm mb-3">Sem movimentações recentes.</p>
              <Link to="/add" className="text-blue-500 font-bold text-sm hover:underline">Adicionar novo gasto</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}