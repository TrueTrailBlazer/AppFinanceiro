import { Zap, Coins, CheckCircle2 } from 'lucide-react';
import { formatCents } from '../../../utils/money';

interface RecurringHeroProps {
  totalFixed: number;
  isGenerating: boolean;
  onGenerate: () => void;
}

export function RecurringHero({ totalFixed, isGenerating, onGenerate }: RecurringHeroProps) {
  if (totalFixed <= 0) return null;

  return (
    <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-2xl p-5 relative overflow-hidden shadow-lg mx-2 mb-2 border border-emerald-500/30">
      <div className="absolute -top-4 -right-2 p-4 opacity-10"><Zap size={100} className="text-white"/></div>
      <div className="relative z-10">
        <p className="text-[10px] uppercase font-bold text-emerald-100 mb-1 flex items-center gap-1">
          <Coins size={12}/> Total Mensal Recorrente
        </p>
        <h2 className="text-3xl font-bold text-white mb-4 tracking-tight drop-shadow-sm">
          {formatCents(totalFixed)}
        </h2>
        <button 
          onClick={onGenerate}
          disabled={isGenerating}
          className="w-full bg-white/10 text-white backdrop-blur-sm border border-white/20 text-xs py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg active:scale-95 hover:bg-white/20 transition-all font-bold"
        >
          {isGenerating ? 'Processando...' : <><CheckCircle2 size={16}/> Lançar Contas do Mês</>}
        </button>
      </div>
    </div>
  );
}
