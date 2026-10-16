import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTransactionsContext } from '../contexts/TransactionContext';
import { useDate } from '../contexts/DateContext';
import { MonthPickerModal } from '../components/dashboard/MonthPickerModal';
import { MonthSelectorBar } from '../components/dashboard/MonthSelectorBar';
import { BalanceHeroCard } from '../components/dashboard/BalanceHeroCard';
import { BillsSummaryCards } from '../components/dashboard/BillsSummaryCards';
import { UpcomingBillsSection } from '../components/dashboard/UpcomingBillsSection';
import { RecentTransactionsSection } from '../components/dashboard/RecentTransactionsSection';
import BankTransactionDetailModal from '../components/extract/BankTransactionDetailModal';
import type { DisplayTransaction } from '../types/models';

export default function Home() {
  const navigate = useNavigate();
  const { currentDate, setCurrentDate } = useDate();
  const [isMonthModalOpen, setIsMonthModalOpen] = useState(false);
  const [selectedBankTx, setSelectedBankTx] = useState<DisplayTransaction | null>(null);
  const { 
    bankSummary,
    plannedSummary,
    plannedBills,
    recentTransactions,
    loading 
  } = useTransactionsContext();

  const handleEdit = (transaction: DisplayTransaction) => {
    if (transaction.pluggy_transaction_id || transaction.is_consolidated) {
      setSelectedBankTx(transaction);
    } else {
      navigate('/add', { state: { transaction } });
    }
  };

  const saldoRealCents = bankSummary?.balanceCents || 0;
  const faltaPagarCents = plannedSummary?.pendingCents || 0;
  const jaPagoCents = plannedSummary?.paidCents || 0;
  const sobraProjetadaCents = saldoRealCents - faltaPagarCents;

  return (
    <div className="flex flex-col w-full gap-4 animate-in fade-in duration-500 pt-1">
      <MonthSelectorBar 
        currentDate={currentDate} 
        onOpenModal={() => setIsMonthModalOpen(true)} 
        onOpenAnalysis={() => navigate('/analysis')} 
      />

      <BalanceHeroCard 
        saldoRealCents={saldoRealCents} 
        sobraProjetadaCents={sobraProjetadaCents} 
        onViewExtract={() => navigate('/extract')} 
      />

      <BillsSummaryCards 
        faltaPagarCents={faltaPagarCents} 
        jaPagoCents={jaPagoCents} 
        onViewBills={() => navigate('/bills')} 
      />

      <UpcomingBillsSection 
        bills={plannedBills} 
        loading={loading} 
        onEdit={handleEdit} 
        onViewAll={() => navigate('/bills')} 
        onAddBill={() => navigate('/add')} 
      />

      <RecentTransactionsSection 
        transactions={recentTransactions} 
        loading={loading} 
        onEdit={handleEdit} 
        onViewExtract={() => navigate('/extract')} 
      />

      <MonthPickerModal 
        isOpen={isMonthModalOpen} 
        onClose={() => setIsMonthModalOpen(false)} 
        currentDate={currentDate} 
        onSelectDate={setCurrentDate} 
      />

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
