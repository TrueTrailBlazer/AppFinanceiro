import { useNavigate } from 'react-router-dom';
import { useTransactions } from '../hooks/useTransactions';
import { MonthSelector } from '../components/dashboard/MonthSelector';
import { SummaryCards } from '../components/dashboard/SummaryCards';
import { TransactionList } from '../components/dashboard/TransactionList';

export default function Home() {
  const navigate = useNavigate();
  const { 
    transactions, 
    recentTransactions, 
    loading, 
    monthTitle, 
    summary, 
    changeMonth 
  } = useTransactions();

  const handleEdit = (transaction) => {
    navigate('/add', { state: { transaction } });
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-500 pb-32 md:pb-0">
      <MonthSelector monthTitle={monthTitle} changeMonth={changeMonth} />
      <SummaryCards summary={summary} />
      <TransactionList 
        transactions={transactions} 
        loading={loading} 
        recentTransactions={recentTransactions} 
        handleEdit={handleEdit} 
      />
    </div>
  );
}