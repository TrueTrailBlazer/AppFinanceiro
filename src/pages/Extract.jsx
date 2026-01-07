import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Search, CheckCircle2, Circle } from 'lucide-react';
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
    // Aumentei o limite para 500 para pegar mais histórico
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(500); 
    
    if (data) setTransactions(data);
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    fetchTransactions();

    const channel = supabase
      .channel('extract-realtime')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${user.id}` }, 
        () => fetchTransactions()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // Função rápida para alternar pago/pendente na lista
  const togglePaid = async (e, t) => {
    e.stopPropagation(); // Não abre a edição ao clicar no check
    const newStatus = !t.is_paid;
    
    // Atualiza visualmente na hora (otimista)
    setTransactions(prev => prev.map(item => item.id === t.id ? {...item, is_paid: newStatus} : item));

    const { error } = await supabase
        .from('transactions')
        .update({ is_paid: newStatus })
        .eq('id', t.id);
    
    if (error) alert('Erro ao atualizar status');
  };

  const handleEdit = (transaction) => {
    navigate('/add', { state: { transaction } });
  };

  // Lógica de Agrupamento por Mês
  const groupedTransactions = useMemo(() => {
    const filtered = transactions.filter(t => {
      if (filter === 'all') return true;
      if (filter === 'income') return t.type === 'income';
      if (filter === 'expense') return t.type !== 'income';
      return true;
    });

    const groups = {};
    filtered.forEach(t => {
      const date = new Date(t.created_at);
      // Cria uma chave ex: "Janeiro 2026"
      const monthKey = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      if (!groups[monthKey]) groups[monthKey] = [];
      groups[monthKey].push(t);
    });
    return groups;
  }, [transactions, filter]);

  return (
    <div className="space-y-4 animate-in fade-in duration-500 pb-24">
      <div className="flex items-center justify-between px-1">
        <h1 className="text-lg font-bold text-white">Extrato</h1>
        <div className="flex bg-[#121212] p-1 rounded-lg border border-[#222]">
            {['all', 'income', 'expense'].map((f) => (
            <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${
                filter === f ? 'bg-[#222] text-white' : 'text-gray-500 hover:text-gray-300'
                }`}
            >
                {f === 'all' ? 'Tudo' : f === 'income' ? 'Entradas' : 'Saídas'}
            </button>
            ))}
        </div>
      </div>

      <div className="space-y-6">
        {loading && transactions.length === 0 ? (
          <div className="text-center py-8 text-xs text-gray-500">Carregando...</div>
        ) : Object.keys(groupedTransactions).length > 0 ? (
          
          // Itera sobre os meses (Grupos)
          Object.entries(groupedTransactions).map(([month, items]) => (
            <div key={month} className="space-y-2">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-2 border-l-2 border-blue-500/50 sticky top-0 bg-[#050505] py-2 z-10">
                    {month}
                </h3>
                
                {items.map(t => {
                    const catData = getCategory(t.category);
                    const CategoryIcon = catData.icon;

                    return (
                    <div 
                        key={t.id}
                        onClick={() => handleEdit(t)}
                        className={`flex justify-between items-center p-3 border rounded-xl transition-all cursor-pointer group
                             ${t.is_paid 
                                ? 'bg-[#121212] border-[#222] active:bg-[#1a1a1a]' 
                                : 'bg-[#1a1a1a] border-yellow-500/20 active:bg-[#222]'}`}
                    >
                        <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full shrink-0 ${t.is_paid ? catData.bg : 'bg-gray-800'}`}>
                            <CategoryIcon size={16} className={t.is_paid ? catData.color : 'text-gray-400'} />
                        </div>
                        <div>
                            <p className={`font-medium text-sm leading-tight ${t.is_paid ? 'text-white' : 'text-gray-300'}`}>{t.name}</p>
                            <div className="flex gap-2 text-[10px] text-gray-500 mt-0.5">
                            <span className="capitalize">{catData.label}</span>
                            <span>•</span>
                            <span>{new Date(t.created_at).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'})}</span>
                            {!t.is_paid && <span className="text-yellow-500 font-bold">• Pendente</span>}
                            </div>
                        </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-1">
                            <span className={`font-bold text-sm ${t.type === 'income' ? 'text-green-400' : 'text-white'} ${!t.is_paid && 'opacity-60'}`}>
                                {t.type === 'income' ? '+ ' : '- '}
                                {Number(t.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                            {/* Botão de Check */}
                            <button onClick={(e) => togglePaid(e, t)} className="text-gray-600 hover:text-green-500 transition-colors p-1 -mr-2">
                                {t.is_paid ? <CheckCircle2 size={16} className="text-green-900" /> : <Circle size={16} className="text-yellow-600" />}
                            </button>
                        </div>
                    </div>
                    );
                })}
            </div>
          ))

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