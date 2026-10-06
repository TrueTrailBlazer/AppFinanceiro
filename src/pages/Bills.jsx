import { useState, useMemo } from 'react';
import { useTransactionsContext } from '../contexts/TransactionContext';
import { useNotifications } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import { toggleTransactionPaidStatus } from '../services/transactions';
import { uploadReceipt } from '../services/storage';
import { useNavigate, Link } from 'react-router-dom';
import { MonthSelector } from '../components/dashboard/MonthSelector';
import { getCategory } from '../utils/constants';
import { parseCents, fromCents, formatCents } from '../utils/money';
import { formatLocalDate } from '../utils/date';
import { 
  CalendarCheck, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Filter, 
  TrendingDown, 
  Receipt,
  ArrowRight,
  FileText
} from 'lucide-react';

export default function Bills() {
  const { user } = useAuth();
  const { plannedBills = [], plannedSummary, loading } = useTransactionsContext();
  const { showAlert } = useNotifications();
  const navigate = useNavigate();

  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'pending', 'paid'
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadingId, setUploadingId] = useState(null);

  const handleUploadReceipt = async (e, bill) => {
    e.stopPropagation();
    const file = e.target.files[0];
    if (!file) return;

    setUploadingId(bill.id);
    try {
      await uploadReceipt(user.id, bill.id, file);
      showAlert('Comprovante anexado com sucesso!', 'success');
    } catch (error) {
      showAlert(error.message, 'error');
    } finally {
      setUploadingId(null);
    }
  };

  // Contas a pagar planejadas do mês (desacopladas do extrato bancário)
  const bills = plannedBills;

  // Resumo de Contas do Mês
  const summary = useMemo(() => {
    if (plannedSummary) return plannedSummary;
    const totalCents = bills.reduce((acc, t) => acc + parseCents(t.amount), 0);
    const paidCents = bills.filter(t => t.is_paid).reduce((acc, t) => acc + parseCents(t.amount), 0);
    const pendingCents = totalCents - paidCents;
    return {
      totalCents,
      paidCents,
      pendingCents,
      pendingCount: bills.filter(t => !t.is_paid).length,
      paidCount: bills.filter(t => t.is_paid).length
    };
  }, [plannedSummary, bills]);

  // Lista filtrada para exibição
  const filteredBills = useMemo(() => {
    return bills.filter(t => {
      // Filtro de status
      if (activeFilter === 'pending' && t.is_paid) return false;
      if (activeFilter === 'paid' && !t.is_paid) return false;

      // Filtro de busca textual
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const nameMatch = (t.name || '').toLowerCase().includes(query);
        const catData = getCategory(t.category);
        const catMatch = (catData?.label || '').toLowerCase().includes(query);
        return nameMatch || catMatch;
      }

      return true;
    }).sort((a, b) => {
      // Ordenação: Pendentes primeiro, depois por data mais próxima
      if (a.is_paid !== b.is_paid) {
        return a.is_paid ? 1 : -1;
      }
      return new Date(a.created_at) - new Date(b.created_at);
    });
  }, [bills, activeFilter, searchTerm]);

  // Alterna status de pago/pendente
  const handleTogglePaid = async (e, t) => {
    e.stopPropagation();
    try {
      const newStatus = !t.is_paid;
      await toggleTransactionPaidStatus(t.id, newStatus);
      showAlert(
        newStatus ? `"${t.name}" marcado como pago!` : `"${t.name}" retornado para pendente.`,
        newStatus ? 'success' : 'info'
      );
    } catch {
      showAlert('Erro ao atualizar status da conta', 'error');
    }
  };

  const handleEdit = (transaction) => {
    navigate('/add', { state: { transaction } });
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300 pb-16">
      
      {/* Top Header com Seletor de Mês */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">Contas a Pagar</h1>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Planejamento
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">Gerencie suas pendências, datas e pagamentos deste mês.</p>
        </div>
        <MonthSelector />
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-3 gap-2.5">
        
        {/* Total do Mês */}
        <div className="p-3.5 rounded-2xl bg-card border border-border flex flex-col justify-between shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Previsto</p>
          <p className="text-base sm:text-lg font-black text-foreground mt-1 truncate">
            {formatCents(summary.totalCents)}
          </p>
          <span className="text-[10px] text-gray-500 mt-1">{bills.length} contas</span>
        </div>

        {/* Já Pago */}
        <div className="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 flex flex-col justify-between shadow-sm">
          <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 size={11} /> Já Pago
          </p>
          <p className="text-base sm:text-lg font-black text-emerald-400 mt-1 truncate">
            {formatCents(summary.paidCents)}
          </p>
          <span className="text-[10px] text-emerald-500/80 mt-1">{summary.paidCount} pagas</span>
        </div>

        {/* Falta Pagar */}
        <div className={`p-3.5 rounded-2xl border flex flex-col justify-between shadow-sm ${
          summary.pendingCents > 0 
            ? 'bg-rose-500/10 border-rose-500/30' 
            : 'bg-card border-border'
        }`}>
          <p className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
            summary.pendingCents > 0 ? 'text-rose-400' : 'text-gray-400'
          }`}>
            <Clock size={11} /> Falta Pagar
          </p>
          <p className={`text-base sm:text-lg font-black mt-1 truncate ${
            summary.pendingCents > 0 ? 'text-rose-400' : 'text-gray-400'
          }`}>
            {formatCents(summary.pendingCents)}
          </p>
          <span className={`text-[10px] mt-1 ${summary.pendingCents > 0 ? 'text-rose-400/80 font-semibold' : 'text-gray-500'}`}>
            {summary.pendingCount} pendentes
          </span>
        </div>

      </div>

      {/* Barra de Filtros Rápidos */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="flex bg-card p-1 rounded-xl border border-border text-xs w-full sm:w-auto">
          <button
            onClick={() => setActiveFilter('all')}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeFilter === 'all' 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'text-gray-400 hover:text-foreground'
            }`}
          >
            Todas ({bills.length})
          </button>
          <button
            onClick={() => setActiveFilter('pending')}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeFilter === 'pending' 
                ? 'bg-rose-600 text-white shadow-sm' 
                : 'text-gray-400 hover:text-foreground'
            }`}
          >
            Pendentes ({summary.pendingCount})
          </button>
          <button
            onClick={() => setActiveFilter('paid')}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeFilter === 'paid' 
                ? 'bg-emerald-600 text-white shadow-sm' 
                : 'text-gray-400 hover:text-foreground'
            }`}
          >
            Pagas ({summary.paidCount})
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <Link
            to="/dossier"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-card border border-border hover:bg-card-hover text-foreground text-xs font-bold transition-all shadow-sm active:scale-95 shrink-0"
          >
            <FileText size={15} /> Dossiê PDF
          </Link>
          <Link
            to="/add"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md active:scale-95 shrink-0"
          >
            <Plus size={15} /> Nova Conta
          </Link>
        </div>
      </div>

      {/* Lista de Contas */}
      <div className="space-y-2">
        {loading && bills.length === 0 ? (
          <div className="text-center py-12 text-xs text-gray-500 animate-pulse">
            Carregando contas a pagar...
          </div>
        ) : filteredBills.length > 0 ? (
          filteredBills.map((bill) => {
            const catData = getCategory(bill.category);
            const CategoryIcon = catData.icon;

            return (
              <div
                key={bill.id}
                onClick={() => handleEdit(bill)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  bill.is_paid 
                    ? 'bg-card/40 border-border/60 opacity-75 hover:opacity-100' 
                    : 'bg-card border-border hover:border-blue-500/40 shadow-sm'
                }`}
              >
                {/* Lado Esquerdo: Ícone + Detalhes */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2.5 rounded-xl shrink-0 ${catData.bg}`}>
                    <CategoryIcon size={18} className={catData.color} />
                  </div>

                  <div className="min-w-0">
                    <p className={`font-bold text-sm leading-tight truncate ${
                      bill.is_paid ? 'line-through text-gray-400' : 'text-foreground'
                    }`}>
                      {bill.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] font-semibold text-gray-400 uppercase bg-card-hover px-1.5 py-0.5 rounded border border-border/50">
                        {catData.label}
                      </span>
                      <span className="text-[10px] text-gray-500">
                        Venc: {formatLocalDate(bill.created_at, { day: '2-digit', month: 'short' })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Lado Direito: Valor + Botões de Ação */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <div className="flex items-center gap-3">
                    <span className={`font-extrabold text-sm whitespace-nowrap ${
                      bill.is_paid ? 'text-gray-400' : 'text-foreground'
                    }`}>
                      {formatCents(bill.amount)}
                    </span>

                    <button
                      onClick={(e) => handleTogglePaid(e, bill)}
                      title={bill.is_paid ? "Marcar como pendente" : "Marcar como pago"}
                      className={`px-2.5 py-1.5 rounded-xl text-[10px] font-extrabold transition-all border flex items-center gap-1 active:scale-90 ${
                        bill.is_paid
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
                      }`}
                    >
                      {bill.is_paid ? (
                        <>
                          <CheckCircle2 size={12} /> PAGO
                        </>
                      ) : (
                        <>
                          <Clock size={12} /> PENDENTE
                        </>
                      )}
                    </button>
                  </div>
                  
                  {/* Comprovantes */}
                  {bill.is_paid && (
                    <div className="flex gap-2 mt-1">
                      {bill.receipt_url ? (
                        <button 
                          onClick={(e) => { e.stopPropagation(); window.open(bill.receipt_url, '_blank'); }}
                          className="flex items-center gap-1 text-[10px] text-blue-500 hover:text-blue-400 font-bold bg-blue-500/10 px-2 py-1 rounded"
                        >
                          <Receipt size={12} /> Ver Comprovante
                        </button>
                      ) : (
                        <label 
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-foreground font-bold bg-card-hover px-2 py-1 rounded border border-border cursor-pointer transition-colors"
                        >
                          {uploadingId === bill.id ? (
                            <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <><Receipt size={12} /> Anexar</>
                          )}
                          <input 
                            type="file" 
                            accept="image/*,application/pdf"
                            className="hidden"
                            onChange={(e) => handleUploadReceipt(e, bill)}
                            disabled={uploadingId === bill.id}
                          />
                        </label>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 border border-dashed border-border rounded-2xl p-6 bg-card/20">
            <Receipt className="mx-auto text-gray-600 mb-2" size={32} />
            <p className="text-sm font-semibold text-foreground">Nenhuma conta encontrada</p>
            <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
              {activeFilter === 'pending' 
                ? 'Parabéns! Todas as contas deste mês já foram pagas.' 
                : 'Você não tem contas cadastradas com este filtro neste mês.'}
            </p>
            <Link
              to="/add"
              className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md active:scale-95"
            >
              <Plus size={14} /> Adicionar Conta
            </Link>
          </div>
        )}
      </div>

    </div>
  );
}
