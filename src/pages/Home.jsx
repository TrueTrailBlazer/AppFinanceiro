import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { SummaryCard } from '../components/ui/SummaryCard';
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

    // Listener para atualizar a tela automaticamente ao editar
    const channel = supabase
      .channel('home-realtime')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${user.id}` }, 
        () => fetchMonthData()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
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

  const recentTransactions = transactions.slice(0, 3);

  return (
    <div className="space-y-5 animate-in fade-in duration-500 pb-32 md:pb-0">
      
      {/* Seletor de Mês (Fixo embaixo) */}
      <div className="fixed bottom-[90px] left-0 right-0 px-4 z-40 md:static md:z-0 md:px-0 md:mb-6">
        <div className="max-w-3xl md:max-w-none mx-auto">
          <div className="flex items-center justify-between bg-[#1a1a1a]/95 backdrop-blur-md py-1.5 px-3 rounded-xl border border-[#333] shadow-xl md:bg-transparent md:border-0 md:shadow-none md:p-0">
            <button onClick={() => changeMonth(-1)} className="p-1.5 hover:bg-[#333] rounded-lg text-gray-300"><ChevronLeft size={18} /></button>
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-blue-500" />
              <span className="font-bold text-sm capitalize text-white md:text-xl">{monthTitle}</span>
            </div>
            <button onClick={() => changeMonth(1)} className="p-1.5 hover:bg-[#333] rounded-lg text-gray-300"><ChevronRight size={18} /></button>
          </div>
        </div>
      </div>

      {/* Cards de Resumo (Tamanho Médio Harmonioso) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Sobra */}
        <div className={`col-span-2 md:col-span-2 p-5 rounded-2xl border flex justify-between items-center h-28 shadow-lg relative overflow-hidden
          ${summary.balance >= 0 
            ? 'bg-gradient-to-r from-green-900/20 to-[#0a0a0a] border-green-500/20' 
            : 'bg-gradient-to-r from-red-900/20 to-[#0a0a0a] border-red-500/20'
          }`}>
          <div className="z-10">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Sobra do Mês</p>
            <h2 className={`text-3xl font-bold tracking-tight ${summary.balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {Number(summary.balance).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </h2>
          </div>
          <div className={`z-10 text-[10px] px-2 py-1 rounded border font-semibold ${summary.balance >= 0 ? 'border-green-500/30 text-green-500' : 'border-red-500/30 text-red-500'}`}>
            {summary.balance >= 0 ? 'Positivo' : 'Negativo'}
          </div>
        </div>

        <SummaryCard title="Entradas" value={summary.income} type="highlight" />
        <SummaryCard title="Saídas" value={summary.expense} type="danger" />
      </div>

      {/* Lista Recente (Compacta) */}
      <div className="space-y-2 pt-2">
        <div className="flex justify-between items-end px-1">
          <h3 className="font-bold text-gray-500 text-[10px] uppercase tracking-wider">Últimos Lançamentos</h3>
          <Link to="/extract" className="text-[10px] text-blue-500 hover:text-blue-400 font-medium">Ver tudo</Link>
        </div>

        <div className="space-y-2">
          {loading && transactions.length === 0 ? (
             <div className="text-center py-6 text-xs text-gray-600 animate-pulse">Carregando...</div>
          ) : recentTransactions.length > 0 ? (
            recentTransactions.map(t => {
              const catData = getCategory(t.category);
              const CategoryIcon = catData.icon;

              return (
                <div 
                  key={t.id}
                  onClick={() => handleEdit(t)}
                  className="flex justify-between items-center p-3 bg-[#121212] border border-[#222] rounded-xl active:bg-[#1a1a1a] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`p-2.5 rounded-full shrink-0 ${catData.bg}`}>
                      <CategoryIcon size={18} className={catData.color} />
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
              );
            })
          ) : (
            <div className="text-center py-8 border border-dashed border-[#222] rounded-xl">
              <p className="text-gray-500 text-xs mb-2">Vazio por aqui.</p>
              <Link to="/add" className="text-blue-500 font-bold text-xs hover:underline">Adicionar</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}