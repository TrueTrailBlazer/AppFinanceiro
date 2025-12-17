import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase.js';
import { useAuth } from '../contexts/AuthContext';
import { Trash2 } from 'lucide-react';

export default function Extract() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState('all'); // all, income, expense

  const fetchTransactions = async () => {
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setTransactions(data);
  };

  useEffect(() => {
    if (user) fetchTransactions();
  }, [user]);

  const handleDelete = async (id) => {
    if (confirm('Excluir este item?')) {
      await supabase.from('transactions').delete().eq('id', id);
      fetchTransactions(); // Recarrega
    }
  };

  const filteredData = transactions.filter(t => {
    if (filter === 'all') return true;
    if (filter === 'income') return t.type === 'income';
    if (filter === 'expense') return t.type !== 'income';
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h1 className="text-2xl font-bold">Extrato Completo</h1>

      {/* Filtros */}
      <div className="flex p-1 bg-[#121212] rounded-xl border border-[#222]">
        {['all', 'income', 'expense'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
              filter === f ? 'bg-[#222] text-white' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {f === 'all' ? 'Tudo' : f === 'income' ? 'Entradas' : 'Saídas'}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filteredData.map(t => (
          <div key={t.id} className="group flex justify-between items-center p-4 bg-[#121212] border border-[#222] rounded-xl">
            <div>
              <p className="font-medium text-white">{t.name}</p>
              <div className="flex gap-2 text-xs text-gray-500 mt-1">
                <span className="capitalize">{t.type === 'income' ? 'Entrada' : t.type}</span>
                <span>•</span>
                <span>{new Date(t.created_at).toLocaleDateString('pt-BR')}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <span className={`font-bold ${t.type === 'income' ? 'text-green-400' : 'text-white'}`}>
                {Number(t.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
              <button onClick={() => handleDelete(t.id)} className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
        {filteredData.length === 0 && (
          <div className="py-20 text-center text-gray-500">
            Nenhuma transação encontrada neste filtro.
          </div>
        )}
      </div>
    </div>
  );
}