import { useNavigate } from 'react-router-dom';
import { useTransactionsContext } from '../contexts/TransactionContext';
import { MonthSelector } from '../components/dashboard/MonthSelector';
import { SummaryCards } from '../components/dashboard/SummaryCards';
import { UpcomingBillsWidget } from '../components/dashboard/UpcomingBillsWidget';

export default function Home() {
  const navigate = useNavigate();
  const { 
    bankSummary,
    plannedSummary,
    plannedBills,
    loading 
  } = useTransactionsContext();

  const handleEdit = (transaction) => {
    navigate('/add', { state: { transaction } });
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-500 md:pb-0">
      <div className="flex justify-between items-center px-1">
        <h1 className="text-xl font-bold text-foreground">Visão Mensal</h1>
        <MonthSelector />
      </div>
      
      <SummaryCards bankSummary={bankSummary} plannedSummary={plannedSummary} />
      
      <UpcomingBillsWidget 
        plannedBills={plannedBills}
        loading={loading}
        handleEdit={handleEdit}
      />
    </div>
  );
}