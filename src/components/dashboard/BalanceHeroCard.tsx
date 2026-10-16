import { formatCurrency } from '../../utils/money';

export interface BalanceHeroCardProps {
  saldoRealCents?: number;
  sobraProjetadaCents?: number;
  onViewExtract?: () => void;
}

export function BalanceHeroCard({
  saldoRealCents = 0,
  sobraProjetadaCents = 0,
  onViewExtract
}: BalanceHeroCardProps) {
  const isPositive = saldoRealCents >= 0;
  const isSobraPositive = sobraProjetadaCents >= 0;

  return (
    <div className="flex flex-col gap-2.5">
      {/* Fluxo Real (Banco) */}
      <section 
        onClick={onViewExtract} 
        className={`${isPositive ? 'bg-emerald-700 border-emerald-600' : 'bg-rose-700 border-rose-600'} text-white rounded-3xl p-5 border shadow-sm flex flex-col gap-2 transition-transform cursor-pointer active:scale-[0.98]`}
      >
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-white/80">Fluxo Real no Banco</span>
            <h2 className="text-3xl font-extrabold text-white tracking-tight mt-1">{formatCurrency(saldoRealCents)}</h2>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-white bg-white/20 px-2.5 py-1 rounded-full border border-white/30 backdrop-blur-md">
            Ver Extrato
          </span>
        </div>
      </section>

      {/* Sobra Projetada */}
      <section className={`bg-white rounded-2xl p-4 border border-border-subtle shadow-sm flex items-center justify-between ${isSobraPositive ? 'border-l-4 border-l-emerald-500' : 'border-l-4 border-l-rose-500'}`}>
        <div className="flex flex-col">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-tight">Sobra Projetada (Mês)</span>
          <span className={`text-xl font-bold tracking-tight mt-0.5 ${isSobraPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
            {formatCurrency(sobraProjetadaCents)}
          </span>
        </div>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isSobraPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
          <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
        </div>
      </section>
    </div>
  );
}

export default BalanceHeroCard;
