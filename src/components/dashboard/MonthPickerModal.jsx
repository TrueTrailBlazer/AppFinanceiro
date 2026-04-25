import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';

export function MonthPickerModal({ isOpen, onClose, currentDate, onSelectDate }) {
  const { user } = useAuth();
  const [year, setYear] = useState(currentDate.getFullYear());
  const [monthsWithData, setMonthsWithData] = useState(new Set());
  
  // Swipe Handlers
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const minSwipeDistance = 50;

  const handleTouchStart = (e) => {
    setTouchEnd(null); // Reset
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      setYear(y => y + 1); // Swipe left = next year
    }
    if (isRightSwipe) {
      setYear(y => y - 1); // Swipe right = previous year
    }
  };

  useEffect(() => {
    if (isOpen) {
      setYear(currentDate.getFullYear());
    }
  }, [isOpen, currentDate]);

  // Buscar quais meses do ano selecionado têm transações
  useEffect(() => {
    if (!isOpen || !user) return;

    const fetchMonthsWithData = async () => {
      const startOfYear = new Date(year, 0, 1).toISOString();
      const endOfYear = new Date(year, 11, 31, 23, 59, 59).toISOString();

      const { data } = await supabase
        .from('transactions')
        .select('created_at')
        .eq('user_id', user.id)
        .gte('created_at', startOfYear)
        .lte('created_at', endOfYear);

      if (data) {
        const activeMonths = new Set(
          data.map(t => new Date(t.created_at).getMonth())
        );
        setMonthsWithData(activeMonths);
      } else {
        setMonthsWithData(new Set());
      }
    };

    fetchMonthsWithData();
  }, [isOpen, year, user]);

  if (!isOpen) return null;

  const months = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
  ];

  const handleSelectMonth = (monthIndex) => {
    const newDate = new Date(year, monthIndex, 1);
    onSelectDate(newDate);
    onClose();
  };

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex justify-center items-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300 px-4">
      
      {/* Clicar fora para fechar */}
      <div className="absolute inset-0 z-0" onClick={onClose} />

      <div 
        className="relative z-10 w-full max-w-sm bg-card border border-border rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-border">
          <h3 className="font-bold text-foreground">Selecionar Mês</h3>
          <button onClick={onClose} className="p-2 bg-card-hover rounded-full text-gray-400 hover:text-foreground transition-colors active:scale-95">
            <X size={18} />
          </button>
        </div>

        {/* Counter / Ano com Suporte a Swipe */}
        <div 
          className="flex items-center justify-between p-6"
        >
          <button onClick={() => setYear(y => y - 1)} className="p-3 bg-card-hover rounded-xl hover:bg-border-strong transition-colors active:scale-95">
             <ChevronLeft size={20} className="text-gray-300"/>
          </button>
          
          <div className="flex-1 flex justify-center items-center overflow-hidden relative">
             <span className="text-2xl font-black text-foreground px-8 animate-in fade-in slide-in-from-bottom-2 duration-300 select-none" key={year}>
               {year}
             </span>
          </div>

          <button onClick={() => setYear(y => y + 1)} className="p-3 bg-card-hover rounded-xl hover:bg-border-strong transition-colors active:scale-95">
             <ChevronRight size={20} className="text-gray-300"/>
          </button>
        </div>

        {/* Grade de Meses */}
        <div className="grid grid-cols-4 gap-3 p-6 pt-0">
          {months.map((m, i) => {
            const isCurrentMonth = year === currentDate.getFullYear() && i === currentDate.getMonth();
            const hasData = monthsWithData.has(i);
            
            return (
              <button
                key={i}
                onClick={() => handleSelectMonth(i)}
                className={`py-3 rounded-xl font-bold text-sm transition-all active:scale-95 ${
                  isCurrentMonth 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' 
                    : hasData
                      ? 'bg-card-hover text-foreground hover:bg-border border border-border hover:border-border-strong'
                      : 'bg-background text-gray-500 hover:bg-card hover:text-gray-400 border border-border'
                }`}
              >
                {m}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
