import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext.jsx';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function Analysis() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Busca TUDO para poder agrupar localmente
  useEffect(() => {
    if (!user) return;
    const fetchAll = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }); // Do mais recente pro antigo
      if (data) setTransactions(data);
      setLoading(false);
    };
    fetchAll();
  }, [user]);

  // Agrupa os dados por mês: "Janeiro 2024", "Fevereiro 2024", etc.
  const monthlyData = useMemo(() => {
    const groups = {};

    transactions.forEach(t => {
      const date = new Date(t.created_at);
      // Chave para ordenação: 2024-01
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      // Nome visual: Jan/24
      const label = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).replace('.', '');

      if (!groups[key]) {
        groups[key] = { label, income: 0, expense: 0, balance: 0 };
      }

      const val = Number(t.amount);
      if (t.type === 'income') {
        groups[key].income += val;
      } else {
        groups[key].expense += val;
      }
      groups[key].balance = groups[key].income - groups[key].expense;
    });

    // Transforma em array e ordena (mais recente primeiro)
    return Object.entries(groups)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([key, val]) => ({ key, ...val }));
  }, [transactions]);

  // Calcula o máximo para fazer a barra de porcentagem proporcional
  const maxVal = useMemo(() => {
    return Math.max(...monthlyData.map(m => Math.max(m.income, m.expense))) || 1;
  }, [monthlyData]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <h1 className="text-xl font-bold text-white">Análise Mensal</h1>

      {loading ? (
        <div className="text-center text-sm text-gray-500 py-10">Calculando...</div>
      ) : monthlyData.length === 0 ? (
        <div className="text-center text-gray-500 py-10">Nenhum dado para comparar ainda.</div>
      ) : (
        <div className="space-y-4">
          {monthlyData.map((m) => (
            <div key={m.key} className="bg-[#121212] border border-[#222] p-4 rounded-xl space-y-3">
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-white capitalize">{m.label}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${m.balance >= 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                  {m.balance >= 0 ? 'Sobra: ' : 'Falta: '} 
                  {m.balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>

              {/* Barra de Entradas */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-400">
                  <span className="flex items-center gap-1"><TrendingUp size={12} /> Entradas</span>
                  <span>{m.income.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                </div>
                <div className="h-2 w-full bg-[#222] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full" 
                    style={{ width: `${(m.income / maxVal) * 100}%` }} 
                  />
                </div>
              </div>

              {/* Barra de Saídas */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-400">
                  <span className="flex items-center gap-1"><TrendingDown size={12} /> Saídas</span>
                  <span>{m.expense.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                </div>
                <div className="h-2 w-full bg-[#222] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-red-500 rounded-full" 
                    style={{ width: `${(m.expense / maxVal) * 100}%` }} 
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}