interface CSVStepTrackerProps {
  step: number;
  importCompleted: boolean;
}

export default function CSVStepTracker({ step, importCompleted }: CSVStepTrackerProps) {
  if (importCompleted) return null;

  return (
    <div className="flex items-center justify-center gap-4 text-[10px] font-bold uppercase tracking-wider mb-4">
      <div className={`flex items-center gap-2 ${step >= 1 ? 'text-blue-500' : 'text-gray-600'}`}>
        <span className={`w-5 h-5 rounded-full flex items-center justify-center border ${
          step >= 1 ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700'
        }`}>
          1
        </span>
        Arquivo
      </div>
      <div className="w-8 h-[1px] bg-border" />
      <div className={`flex items-center gap-2 ${step >= 2 ? 'text-blue-500' : 'text-gray-600'}`}>
        <span className={`w-5 h-5 rounded-full flex items-center justify-center border ${
          step >= 2 ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700'
        }`}>
          2
        </span>
        Colunas
      </div>
      <div className="w-8 h-[1px] bg-border" />
      <div className={`flex items-center gap-2 ${step >= 3 ? 'text-blue-500' : 'text-gray-600'}`}>
        <span className={`w-5 h-5 rounded-full flex items-center justify-center border ${
          step >= 3 ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700'
        }`}>
          3
        </span>
        Revisão
      </div>
    </div>
  );
}
