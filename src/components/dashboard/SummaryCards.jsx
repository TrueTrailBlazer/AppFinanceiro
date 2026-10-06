import { SummaryCard } from '../ui/SummaryCard';
import { useNavigate } from 'react-router-dom';
import { fromCents } from '../../utils/money';

export function SummaryCards({ bankSummary, plannedSummary }) {
  const navigate = useNavigate();
  
  // Sobra projetada: Saldo Real no Banco - Falta Pagar
  const projectedBalanceCents = bankSummary.balanceCents - plannedSummary.pendingCents;
  const projectedBalance = fromCents(projectedBalanceCents);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {/* Saldo Real Consolidado (Banco) */}
      <div 
        onClick={() => navigate('/extract', { state: { category: 'all' } })}
        className={`col-span-2 md:col-span-4 p-5 rounded-2xl border flex justify-between items-center h-28 shadow-lg relative overflow-hidden transition-transform cursor-pointer active:scale-95 hover:brightness-110
        ${bankSummary.balanceCents >= 0 
          ? 'bg-gradient-to-r from-blue-500/10 to-blue-500/5 border-blue-500/30' 
          : 'bg-gradient-to-r from-red-500/10 to-red-500/5 border-red-500/30'
        }`}>
        <div className="z-10">
          <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${bankSummary.balanceCents >= 0 ? 'text-blue-600 dark:text-blue-400 opacity-70' : 'text-red-600 dark:text-red-400 opacity-70'}`}>
            Fluxo Real no Banco (Mês)
          </p>
          <h2 className={`text-3xl font-bold tracking-tight ${bankSummary.balanceCents >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
            {Number(bankSummary.balance).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </h2>
        </div>
        <div className={`z-10 text-[10px] px-2 py-1 rounded border font-semibold ${bankSummary.balanceCents >= 0 ? 'border-blue-500/30 text-blue-600 dark:text-blue-400' : 'border-red-500/30 text-red-600 dark:text-red-400'}`}>
          Extrato
        </div>
      </div>

      {/* Painel de Contas do Mês */}
      <SummaryCard 
        title="Falta Pagar" 
        value={plannedSummary.pending} 
        type="danger" 
        onClick={() => navigate('/bills', { state: { filter: 'pending' }})} 
      />
      <SummaryCard 
        title="Já Pago" 
        value={plannedSummary.paid} 
        type="highlight" 
        onClick={() => navigate('/bills', { state: { filter: 'paid' }})} 
      />
      <div className={`col-span-2 md:col-span-2 p-4 rounded-xl border flex flex-col justify-center
        ${projectedBalanceCents >= 0 
          ? 'bg-green-500/5 border-green-500/20' 
          : 'bg-red-500/5 border-red-500/20'
        }`}>
        <p className="text-[10px] font-bold uppercase tracking-wider mb-1 text-foreground/60">
          Sobra Projetada
        </p>
        <h3 className={`text-xl font-bold ${projectedBalanceCents >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {Number(projectedBalance).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </h3>
      </div>
    </div>
  );
}
