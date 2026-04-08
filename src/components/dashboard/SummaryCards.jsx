import { SummaryCard } from '../ui/SummaryCard';

export function SummaryCards({ summary }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {/* Sobra */}
      <div className={`col-span-2 md:col-span-2 p-5 rounded-2xl border flex justify-between items-center h-28 shadow-lg relative overflow-hidden
        ${summary.balance >= 0 
          ? 'bg-gradient-to-r from-green-900/20 to-[#0a0a0a] border-green-500/20' 
          : 'bg-gradient-to-r from-red-900/20 to-[#0a0a0a] border-red-500/20'
        }`}>
        <div className="z-10">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Sobra do Mês</p>
          <h2 className={`text-3xl font-bold tracking-tight ${summary.balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {Number(summary.balance).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </h2>
        </div>
        <div className={`z-10 text-[10px] px-2 py-1 rounded border font-semibold ${summary.balance >= 0 ? 'border-green-500/30 text-green-500' : 'border-red-500/30 text-red-500'}`}>
          {summary.balance >= 0 ? 'Positivo' : 'Negativo'}
        </div>
      </div>

      <SummaryCard title="Entradas" value={summary.income} type="highlight" />
      <SummaryCard title="Saídas" value={summary.expense} type="danger" />
    </div>
  );
}
