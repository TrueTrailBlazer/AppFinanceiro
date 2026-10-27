import { Zap, Coins, CheckCircle2 } from 'lucide-react';
import { formatCents } from '../../../utils/money';

interface RecurringHeroProps {
  totalFixed: number;
  isGenerating: boolean;
  onGenerate: () => void;
  monthTitle?: string;
}

export function RecurringHero({ totalFixed, isGenerating, onGenerate, monthTitle }: RecurringHeroProps) {
  if (totalFixed <= 0) return null;

  return (
    <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-2xl p-5 relative overflow-hidden shadow-sm mb-4">
      <div className="absolute -top-4 -right-2 p-4 opacity-10"><Zap size={100} className="text-white"/></div>
      <div className="relative z-10">
        <p className="text-[11px] uppercase font-bold text-emerald-100 mb-1 flex items-center gap-1">
          <Coins size={12}/> Total mensal
        </p>
        <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">
          {formatCents(totalFixed)}
        </h2>
        <button
          onClick={onGenerate}
          disabled={isGenerating}
          className="w-full bg-white text-emerald-800 text-sm py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] hover:bg-emerald-50 transition-all font-bold disabled:opacity-60"
          type="button"
        >
          {isGenerating ? 'Processando...' : <><CheckCircle2 size={16}/> Lançar contas{monthTitle ? ` de ${monthTitle}` : ' deste mês'}</>}
        </button>
      </div>
    </div>
  );
}
