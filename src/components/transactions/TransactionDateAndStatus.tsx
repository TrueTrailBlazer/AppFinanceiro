interface TransactionDateAndStatusProps {
  date: string;
  setDate: (date: string) => void;
  isPaid: boolean;
  setIsPaid: (isPaid: boolean) => void;
}

export default function TransactionDateAndStatus({
  date,
  setDate,
  isPaid,
  setIsPaid
}: TransactionDateAndStatusProps) {
  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-border-subtle flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
            <span className="material-symbols-outlined text-[20px]">calendar_today</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Data</span>
            <input
              type="date" 
              value={date} 
              onChange={e => setDate(e.target.value)}
              className="text-sm font-bold text-slate-900 bg-transparent outline-none mt-0.5"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm border border-border-subtle flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
            isPaid ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-100 text-amber-600'
          }`}>
            <span className="material-symbols-outlined text-[20px]">{isPaid ? 'check_circle' : 'schedule'}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Status</span>
            <span className="text-sm font-semibold text-slate-900">{isPaid ? 'Já foi pago' : 'Pendente'}</span>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input 
            type="checkbox" 
            checked={isPaid} 
            onChange={e => setIsPaid(e.target.checked)} 
            className="sr-only peer" 
          />
          <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
        </label>
      </div>
    </div>
  );
}
