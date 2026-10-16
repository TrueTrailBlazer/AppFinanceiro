import type { InstallmentInfo } from '../../types/models';

interface FutureInstallmentsPromptProps {
  instInfo: InstallmentInfo | null | undefined;
  applyToFuture: boolean;
  setApplyToFuture: (val: boolean) => void;
}

export default function FutureInstallmentsPrompt({
  instInfo,
  applyToFuture,
  setApplyToFuture
}: FutureInstallmentsPromptProps) {
  if (!instInfo) return null;

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-border-subtle flex items-center justify-between">
      <div className="flex flex-col">
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[14px]">calendar_month</span> 
          Conta Parcelada ({instInfo.current}/{instInfo.total})
        </p>
        <p className="text-[11px] text-slate-900 mt-1 font-medium">Aplicar nas próximas parcelas?</p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input 
          type="checkbox" 
          checked={applyToFuture} 
          onChange={e => setApplyToFuture(e.target.checked)} 
          className="sr-only peer" 
        />
        <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
      </label>
    </div>
  );
}
