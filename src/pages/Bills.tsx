import { useState, useMemo, type MouseEvent, type ChangeEvent } from 'react';
import { useTransactionsContext } from '../contexts/TransactionContext';
import { useNotifications } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import { toggleTransactionPaidStatus } from '../services/transactions';
import { uploadReceipt } from '../services/storage';
import { useNavigate } from 'react-router-dom';
import { parseCents } from '../utils/money';
import { useDate } from '../contexts/DateContext';
import { MonthPickerModal } from '../components/dashboard/MonthPickerModal';
import BillsHeaderBar from '../components/bills/BillsHeaderBar';
import BillsLiquidationHero, { type BillsLiquidationSummary } from '../components/bills/BillsLiquidationHero';
import BillsFilterTabs, { type BillFilterType } from '../components/bills/BillsFilterTabs';
import BillsGroupedList, { type BillGroup } from '../components/bills/BillsGroupedList';
import type { DisplayTransaction } from '../types/models';

export default function Bills() {
  const { user } = useAuth();
  const { plannedBills = [], plannedSummary, loading, refreshData } = useTransactionsContext();
  const { showAlert } = useNotifications();
  const navigate = useNavigate();
  const { currentDate, setCurrentDate } = useDate();

  const [activeFilter, setActiveFilter] = useState<BillFilterType>('all');
  const [uploadingId, setUploadingId] = useState<string | number | null>(null);
  const [isMonthModalOpen, setIsMonthModalOpen] = useState(false);

  const handleUploadReceipt = async (e: ChangeEvent<HTMLInputElement>, bill: DisplayTransaction) => {
    e.stopPropagation();
    if (!user) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingId(bill.id);
    try {
      await uploadReceipt(user.id, bill.id, file);
      showAlert('Comprovante anexado com sucesso!', 'success');
      if (refreshData) {
        refreshData();
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro ao anexar comprovante';
      showAlert(msg, 'error');
    } finally {
      setUploadingId(null);
    }
  };

  const bills = plannedBills;

  const summary = useMemo<BillsLiquidationSummary>(() => {
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
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
  }, [bills, activeFilter]);

  const groupedBills = useMemo<BillGroup[]>(() => {
    const groups: Record<string, BillGroup> = {
      overdue: { id: 'overdue', label: 'VENCIDAS', icon: 'error', color: 'text-rose-600', iconColor: 'text-rose-500', total: 0, items: [] },
      thisWeek: { id: 'thisWeek', label: 'VENCE ESTA SEMANA', icon: 'schedule', color: 'text-amber-600', iconColor: 'text-amber-500', total: 0, items: [] },
      later: { id: 'later', label: 'A VENCER MAIS TARDE', icon: 'calendar_month', color: 'text-slate-500', iconColor: 'text-slate-400', total: 0, items: [] },
      paid: { id: 'paid', label: 'JÁ PAGAS', icon: 'check_circle', color: 'text-emerald-700', iconColor: 'text-emerald-600', total: 0, items: [] }
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    filteredBills.forEach(bill => {
      const cents = parseCents(bill.amount);
      if (bill.is_paid) {
        groups.paid.items.push(bill);
        groups.paid.total += cents;
      } else {
        const dueDate = new Date(bill.created_at);
        dueDate.setHours(0, 0, 0, 0);

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

  const handleTogglePaid = async (e: MouseEvent, t: DisplayTransaction) => {
    e.stopPropagation();
    if (!user) return;
    try {
      const newStatus = !t.is_paid;
      await toggleTransactionPaidStatus(user.id, Number(t.id), newStatus);
      if (refreshData) {
        refreshData();
      }
      showAlert(
        newStatus ? `"${t.name}" marcado como pago!` : `"${t.name}" retornado para pendente.`,
        newStatus ? 'success' : 'info'
      );
    } catch {
      showAlert('Erro ao atualizar status da conta', 'error');
    }
  };

  const handleEdit = (transaction: DisplayTransaction) => {
    navigate('/add', { state: { transaction } });
  };

  return (
    <div className="flex flex-col w-full gap-4 animate-in fade-in duration-500 pt-1">
      
      {/* MONTH SELECTOR & ACTION */}
      <BillsHeaderBar 
        currentDate={currentDate}
        onOpenMonthModal={() => setIsMonthModalOpen(true)}
        activeFilter={activeFilter}
        onToggleFilter={() => setActiveFilter(prev => prev === 'all' ? 'pending' : prev === 'pending' ? 'paid' : 'all')}
      />

      {/* HERO CARD SUMMARY */}
      <BillsLiquidationHero 
        summary={summary}
        billsCount={bills.length}
        progress={progress}
      />

      {/* FILTERS & PDF DOSSIER */}
      <BillsFilterTabs 
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        totalCount={bills.length}
        pendingCount={summary.pendingCount}
        paidCount={summary.paidCount}
      />

      {/* BILLS LIST */}
      <BillsGroupedList 
        loading={loading}
        billsCount={bills.length}
        groupedBills={groupedBills}
        filteredCount={filteredBills.length}
        activeFilter={activeFilter}
        uploadingId={uploadingId}
        onEdit={handleEdit}
        onTogglePaid={handleTogglePaid}
        onUploadReceipt={handleUploadReceipt}
      />

      <MonthPickerModal 
        isOpen={isMonthModalOpen} 
        onClose={() => setIsMonthModalOpen(false)} 
        currentDate={currentDate} 
        onSelectDate={setCurrentDate} 
      />

    </div>
  );
}
