import { useState, useMemo } from 'react';
import { useTransactionsContext } from '../contexts/TransactionContext';
import { useNotifications } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import { toggleTransactionPaidStatus } from '../services/transactions';
import { uploadReceipt } from '../services/storage';
import { useNavigate, Link } from 'react-router-dom';
import { getCategory } from '../utils/constants';
import { parseCents, formatCurrency } from '../utils/money';
import { formatLocalDate } from '../utils/date';
import { useDate } from '../contexts/DateContext';
import { MonthPickerModal } from '../components/dashboard/MonthPickerModal';

export default function Bills() {
  const { user } = useAuth();
  const { plannedBills = [], plannedSummary, loading } = useTransactionsContext();
  const { showAlert } = useNotifications();
  const navigate = useNavigate();
  const { currentDate, setCurrentDate, changeMonth } = useDate();

  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'pending', 'paid'
  const [uploadingId, setUploadingId] = useState(null);
  const [isMonthModalOpen, setIsMonthModalOpen] = useState(false);

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

  const bills = plannedBills;

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

  const progress = summary.totalCents > 0 ? Math.round((summary.paidCents / summary.totalCents) * 100) : 0;

  const filteredBills = useMemo(() => {
    return bills.filter(t => {
      if (activeFilter === 'pending' && t.is_paid) return false;
      if (activeFilter === 'paid' && !t.is_paid) return false;
      return true;
    }).sort((a, b) => {
      if (a.is_paid !== b.is_paid) return a.is_paid ? 1 : -1;
      return new Date(a.created_at) - new Date(b.created_at);
    });
  }, [bills, activeFilter]);

  const groupedBills = useMemo(() => {
    const groups = {
      overdue: { id: 'overdue', label: 'VENCIDAS', icon: 'error', color: 'text-rose-600', iconColor: 'text-rose-500', total: 0, items: [] },
      thisWeek: { id: 'thisWeek', label: 'VENCE ESTA SEMANA', icon: 'schedule', color: 'text-amber-600', iconColor: 'text-amber-500', total: 0, items: [] },
      later: { id: 'later', label: 'A VENCER MAIS TARDE', icon: 'calendar_month', color: 'text-slate-500', iconColor: 'text-slate-400', total: 0, items: [] },
      paid: { id: 'paid', label: 'JÁ PAGAS', icon: 'check_circle', color: 'text-emerald-700', iconColor: 'text-emerald-600', total: 0, items: [] }
    };

    const today = new Date();
    today.setHours(0,0,0,0);
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    filteredBills.forEach(bill => {
      const cents = parseCents(bill.amount);
      if (bill.is_paid) {
        groups.paid.items.push(bill);
        groups.paid.total += cents;
      } else {
        const dueDate = new Date(bill.created_at);
        dueDate.setHours(0,0,0,0);

        if (dueDate < today) {
          groups.overdue.items.push(bill);
          groups.overdue.total += cents;
        } else if (dueDate <= nextWeek) {
          groups.thisWeek.items.push(bill);
          groups.thisWeek.total += cents;
        } else {
          groups.later.items.push(bill);
          groups.later.total += cents;
        }
      }
    });

    return Object.values(groups).filter(g => g.items.length > 0);
  }, [filteredBills]);

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
    <div className="flex flex-col w-full gap-4 animate-in fade-in duration-500 pt-1">
      
      {/* MONTH SELECTOR & ACTION */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div 
          onClick={() => setIsMonthModalOpen(true)}
          className="bg-white border border-border-subtle rounded-full px-3 py-1.5 shadow-sm flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-[16px] text-slate-500">calendar_today</span>
          <span className="text-[13px] font-bold text-slate-900 select-none capitalize">
            {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </span>
          <span className="material-symbols-outlined text-[16px] text-slate-500">arrow_drop_down</span>
        </div>

        <button 
          onClick={() => setActiveFilter(prev => prev === 'all' ? 'pending' : prev === 'pending' ? 'paid' : 'all')}
          className="bg-white border border-border-subtle rounded-full px-3 py-1.5 shadow-sm flex items-center gap-1.5 text-slate-600 hover:bg-slate-50 transition-colors active:scale-95"
        >
          <span className="material-symbols-outlined text-[16px]">filter_list</span>
          <span className="text-[11px] font-bold">
            {activeFilter === 'all' ? 'Filtros' : activeFilter === 'pending' ? 'Pendentes' : 'Pagos'}
          </span>
        </button>
      </div>

      {/* HERO CARD SUMMARY */}
      <section className="relative overflow-hidden bg-emerald-700 text-white rounded-3xl p-5 shadow-sm border border-emerald-600">
        <div className="absolute -right-8 -top-8 w-44 h-44 rounded-full bg-emerald-400/20 blur-2xl pointer-events-none"></div>
        <div className="absolute -left-10 -bottom-10 w-36 h-36 rounded-full bg-black/10 blur-xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] font-semibold tracking-wider uppercase text-emerald-200">Total a pagar no mês</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl font-extrabold tracking-tight">{formatCurrency(summary.totalCents)}</span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/10 backdrop-blur-md text-white border border-white/10">
              <span className="material-symbols-outlined text-[14px]">receipt_long</span>
              {bills.length} Contas
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <div className="bg-black/10 backdrop-blur-sm rounded-2xl p-3 border border-white/10 flex flex-col">
              <div className="flex items-center gap-1.5 text-xs text-emerald-100 font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0"></span>
                <span>Pendentes ({summary.pendingCount})</span>
              </div>
              <span className="text-base font-bold text-white mt-1">{formatCurrency(summary.pendingCents)}</span>
            </div>
            <div className="bg-black/10 backdrop-blur-sm rounded-2xl p-3 border border-white/10 flex flex-col">
              <div className="flex items-center gap-1.5 text-xs text-emerald-100 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-300 shrink-0"></span>
                <span>Pagas ({summary.paidCount})</span>
              </div>
              <span className="text-base font-bold text-white mt-1">{formatCurrency(summary.paidCents)}</span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 pt-1 border-t border-white/15">
            <div className="flex justify-between text-xs font-semibold text-emerald-50">
              <span>Progresso de liquidação</span>
              <span className="text-emerald-200">{progress}% quitado</span>
            </div>
            <div className="h-2 w-full bg-black/20 rounded-full overflow-hidden p-0.5">
              <div className="h-full bg-emerald-300 rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
            </div>
            <p className="text-[11px] text-emerald-100/80">Faltam {formatCurrency(summary.pendingCents)} para encerrar as despesas do mês.</p>
          </div>
        </div>
      </section>

      {/* FILTERS & PDF DOSSIER */}
      <div className="flex items-center justify-between mt-2">
        <nav className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1 -mx-4 px-4">
          <button onClick={() => setActiveFilter('all')} className={`shrink-0 px-4 py-1.5 rounded-full text-[13px] font-bold shadow-sm transition-all border ${activeFilter === 'all' ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-white text-slate-600 border-border-subtle hover:text-slate-900'}`}>
            Todas ({bills.length})
          </button>
          <button onClick={() => setActiveFilter('pending')} className={`shrink-0 px-4 py-1.5 rounded-full text-[13px] font-semibold shadow-sm transition-all border flex items-center gap-1.5 ${activeFilter === 'pending' ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-white text-slate-600 border-border-subtle hover:text-slate-900'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${activeFilter === 'pending' ? 'bg-white' : 'bg-amber-500'}`}></span>
            Pendentes ({summary.pendingCount})
          </button>
          <button onClick={() => setActiveFilter('paid')} className={`shrink-0 px-4 py-1.5 rounded-full text-[13px] font-semibold shadow-sm transition-all border flex items-center gap-1.5 ${activeFilter === 'paid' ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-white text-slate-600 border-border-subtle hover:text-slate-900'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${activeFilter === 'paid' ? 'bg-white' : 'bg-emerald-500'}`}></span>
            Pagas ({summary.paidCount})
          </button>
        </nav>
        <Link to="/dossier" className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-border-subtle text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-[12px] font-bold transition-all shadow-sm shrink-0">
          <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span> PDF
        </Link>
      </div>

      {/* BILLS LIST */}
      <div className="flex flex-col gap-5 mt-1 pb-16">
        {loading && bills.length === 0 ? (
          <div className="text-center py-16 text-xs text-slate-500 animate-pulse">
            Carregando contas...
          </div>
        ) : filteredBills.length > 0 ? (
          groupedBills.map(group => (
            <section key={group.id} className="flex flex-col gap-2">
              <div className="flex items-center justify-between px-1">
                <h3 className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${group.color}`}>
                  <span className={`material-symbols-outlined text-[15px] ${group.iconColor}`}>{group.icon}</span>
                  {group.label}
                </h3>
                <span className={`text-xs font-bold ${group.color}`}>{formatCurrency(group.total)}</span>
              </div>

              {group.items.map(bill => {
                const catData = getCategory(bill.category);
                
                // Adaptação dos ícones dinâmicos
                let iconName = 'receipt_long';
                if (bill.category === 'home' || bill.name.toLowerCase().includes('condomínio') || bill.name.toLowerCase().includes('aluguel')) iconName = 'home';
                if (bill.category === 'utilities' || bill.name.toLowerCase().includes('energia') || bill.name.toLowerCase().includes('luz')) iconName = 'bolt';
                if (bill.category === 'utilities' || bill.name.toLowerCase().includes('internet')) iconName = 'wifi';
                if (bill.name.toLowerCase().includes('cartão') || bill.name.toLowerCase().includes('fatura')) iconName = 'credit_card';
                if (bill.category === 'health' || bill.name.toLowerCase().includes('academia')) iconName = 'fitness_center';

                return (
                  <article 
                    key={bill.id} 
                    onClick={() => handleEdit(bill)}
                    className={`bg-white border border-border-subtle rounded-2xl p-3.5 flex items-center justify-between shadow-sm hover:border-slate-300 transition-all cursor-pointer ${bill.is_paid ? 'opacity-70 hover:opacity-100' : ''}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${bill.is_paid ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                        <span className="material-symbols-outlined text-[22px]">{iconName}</span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <h4 className={`text-[14px] font-bold leading-snug truncate ${bill.is_paid ? 'text-slate-500 line-through' : 'text-slate-900'}`}>{bill.name}</h4>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className={`text-[11px] font-medium ${bill.is_paid ? 'text-slate-400' : 'text-slate-500'}`}>
                            {bill.is_paid ? 'Pago em ' : 'Vence: '}{formatLocalDate(bill.created_at, { day: '2-digit', month: 'short' })}
                          </span>
                          {!bill.is_paid && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                              new Date(bill.created_at) < new Date() ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {new Date(bill.created_at) < new Date() ? 'Vencida' : 'Pendente'}
                            </span>
                          )}
                          {bill.is_paid && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-0.5">
                              <span className="material-symbols-outlined text-[10px]">done</span> Pago
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 shrink-0 pl-2">
                      <div className="text-right">
                        <p className={`text-[14px] font-bold ${bill.is_paid ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                          - {formatCurrency(bill.amount)}
                        </p>
                        {bill.is_paid && bill.receipt_url && (
                          <p 
                            onClick={(e) => { e.stopPropagation(); window.open(bill.receipt_url, '_blank'); }}
                            className="text-[10px] text-blue-600 font-bold hover:underline mt-0.5 flex items-center justify-end gap-0.5"
                          >
                            <span className="material-symbols-outlined text-[10px]">receipt</span> Comprovante
                          </p>
                        )}
                        {bill.is_paid && !bill.receipt_url && (
                          <label onClick={(e) => e.stopPropagation()} className="text-[10px] text-slate-500 hover:text-slate-700 font-bold mt-0.5 flex items-center justify-end gap-0.5 cursor-pointer">
                            {uploadingId === bill.id ? (
                              <div className="w-2.5 h-2.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <><span className="material-symbols-outlined text-[10px]">attach_file</span> Anexar</>
                            )}
                            <input type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => handleUploadReceipt(e, bill)} disabled={uploadingId === bill.id} />
                          </label>
                        )}
                      </div>
                      
                      <button 
                        onClick={(e) => handleTogglePaid(e, bill)}
                        aria-label="Marcar como Pago" 
                        className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all ${
                          bill.is_paid 
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100' 
                            : 'border-border-subtle hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-600 text-slate-400'
                        }`} 
                        title={bill.is_paid ? "Desmarcar" : "Marcar como Pago"}
                      >
                        <span className={`material-symbols-outlined text-[18px] ${bill.is_paid ? 'material-symbols-filled' : ''}`}>
                          {bill.is_paid ? 'verified' : 'check'}
                        </span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </section>
          ))
        ) : (
          <div className="text-center py-16 px-4">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3 border border-slate-200 mx-auto">
              <span className="material-symbols-outlined text-[28px]">receipt_long</span>
            </div>
            <p className="text-sm font-bold text-slate-900">Nenhuma conta encontrada</p>
            <p className="text-xs text-slate-500 mt-1 max-w-[240px] mx-auto">
              {activeFilter === 'pending' 
                ? 'Parabéns! Todas as contas deste mês já foram pagas.' 
                : 'Você não tem contas cadastradas com este filtro neste mês.'}
            </p>
            <Link to="/add" className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-md active:scale-95">
              <span className="material-symbols-outlined text-[16px]">add</span> Adicionar Conta
            </Link>
          </div>
        )}
      </div>

      <MonthPickerModal isOpen={isMonthModalOpen} onClose={() => setIsMonthModalOpen(false)} currentDate={currentDate} onSelectDate={setCurrentDate} />

    </div>
  );
}
