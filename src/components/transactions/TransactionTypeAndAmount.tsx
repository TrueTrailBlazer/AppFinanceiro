import { formatCents } from '../../utils/money';

interface TransactionTypeAndAmountProps {
  type: string;
  setType: (type: string) => void;
  displayAmount: string;
  setDisplayAmount: (val: string) => void;
  setAmountCents: (cents: number) => void;
  category: string;
  setCategory: (category: string) => void;
  setIsInstallment: (isInstallment: boolean) => void;
  autoFocus?: boolean;
}

export default function TransactionTypeAndAmount({
  type,
  setType,
  displayAmount,
  setDisplayAmount,
  setAmountCents,
  category,
  setCategory,
  setIsInstallment,
  autoFocus
}: TransactionTypeAndAmountProps) {
  return (
    <>
      {/* TYPE SWITCHER */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex p-1 bg-slate-200 rounded-full w-full max-w-xs shadow-inner">
          <button 
            onClick={() => { 
              setType('variable'); 
              setIsInstallment(false); 
              if (['salary', 'investment', 'extra'].includes(category)) {
                setCategory('food');
              }
            }} 
            className={`flex-1 py-2 text-center rounded-full text-[13px] font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 ${
              type !== 'income' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`} 
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_downward</span>
            <span>Despesa</span>
          </button>
          <button 
            onClick={() => { 
              setType('income'); 
              setIsInstallment(false); 
              setCategory('salary'); 
            }} 
            className={`flex-1 py-2 text-center rounded-full text-[13px] font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 ${
              type === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`} 
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
            <span>Receita</span>
          </button>
        </div>
      </div>

      {/* AMOUNT INPUT */}
      <div className="flex flex-col items-center justify-center py-6 px-4 bg-white rounded-2xl shadow-sm mb-6 relative overflow-hidden border border-border-subtle">
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/5 rounded-full pointer-events-none"></div>
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Valor da operação</span>
        <div className="flex items-baseline justify-center gap-1 w-full">
          <span className={`text-[22px] font-semibold transition-colors ${type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>R$</span>
          <input 
            className={`text-[40px] bg-transparent text-center focus:outline-none w-56 font-bold tracking-tight transition-colors ${
              type === 'income' ? 'text-emerald-600 selection:bg-emerald-600/10' : 'text-rose-600 selection:bg-rose-600/10'
            }`} 
            inputMode="numeric"
            placeholder="0,00"
            type="text" 
            value={displayAmount}
            onChange={e => {
              const rawValue = e.target.value.replace(/\D/g, '');
              if (!rawValue) {
                setDisplayAmount('');
                setAmountCents(0);
                return;
              }
              const cents = parseInt(rawValue, 10);
              setAmountCents(cents);
              setDisplayAmount(formatCents(cents, false));
            }}
            autoFocus={autoFocus}
          />
        </div>
      </div>
    </>
  );
}
