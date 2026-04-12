import { Calendar, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useDate } from '../../contexts/DateContext';
import { MonthPickerModal } from './MonthPickerModal';

export function MonthSelector() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { currentDate, setCurrentDate } = useDate();

  const handleSelectDate = (newDate) => {
    setCurrentDate(newDate);
  }

  // Formato: "Abr 26"
  const shortTitle = currentDate.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).replace('.', '');

  return (
    <>
      <button 
        onClick={() => setIsModalOpen(true)} 
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#121212] border border-[#222] hover:bg-[#1a1a1a] transition-all active:scale-95 group shadow-sm z-50"
      >
        <Calendar size={14} className="text-blue-500 group-hover:text-blue-400 transition-colors" />
        <span className="font-bold text-xs md:text-sm capitalize text-gray-300 group-hover:text-white transition-colors">{shortTitle}</span>
        <ChevronDown size={14} className="text-gray-500 group-hover:text-blue-400 transition-colors" />
      </button>

      <MonthPickerModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        currentDate={currentDate}
        onSelectDate={handleSelectDate}
      />
    </>
  );
}
