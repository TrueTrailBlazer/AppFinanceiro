import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Search, ChevronLeft, ChevronRight, Calendar, CheckCircle2, XCircle, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getCategory } from '../utils/constants';

export default function Extract() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Estados de Dados
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados de Filtro e Navegação
  const [viewMode, setViewMode] = useState('month'); // 'month' ou 'all'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [typeFilter, setTypeFilter] = useState('all'); // 'all', 'income', 'expense'

  // --- Lógica de Data ---
  const changeMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const monthTitle = useMemo(() => {
    return currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  }, [currentDate]);

  // --- Busca de Dados ---
  const fetchTransactions = async () => {
    setLoading(true);
    let query = supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // Se estiver no modo "Mês", filtra pelas datas
    if (viewMode === 'month') {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59).toISOString();
      query = query.gte('created_at', startOfMonth).lte('created_at', endOfMonth);
    } else {
      // Se for "Tudo", limita a 200 para não pesar
      query = query.limit(200);
    }

    const { data } = await query;
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
  }, [user, currentDate, viewMode]); // Recarrega se mudar mês ou modo

  // --- Ações ---
  const togglePaid = async (e, t) => {
    e.stopPropagation(); 
    const newStatus = !t.is_paid;
    
    // Atualização Otimista (Visual instantâneo)
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

  // --- Filtragem Local (Entrada/Saída) ---
  const filteredList = transactions.filter(t => {
    if (typeFilter === 'income') return t.type === 'income';
    if (typeFilter === 'expense') return t.type !== 'income';
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-24">
      
      {/* --- CABEÇALHO DE CONTROLO --- */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between sticky top-0 z-20 bg-[#050505] py-2">
        
        {/* Seletor de Modo (Mês ou Tudo) */}
        <div className="flex bg-[#121212] p-1 rounded-xl border border-[#222] self-start">
            <button 
                onClick={() => setViewMode('month')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'month' ? 'bg-[#222] text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
            >
                <Calendar size={14} /> Mês
            </button>
            <button 
                onClick={() => setViewMode('all')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'all' ? 'bg-[#222] text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
            >
                <Filter size={14} /> Tudo
            </button>
        </div>

        {/* Navegação de Mês (Só aparece se viewMode === 'month') */}
        {viewMode === 'month' && (
             <div className="flex items-center justify-between bg-[#1a1a1a] py-1.5 px-2 rounded-xl border border-[#333] w-full md:w-auto md:min-w-[250px]">
                <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-[#333] rounded-lg text-gray-300 transition-colors"><ChevronLeft size={18} /></button>
                <span className="font-bold text-sm capitalize text-white">{monthTitle}</span>
                <button onClick={() => changeMonth(1)} className="p-2 hover:bg-[#333] rounded-lg text-gray-300 transition-colors"><ChevronRight size={18} /></button>
             </div>
        )}

        {/* Filtro Tipo (Receita/Despesa) */}
        <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
            {['all', 'income', 'expense'].map(type => (
                <button
                    key={type}
                    onClick={() => setTypeFilter(type)}
                    className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-colors
                    ${typeFilter === type ? 'bg-blue-600/10 border-blue-600 text-blue-500' : 'border-[#222] text-gray-500 hover:border-gray-600'}`}
                >
                    {type === 'all' ? 'Todos' : type === 'income' ? 'Entradas' : 'Saídas'}
                </button>
            ))}
        </div>
      </div>

      {/* --- LISTA DE TRANSAÇÕES --- */}
      <div className="space-y-3">
        {loading ? (
           <div className="text-center py-12 text-xs text-gray-500 animate-pulse">Carregando lançamentos...</div>
        ) : filteredList.length > 0 ? (
            filteredList.map(t => {
              const catData = getCategory(t.category);
              const CategoryIcon = catData.icon;
              
              return (
                <div 
                  key={t.id}
                  onClick={() => handleEdit(t)}
                  className={`relative group flex flex-col md:flex-row md:items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer overflow-hidden
                    ${t.is_paid 
                        ? 'bg-[#121212] border-[#222] hover:border-[#333]' 
                        : 'bg-[#1a1a1a] border-yellow-500/30 shadow-[inset_3px_0_0_0_#eab308]'}`}
                >
                  
                  {/* Esquerda: Ícone + Infos */}
                  <div className="flex items-center gap-4 mb-3 md:mb-0">
                    <div className={`p-3 rounded-full shrink-0 ${t.is_paid ? catData.bg : 'bg-yellow-500/10'}`}>
                      <CategoryIcon size={20} className={t.is_paid ? catData.color : 'text-yellow-500'} />
                    </div>
                    <div>
                      <h3 className={`font-bold text-sm md:text-base ${t.is_paid ? 'text-white' : 'text-yellow-100'}`}>{t.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                         <span className="text-[10px] md:text-xs text-gray-500 bg-[#222] px-1.5 py-0.5 rounded capitalize">{catData.label}</span>
                         <span className="text-[10px] md:text-xs text-gray-500">
                            {new Date(t.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
                         </span>
                      </div>
                    </div>
                  </div>

                  {/* Direita: Valor + Botão Status */}
                  <div className="flex items-center justify-between md:gap-8">
                     <span className={`text-base md:text-lg font-bold ${t.type === 'income' ? 'text-green-400' : 'text-white'}`}>
                        {t.type === 'income' ? '+ ' : '- '}
                        {Number(t.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                     </span>

                     {/* Botão de Status (Grande e Clicável) */}
                     <button
                        onClick={(e) => togglePaid(e, t)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-bold text-[10px] md:text-xs uppercase tracking-wider transition-all hover:scale-105 active:scale-95
                        ${t.is_paid 
                            ? 'bg-green-500/10 border-green-500/50 text-green-500 hover:bg-green-500/20' 
                            : 'bg-yellow-500/10 border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/20'}`}
                     >
                        {t.is_paid ? (
                            <>PAGO <CheckCircle2 size={14} /></>
                        ) : (
                            <>PENDENTE <XCircle size={14} /></>
                        )}
                     </button>
                  </div>

                </div>
              );
            })
        ) : (
            <div className="py-20 flex flex-col items-center justify-center text-gray-500 gap-3 border border-dashed border-[#222] rounded-2xl bg-[#121212]/30">
                <Search size={24} className="opacity-20" />
                <p className="text-sm font-medium">Nenhum lançamento neste período.</p>
                {viewMode === 'month' && (
                    <p className="text-xs opacity-50">Tente mudar o mês ou clique em "Tudo".</p>
                )}
            </div>
        )}
      </div>
    </div>
  );
}