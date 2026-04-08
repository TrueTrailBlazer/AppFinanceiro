import { createContext, useContext, useState, useMemo, useCallback } from 'react';

const DateContext = createContext({});

export function DateProvider({ children }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const changeMonth = useCallback((direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  }, []);

  const monthTitle = useMemo(() => {
    return currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  }, [currentDate]);

  return (
    <DateContext.Provider value={{ currentDate, setCurrentDate, changeMonth, monthTitle }}>
      {children}
    </DateContext.Provider>
  );
}

export const useDate = () => useContext(DateContext);
