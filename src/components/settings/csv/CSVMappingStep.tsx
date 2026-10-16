import React from 'react';
import { Settings2, ArrowRight } from 'lucide-react';
import type { CSVColumnMapping } from '../../../types/models';

interface CSVMappingStepProps {
  headers: string[];
  mapping: CSVColumnMapping;
  setMapping: React.Dispatch<React.SetStateAction<CSVColumnMapping>>;
  onProcess: () => void;
}

export default function CSVMappingStep({
  headers,
  mapping,
  setMapping,
  onProcess
}: CSVMappingStepProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      <div className="bg-card rounded-2xl p-4 border border-border space-y-4">
        <div className="flex items-center gap-2 text-blue-500 mb-2">
          <Settings2 size={18} />
          <h3 className="text-xs font-bold uppercase">Ajustar Mapeamento</h3>
        </div>
        <p className="text-[11px] text-gray-500">
          Não conseguimos identificar todas as colunas automaticamente. Por favor, ajude-nos:
        </p>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-gray-600">Coluna da Data</label>
            <select 
              value={mapping.date} 
              onChange={e => setMapping(prev => ({ ...prev, date: e.target.value }))} 
              className="w-full bg-card-hover border border-border text-foreground text-sm rounded-xl px-4 py-3 outline-none focus:border-blue-500"
            >
              <option value="">Selecione...</option>
              {headers.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-gray-600">Coluna da Descrição (Nome)</label>
            <select 
              value={mapping.name} 
              onChange={e => setMapping(prev => ({ ...prev, name: e.target.value }))} 
              className="w-full bg-card-hover border border-border text-foreground text-sm rounded-xl px-4 py-3 outline-none focus:border-blue-500"
            >
              <option value="">Selecione...</option>
              {headers.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-gray-600">Coluna do Valor</label>
            <select 
              value={mapping.amount} 
              onChange={e => setMapping(prev => ({ ...prev, amount: e.target.value }))} 
              className="w-full bg-card-hover border border-border text-foreground text-sm rounded-xl px-4 py-3 outline-none focus:border-blue-500"
            >
              <option value="">Selecione...</option>
              {headers.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>
        </div>
      </div>
      <button 
        onClick={onProcess} 
        className="w-full bg-blue-600 hover:bg-blue-500 text-foreground font-bold py-4 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95"
        type="button"
      >
        Processar Transações <ArrowRight size={18} />
      </button>
    </div>
  );
}
