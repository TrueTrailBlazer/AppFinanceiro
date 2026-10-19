interface TransactionDateAndStatusProps {
  date: string;
  setDate: (date: string) => void;
  dueDate?: string;
  setDueDate?: (dueDate: string) => void;
  isPaid: boolean;
  setIsPaid: (isPaid: boolean) => void;
  type?: string;
}

export default function TransactionDateAndStatus({
  date,
  setDate,
  dueDate,
  setDueDate,
  isPaid,
  setIsPaid,
  type = 'variable'
}: TransactionDateAndStatusProps) {
  const isIncome = type === 'income';

  return (
    <div className="grid grid-cols-1 gap-3.5">
      {/* 1. Mês de Referência / Data de Competência Contábil */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-border-subtle flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[20px]">
              {isIncome ? 'event_available' : 'calendar_month'}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
              {isIncome ? 'Data do Recebimento' : 'Mês de Referência (Competência)'}
            </span>
            <input
              type="date" 
              value={date} 
              onChange={e => {
                const newDate = e.target.value;
                setDate(newDate);
                // Se a data de vencimento ainda for idêntica ou não definida, sincroniza automaticamente
                if (setDueDate && (!dueDate || dueDate === date)) {
                  setDueDate(newDate);
                }
              }}
              className="text-sm font-bold text-slate-900 bg-transparent outline-none mt-0.5 cursor-pointer"
            />
            {!isIncome && (
              <span className="text-[10px] text-slate-400 mt-0.5">
                Mês em que o gasto entra no seu orçamento planejado
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Data de Vencimento da Conta/Boleto (apenas para despesas) */}
      {!isIncome && setDueDate && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-border-subtle flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">event_upcoming</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                  Data de Vencimento
                </span>
                {dueDate && date && dueDate !== date && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                    Vencimento posterior
                  </span>
                )}
              </div>
              <input
                type="date" 
                value={dueDate || date} 
                onChange={e => setDueDate(e.target.value)}
                className="text-sm font-bold text-slate-900 bg-transparent outline-none mt-0.5 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 mt-0.5">
                Data limite para pagar o boleto ou fatura
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Status de Pagamento */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-border-subtle flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors shrink-0 ${
            isPaid ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'
          }`}>
            <span className="material-symbols-outlined text-[20px]">{isPaid ? 'check_circle' : 'schedule'}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Status</span>
            <span className="text-sm font-semibold text-slate-900">
              {isPaid ? (isIncome ? 'Recebido' : 'Já foi pago') : (isIncome ? 'A receber' : 'Pendente')}
            </span>
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
