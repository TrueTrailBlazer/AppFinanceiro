import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { createPortal } from 'react-dom';

export function MonthSelector({ monthTitle, changeMonth, hideDesktop = false }) {
  const content = (
    <div className="flex items-center justify-between bg-[#1a1a1a]/95 backdrop-blur-md py-1.5 px-3 rounded-xl border border-[#333] shadow-xl md:bg-transparent md:border-0 md:shadow-none md:p-0 pointer-events-auto">
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
  );

  return (
    <>
      {/* MOBILE PORTAL */}
      {createPortal(
        <div className="fixed bottom-[110px] left-0 right-0 px-4 z-40 md:hidden pointer-events-none">
          <div className="max-w-3xl mx-auto">
            {content}
          </div>
        </div>,
        document.body
      )}

      {/* DESKTOP */}
      {!hideDesktop && (
        <div className="hidden md:block md:mb-6">
          {content}
        </div>
      )}
    </>
  );
}
