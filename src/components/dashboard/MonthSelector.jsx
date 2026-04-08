import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

export function MonthSelector({ monthTitle, changeMonth }) {
  return (
    <div className="fixed bottom-[90px] left-0 right-0 px-4 z-40 md:static md:z-0 md:px-0 md:mb-6">
      <div className="max-w-3xl md:max-w-none mx-auto">
        <div className="flex items-center justify-between bg-[#1a1a1a]/95 backdrop-blur-md py-1.5 px-3 rounded-xl border border-[#333] shadow-xl md:bg-transparent md:border-0 md:shadow-none md:p-0">
          <button onClick={() => changeMonth(-1)} className="p-1.5 hover:bg-[#333] rounded-lg text-gray-300">
            <ChevronLeft size={18} />
          </button>
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-blue-500" />
            <span className="font-bold text-sm capitalize text-white md:text-xl">{monthTitle}</span>
          </div>
          <button onClick={() => changeMonth(1)} className="p-1.5 hover:bg-[#333] rounded-lg text-gray-300">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
