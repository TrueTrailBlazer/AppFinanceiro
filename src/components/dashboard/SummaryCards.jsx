import { SummaryCard } from '../ui/SummaryCard';
import { useNavigate } from 'react-router-dom';

export function SummaryCards({ summary }) {
  const navigate = useNavigate();
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div 
        onClick={() => navigate('/extract', { state: { category: 'all' } })}
        className={`col-span-2 md:col-span-2 p-5 rounded-2xl border flex justify-between items-center h-28 shadow-lg relative overflow-hidden transition-transform cursor-pointer active:scale-95 hover:brightness-110
        ${summary.balance >= 0 
          ? 'bg-gradient-to-r from-green-500/10 to-green-500/5 border-green-500/30' 
          : 'bg-gradient-to-r from-red-500/10 to-red-500/5 border-red-500/30'
        }`}>
        <div className="z-10">
          <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${summary.balance >= 0 ? 'text-green-600 dark:text-green-400 opacity-70' : 'text-red-600 dark:text-red-400 opacity-70'}`}>Sobra do Mês</p>
          <h2 className={`text-3xl font-bold tracking-tight ${summary.balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {Number(summary.balance).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </h2>
        </div>
        <div className={`z-10 text-[10px] px-2 py-1 rounded border font-semibold ${summary.balance >= 0 ? 'border-green-500/30 text-green-600 dark:text-green-400' : 'border-red-500/30 text-red-600 dark:text-red-400'}`}>
          {summary.balance >= 0 ? 'Positivo' : 'Negativo'}
        </div>
      </div>

      <SummaryCard title="Entradas" value={summary.income} type="highlight" onClick={() => navigate('/extract', { state: { category: 'income' }})} />
      <SummaryCard title="Saídas" value={summary.expense} type="danger" onClick={() => navigate('/extract', { state: { category: 'expense' }})} />
    </div>
  );
}
