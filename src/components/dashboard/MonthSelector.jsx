import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useDate } from '../../contexts/DateContext';
import { MonthPickerModal } from './MonthPickerModal';

export function MonthSelector({ variant = 'default' }) {
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
          if (!touchEnd || Math.abs(touchStart - touchEnd) < 10) {
            setIsModalOpen(true);
          }
        }} 
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`flex items-center gap-1.5 transition-all active:scale-95 group z-50 select-none touch-pan-y ${
          variant === 'tab' 
            ? 'px-3 py-1.5 rounded-lg bg-blue-600 text-white shadow-md' 
            : 'px-3 py-1.5 rounded-xl bg-card border border-border hover:bg-card-hover shadow-sm'
        }`}
      >
        <ChevronLeft size={14} className={variant === 'tab' ? "text-white/70 hover:text-white" : "text-gray-500 opacity-50 group-hover:opacity-100 transition-opacity"} />
        {variant !== 'tab' && <Calendar size={14} className="text-blue-500 group-hover:text-blue-400 transition-colors hidden md:block" />}
        <span className={`font-black text-[9px] md:text-[10px] uppercase tracking-widest ${variant === 'tab' ? 'text-white' : 'text-foreground/80 group-hover:text-foreground transition-colors'}`} key={shortTitle}>
          {shortTitle}
        </span>
        <ChevronRight size={14} className={variant === 'tab' ? "text-white/70 hover:text-white" : "text-gray-500 opacity-50 group-hover:opacity-100 transition-opacity"} />
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
