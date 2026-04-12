import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Calendar, Tag, TrendingDown, Search } from 'lucide-react';
import { getCategory } from '../utils/constants';

export default function CategoryDetails() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Dados vindos da navegação
  const { category, monthKey, monthLabel } = location.state || {};

  useEffect(() => {
    if (!user || !category) {
        if (!category) navigate('/analysis');
        return;
    }

    const fetchCategoryData = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', user.id)
            .eq('category', category)
            .order('created_at', { ascending: false });
        
        if (error) throw error;

        if (data && monthKey) {
            const filtered = data.filter(t => {
                const d = new Date(t.created_at);
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                return key === monthKey;
            });
            setTransactions(filtered);
        } else {
            setTransactions(data || []);
        }
      } catch (err) {
        console.error("Erro ao buscar detalhes da categoria:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryData();
  }, [user, category, monthKey, navigate]);

  const catInfo = useMemo(() => getCategory(category), [category]);
  const totalAmount = useMemo(() => transactions.reduce((acc, t) => acc + Number(t.amount), 0), [transactions]);

  if (!category) return null;

  return (
    <div className="flex flex-col h-[100dvh] bg-[#050505] animate-in fade-in duration-500 overflow-hidden">
      
      {/* HEADER FIXO - Ajustado para não cortar */}
      <div className="bg-[#050505] pt-6 pb-4 border-b border-[#1a1a1a] px-5 space-y-4 shrink-0">
        <div className="flex items-center gap-4">
            <div className={`p-3.5 rounded-2xl ${catInfo.bg} border border-white/5 shadow-lg`}>
                <catInfo.icon size={24} className={catInfo.color} />
            </div>
            <div className="flex flex-col">
                <h1 className="text-lg font-black text-white tracking-tight uppercase leading-none">{catInfo.label}</h1>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] flex items-center gap-1.5 mt-1.5 leading-none">
                    <Calendar size={12}/> {monthLabel || 'Todo o Período'}
                </p>
            </div>
        </div>
        
        <div className="bg-[#0c0c0c] rounded-2xl p-4 border border-[#1a1a1a] flex justify-between items-center">
            <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest">Total Gasto</p>
            <span className="text-lg font-black text-white">
                {totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
        </div>
      </div>

      {/* LISTA DE GASTOS - SCROLLABLE */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-30">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <p className="text-[10px] font-bold uppercase tracking-widest">Buscando lançamentos...</p>
          </div>
        ) : transactions.length > 0 ? (
          <>
            {transactions.map(t => (
              <div key={t.id} className="bg-[#0c0c0c] border border-[#1a1a1a] rounded-[1.5rem] p-4 flex items-center justify-between group active:scale-[0.98] transition-all">
                <div className="flex flex-col truncate">
                  <h3 className="text-xs font-black text-white uppercase tracking-tight truncate mb-1">
                    {t.name.replace(/\s*\(\d+\/\d+\)\s*$/, '')}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-gray-600 font-black uppercase tracking-wider">
                      {new Date(t.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
                    </span>
                    {t.is_paid ? 
                      <span className="text-[8px] bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full font-bold">PAGO</span> :
                      <span className="text-[8px] bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full font-bold">PENDENTE</span>
                    }
                  </div>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <span className="text-sm font-black text-white">
                    - {Number(t.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
              </div>
            ))}
            {/* Espaço extra no fim do scroll */}
            <div className="h-4" />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-gray-700 gap-4 border border-dashed border-[#1a1a1a] rounded-[2rem]">
            <Search size={32} className="opacity-10" />
            <p className="text-[10px] font-black uppercase tracking-widest opacity-30">Nenhum gasto neste mês</p>
          </div>
        )}
      </div>

      {/* FOOTER VOLTAR - THUMB ZONE STYLE */}
      <div className="p-4 pb-8 bg-[#050505] border-t border-[#1a1a1a] shrink-0">
        <button 
            onClick={() => navigate(-1)} 
            className="w-full py-4 rounded-xl border border-[#222] text-gray-400 font-black text-xs uppercase tracking-[0.2em] active:scale-95 transition-all hover:bg-[#121212] hover:text-white"
        >
            Voltar para Análise
        </button>
      </div>

    </div>
  );
}
