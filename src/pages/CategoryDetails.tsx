import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Calendar, Search } from 'lucide-react';
import { getCategory } from '../utils/constants';
import { formatCents, parseCents } from '../utils/money';
import { formatLocalDate, parseLocalDate } from '../utils/date';
import { isInternalReserveTransaction } from '../utils/transactionSelectors';
import { fetchTransactionsByCategory } from '../services/transactions';
import { BankBadge } from '../components/ui/BankBadge';
import BankTransactionDetailModal from '../components/extract/BankTransactionDetailModal';
import type { TransactionRow } from '../types/models';

interface CategoryDetailsState {
  category?: string;
  monthKey?: string;
  monthLabel?: string;
  isBankSource?: boolean;
}

export default function CategoryDetails() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedBankTx, setSelectedBankTx] = useState<TransactionRow | null>(null);

  // Dados vindos da navegação
  const { category, monthKey, monthLabel, isBankSource } = (location.state as CategoryDetailsState | null) || {};

  useEffect(() => {
    if (!user || !category) {
      if (!category) navigate('/analysis');
      return;
    }

    const fetchCategoryData = async () => {
      setLoading(true);
      try {
        let startIso: string | undefined;
        let endIso: string | undefined;
        if (monthKey) {
          const [yy, mm] = monthKey.split('-');
          const yNum = parseInt(yy, 10);
          const mNum = parseInt(mm, 10) - 1;
          // Margem de 1 dia para evitar perda por conversão UTC no PostgreSQL
          startIso = new Date(yNum, mNum, 0, 0, 0, 0).toISOString();
          endIso = new Date(yNum, mNum + 1, 1, 23, 59, 59).toISOString();
        } else if (monthLabel && !isNaN(parseInt(monthLabel, 10))) {
          const yNum = parseInt(monthLabel, 10);
          startIso = new Date(yNum - 1, 11, 31, 0, 0, 0).toISOString();
          endIso = new Date(yNum + 1, 0, 1, 23, 59, 59).toISOString();
        }

        const data = await fetchTransactionsByCategory(user.id, category, startIso, endIso);

        const isBankTransaction = (t: TransactionRow) => Boolean(t.pluggy_transaction_id);

        const periodTxs = data || [];

        // 2. Determina se usa fonte bancária ou manual
        const useBankSource = isBankSource !== undefined 
          ? isBankSource 
          : periodTxs.some(t => isBankTransaction(t));

        // 3. Aplica regra de desacoplamento e exclui transferências internas e receitas
        const filtered = periodTxs.filter(t => {
          if (t.type === 'income' || isInternalReserveTransaction(t.name || '')) {
            return false;
          }
          if (monthKey) {
            const d = parseLocalDate(t.created_at);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            if (key !== monthKey) return false;
          }
          return useBankSource ? isBankTransaction(t) : !isBankTransaction(t);
        });

        setTransactions(filtered);
      } catch (err) {
        console.error('Erro ao buscar detalhes da categoria:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryData();
  }, [user, category, monthKey, monthLabel, isBankSource, navigate]);

  const catInfo = useMemo(() => getCategory(category), [category]);
  const totalAmountCents = useMemo(() => transactions.reduce((acc, t) => acc + parseCents(t.amount), 0), [transactions]);

  if (!category) return null;
  const CatIcon = catInfo.icon;

  return (
    <div className="fixed inset-0 z-[60] bg-surface flex flex-col h-[100dvh] overflow-hidden text-on-surface animate-in fade-in duration-300">
      
      {/* HEADER FIXO TOPO */}
      <header className="fixed top-0 w-full z-40 pt-safe bg-white border-b border-border-subtle">
        <div className="h-16 px-4 flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(-1)} 
              aria-label="Voltar" 
              className="w-10 h-10 rounded-full bg-white border border-border-subtle flex items-center justify-center text-slate-700 hover:bg-slate-50 transition-colors shadow-sm active:scale-95" 
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </button>
            <div className="flex flex-col">
              <h1 className="text-base font-bold text-slate-900 tracking-tight leading-tight">{catInfo.label}</h1>
              <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                <Calendar size={11} className="shrink-0" /> {monthLabel || 'Todo o Período'}
              </p>
            </div>
          </div>
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${catInfo.bg} ${catInfo.color}`}>
            <CatIcon size={20} />
          </div>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 overflow-y-auto w-full max-w-4xl mx-auto px-4 pt-20 pb-8 flex flex-col gap-4">
        
        {/* CARD TOTAL GASTO */}
        <div className="bg-white border border-border-subtle rounded-3xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Gasto na Categoria</span>
            <h2 className="text-2xl font-black text-slate-900 mt-0.5">{formatCents(totalAmountCents)}</h2>
          </div>
          <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold">
            {transactions.length} lançamentos
          </span>
        </div>

        {/* LISTA DE TRANSAÇÕES */}
        <div className="bg-white border border-border-subtle rounded-3xl p-5 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-[16px] font-bold text-slate-900">Lançamentos</h3>
            <span className="text-[11px] font-semibold text-slate-500">Toque para editar</span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-500 font-medium">Buscando lançamentos...</p>
            </div>
          ) : transactions.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {transactions.map(t => (
                <div 
                  key={t.id} 
                  onClick={() => {
                    if (t.pluggy_transaction_id) {
                      setSelectedBankTx(t);
                    } else {
                      navigate('/add', { state: { transaction: t } });
                    }
                  }} 
                  className="flex items-center justify-between py-3.5 px-2 hover:bg-slate-50 rounded-2xl transition-colors cursor-pointer active:scale-[0.99]"
                >
                  <div className="flex flex-col truncate pr-3">
                    <h4 className="text-sm font-bold text-slate-900 truncate mb-0.5">
                      {t.name.replace(/\s*\(\d+\/\d+\)\s*$/, '')}
                    </h4>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-500 font-medium">
                        {formatLocalDate(t.created_at, { day: '2-digit', month: 'short' })}
                      </span>
                      {t.bank_name && (
                        <BankBadge bankName={t.bank_name} />
                      )}
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${t.is_paid ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                        {t.is_paid ? 'Pago' : 'Pendente'}
                      </span>
                    </div>
                  </div>
                  <span className="text-sm font-black text-rose-600 shrink-0">
                    - {formatCents(t.amount)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
              <Search size={28} className="opacity-40" />
              <p className="text-xs font-semibold text-slate-500">Nenhum lançamento encontrado nesta categoria</p>
            </div>
          )}
        </div>

      </main>

      {selectedBankTx && (
        <BankTransactionDetailModal
          isOpen={!!selectedBankTx}
          onClose={() => setSelectedBankTx(null)}
          transaction={selectedBankTx}
        />
      )}
    </div>
  );
}
