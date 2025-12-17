import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../services/supabase.js';
import { useAuth } from '../contexts/AuthContext';
import { SummaryCard } from '../components/ui/SummaryCard';
import { TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Home() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      if (data) setTransactions(data);
    };
    fetch();
  }, [user]);

  const summary = useMemo(() => {
    const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount), 0);
    const expense = transactions.filter(t => t.type !== 'income').reduce((acc, t) => acc + Number(t.amount), 0);
    return { income, expense, balance: income - expense };
  }, [transactions]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-bold">Olá, Investidor</h2>
          <p className="text-gray-500 text-sm">Resumo deste mês</p>
        </div>
      </header>

      {/* Cards Principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard title="Saldo Atual" value={summary.balance} type={summary.balance >= 0 ? 'success' : 'danger'} />
        <div className="grid grid-cols-2 gap-4 md:col-span-2">
          <SummaryCard title="Entradas" value={summary.income} type="highlight" />
          <SummaryCard title="Saídas" value={summary.expense} type="neutral" />
        </div>
      </div>

      {/* Últimas Transações */}
      <div className="space-y-4 pt-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-gray-300 flex items-center gap-2"><Clock size={18} /> Recentes</h3>
          <Link to="/extract" className="text-sm text-blue-500 hover:text-blue-400">Ver tudo</Link>
        </div>

        <div className="space-y-3">
          {transactions.map(t => (
            <div key={t.id} className="flex justify-between items-center p-4 bg-[#121212] border border-[#222] rounded-xl hover:border-blue-500/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${t.type === 'income' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                  {t.type === 'income' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                </div>
                <div>
                  <p className="font-medium text-white">{t.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{t.type === 'income' ? 'Entrada' : t.type === 'fixed' ? 'Fixo' : 'Variável'}</p>
                </div>
              </div>
              <span className={`font-bold ${t.type === 'income' ? 'text-green-400' : 'text-white'}`}>
                {t.type === 'income' ? '+ ' : '- '}
                {Number(t.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>
          ))}
          {transactions.length === 0 && (
            <div className="text-center py-10 text-gray-600">
              Nenhuma movimentação ainda.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}