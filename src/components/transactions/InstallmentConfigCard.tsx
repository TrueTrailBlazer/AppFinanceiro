interface InstallmentConfigCardProps {
  isInstallment: boolean;
  setIsInstallment: (val: boolean) => void;
  installmentsCount: number | '';
  setInstallmentsCount: (val: number | '') => void;
  currentInstallment: number | '';
  setCurrentInstallment: (val: number | '') => void;
  installmentType: 'divide_total' | 'multiply_parcel';
  setInstallmentType: (val: 'divide_total' | 'multiply_parcel') => void;
}

export default function InstallmentConfigCard({
  isInstallment,
  setIsInstallment,
  installmentsCount,
  setInstallmentsCount,
  currentInstallment,
  setCurrentInstallment,
  installmentType,
  setInstallmentType
}: InstallmentConfigCardProps) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-border-subtle flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
            <span className="material-symbols-outlined text-[20px]">layers</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Compra Parcelada?</span>
            <span className="text-[10px] text-slate-400">Divida em meses</span>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input 
            type="checkbox" 
            checked={isInstallment} 
            onChange={e => setIsInstallment(e.target.checked)} 
            className="sr-only peer" 
          />
          <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
        </label>
      </div>

      {isInstallment && (
        <div className="animate-in fade-in slide-in-from-top-2 pt-3 border-t border-border-subtle space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 space-y-1">
              <label className="text-[11px] font-semibold text-slate-500 uppercase">Qtd. Parcelas</label>
              <input 
                type="number" 
                pattern="\d*" 
                inputMode="numeric" 
                min="2" 
                max="72" 
                value={installmentsCount} 
                onChange={e => setInstallmentsCount(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold px-3 py-2 rounded-xl outline-none focus:border-emerald-500 transition-colors" 
              />
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-[11px] font-semibold text-slate-500 uppercase">Parcela Atual</label>
              <input 
                type="number" 
                pattern="\d*" 
                inputMode="numeric" 
                min="1" 
                max={installmentsCount || 72} 
                value={currentInstallment} 
                onChange={e => setCurrentInstallment(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold px-3 py-2 rounded-xl outline-none focus:border-emerald-500 transition-colors" 
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500 uppercase">Como calcular?</label>
            <div className="flex gap-2">
              <button 
                type="button" 
                onClick={() => setInstallmentType('divide_total')} 
                className={`flex-1 flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                  installmentType === 'divide_total' 
                    ? 'bg-emerald-50 border-emerald-500 shadow-sm' 
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <span className={`text-[12px] font-bold ${installmentType === 'divide_total' ? 'text-emerald-700' : 'text-slate-600'}`}>
                  Dividir o Total
                </span>
                <span className="text-[9px] text-slate-500 mt-1 line-clamp-1 leading-tight">Valor dividido nas parcelas</span>
              </button>
              <button 
                type="button" 
                onClick={() => setInstallmentType('multiply_parcel')} 
                className={`flex-1 flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                  installmentType === 'multiply_parcel' 
                    ? 'bg-emerald-50 border-emerald-500 shadow-sm' 
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <span className={`text-[12px] font-bold ${installmentType === 'multiply_parcel' ? 'text-emerald-700' : 'text-slate-600'}`}>
                  É da Parcela
                </span>
                <span className="text-[9px] text-slate-500 mt-1 line-clamp-1 leading-tight">Valor x Meses</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
