import type { ReactNode } from 'react';

export interface SettingsHeaderProps {
  title: string;
  onBack: () => void;
  action?: ReactNode;
}

/**
 * Cabeçalho padrão das sub-telas de Configurações: botão voltar no topo + título + ação opcional.
 */
export function SettingsHeader({ title, onBack, action }: SettingsHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3 pb-4">
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={onBack}
          aria-label="Voltar"
          type="button"
          className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-slate-700 hover:bg-slate-100 active:scale-95 transition-all shrink-0"
        >
          <span className="material-symbols-outlined text-[22px]">arrow_back</span>
        </button>
        <h2 className="text-[18px] font-bold text-slate-900 truncate">{title}</h2>
      </div>
      {action}
    </div>
  );
}
