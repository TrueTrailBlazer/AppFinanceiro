import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Tenta resetar o scroll da janela
    window.scrollTo(0, 0);
    
    // Tenta resetar o scroll de qualquer container com scroll interno que possa estar aberto
    const scrollableContainers = document.querySelectorAll('.overflow-y-auto');
    scrollableContainers.forEach(container => {
      container.scrollTop = 0;
    });
  }, [pathname]);

  return null;
}
