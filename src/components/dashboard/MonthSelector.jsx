import { Calendar, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useDate } from '../../contexts/DateContext';
import { MonthPickerModal } from './MonthPickerModal';

export function MonthSelector() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { currentDate, setCurrentDate } = useDate();

  // Swipe Handlers
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const minSwipeDistance = 50;

  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe || isRightSwipe) {
      // Evita abrir o modal se for um swipe
      e.preventDefault();
      e.stopPropagation();

      const newDate = new Date(currentDate);
      if (isLeftSwipe) {
        newDate.setMonth(newDate.getMonth() + 1);
      } else {
        newDate.setMonth(newDate.getMonth() - 1);
      }
      setCurrentDate(newDate);
    }
  };

  const handleSelectDate = (newDate) => {
    setCurrentDate(newDate);
  }

  // Formato: "Abr 26"
  const shortTitle = currentDate.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).replace('.', '');

  return (
    <>
      <button 
        onClick={() => {
          // Só abre o modal se não houve movimento de swipe signficativo
          if (!touchEnd || Math.abs(touchStart - touchEnd) < 10) {
            setIsModalOpen(true);
          }
        }} 
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#121212] border border-[#222] hover:bg-[#1a1a1a] transition-all active:scale-95 group shadow-sm z-50 select-none touch-pan-y"
      >
        <Calendar size={14} className="text-blue-500 group-hover:text-blue-400 transition-colors" />
        <span className="font-bold text-xs md:text-sm capitalize text-gray-300 group-hover:text-white transition-colors" key={shortTitle}>
          {shortTitle}
        </span>
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
