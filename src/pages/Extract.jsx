import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getCategory } from '../utils/constants';

export default function Extract() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async () => {
    if(transactions.length === 0) setLoading(true);
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100);
    
    if (data) setTransactions(data);
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    fetchTransactions();

    // Atualização em Tempo Real no Extrato também
    const channel = supabase
      .channel('extract-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${user.id}` }, 
        () => fetchTransactions()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const handleEdit = (transaction) => {
    navigate('/add', { state: { transaction } });
  };

  const filteredData = transactions.filter(t => {
    if (filter === 'all') return true;
    if (filter === 'income') return t.type === 'income';
    if (filter === 'expense') return t.type !== 'income';
    return true;
  });

  return (
    <div className="space-y-3 animate-in fade-in duration-500 pb-24">
      <div className="flex items-center justify-between px-1">
        <h1 className="text-lg font-bold text-white">Extrato Completo</h1>
        <span className="text-[10px] text-gray-500 bg-[#1a1a1a] px-2 py-0.5 rounded border border-[#222]">
          {filteredData.length} registros
        </span>
      </div>

      <div className="flex p-1 bg-[#121212] rounded-xl border border-[#222]">
        {['all', 'income', 'expense'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
              filter === f ? 'bg-[#222] text-white' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {f === 'all' ? 'Tudo' : f === 'income' ? 'Entradas' : 'Saídas'}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {loading && transactions.length === 0 ? (
          <div className="text-center py-8 text-xs text-gray-500">Carregando...</div>
        ) : filteredData.length > 0 ? (
          filteredData.map(t => {
            const catData = getCategory(t.category);
            const CategoryIcon = catData.icon;

            return (
              <div 
                key={t.id}
                onClick={() => handleEdit(t)}
                className="flex justify-between items-center p-3 bg-[#121212] border border-[#222] rounded-xl active:bg-[#1a1a1a] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full shrink-0 ${catData.bg}`}>
                    <CategoryIcon size={16} className={catData.color} />
                  </div>
                  <div>
                    <p className="font-medium text-white text-sm leading-tight">{t.name}</p>
                    <div className="flex gap-2 text-[10px] text-gray-500 mt-0.5">
                      <span className="capitalize">{catData.label}</span>
                      <span>•</span>
                      <span>{new Date(t.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <span className={`font-bold text-sm ${t.type === 'income' ? 'text-green-400' : 'text-white'}`}>
                    {t.type === 'income' ? '+ ' : '- '}
                    {Number(t.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-16 flex flex-col items-center justify-center text-gray-500 gap-2 border border-dashed border-[#222] rounded-xl bg-[#121212]/50">
            <Search size={20} className="opacity-30" />
            <p className="text-xs">Nada encontrado.</p>
          </div>
        )}
      </div>
    </div>
  );
}