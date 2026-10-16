import React, { createContext, useContext, useState, useMemo, useCallback, type ReactNode } from 'react';

export interface DateContextType {
  currentDate: Date;
  setCurrentDate: React.Dispatch<React.SetStateAction<Date>>;
  changeMonth: (direction: number) => void;
  monthTitle: string;
}

const DateContext = createContext<DateContextType | undefined>(undefined);

export function DateProvider({ children }: { children: ReactNode }) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  
  const changeMonth = useCallback((direction: number) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(1); // Resolve M3: previne pulo duplo de meses ao navegar de dias 31 para meses curtos
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  }, []);

  const monthTitle = useMemo(() => {
    return currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  }, [currentDate]);

  const value = useMemo<DateContextType>(() => ({
    currentDate,
    setCurrentDate,
    changeMonth,
    monthTitle
  }), [currentDate, changeMonth, monthTitle]);

  return (
    <DateContext.Provider value={value}>
      {children}
    </DateContext.Provider>
  );
}

export const useDate = (): DateContextType => {
  const context = useContext(DateContext);
  if (!context) {
    throw new Error('useDate must be used within a DateProvider');
  }
  return context;
};
